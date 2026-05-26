"use client";

/**
 * 章一覧（G検定研究室の ChapterCard パターンを移植）
 *
 * 上部:
 *   - 「苦手問題を復習」カード（間違えた問題 > 0 のとき表示）
 * 各章カード:
 *   - 章番号バッジ + 第X章 章名
 *   - 利用可能数/総数 + 🔒残N問 + 進捗 + 正答率
 *   - 章解説
 *   - 「続きから (N問残り)」+「最初から」、または「演習を開始 →」
 * 下部:
 *   - 「演習の進め方」案内
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories, questions, DOMAIN_LABEL, type DomainId } from "@/lib/content";
import { chapterNumber, CHAPTER_DESCRIPTION } from "@/lib/domain";
import { useAuth } from "@/lib/auth-client";
import { getWrongQuestionIds } from "@/lib/wrong-questions";
import { StudyCalendar } from "./StudyCalendar";

type StoredProgress = {
  [questionId: string]: { correct: boolean; answeredAt: number };
};

function loadProgress(domainId: string): StoredProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`ds-cert:progress:${domainId}`);
    return raw ? (JSON.parse(raw) as StoredProgress) : {};
  } catch {
    return {};
  }
}

export default function ChapterListClient() {
  const router = useRouter();
  const { plan } = useAuth();
  const isPaid = plan === "paid";
  const [progressMap, setProgressMap] = useState<Record<string, StoredProgress>>({});
  const [wrongCount, setWrongCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  /** 章の進捗をクリアして全問演習を開始 */
  const resetChapter = useCallback(
    (domainId: string) => {
      try {
        window.localStorage.removeItem(`ds-cert:progress:${domainId}`);
      } catch {
        /* ignore */
      }
      setProgressMap((prev) => ({ ...prev, [domainId]: {} }));
      router.push(`/quiz/${domainId}/?start=all`);
    },
    [router],
  );

  useEffect(() => {
    const m: Record<string, StoredProgress> = {};
    for (const c of categories) m[c.id] = loadProgress(c.id);
    setProgressMap(m);
    setWrongCount(getWrongQuestionIds().length);
    setMounted(true);
  }, []);

  const sorted = useMemo(
    () =>
      [...categories].sort(
        (a, b) => chapterNumber(a.id) - chapterNumber(b.id),
      ),
    [],
  );

  return (
    <>
      {/* 上部: 苦手問題復習 + 学習カレンダー */}
      {mounted ? (
        wrongCount > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 items-stretch">
            <Link
              href="/quiz/review/"
              className="flex items-center gap-4 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-5 shadow-sm transition hover:shadow-md hover:border-amber-400"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800/50 text-xl">
                🎯
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-amber-900 dark:text-amber-200">
                  苦手問題を復習
                </div>
                <div className="mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                  間違えた {wrongCount} 問を集中再演習
                </div>
              </div>
              <span className="text-amber-600 dark:text-amber-400 text-lg">→</span>
            </Link>
            <StudyCalendar />
          </div>
        ) : (
          <div className="mt-6">
            <StudyCalendar />
          </div>
        )
      ) : (
        // SSR/CSR 差防止のプレースホルダー
        <div className="mt-6 h-[124px]" aria-hidden />
      )}

      {/* 章カード 2 カラムグリッド */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sorted.map((cat) => {
          const d = cat.id as DomainId;
          const chNum = chapterNumber(d);
          const all = questions.filter((q) => q.domainId === d);
          const available = isPaid ? all : all.filter((q) => q.free);
          const lockedCount = all.length - available.length;
          const progress = progressMap[cat.id] ?? {};
          const answeredCount = Object.keys(progress).length;
          const correctCount = Object.values(progress).filter((p) => p.correct).length;
          const remaining = available.length - answeredCount;
          const rate =
            answeredCount > 0
              ? Math.round((correctCount / answeredCount) * 100)
              : 0;

          return (
            <div
              key={cat.id}
              className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">
                  {chNum}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    第{chNum}章 {DOMAIN_LABEL[d]}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>
                      {available.length} / {all.length}問
                    </span>
                    {lockedCount > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        🔒 残 {lockedCount}問
                      </span>
                    )}
                    {mounted && answeredCount > 0 && (
                      <span className="text-teal-600 dark:text-teal-400">
                        進捗 {answeredCount}/{available.length}（正答率 {rate}%）
                      </span>
                    )}
                  </p>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {CHAPTER_DESCRIPTION[d]}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {mounted && answeredCount > 0 && remaining > 0 ? (
                  <>
                    <Link
                      href={`/quiz/${cat.id}/?resume=true`}
                      className="flex-1 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 py-2.5 text-center text-xs font-bold text-white transition"
                    >
                      続きから（{remaining}問残り）
                    </Link>
                    <button
                      type="button"
                      onClick={() => resetChapter(cat.id)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-amber-500 hover:text-amber-600 transition"
                      aria-label="この章の進捗をリセットして最初から"
                    >
                      🔄 リセット
                    </button>
                  </>
                ) : mounted && answeredCount > 0 && remaining === 0 ? (
                  <Link
                    href={`/quiz/${cat.id}/`}
                    className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-center text-xs font-bold text-white transition"
                  >
                    完答済み — もう一度演習する
                  </Link>
                ) : (
                  <Link
                    href={`/quiz/${cat.id}/`}
                    className="flex-1 rounded-xl bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500 py-2.5 text-center text-xs font-bold text-white transition"
                  >
                    演習を開始 →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 演習の進め方 */}
      <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          演習の進め方
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          章を選ぶと出題数（10・20・50問または全問）を選択できます。問題はランダムに出題され、回答すると正誤判定・解説・選択肢ごとの補足が表示されます。進捗は端末内に保存され、次回「続きから」ボタンで未解答の問題のみを続けて解けます。間違えた問題は自動的に「苦手問題」に記録され、上部の「苦手問題を復習」から再演習できます。
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
        >
          ← ホームに戻る
        </Link>
      </div>
    </>
  );
}
