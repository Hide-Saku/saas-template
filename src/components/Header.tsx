"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";

const THEME_KEY = "ds-cert:theme";

export default function Header() {
  const [dark, setDark] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* noop */
    }
  }

  return (
    <header className="border-b border-border bg-bg-elevated">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <a href="/" className="font-bold text-brand">
          {/* TODO: テンプレ利用側でサイト名に置換 */}
          {"{{SITE_NAME}}"}
        </a>
        <nav className="flex items-center gap-1 text-sm">
          <a href="/quiz/" className="rounded-md px-2.5 py-1.5 hover:bg-bg">
            問題演習
          </a>
          <a href="/exam/" className="rounded-md px-2.5 py-1.5 hover:bg-bg">
            模試
          </a>
          <a href="/glossary/" className="rounded-md px-2.5 py-1.5 hover:bg-bg">
            用語集
          </a>
          <a href="/listen/" className="rounded-md px-2.5 py-1.5 hover:bg-bg">
            聞き流し
          </a>
          <a href="/mypage/" className="rounded-md px-2.5 py-1.5 hover:bg-bg">
            マイページ
          </a>
          {!auth.loading && !auth.authenticated && (
            <a
              href="/login/"
              className="ml-1 rounded-md border border-border px-2.5 py-1.5 hover:border-brand"
            >
              ログイン
            </a>
          )}
          {!auth.loading && auth.authenticated && (
            <a
              href="/account/"
              className="ml-1 flex items-center gap-1.5 rounded-md border border-border px-2 py-1 hover:border-brand"
              title={auth.email}
            >
              {auth.picture ? (
                <img src={auth.picture} alt="" className="h-6 w-6 rounded-full" />
              ) : (
                <span className="inline-block h-6 w-6 rounded-full bg-brand/20 text-center text-xs leading-6 text-brand">
                  {(auth.name || auth.email || "?").slice(0, 1)}
                </span>
              )}
              {auth.plan === "paid" && (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-brand-fg">
                  有料
                </span>
              )}
            </a>
          )}
          <button
            onClick={toggleTheme}
            aria-label="テーマ切替"
            className="ml-1 rounded-md border border-border px-2 py-1.5 hover:border-brand"
          >
            {dark ? "☀" : "☾"}
          </button>
        </nav>
      </div>
    </header>
  );
}
