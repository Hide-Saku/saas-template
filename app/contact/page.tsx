"use client";

import Header from "@/components/Header";
import { useState, useEffect, useRef } from "react";

// Cloudflare Turnstile の site key (公開情報)
// TODO: テンプレ利用側で本番 site key に置換 ("0x4AAAA..." 24 文字)
const TURNSTILE_SITE_KEY = "{{TURNSTILE_SITE_KEY}}";
const TURNSTILE_ENABLED = !TURNSTILE_SITE_KEY.startsWith("{{");

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (t: string) => void; "error-callback"?: () => void },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "ok" | "error" | "rate_limited"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!TURNSTILE_ENABLED) return;
    const SCRIPT_ID = "cf-turnstile-script";
    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.body.appendChild(script);
    }
    const renderWidget = () => {
      if (renderedRef.current || !widgetRef.current || !window.turnstile) return;
      window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setToken(t),
        "error-callback": () => setToken(""),
      });
      renderedRef.current = true;
    };
    if (window.turnstile) renderWidget();
    else script.addEventListener("load", renderWidget);
    return () => {
      script?.removeEventListener("load", renderWidget);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          body,
          turnstileToken: token,
        }),
      });
      if (r.ok) {
        setStatus("ok");
        setName("");
        setEmail("");
        setSubject("");
        setBody("");
      } else if (r.status === 429) {
        setStatus("rate_limited");
      } else {
        const j = await r.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(j.error || "送信に失敗しました");
      }
    } catch {
      setStatus("error");
      setErrorMsg("通信エラーが発生しました");
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-bold">お問い合わせ</h1>
        <p className="mt-2 text-fg-muted text-sm">
          ご質問・ご要望・誤問題のご指摘などお気軽にどうぞ。3営業日以内に返信します。
        </p>

        {status === "ok" ? (
          <div className="mt-8 rounded-xl border border-brand bg-brand/10 p-6 text-center">
            <p className="font-bold text-brand">送信完了</p>
            <p className="mt-2 text-sm">
              お問い合わせを受け付けました。3営業日以内に返信いたします。
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="お名前" required>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2"
              />
            </Field>
            <Field label="メールアドレス" required>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2"
              />
            </Field>
            <Field label="件名" required>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2"
              />
            </Field>
            <Field label="本文" required>
              <textarea
                required
                rows={8}
                maxLength={4000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2"
              />
            </Field>

            {TURNSTILE_ENABLED && <div ref={widgetRef} />}

            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-lg bg-brand px-6 py-2.5 font-medium text-brand-fg disabled:opacity-50 hover:bg-brand-hover"
            >
              {status === "sending" ? "送信中..." : "送信する"}
            </button>

            {status === "error" && (
              <p className="text-sm text-danger">{errorMsg}</p>
            )}
            {status === "rate_limited" && (
              <p className="text-sm text-warning">
                送信回数の上限に達しました。1時間後に再度お試しください。
              </p>
            )}
          </form>
        )}
      </main>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
