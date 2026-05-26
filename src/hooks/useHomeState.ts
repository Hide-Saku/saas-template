"use client";

/**
 * ホーム画面の状態判定フック。
 * useAuth() と home-stats を統合し、HomeView が必要な値を1つにまとめて返す。
 *
 * 仕様書: docs/HOME_PAGE_SPEC.md §1 (2軸4象限)
 *   - isPaid × hasProgress でセクション出し分け
 *   - loading=true の間は SSR/CSR ハイドレーション差を避けるためプレースホルダー
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-client";
import { computeHomeStats, type HomeStats } from "@/lib/home-stats";

export type HomeState = {
  loading: boolean;
  // 状態判定
  isPaid: boolean;
  hasProgress: boolean;
  // ダッシュ表示用
  stats: HomeStats;
  // 補助
  ownerCleared: boolean;
  email?: string;
};

const EMPTY_STATS: HomeStats = {
  chaptersChallenged: 0,
  totalChapters: 5,
  avgCorrectRate: 0,
  mockBest: null,
  wrongCount: 0,
  lastStudyDate: null,
  streak: 0,
  hasProgress: false,
  remainingFreeQuestions: 0,
};

export function useHomeState(): HomeState {
  const auth = useAuth();
  const [statsReady, setStatsReady] = useState(false);
  const [stats, setStats] = useState<HomeStats>(EMPTY_STATS);

  useEffect(() => {
    setStats(computeHomeStats());
    setStatsReady(true);
  }, []);

  return {
    loading: auth.loading || !statsReady,
    isPaid: auth.plan === "paid",
    hasProgress: stats.hasProgress,
    stats,
    ownerCleared: auth.ownerCleared,
    email: auth.email,
  };
}
