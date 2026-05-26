/**
 * plan.ts — 有料プランの判定・永続化（REUSABLE_STACK #6）
 *
 * paid_email:{email} キーで10年永続化する。セッション切れでも同じ Google
 * アカウントで再ログインすれば有料状態が復元される。
 */

import type { Env, PaidEmailRecord, PlanType, SessionData } from "./types";
import { getSession, updateSession } from "./session";

const PAID_EMAIL_TTL = 60 * 60 * 24 * 365 * 10; // 10年

const paidEmailKey = (email: string) =>
  `paid_email:${email.toLowerCase().trim()}`;

/** メールから有料記録を取得 */
export async function getPaidEmailRecord(
  email: string,
  env: Env,
): Promise<PaidEmailRecord | null> {
  const raw = await env.AUTH_SESSIONS.get(paidEmailKey(email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PaidEmailRecord;
  } catch {
    return null;
  }
}

/** 有料化を記録（Webhook の checkout.session.completed で呼ぶ） */
export async function grantPlanByEmail(
  email: string,
  type: PlanType,
  env: Env,
  extras: { expiresAt?: number | null; customerId?: string } = {},
): Promise<void> {
  const rec: PaidEmailRecord = {
    plan: "paid",
    type,
    paidAt: Date.now(),
    expiresAt: extras.expiresAt ?? null,
    stripeCustomerId: extras.customerId,
  };
  await env.AUTH_SESSIONS.put(paidEmailKey(email), JSON.stringify(rec), {
    expirationTtl: PAID_EMAIL_TTL,
  });
}

/** プラン剥奪（返金時） */
export async function revokePlanByEmail(email: string, env: Env): Promise<void> {
  await env.AUTH_SESSIONS.delete(paidEmailKey(email));
}

/** リクエストの現在プラン（未ログインなら "free"） */
export async function getCurrentPlan(req: Request, env: Env): Promise<"free" | "paid"> {
  const s = await getSession(req, env);
  if (!s) return "free";
  if (s.data.plan === "paid") return "paid";
  // セッションが free でも paid_email があるなら復元
  const rec = await getPaidEmailRecord(s.data.email, env);
  if (rec && rec.plan === "paid") {
    await updateSession(
      s.id,
      { plan: "paid", planType: rec.type, expiresAt: rec.expiresAt },
      env,
    );
    return "paid";
  }
  return "free";
}

/** ログイン時にプランを復元する */
export async function restoreSessionPlan(
  sessionId: string,
  email: string,
  env: Env,
): Promise<SessionData["plan"]> {
  const rec = await getPaidEmailRecord(email, env);
  if (rec && rec.plan === "paid") {
    await updateSession(
      sessionId,
      { plan: "paid", planType: rec.type, expiresAt: rec.expiresAt },
      env,
    );
    return "paid";
  }
  return "free";
}
