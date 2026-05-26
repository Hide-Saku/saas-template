"use client";

/**
 * PremiumThankYouBadge — 有料ユーザー向けの感謝帯。
 * 仕様書 §2【6】料金プランの位置に表示。控えめ・温かい印象。
 */

import Link from "next/link";

export default function PremiumThankYouBadge() {
  return (
    <section className="py-6">
      <div className="rounded-2xl border border-teal-300/60 dark:border-teal-800/60 bg-gradient-to-r from-teal-50/70 to-teal-100/40 dark:from-teal-950/30 dark:to-teal-900/20 p-5 text-center">
        <p className="text-sm text-teal-900 dark:text-teal-200">
          <span className="mr-1">✨</span>
          <strong>プレミアム会員ありがとうございます</strong>
        </p>
        <p className="mt-1 text-xs text-teal-800/80 dark:text-teal-300/80">
          全945問・模試9回・全音声・聞き流しモード が解放されています
        </p>
        <Link
          href="/account/"
          className="mt-3 inline-block text-[11px] text-teal-700 dark:text-teal-400 hover:underline"
        >
          領収書・支払履歴を見る →
        </Link>
      </div>
    </section>
  );
}
