/**
 * progress.ts — 学習進捗の localStorage 管理（P1-5）
 *
 * 未ログインでも進捗が残るよう localStorage を使う。
 * 将来 KV 同期を追加する際もこのインターフェースを維持する。
 */

const KEY = "ds-cert:progress";

export interface AnswerRecord {
  selectedIndex: number; // シャッフル後の表示位置
  optionOrder: number[]; // シャッフル順（復習時の再現用）
  isCorrect: boolean;
  answeredAt: number;
}

export interface Progress {
  answered: Record<string, AnswerRecord>; // questionId -> 最新回答
  flagged: string[]; // 苦手フラグ
}

const EMPTY: Progress = { answered: {}, flagged: [] };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const p = JSON.parse(raw);
    return { answered: p.answered ?? {}, flagged: p.flagged ?? [] };
  } catch {
    return { ...EMPTY };
  }
}

function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* localStorage 不可環境は黙ってスキップ */
  }
}

export function recordAnswer(questionId: string, rec: AnswerRecord): Progress {
  const p = loadProgress();
  p.answered[questionId] = rec;
  // 不正解なら苦手フラグ、正解なら解除
  const set = new Set(p.flagged);
  if (rec.isCorrect) set.delete(questionId);
  else set.add(questionId);
  p.flagged = [...set];
  save(p);
  return p;
}

export function toggleFlag(questionId: string): Progress {
  const p = loadProgress();
  const set = new Set(p.flagged);
  set.has(questionId) ? set.delete(questionId) : set.add(questionId);
  p.flagged = [...set];
  save(p);
  return p;
}

/** 指定問題群に対する正答率などの統計 */
export function statsFor(questionIds: string[]): {
  answered: number;
  correct: number;
  rate: number;
} {
  const p = loadProgress();
  let answered = 0;
  let correct = 0;
  for (const id of questionIds) {
    const r = p.answered[id];
    if (r) {
      answered++;
      if (r.isCorrect) correct++;
    }
  }
  return { answered, correct, rate: answered ? correct / answered : 0 };
}
