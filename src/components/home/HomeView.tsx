"use client";

/**
 * HomeView — 状態判定とセクション組み立てのルート。
 *
 * 仕様書 docs/HOME_PAGE_SPEC.md §2:
 *   【1】Header                      ← layout で提供
 *   【2】TopSection                  ← Hero or Dashboard
 *   【3】無料公開ハイライト          ← 進捗なしユーザーのみ
 *   【4】4 つの武器                  ← ④継続学習中は折りたたみ
 *   【5】章カード                    ← 常に表示
 *   【6】料金 or プレミアム帯        ← 無料/有料で出し分け
 *   【7】3 つの理由                  ← ④継続学習中は折りたたみ
 *   【8】Footer                      ← layout で提供
 *
 * 状態 (仕様書 §1 2軸4象限):
 *   ① 新規(無料・進捗なし)    : Hero    + 無料 + 4武器 + 章 + Pricing + 3理由
 *   ② 試用中(無料・進捗あり)  : Dashboard + 無料 + 4武器 + 章 + Pricing + 3理由
 *   ③ 購入後未着手(有料・進捗なし): Hero + 4武器 + 章 + ThankYou + 3理由
 *   ④ 継続学習中(有料・進捗あり): Dashboard + [4武器折] + 章 + ThankYou + [3理由折]
 */

import { useHomeState } from "@/hooks/useHomeState";
import Hero from "./Hero";
import Dashboard from "./Dashboard";
import FreeHighlightBox from "./FreeHighlightBox";
import FourWeapons from "./FourWeapons";
import ChapterCards from "./ChapterCards";
import PricingCard from "./PricingCard";
import PremiumThankYouBadge from "./PremiumThankYouBadge";
import ThreeReasons from "./ThreeReasons";

export default function HomeView() {
  const state = useHomeState();

  // 初回ハイドレーション中: 最小プレースホルダー（CLS 防止のため章カードは常に出す）
  if (state.loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <div className="h-40" aria-hidden />
        <ChapterCards />
      </div>
    );
  }

  const { isPaid, hasProgress, stats } = state;
  // ④継続学習中ユーザー: 4武器と3理由を折りたたみ
  const collapseExtras = isPaid && hasProgress;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      {/* 【2】TopSection — state-aware */}
      {hasProgress ? <Dashboard stats={stats} /> : <Hero />}

      {/* 【3】無料公開ハイライト — 進捗なしのみ */}
      {!hasProgress && <FreeHighlightBox />}

      {/* 【4】4 つの武器 */}
      {collapseExtras ? (
        <details className="my-6 group">
          <summary className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition list-none flex items-center justify-between">
            <span>サイトの機能を見る (問題演習・模試・用語集・聞き流し)</span>
            <span className="text-xs text-slate-400 group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <FourWeapons />
        </details>
      ) : (
        <FourWeapons />
      )}

      {/* 【5】章カード — 常に表示 */}
      <ChapterCards />

      {/* 【6】料金 or 感謝帯 */}
      {isPaid ? <PremiumThankYouBadge /> : <PricingCard />}

      {/* 【7】3 つの理由 */}
      {collapseExtras ? (
        <details className="my-6 group">
          <summary className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 transition list-none flex items-center justify-between">
            <span>選ばれる3つの理由を見る</span>
            <span className="text-xs text-slate-400 group-open:rotate-90 transition-transform">▶</span>
          </summary>
          <ThreeReasons />
        </details>
      ) : (
        <ThreeReasons />
      )}
    </div>
  );
}
