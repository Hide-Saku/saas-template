"use client";

/**
 * 聞き流しモードの課金ゲート (G検定研究室の ListenGate を DS向けに移植)
 *
 * - foundation 章 (1章=基盤): 誰でも利用可
 * - 2章以降: 有料プラン限定
 */

import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import type { Question, DomainId } from "@/lib/content";
import { CHAPTER_LABEL, chapterNumber } from "@/lib/domain";
import ListenClient from "./ListenClient";

type Props = {
  domainId: DomainId;
  questions: Question[];
};

export default function ListenGate({ domainId, questions }: Props) {
  const { loading, plan } = useAuth();
  const isPaid = plan === "paid";
  const chapNum = chapterNumber(domainId);
  const chapterLabel = CHAPTER_LABEL[domainId];

  // 無料アクセス可: 1章 (foundation) のみ
  if (domainId === "foundation" || isPaid) {
    return <ListenClient questions={questions} chapterLabel={chapterLabel} />;
  }

  // プラン確認中
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        プランを確認中…
      </div>
    );
  }

  // 有料ロック画面
  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-2">
          {chapNum}章「{chapterLabel.replace(/^\d+章\s*/, "")}」の聞き流しは有料プラン限定
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-300 mb-4 leading-relaxed">
          聞き流しモードは無料プランでは第1章（基盤）のみご利用いただけます。
          <br />
          全章をスキマ時間に聞き流せるのは買い切りプランです (¥1,500・追加課金なし)。
        </p>
        <Link
          href="/pricing/"
          className="inline-block px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition"
        >
          プランを見る
        </Link>
      </div>
      <div className="text-center">
        <Link
          href="/listen/"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 transition"
        >
          ← 章選択に戻る
        </Link>
        <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
        <Link
          href="/listen/foundation/"
          className="text-sm text-teal-600 dark:text-teal-400 font-semibold hover:underline"
        >
          無料の第1章を聞いてみる →
        </Link>
      </div>
    </div>
  );
}
