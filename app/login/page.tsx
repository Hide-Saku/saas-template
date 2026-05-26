"use client";

import Header from "@/components/Header";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-client";

export default function LoginPage() {
  const auth = useAuth();

  useEffect(() => {
    if (auth.authenticated) window.location.href = "/account/";
  }, [auth.authenticated]);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-center text-2xl font-bold">ログイン</h1>
        <p className="mt-3 text-center text-fg-muted">
          Googleアカウントでログインすると、進捗を端末をまたいで保存できます。
        </p>

        <a
          href="/api/auth/google?next=/account/"
          className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-border bg-bg-elevated px-5 py-3 font-medium transition hover:border-brand"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden
          >
            <path
              fill="#4285F4"
              d="M22 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.62c-.24 1.3-.97 2.4-2.07 3.14v2.6h3.35c1.96-1.8 3.1-4.46 3.1-7.57z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.8 0 5.14-.93 6.85-2.5l-3.35-2.6c-.93.62-2.12.99-3.5.99-2.7 0-4.98-1.82-5.8-4.27H2.74v2.68A10 10 0 0 0 12 22z"
            />
            <path
              fill="#FBBC05"
              d="M6.2 13.62a6 6 0 0 1 0-3.84V7.1H2.74a10 10 0 0 0 0 9.8L6.2 13.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.88c1.52 0 2.88.52 3.95 1.55l2.96-2.96A10 10 0 0 0 2.74 7.1L6.2 9.78c.82-2.45 3.1-3.9 5.8-3.9z"
            />
          </svg>
          Google でログイン
        </a>

        <p className="mt-6 text-center text-xs text-fg-muted">
          ログインによって取得する情報：メールアドレス・名前・プロフィール画像。
          <br />
          進捗・有料プランの管理に使用します。
        </p>
      </main>
    </>
  );
}
