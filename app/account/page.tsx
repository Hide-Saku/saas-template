"use client";

import Header from "@/components/Header";
import { useAuth, logout, openPortal, deleteAccount } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const auth = useAuth();
  const [banner, setBanner] = useState<"paid" | "canceled" | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("paid") === "1") setBanner("paid");
    else if (p.get("canceled") === "1") setBanner("canceled");
    if (p.has("paid") || p.has("canceled")) {
      // クエリを消してURLをきれいに
      window.history.replaceState({}, "", "/account/");
    }
  }, []);

  if (auth.loading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-xl px-5 py-16 text-center text-fg-muted">
          読み込み中...
        </main>
      </>
    );
  }

  if (!auth.authenticated) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-xl px-5 py-16 text-center">
          <p className="text-fg-muted">ログインが必要です。</p>
          <a
            href="/login/"
            className="mt-4 inline-block rounded-lg bg-brand px-6 py-2 font-medium text-brand-fg hover:bg-brand-hover"
          >
            ログイン
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 py-10">
        <h1 className="text-2xl font-bold">アカウント</h1>

        {banner === "paid" && (
          <div className="mt-5 rounded-xl border border-brand bg-brand/10 p-5">
            <p className="font-bold text-brand">✓ ご購入ありがとうございます</p>
            <p className="mt-2 text-sm">
              有料プランが有効化されました。全ての問題・音声・模試がご利用いただけます。
              （プランの反映まで数秒かかる場合があります）
            </p>
          </div>
        )}
        {banner === "canceled" && (
          <div className="mt-5 rounded-xl border border-warning bg-warning/10 p-5">
            <p className="font-bold text-warning">決済をキャンセルしました</p>
            <p className="mt-2 text-sm">
              いつでも <a href="/pricing/" className="underline">料金プラン</a> から再開できます。
            </p>
          </div>
        )}

        <section className="mt-6 rounded-xl border border-border bg-bg-elevated p-6">
          <div className="flex items-center gap-4">
            {auth.picture && (
              <img
                src={auth.picture}
                alt=""
                className="h-14 w-14 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{auth.name}</p>
              <p className="text-sm text-fg-muted">{auth.email}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
          <h2 className="font-bold">プラン</h2>
          <p className="mt-2 text-2xl font-bold text-brand">
            {auth.plan === "paid" ? "有料プラン" : "無料プラン"}
          </p>
          {auth.plan === "free" && (
            <a
              href="/pricing/"
              className="mt-4 inline-block rounded-lg bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:bg-brand-hover"
            >
              プランを比較する
            </a>
          )}
          {auth.plan === "paid" && (
            <>
              <p className="mt-2 text-sm text-fg-muted">
                買い切りプラン（追加課金なし）です。継続課金はありません。
              </p>
              <button
                onClick={openPortal}
                className="mt-4 rounded-lg border border-border bg-bg px-5 py-2 text-sm hover:border-brand"
              >
                領収書・支払履歴を見る
              </button>
            </>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
          <h2 className="font-bold">セッション</h2>
          <button
            onClick={logout}
            className="mt-3 rounded-lg border border-danger px-5 py-2 text-sm text-danger hover:bg-danger/10"
          >
            ログアウト
          </button>
        </section>

        {/* アカウント削除（個人情報保護法対応） */}
        <section className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
          <h2 className="font-bold">アカウントの削除</h2>
          <p className="mt-2 text-sm text-fg-muted leading-relaxed">
            ご利用のアカウント情報（メールアドレス・お名前・有料プラン記録）と、
            この端末に保存された学習進捗を完全に削除します。
          </p>
          <ul className="mt-3 list-disc pl-5 text-xs text-fg-muted space-y-1">
            <li>サーバー側のセッション・有料プラン記録を即時削除</li>
            <li>この端末の localStorage 学習データを全消去</li>
            <li>削除後はホームへ自動遷移、再ログインで「無料プラン」として表示</li>
            <li>
              ※ Stripe側の購入履歴・領収書は税務処理のため保持されます
              （個人情報ではなく取引記録）
            </li>
          </ul>
          <button
            onClick={() => {
              if (
                confirm(
                  "アカウント情報と学習進捗をすべて削除します。\nこの操作は取り消せません。本当に削除しますか？",
                )
              ) {
                deleteAccount();
              }
            }}
            className="mt-4 rounded-lg border border-danger px-5 py-2 text-sm text-danger hover:bg-danger/10"
          >
            アカウントを削除する
          </button>
        </section>
      </main>
    </>
  );
}
