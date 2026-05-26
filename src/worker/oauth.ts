/**
 * oauth.ts — Google OAuth 2.0 ハンドラ（REUSABLE_STACK #1）
 *
 * GET  /api/auth/google         開始（Googleへリダイレクト）
 * GET  /api/auth/callback       コールバック（コード→トークン→セッション）
 * POST /api/auth/logout         ログアウト（セッション破棄）
 * GET  /api/auth/me             現在のユーザー（プラン含む）を返す
 */

import type { Env, SessionData } from "./types";
import {
  createSession,
  cookieValue,
  getSession,
  deleteSession,
  parseCookie,
  SESSION_COOKIE,
} from "./session";
import { getCurrentPlan, restoreSessionPlan } from "./plan";

const STATE_TTL = 600; // 10分
const STATE_COOKIE = "oauth_state";

function randomState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** /api/auth/google — Google認可ページへリダイレクト */
export async function handleAuthStart(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/";
  const state = randomState();
  await env.AUTH_SESSIONS.put(`oauth_state:${state}`, next, {
    expirationTtl: STATE_TTL,
  });

  const redirectUri = `${env.APP_ORIGIN}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const headers = new Headers({
    Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
  headers.append(
    "Set-Cookie",
    cookieValue(STATE_COOKIE, state, { maxAge: STATE_TTL }),
  );
  return new Response(null, { status: 302, headers });
}

/** /api/auth/callback */
export async function handleAuthCallback(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = parseCookie(req, STATE_COOKIE);

  if (!code || !state) return badRequest("missing code/state");
  if (state !== cookieState) return badRequest("state mismatch");

  // state を消費（一度きり）
  const next = await env.AUTH_SESSIONS.get(`oauth_state:${state}`);
  await env.AUTH_SESSIONS.delete(`oauth_state:${state}`);
  const redirectAfter = next ?? "/";

  // code → token 交換
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.APP_ORIGIN}/api/auth/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return badRequest("token exchange failed", tokenRes.status);
  const tok = (await tokenRes.json()) as { access_token: string };

  // userinfo 取得
  const infoRes = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${tok.access_token}` } },
  );
  if (!infoRes.ok) return badRequest("userinfo failed", infoRes.status);
  const info = (await infoRes.json()) as {
    email: string;
    name?: string;
    picture?: string;
  };

  // セッション作成
  const data: SessionData = {
    email: info.email,
    name: info.name,
    picture: info.picture,
    plan: "free",
    createdAt: Date.now(),
  };
  const sid = await createSession(env, data);
  // 有料プランの復元（paid_email 永続化レコードを参照）
  await restoreSessionPlan(sid, info.email, env);

  const headers = new Headers({ Location: redirectAfter });
  headers.append(
    "Set-Cookie",
    cookieValue(SESSION_COOKIE, sid, { maxAge: 60 * 60 * 24 * 30 }),
  );
  // state cookie を即時削除
  headers.append("Set-Cookie", cookieValue(STATE_COOKIE, "", { maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}

/** POST /api/auth/logout */
export async function handleLogout(req: Request, env: Env): Promise<Response> {
  const s = await getSession(req, env);
  if (s) await deleteSession(s.id, env);
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", cookieValue(SESSION_COOKIE, "", { maxAge: 0 }));
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
}

/**
 * POST /api/account/delete — アカウント完全削除
 *
 * 個人情報保護法の「本人請求による削除」に対応。
 * 以下を KV から完全削除:
 *   - session:{id}       (現在のセッション)
 *   - paid_email:{email} (有料プラン記録、10 年 TTL のもの)
 *
 * Stripe Customer は Stripe ダッシュボードから別途削除（領収書履歴のため通常は残す）。
 * クライアント側の localStorage はフロントで個別にクリアする。
 */
export async function handleDeleteAccount(
  req: Request,
  env: Env,
): Promise<Response> {
  const s = await getSession(req, env);
  if (!s) {
    return new Response(JSON.stringify({ error: "login_required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const email = s.data.email;

  // KV エントリを削除
  await deleteSession(s.id, env);
  if (email) {
    await env.AUTH_SESSIONS.delete(
      `paid_email:${email.toLowerCase().trim()}`,
    );
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", cookieValue(SESSION_COOKIE, "", { maxAge: 0 }));
  return new Response(
    JSON.stringify({
      ok: true,
      message: "アカウント情報を削除しました。",
    }),
    { status: 200, headers },
  );
}

/** GET /api/auth/me */
export async function handleMe(req: Request, env: Env): Promise<Response> {
  const s = await getSession(req, env);
  if (!s) {
    return jsonResponse({ authenticated: false, plan: "free" });
  }
  const plan = await getCurrentPlan(req, env);
  return jsonResponse({
    authenticated: true,
    plan,
    email: s.data.email,
    name: s.data.name,
    picture: s.data.picture,
  });
}

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function badRequest(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
