"use client";

/**
 * Hero — 進捗なしユーザー向けトップセクション。
 * 仕様書 §6 の統一テンプレ「○○対策を、[差別化]で[ベネフィット]。」
 */

import Link from "next/link";

export default function Hero() {
  return (
    <section className="text-center pt-4 pb-10">
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100">
        {/* TODO: テンプレ利用側で資格名・キャッチコピーに置換 */}
        {"{{CERT_NAME}}"}対策を、
        <br className="sm:hidden" />
        <span className="text-teal-600 dark:text-teal-400">音声で耳から</span>
        もう一段。
      </h1>
      <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
        {/* TODO: テンプレ利用側で問題数・模試数・用語数に置換 */}
        全{"{{QUESTION_COUNT}}"}問・模試{"{{EXAM_COUNT}}"}回・用語集{"{{GLOSSARY_COUNT}}"}語。問題・選択肢・解説まですべて音声化し、
        <br className="hidden sm:block" />
        通勤中・運動中の隙間時間に学習できる独自設計。
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/quiz/"
          className="rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-3 text-sm font-bold text-white transition"
        >
          無料で問題演習を始める
        </Link>
        <Link
          href="/listen/"
          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition"
        >
          聞き流しモードを試す
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        {"{{CERT_NAME}}"}{"{{SYLLABUS_VERSION}}"}準拠 / 全問に解説音声
      </p>
    </section>
  );
}
