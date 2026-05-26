"use client";

/**
 * PricingCard — 仕様書 §2【6】無料/プレミアム 2 カラム比較。
 * 無料ユーザーのみ表示。買い切り価格を強調 + §5-B 開示注記。
 */

import Link from "next/link";

export default function PricingCard() {
  return (
    <section className="py-10">
      <h2 className="text-xl font-bold text-center text-slate-900 dark:text-slate-100">
        まずは無料で。納得したらプレミアムへ。
      </h2>
      <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
        買い切り 1,500円。サブスクではありません。
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
        {/* 無料プラン */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            無料プラン
          </h3>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">
            ¥0
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li>✓ 問題演習 300問</li>
            <li>✓ 模擬試験 3回</li>
            <li>✓ 用語集 全333語</li>
            <li>✓ 1章（基盤）の音声学習</li>
          </ul>
        </div>

        {/* プレミアムプラン */}
        <div className="relative rounded-2xl border-2 border-teal-500 bg-teal-50/40 dark:bg-teal-900/20 p-5">
          <span className="absolute -top-3 right-4 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
            ローンチ記念
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            プレミアムプラン
          </h3>
          <p className="mt-3">
            <span className="text-sm text-slate-400 line-through mr-2">
              ¥2,480
            </span>
            <span className="text-3xl font-bold text-teal-700 dark:text-teal-400">
              ¥1,500
            </span>
            <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
              （買い切り）
            </span>
          </p>
          <ul className="mt-4 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <li>✓ 問題演習 全945問</li>
            <li>✓ 模擬試験 9回</li>
            <li className="font-semibold">✓ 全945問の音声と聞き流しモード</li>
            <li>✓ 今後追加される問題も無料</li>
          </ul>
          <Link
            href="/pricing/"
            className="mt-4 block rounded-xl bg-teal-600 hover:bg-teal-700 py-2.5 text-center text-sm font-bold text-white transition"
          >
            プレミアムを見る
          </Link>
        </div>
      </div>

      {/* §5-B 購入前の開示 */}
      <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500">
        ※ 学習進捗はご利用端末のブラウザに保存されます。端末・ブラウザ間の同期機能はありません。
      </p>
    </section>
  );
}
