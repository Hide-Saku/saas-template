"use client";

/**
 * ChapterCards (ホーム用軽量版) — 仕様書 §3:
 *   番号バッジ + 章名 + 問題数 + 1〜2行解説 + 「演習する→」1ボタン
 *
 * /quiz/ ページの ChapterListClient (続きから/リセット付き) とは別物。
 * ホームでは詳細操作はせず、章の「ショールーム」として機能する。
 */

import Link from "next/link";
import { categories, DOMAIN_LABEL, type DomainId } from "@/lib/content";
import { chapterNumber, CHAPTER_DESCRIPTION } from "@/lib/domain";

export default function ChapterCards() {
  const sorted = [...categories].sort(
    (a, b) => chapterNumber(a.id) - chapterNumber(b.id),
  );

  return (
    <section className="py-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl px-5">
      <h2 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100">
        {/* TODO: テンプレ利用側で資格名・シラバス名に置換 */}
        {"{{CERT_NAME}}"}{"{{SYLLABUS_VERSION}}"}準拠
      </h2>
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
        公式シラバスの大項目を{"{{CHAPTER_COUNT}}"}章 / {"{{QUESTION_COUNT}}"}問で網羅
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {sorted.map((c) => {
          const d = c.id as DomainId;
          const chNum = chapterNumber(d);
          return (
            <Link
              key={c.id}
              href={`/quiz/${c.id}/`}
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition hover:border-teal-500 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  第{chNum}章
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {c.total}問
                </span>
              </div>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                {DOMAIN_LABEL[d]}
              </h3>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {CHAPTER_DESCRIPTION[d]}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
