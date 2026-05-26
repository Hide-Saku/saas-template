/**
 * Worker 型定義 — KV / Secrets / Vars のバインディング
 *
 * KV Namespace: AUTH_SESSIONS（セッション + paid_email 永続化）
 *
 * Secrets (wrangler secret put):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *
 * Vars (wrangler.jsonc):
 *   APP_ORIGIN, STRIPE_PRICE_ID_ONETIME
 */

/** Cloudflare KV の最小限の型定義（@cloudflare/workers-types を別途入れる代わり） */
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    opts?: { expirationTtl?: number; expiration?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  AUTH_SESSIONS: KVNamespace;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID_ONETIME: string;
  APP_ORIGIN: string; // 例: "https://ds-kentei-lab.com"
  // お問い合わせ用（任意・未設定なら /api/contact は 503）
  TURNSTILE_SECRET?: string;
  TURNSTILE_SITE_KEY?: string; // フロント用にvars経由でも公開可
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
}

export type PlanType = "one_time";

export interface SessionData {
  email: string;
  name?: string;
  picture?: string;
  plan: "free" | "paid";
  planType?: PlanType;
  expiresAt?: number | null; // 買い切り：null（互換のため残置）
  createdAt: number;
}

export interface PaidEmailRecord {
  plan: "paid";
  type: PlanType;
  paidAt: number;
  expiresAt: number | null;
  stripeCustomerId?: string;
}
