"use client";

import { useEffect, useState } from "react";

export interface AuthState {
  loading: boolean;
  authenticated: boolean;
  email?: string;
  name?: string;
  picture?: string;
  plan: "free" | "paid";
}

const PROGRESS_KEYS = ["ds-cert:progress"];
const LAST_OWNER_KEY = "ds-cert:lastOwner";

/**
 * 現在のログイン状態とプランを取得。
 * REUSABLE_STACK #13: ログインemail変更時はlocalStorageの進捗をクリア。
 */
export function useAuth(): AuthState & { ownerCleared: boolean } {
  const [state, setState] = useState<AuthState>({
    loading: true,
    authenticated: false,
    plan: "free",
  });
  const [ownerCleared, setOwnerCleared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json() as Promise<{
          authenticated?: boolean;
          email?: string;
          name?: string;
          picture?: string;
          plan?: "free" | "paid";
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setState({ loading: false, authenticated: false, plan: "free" });
          return;
        }
        // lastOwner チェック
        if (data.authenticated && data.email) {
          try {
            const prev = localStorage.getItem(LAST_OWNER_KEY);
            if (prev && prev !== data.email) {
              for (const k of PROGRESS_KEYS) localStorage.removeItem(k);
              setOwnerCleared(true);
            }
            localStorage.setItem(LAST_OWNER_KEY, data.email);
          } catch {}
        }
        setState({
          loading: false,
          authenticated: !!data.authenticated,
          email: data.email,
          name: data.name,
          picture: data.picture,
          plan: data.plan ?? "free",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ loading: false, authenticated: false, plan: "free" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...state, ownerCleared };
}

/** ログアウト */
export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  try {
    localStorage.removeItem(LAST_OWNER_KEY);
  } catch {}
  window.location.href = "/";
}

/** Checkout セッションを作成して Stripe にリダイレクト（買い切り単一商品） */
export async function startCheckout(): Promise<void> {
  const r = await fetch("/api/stripe/checkout", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) {
    alert("決済セッションの作成に失敗しました");
    return;
  }
  const data = (await r.json()) as { url?: string };
  if (data.url) window.location.href = data.url;
}

/**
 * アカウント完全削除（個人情報保護法対応）。
 * KV のセッション + 有料プラン記録 + 端末の localStorage 全消去後、ホームへリダイレクト。
 *
 * 注意: Stripe 側の顧客情報・購入履歴は領収書管理のため削除しない（運営の義務）。
 *      これは規約・特商法表記で説明する。
 */
export async function deleteAccount(): Promise<void> {
  const r = await fetch("/api/account/delete", {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) {
    alert("アカウント削除に失敗しました。お問い合わせください。");
    return;
  }
  // localStorage の学習データもクリア
  try {
    const KEYS_TO_REMOVE: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("ds-cert:")) KEYS_TO_REMOVE.push(k);
    }
    for (const k of KEYS_TO_REMOVE) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  window.location.href = "/?account_deleted=1";
}

/** Customer Portal を開く */
export async function openPortal(): Promise<void> {
  const r = await fetch("/api/stripe/portal", {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) {
    let msg = "領収書ページの作成に失敗しました";
    try {
      const j = (await r.json()) as { error?: string; detail?: string };
      if (j.error === "portal_not_configured") {
        msg =
          "Stripe Customer Portal が未有効化のためご利用いただけません。\n運営でDashboardの設定を確認します。お問い合わせいただければ領収書を個別に発行します。";
      } else if (j.error === "no_customer") {
        msg =
          "決済情報が見つかりません（Webhook受信前の購入かもしれません）。\nお問い合わせください。";
      } else if (j.detail) {
        msg = `領収書ページの作成に失敗しました：${j.detail.slice(0, 120)}`;
      }
    } catch {
      /* ignore */
    }
    alert(msg);
    return;
  }
  const data = (await r.json()) as { url?: string };
  if (data.url) window.location.href = data.url;
}
