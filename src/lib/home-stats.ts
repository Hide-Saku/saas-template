/**
 * ホーム画面ダッシュボード用の集計純関数。
 *
 * すべての値は localStorage から読み出して算出される。
 * SSR 時は安全なデフォルト値を返す（window ガードあり）。
 *
 * 仕様書: docs/HOME_PAGE_SPEC.md §3 / §5
 */

import { categories, exams, questions } from "./content";
import { DOMAIN_ORDER } from "./domain";
import { getWrongQuestionIds } from "./wrong-questions";
import { loadActivity, getStreak as getActivityStreak } from "./activity";

export type HomeStats = {
  /** 1問でも解いた章の数 (0〜5) */
  chaptersChallenged: number;
  /** 5 */
  totalChapters: number;
  /** 全章合算の正答率 (0〜100、回答0なら0) */
  avgCorrectRate: number;
  /** 受験済み模試の最高 bestRate (0〜100)。未受験なら null */
  mockBest: number | null;
  /** 苦手問題数 */
  wrongCount: number;
  /** 最終学習日 "YYYY-MM-DD" or null */
  lastStudyDate: string | null;
  /** 連続学習日数 */
  streak: number;
  /** 1問でも解答 OR 模試1回でも受験 OR 苦手1問でもあれば true */
  hasProgress: boolean;
  /** 全章完答までの残り問題数（無料分のみ計算）。0〜totalFreeQuestions */
  remainingFreeQuestions: number;
};

type StoredProgress = {
  [questionId: string]: { correct: boolean; answeredAt: number };
};

function loadChapterProgress(domainId: string): StoredProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`ds-cert:progress:${domainId}`);
    return raw ? (JSON.parse(raw) as StoredProgress) : {};
  } catch {
    return {};
  }
}

type StoredExamHistory = Record<
  string,
  { bestRate: number; attemptCount: number }
>;

function loadExamHistory(): StoredExamHistory {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("ds-cert:exam-history");
    return raw ? (JSON.parse(raw) as StoredExamHistory) : {};
  } catch {
    return {};
  }
}

/** ダッシュボード表示に必要な全集計値を一括取得 */
export function computeHomeStats(): HomeStats {
  // ----- 章別進捗を集計 -----
  let answeredTotal = 0;
  let correctTotal = 0;
  let chaptersChallenged = 0;
  for (const cat of categories) {
    const prog = loadChapterProgress(cat.id);
    const keys = Object.keys(prog);
    if (keys.length === 0) continue;
    chaptersChallenged++;
    for (const k of keys) {
      answeredTotal++;
      if (prog[k]?.correct) correctTotal++;
    }
  }
  const avgCorrectRate =
    answeredTotal > 0 ? Math.round((correctTotal / answeredTotal) * 100) : 0;

  // ----- 模試ベスト -----
  const examHist = loadExamHistory();
  const examKeys = Object.keys(examHist);
  const mockBest =
    examKeys.length === 0
      ? null
      : Math.max(...examKeys.map((k) => examHist[k].bestRate));

  // ----- 苦手 -----
  const wrongCount = getWrongQuestionIds().length;

  // ----- 最終学習日 -----
  const activity = loadActivity();
  const dates = Object.keys(activity).sort();
  const lastStudyDate = dates.length > 0 ? dates[dates.length - 1] : null;

  // ----- 連続日数 -----
  const streak = getActivityStreak();

  // ----- 進捗あり判定 -----
  const hasProgress =
    answeredTotal > 0 || examKeys.length > 0 || wrongCount > 0;

  // ----- 残り無料問題数 -----
  const freeIds = new Set(questions.filter((q) => q.free).map((q) => q.id));
  let seenFreeCount = 0;
  for (const cat of categories) {
    const prog = loadChapterProgress(cat.id);
    for (const id of Object.keys(prog)) {
      if (freeIds.has(id)) seenFreeCount++;
    }
  }
  const remainingFreeQuestions = Math.max(0, freeIds.size - seenFreeCount);

  return {
    chaptersChallenged,
    totalChapters: DOMAIN_ORDER.length,
    avgCorrectRate,
    mockBest,
    wrongCount,
    lastStudyDate,
    streak,
    hasProgress,
    remainingFreeQuestions,
  };
}

/** 最初に着手すべき「次の章」(進捗のある最後の章 → 1章の順) */
export function pickNextChapter(): string {
  // 1問でも回答した最後の章を選ぶ
  for (let i = DOMAIN_ORDER.length - 1; i >= 0; i--) {
    const id = DOMAIN_ORDER[i];
    const prog = loadChapterProgress(id);
    if (Object.keys(prog).length > 0) return id;
  }
  return DOMAIN_ORDER[0];
}

/** 全模試の合計受験回数 */
export function getTotalExamAttempts(): number {
  const h = loadExamHistory();
  return Object.values(h).reduce((s, r) => s + (r.attemptCount ?? 0), 0);
}

void exams; // 将来用（模試数表示などで使う可能性）
