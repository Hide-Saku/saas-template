/**
 * Cloudflare Worker — {{SITE_NAME}}
 *
 * MAINTENANCE_MODE フラグでメンテナンス画面の表示を切替:
 *  - true:  全リクエストに 503 + メンテナンス HTML を返す（公開停止）
 *  - false: 通常運用
 *
 * REUSABLE_STACK 準拠:
 *  - メンテナンス中は静的HTMLを 503 で返す（Basic Auth は使わない）
 *  - run_worker_first: true（wrangler.jsonc）が必須
 *  - APIレスポンスには Cache-Control: no-store
 */

import type { Env } from "./types";
import {
  handleAuthStart,
  handleAuthCallback,
  handleLogout,
  handleMe,
  handleDeleteAccount,
} from "./oauth";
import { handleCheckout, handlePortal, handleWebhook } from "./stripe";
import { handleContact } from "./contact";
import { getCurrentPlan } from "./plan";

// ===== 公開フラグ =====
// 2026-05-26: ユーザー指示によりメンテナンスモード解除（公開状態）
const MAINTENANCE_MODE = false;

// Content-Security-Policy (Report-Only モード)
// 違反は console に警告として記録されるが、リソース読み込みは遮断しない。
// 1 週間運用→違反がなくなった時点で enforcing (Content-Security-Policy) に切替予定。
//
// 許可ドメイン:
//   - https://challenges.cloudflare.com : Turnstile (お問い合わせフォーム)
//   - https://js.stripe.com / https://checkout.stripe.com : Stripe Checkout
//   - https://api.stripe.com : Stripe API (currently 経由なし、念のため)
//   - https://lh3.googleusercontent.com 等: Google プロフィール画像
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://lh3.googleusercontent.com https://www.googleusercontent.com https:",
  "media-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com https://checkout.stripe.com",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

// Permissions-Policy: 当アプリで使用しない機能を明示無効化
const PERMISSIONS_POLICY = [
  "geolocation=()",
  "microphone=()",
  "camera=()",
  "payment=(self)", // Stripe Checkout で必要なので self は許可
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
].join(", ");

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy-Report-Only": CSP_REPORT_ONLY,
  "Permissions-Policy": PERMISSIONS_POLICY,
};

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>準備中 — {{SITE_NAME}}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background:#f8fafc; color:#0f172a; }
  @media (prefers-color-scheme: dark) {
    body { background:#0f172a; color:#f1f5f9; }
    .card { background:#1e293b !important; border-color:#334155 !important; }
    .muted { color:#94a3b8 !important; }
  }
  .card { background:#fff; border:1px solid #e2e8f0; border-radius:16px;
    padding:48px 40px; max-width:480px; margin:24px; text-align:center; }
  h1 { font-size:1.5rem; margin:0 0 12px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:999px;
    background:#0d9488; color:#fff; font-size:.8rem; margin-bottom:20px; }
  .muted { color:#475569; line-height:1.7; font-size:.95rem; }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">準備中</div>
    <h1>{{SITE_NAME}}</h1>
    <p class="muted">
      ただいまサービスの公開準備を進めています。<br />
      もうしばらくお待ちください。
    </p>
  </div>
</body>
</html>`;

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function maintenanceResponse(): Response {
  return new Response(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Retry-After": "3600",
      ...SECURITY_HEADERS,
    },
  });
}

// 音声ファイルが有料プランを必要とするか判定
//   /audio/markers/...                   → 無料（共通アナウンス）
//   /audio/ds-cert/q-foundation-.../...  → 無料（1章＝基盤・試聴可）
//   /audio/ds-cert/q-{他}.../...         → 有料
//   /audio/glossary/...                  → 有料
function audioRequiresPaid(path: string): boolean {
  if (path.startsWith("/audio/markers/")) return false;
  if (path.startsWith("/audio/glossary/")) return true;
  if (path.startsWith("/audio/ds-cert/")) {
    const rest = path.slice("/audio/ds-cert/".length);
    const id = rest.split("/")[0];
    if (!id) return true;
    if (id.startsWith("q-foundation-")) return false;
    return true;
  }
  return false;
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const p = url.pathname;

  // 認証関連
  if (p === "/api/auth/google" && request.method === "GET")
    return handleAuthStart(request, env);
  if (p === "/api/auth/callback" && request.method === "GET")
    return handleAuthCallback(request, env);
  if (p === "/api/auth/logout" && request.method === "POST")
    return handleLogout(request, env);
  if (p === "/api/auth/me" && request.method === "GET")
    return handleMe(request, env);
  if (p === "/api/account/delete" && request.method === "POST")
    return handleDeleteAccount(request, env);

  // Stripe
  if (p === "/api/stripe/checkout" && request.method === "POST")
    return handleCheckout(request, env);
  if (p === "/api/stripe/portal" && request.method === "POST")
    return handlePortal(request, env);
  if (p === "/api/stripe/webhook" && request.method === "POST")
    return handleWebhook(request, env);

  // お問い合わせ
  if (p === "/api/contact" && request.method === "POST")
    return handleContact(request, env);

  // 未実装
  return new Response(JSON.stringify({ error: "not_found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // 🔴 メンテナンス中は全リクエストに 503 を返す
    if (MAINTENANCE_MODE) return maintenanceResponse();

    const url = new URL(request.url);

    // /api/* は Worker で処理
    if (url.pathname.startsWith("/api/")) {
      const res = await handleApi(request, env);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    }

    // /audio/* は有料プランチェック（1章=無料、2章以降と用語集音声=有料）
    if (url.pathname.startsWith("/audio/")) {
      if (audioRequiresPaid(url.pathname)) {
        const plan = await getCurrentPlan(request, env);
        if (plan !== "paid") {
          return new Response(JSON.stringify({ error: "paid_only" }), {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              ...SECURITY_HEADERS,
            },
          });
        }
      }
    }

    // それ以外は静的ファイル配信
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
