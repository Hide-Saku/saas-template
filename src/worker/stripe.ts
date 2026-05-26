/**
 * stripe.ts — Stripe Checkout + Webhook + Customer Portal（買い切り単一商品）
 *
 * POST /api/stripe/checkout                                          → { url }
 * POST /api/stripe/portal                                            → { url }
 * POST /api/stripe/webhook                                           署名検証 + イベント処理
 */

import type { Env } from "./types";
import { getSession } from "./session";
import {
  grantPlanByEmail,
  revokePlanByEmail,
  getPaidEmailRecord,
} from "./plan";

const STRIPE = "https://api.stripe.com/v1";

function stripeHeaders(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

function form(obj: Record<string, string | number | boolean | undefined>): string {
  return new URLSearchParams(
    Object.entries(obj).reduce<Record<string, string>>((a, [k, v]) => {
      if (v !== undefined && v !== null) a[k] = String(v);
      return a;
    }, {}),
  ).toString();
}

/** POST /api/stripe/checkout — 買い切り Checkout セッション作成 */
export async function handleCheckout(req: Request, env: Env): Promise<Response> {
  const s = await getSession(req, env);
  if (!s) return json({ error: "login_required" }, 401);

  const params: Record<string, string> = {
    mode: "payment",
    "line_items[0][price]": env.STRIPE_PRICE_ID_ONETIME,
    "line_items[0][quantity]": "1",
    customer_email: s.data.email,
    // 🩹 ゲスト購入を回避し、Customer オブジェクトを必ず作成する。
    //    これがないと Customer Portal（領収書ダウンロード）が開けない。
    customer_creation: "always",
    success_url: `${env.APP_ORIGIN}/account/?paid=1`,
    cancel_url: `${env.APP_ORIGIN}/pricing/?canceled=1`,
    "metadata[email]": s.data.email,
    "metadata[plan]": "onetime",
  };

  const res = await fetch(`${STRIPE}/checkout/sessions`, {
    method: "POST",
    headers: stripeHeaders(env),
    body: new URLSearchParams(params).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    return json({ error: "stripe_error", detail: err.slice(0, 300) }, 500);
  }
  const data = (await res.json()) as { url?: string };
  return json({ url: data.url });
}

/** POST /api/stripe/portal — 領収書・支払履歴の確認用 */
export async function handlePortal(req: Request, env: Env): Promise<Response> {
  const s = await getSession(req, env);
  if (!s) return json({ error: "login_required" }, 401);

  let rec = await getPaidEmailRecord(s.data.email, env);
  if (!rec?.stripeCustomerId) {
    // 🩹 自己修復: KV に customerId が無い場合、Stripe API でメールから顧客を検索して保存
    // （Webhook 受信時に cs.customer が null だった場合のリカバリ）
    const customerId = await findStripeCustomerByEmail(env, s.data.email);
    if (!customerId) return json({ error: "no_customer" }, 400);
    await grantPlanByEmail(s.data.email, rec?.type ?? "one_time", env, {
      expiresAt: rec?.expiresAt ?? null,
      customerId,
    });
    rec = await getPaidEmailRecord(s.data.email, env);
    if (!rec?.stripeCustomerId) return json({ error: "no_customer" }, 400);
  }

  const res = await fetch(`${STRIPE}/billing_portal/sessions`, {
    method: "POST",
    headers: stripeHeaders(env),
    body: form({
      customer: rec.stripeCustomerId,
      return_url: `${env.APP_ORIGIN}/account/`,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error("[portal] stripe error:", res.status, detail);
    // よくある原因を判定
    // - "No configuration provided" → Customer Portal が未有効化（Stripe Dashboard）
    // - "Invalid API Key" / 403 → 制限付きキーの権限不足
    let hint = "stripe_error";
    if (detail.includes("No configuration provided") || detail.includes("billing_portal")) {
      hint = "portal_not_configured";
    } else if (res.status === 403 || detail.includes("permission")) {
      hint = "permission";
    }
    return json({ error: hint, status: res.status, detail: detail.slice(0, 500) }, 500);
  }
  const data = (await res.json()) as { url?: string };
  return json({ url: data.url });
}

/** POST /api/stripe/webhook — 署名検証 + 買い切り完了イベント処理
 *
 * 冪等性確保 (SEC-3):
 *   Stripe は同じイベントを複数回送信する可能性がある (at-least-once delivery)。
 *   event.id を KV に 24 時間 TTL で記録し、重複時は処理スキップして 200 を返す。
 *   これにより grantPlanByEmail / revokePlanByEmail の二重実行を防止。
 */
export async function handleWebhook(req: Request, env: Env): Promise<Response> {
  const raw = await req.text(); // request.text() で受け取る（REUSABLE_STACK #2）
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });

  const ok = await verifyStripeSignature(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!ok) return new Response("invalid signature", { status: 400 });

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  // 冪等性チェック: event.id が既に処理済みなら 200 で即返却
  if (event.id) {
    const dedupeKey = `webhook_event:${event.id}`;
    const seen = await env.AUTH_SESSIONS.get(dedupeKey);
    if (seen) {
      return new Response(
        JSON.stringify({ received: true, duplicate: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    // 先にマーク (race condition での二重実行を最小化、24h TTL)
    await env.AUTH_SESSIONS.put(dedupeKey, "1", { expirationTtl: 86400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object;
      const email = cs.customer_email || cs.customer_details?.email || cs.metadata?.email;
      if (!email) break;
      await grantPlanByEmail(email, "one_time", env, {
        expiresAt: null,
        customerId: cs.customer,
      });
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      const fully = charge.refunded === true || charge.amount_refunded >= charge.amount;
      if (!fully) break;
      const email =
        charge.receipt_email || (await fetchCustomerEmail(env, charge.customer));
      if (email) await revokePlanByEmail(email, env);
      break;
    }
    default:
      // 他のイベントは無視
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/** メールアドレスから Stripe Customer ID を検索（self-heal用） */
async function findStripeCustomerByEmail(
  env: Env,
  email: string,
): Promise<string | undefined> {
  const url = `${STRIPE}/customers?email=${encodeURIComponent(email)}&limit=1`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!r.ok) {
    console.error("[findCustomer] failed:", r.status, await r.text());
    return undefined;
  }
  const j = (await r.json()) as { data?: Array<{ id: string }> };
  return j.data?.[0]?.id;
}

async function fetchCustomerEmail(env: Env, customerId?: string): Promise<string | undefined> {
  if (!customerId) return undefined;
  const r = await fetch(`${STRIPE}/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!r.ok) return undefined;
  const c = (await r.json()) as { email?: string };
  return c.email;
}

/** Stripe Webhook 署名検証（HMAC-SHA256） */
async function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
): Promise<boolean> {
  const parts = Object.fromEntries(
    header.split(",").map((s) => {
      const [k, ...rest] = s.split("=");
      return [k, rest.join("=")];
    }),
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(t)) > 300) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`${t}.${payload}`),
  );
  const computed = [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return constantTimeEq(computed, v1);
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
