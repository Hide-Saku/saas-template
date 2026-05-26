/**
 * session.ts — KV ベースのセッション管理（REUSABLE_STACK #1）
 *
 * - session:{id} で SessionData を保存（TTL 30日）
 * - Cookie: session_id（HttpOnly, Secure, SameSite=Lax）
 */

import type { Env, KVNamespace, SessionData } from "./types";

// type 引数として KVNamespace を使うため型を明示する
type _kv = KVNamespace;

const SESSION_TTL = 60 * 60 * 24 * 30; // 30日
const COOKIE = "session_id";

/** 暗号学的に強いランダムID（24バイト → 32文字 base64url） */
function randomId(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function parseCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("Cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Set-Cookie 文字列を組み立てる */
export function cookieValue(
  name: string,
  value: string,
  opts: { maxAge?: number; path?: string; httpOnly?: boolean; secure?: boolean } = {},
): string {
  const { maxAge, path = "/", httpOnly = true, secure = true } = opts;
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${path}`, "SameSite=Lax"];
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}

/** セッションを KV に作成して id を返す */
export async function createSession(env: Env, data: SessionData): Promise<string> {
  const id = randomId();
  await env.AUTH_SESSIONS.put(`session:${id}`, JSON.stringify(data), {
    expirationTtl: SESSION_TTL,
  });
  return id;
}

/** リクエストから現在のセッションを取得（なければ null） */
export async function getSession(
  req: Request,
  env: Env,
): Promise<{ id: string; data: SessionData } | null> {
  const id = parseCookie(req, COOKIE);
  if (!id) return null;
  const raw = await env.AUTH_SESSIONS.get(`session:${id}`);
  if (!raw) return null;
  try {
    return { id, data: JSON.parse(raw) as SessionData };
  } catch {
    return null;
  }
}

/** セッションを更新（plan復元など） */
export async function updateSession(
  id: string,
  patch: Partial<SessionData>,
  env: Env,
): Promise<void> {
  const raw = await env.AUTH_SESSIONS.get(`session:${id}`);
  if (!raw) return;
  const data = JSON.parse(raw) as SessionData;
  const merged = { ...data, ...patch };
  await env.AUTH_SESSIONS.put(`session:${id}`, JSON.stringify(merged), {
    expirationTtl: SESSION_TTL,
  });
}

export async function deleteSession(id: string, env: Env): Promise<void> {
  await env.AUTH_SESSIONS.delete(`session:${id}`);
}

export const SESSION_COOKIE = COOKIE;
