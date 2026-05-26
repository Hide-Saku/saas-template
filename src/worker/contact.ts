/**
 * contact.ts — お問い合わせフォーム送信（REUSABLE_STACK #3）
 *
 * POST /api/contact { name, email, subject, body, turnstileToken }
 *
 * - Turnstile で bot 対策
 * - KV で IP ベースのレート制限（1時間に5回まで）
 * - Resend でメール送信
 */

import type { Env } from "./types";

interface Body {
  name?: string;
  email?: string;
  subject?: string;
  body?: string;
  turnstileToken?: string;
}

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 60; // 1時間

export async function handleContact(req: Request, env: Env): Promise<Response> {
  let payload: Body = {};
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const { name, email, subject, body, turnstileToken } = payload;

  if (!name || !email || !subject || !body) {
    return json({ error: "missing_fields" }, 400);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "invalid_email" }, 400);
  }
  if (body.length > 4000) return json({ error: "too_long" }, 400);

  // Turnstile 検証
  if (env.TURNSTILE_SECRET) {
    if (!turnstileToken) return json({ error: "missing_turnstile" }, 400);
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: turnstileToken,
        }).toString(),
      },
    );
    const verify = (await verifyRes.json()) as { success?: boolean };
    if (!verify.success) return json({ error: "turnstile_failed" }, 400);
  }

  // レート制限（IPベース）
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const rlKey = `contact_rl:${ip}`;
  const current = parseInt((await env.AUTH_SESSIONS.get(rlKey)) || "0", 10);
  if (current >= RATE_LIMIT_MAX) {
    return json({ error: "rate_limited" }, 429);
  }
  await env.AUTH_SESSIONS.put(rlKey, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW,
  });

  // Resend 送信
  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) {
    return json({ error: "mail_not_configured" }, 503);
  }
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || "noreply@example.com",
      to: env.CONTACT_TO_EMAIL,
      reply_to: email,
      subject: `[{{SITE_NAME}}] ${subject}`,
      text: [
        `氏名: ${name}`,
        `メール: ${email}`,
        `件名: ${subject}`,
        `IP: ${ip}`,
        ``,
        body,
      ].join("\n"),
    }),
  });
  if (!sendRes.ok) {
    const err = await sendRes.text();
    return json({ error: "send_failed", detail: err.slice(0, 200) }, 500);
  }
  return json({ ok: true });
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
