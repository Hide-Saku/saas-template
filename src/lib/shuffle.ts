/**
 * shuffle.ts — 選択肢シャッフル（REUSABLE_STACK #11）
 *
 * LLM作問では正解がindex1等に偏るバイアスがあるため、表示時にシャッフルする。
 * 復習時の整合性のため、シャッフル順（optionOrder）を回答と一緒に保存する。
 */

/** Fisher-Yates で 0..n-1 のシャッフル済みインデックス配列を返す */
export function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** order に従って配列を並べ替える */
export function applyOrder<T>(arr: T[], order: number[]): T[] {
  return order.map((i) => arr[i]);
}

/** シャッフル後の正解位置を求める（元のcorrectIndexがどこに移ったか） */
export function correctIndexAfter(order: number[], correctIndex: number): number {
  return order.indexOf(correctIndex);
}
