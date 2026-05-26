"use client";

/**
 * Dashboard — 進捗ありユーザー向け「おかえりなさい」ダッシュ。
 * 仕様書 §3:
 *   - 4数値: 挑戦済み章 / 平均正答率 / 模試ベスト / 苦手問題数
 *   - 3ボタン: 学習続ける(主) / 苦手N問(副) / 模擬試験(副)
 *   - 右上に「最終学習: YYYY-MM-DD」 + 🔥連続日数
 *   - 模試未受験は「未受験」灰色
 */

import Link from "next/link";
import type { HomeStats } from "@/lib/home-stats";
import { pickNextChapter } from "@/lib/home-stats";
import { StudyCalendar } from "@/components/StudyCalendar";

type Props = { stats: HomeStats };

export default function Dashboard({ stats }: Props) {
  const nextChapter = pickNextChapter();
  const continueHref = `/quiz/${nextChapter}/?resume=true`;

  return (
    <section className="pt-2 pb-8">
      {/* おかえりなさい + カレンダー + ボタン を 1 枠に統合 (G検定パターン) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            👋 おかえりなさい
          </h2>
          <div className="flex items-center gap-2 text-[11px]">
            {stats.streak > 0 && (
              <span className="font-semibold text-teal-700 dark:text-teal-400">
                🔥 {stats.streak}日連続
              </span>
            )}
            {stats.lastStudyDate && (
              <span className="text-slate-400 dark:text-slate-500">
                最終学習: {stats.lastStudyDate}
              </span>
            )}
          </div>
        </div>

        {/* 4 数値 */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Metric
            value={`${stats.chaptersChallenged}`}
            suffix={`/${stats.totalChapters}`}
            label="挑戦済み章"
            tone="brand"
          />
          <Metric
            value={`${stats.avgCorrectRate}%`}
            label="平均正答率"
            tone="slate"
          />
          {stats.mockBest !== null ? (
            <Metric
              value={`${stats.mockBest}%`}
              label="模試ベスト"
              tone="teal"
            />
          ) : (
            <Metric value="未受験" label="模試ベスト" tone="muted" />
          )}
          <Metric
            value={`${stats.wrongCount}`}
            label="苦手問題"
            tone={stats.wrongCount > 0 ? "amber" : "slate"}
          />
        </div>

        {/* 学習カレンダー (4数値とボタンの間に内包) */}
        <div className="mt-4">
          <StudyCalendar />
        </div>

        {/* 3 ボタン */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link
            href={continueHref}
            className="rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-center text-sm font-bold text-white transition"
          >
            学習を続ける →
          </Link>
          {stats.wrongCount > 0 ? (
            <Link
              href="/quiz/review/"
              className="rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 py-2.5 text-center text-sm font-semibold text-amber-800 dark:text-amber-200 hover:border-amber-400 transition"
            >
              🎯 苦手 {stats.wrongCount} 問
            </Link>
          ) : (
            <span className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-2.5 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
              🎯 苦手 0 問
            </span>
          )}
          <Link
            href="/exam/"
            className="rounded-xl border border-teal-300 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-900/10 py-2.5 text-center text-sm font-semibold text-teal-700 dark:text-teal-400 hover:border-teal-400 transition"
          >
            📝 模擬試験
          </Link>
        </div>
      </div>
    </section>
  );
}

type MetricProps = {
  value: string;
  suffix?: string;
  label: string;
  tone: "brand" | "teal" | "amber" | "slate" | "muted";
};

function Metric({ value, suffix, label, tone }: MetricProps) {
  const toneClass = {
    brand: "text-teal-600 dark:text-teal-400",
    teal: "text-teal-600 dark:text-teal-400",
    amber: "text-amber-600 dark:text-amber-400",
    slate: "text-slate-700 dark:text-slate-300",
    muted: "text-slate-400 dark:text-slate-500",
  }[tone];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-3 py-3 text-center">
      <div className={`text-xl font-bold leading-none ${toneClass}`}>
        {value}
        {suffix && (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}
