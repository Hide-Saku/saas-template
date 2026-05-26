/**
 * 模試の受験履歴管理（localStorage）
 * 本テンプレ標準の saveMockAttempt / getMockRecord 実装。
 *
 * キー: ds-cert:exam-history = { [examId]: ExamRecord }
 */

const EXAM_KEY = "ds-cert:exam-history";

/** 合格目安ライン（本テンプレ既定値: 80%） */
export const EXAM_PASS_RATIO = 0.8;

export type ExamRecord = {
  bestRate: number; // 過去最高の正答率（百分率・整数）
  bestCorrect: number; // 最高スコアの正答数
  totalCount: number; // 問題数（基本は100）
  lastAttemptAt: string; // 最終受験日 YYYY-MM-DD
  lastRate: number; // 最終受験時の正答率
  attemptCount: number; // 受験回数
};

type ExamStore = Record<string, ExamRecord>;

function loadStore(): ExamStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EXAM_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? (data as ExamStore) : {};
  } catch {
    return {};
  }
}

/** 受験結果を保存（最高スコアの更新を含む） */
export function saveExamAttempt(
  examId: string,
  correctCount: number,
  totalCount: number,
): ExamRecord {
  const store = loadStore();
  const rate =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const prev = store[examId];
  const next: ExamRecord = {
    bestRate: prev ? Math.max(prev.bestRate, rate) : rate,
    bestCorrect:
      prev && prev.bestRate >= rate ? prev.bestCorrect : correctCount,
    totalCount,
    lastAttemptAt: new Date().toISOString().slice(0, 10),
    lastRate: rate,
    attemptCount: (prev?.attemptCount ?? 0) + 1,
  };
  store[examId] = next;
  try {
    window.localStorage.setItem(EXAM_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
  return next;
}

/** 模試ごとの履歴を取得（未受験なら null） */
export function getExamRecord(examId: string): ExamRecord | null {
  return loadStore()[examId] ?? null;
}
