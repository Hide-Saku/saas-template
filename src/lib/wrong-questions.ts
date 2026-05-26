/**
 * 苦手問題（間違えた問題）のローカル管理
 *
 * 本テンプレ標準の addWrongQuestion / removeWrongQuestion 実装。
 * localStorage キー: ds-cert:wrong
 * 値: questionId の配列（重複排除）
 */

const WRONG_KEY = "ds-cert:wrong";

export function getWrongQuestionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WRONG_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr.filter((x) => typeof x === "string") as string[]) : [];
  } catch {
    return [];
  }
}

export function addWrongQuestion(id: string): void {
  try {
    const list = getWrongQuestionIds();
    if (list.includes(id)) return;
    list.push(id);
    window.localStorage.setItem(WRONG_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function removeWrongQuestion(id: string): void {
  try {
    const list = getWrongQuestionIds().filter((x) => x !== id);
    window.localStorage.setItem(WRONG_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function clearWrongQuestions(): void {
  try {
    window.localStorage.removeItem(WRONG_KEY);
  } catch {
    /* ignore */
  }
}
