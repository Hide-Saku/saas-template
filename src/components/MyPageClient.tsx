"use client";

import { useEffect, useState } from "react";
import { loadProgress, type Progress } from "@/lib/progress";
import { questions, categories, DOMAIN_LABEL } from "@/lib/content";
import { useAuth, logout, openPortal } from "@/lib/auth-client";

export default function MyPageClient() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const auth = useAuth();

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) {
    return <p className="mt-6 text-fg-muted">読み込み中…</p>;
  }

  const answeredIds = Object.keys(progress.answered);
  const totalAnswered = answeredIds.length;
  const totalCorrect = answeredIds.filter(
    (id) => progress.answered[id].isCorrect,
  ).length;
  const overallRate = totalAnswered
    ? Math.round((totalCorrect / totalAnswered) * 100)
    : 0;

  // 領域別
  const byDomain = categories.map((c) => {
    const ids = questions
      .filter((q) => q.domainId === c.id)
      .map((q) => q.id);
    let answered = 0;
    let correct = 0;
    for (const id of ids) {
      const r = progress.answered[id];
      if (r) {
        answered++;
        if (r.isCorrect) correct++;
      }
    }
    return { c, answered, correct, total: ids.length };
  });

  if (totalAnswered === 0) {
    return (
      <>
        <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-8 text-center">
          <p className="text-fg-muted">まだ回答記録がありません。</p>
          <a
            href="/quiz/"
            className="mt-4 inline-block rounded-lg bg-brand px-6 py-2.5 font-medium text-brand-fg hover:bg-brand-hover"
          >
            問題を解く
          </a>
        </div>
        <AccountSection auth={auth} />
      </>
    );
  }

  return (
    <div className="mt-6">
      {/* 全体 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: totalAnswered, label: "回答数" },
          { n: totalCorrect, label: "正解数" },
          { n: `${overallRate}%`, label: "正答率" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-bg-elevated p-4 text-center"
          >
            <div className="text-2xl font-bold text-brand">{s.n}</div>
            <div className="mt-1 text-sm text-fg-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 領域別 */}
      <h2 className="mt-8 font-bold">領域別の進捗</h2>
      <div className="mt-2 space-y-2">
        {byDomain.map(({ c, answered, correct, total }) => {
          const rate = answered ? Math.round((correct / answered) * 100) : 0;
          const rateColor =
            !answered
              ? "bg-border"
              : rate >= 80
              ? "bg-brand"
              : rate >= 60
              ? "bg-warning"
              : "bg-danger";
          return (
            <a
              key={c.id}
              href={`/quiz/${c.id}/`}
              className="block rounded-xl border border-border bg-bg-elevated p-4 transition hover:border-brand"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{DOMAIN_LABEL[c.id]}</span>
                <span className="text-fg-muted">
                  {answered}/{total}問　正答率{rate}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full ${rateColor} transition-all`}
                  style={{ width: `${(answered / total) * 100}%` }}
                />
              </div>
            </a>
          );
        })}
      </div>

      {/* 苦手カテゴリ */}
      {(() => {
        // 領域別の正答率を集計し、苦手TOP3を抽出
        const ranked = byDomain
          .filter((d) => d.answered >= 3) // 3問以上回答した領域のみ
          .map((d) => ({
            ...d,
            rate: d.correct / d.answered,
          }))
          .sort((a, b) => a.rate - b.rate)
          .slice(0, 3);
        if (ranked.length === 0) return null;
        return (
          <>
            <h2 className="mt-8 font-bold">苦手カテゴリ（正答率が低い領域）</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {ranked.map((d) => (
                <a
                  key={d.c.id}
                  href={`/quiz/${d.c.id}/`}
                  className="rounded-xl border border-border bg-bg-elevated p-4 text-center transition hover:border-warning"
                >
                  <div className="text-sm font-medium">{DOMAIN_LABEL[d.c.id]}</div>
                  <div className="mt-1 text-2xl font-bold text-warning">
                    {Math.round(d.rate * 100)}%
                  </div>
                  <div className="text-xs text-fg-muted">
                    再挑戦 →
                  </div>
                </a>
              ))}
            </div>
          </>
        );
      })()}

      {/* 苦手問題リスト */}
      <h2 className="mt-8 font-bold">苦手フラグの付いた問題</h2>
      {progress.flagged.length === 0 ? (
        <p className="mt-2 text-sm text-fg-muted">
          まだ苦手問題はありません。間違えると自動的にフラグが立ちます。
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-fg-muted">
            {progress.flagged.length} 件あります（最新10件を表示）
          </p>
          <ul className="mt-3 space-y-2">
            {progress.flagged
              .slice(-10)
              .reverse()
              .map((id) => {
                const q = questions.find((x) => x.id === id);
                if (!q) return null;
                return (
                  <li
                    key={id}
                    className="rounded-lg border border-border bg-bg-elevated p-3 text-sm"
                  >
                    <div className="text-xs text-fg-muted">{q.syllabusRef}</div>
                    <div className="mt-1 line-clamp-2">{q.question}</div>
                  </li>
                );
              })}
          </ul>
          <a
            href="/quiz/review/"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            🎯 苦手問題を集中再演習する →
          </a>
        </>
      )}

      <AccountSection auth={auth} />
    </div>
  );
}

/** アカウント情報 + 領収書・購入履歴 + ログアウト */
function AccountSection({ auth }: { auth: ReturnType<typeof useAuth> }) {
  if (auth.loading) return null;

  // 未ログイン
  if (!auth.authenticated) {
    return (
      <>
        <hr className="my-8 border-border" />
        <h2 className="font-bold">アカウント情報</h2>
        <div className="mt-3 rounded-xl border border-border bg-bg-elevated p-5">
          <p className="text-sm text-fg-muted">
            ログインすると、有料プラン購入や領収書ダウンロードができます。
          </p>
          <a
            href="/login/"
            className="mt-3 inline-block rounded-lg bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:bg-brand-hover"
          >
            ログイン
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <hr className="my-8 border-border" />

      <h2 className="font-bold">アカウント情報</h2>
      <div className="mt-3 rounded-xl border border-border bg-bg-elevated p-5">
        <div className="flex items-center gap-3">
          {auth.picture ? (
            <img
              src={auth.picture}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-base font-bold text-brand">
              {(auth.name || auth.email || "?").slice(0, 1)}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{auth.name || "(名前未設定)"}</div>
            <div className="text-sm text-fg-muted truncate">{auth.email}</div>
          </div>
        </div>
        <div className="mt-3">
          {auth.plan === "paid" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-900/40 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
              ✓ プレミアムプラン（買い切り）
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              無料プラン
            </span>
          )}
        </div>
      </div>

      {auth.plan === "paid" ? (
        <>
          <h2 className="mt-6 font-bold">領収書・購入履歴</h2>
          <div className="mt-3 rounded-xl border border-border bg-bg-elevated p-5">
            <p className="text-sm text-fg-muted">
              Stripe のカスタマーポータルで領収書のダウンロード・支払い方法の確認ができます。
            </p>
            <button
              onClick={openPortal}
              className="mt-3 rounded-lg border border-border bg-bg px-5 py-2 text-sm font-medium hover:border-brand"
            >
              カスタマーポータルを開く
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="mt-6 font-bold">プランをアップグレード</h2>
          <div className="mt-3 rounded-xl border border-border bg-bg-elevated p-5">
            <p className="text-sm text-fg-muted">
              買い切り ¥1,500（追加課金なし）で全問題・全音声・聞き流しモードが解放されます。
            </p>
            <a
              href="/pricing/"
              className="mt-3 inline-block rounded-lg bg-brand px-5 py-2 text-sm font-medium text-brand-fg hover:bg-brand-hover"
            >
              プランを見る
            </a>
          </div>
        </>
      )}

      <button
        onClick={logout}
        className="mt-6 text-sm text-fg-muted hover:text-danger"
      >
        ログアウト
      </button>
    </>
  );
}
