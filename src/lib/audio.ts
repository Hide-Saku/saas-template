/**
 * 音声URL・再生キューのユーティリティ（G検定研究室から移植）
 *
 * 本テンプレの音声配置:
 *   /audio/markers/{name}.mp3                マーカー（問題・選択肢A〜D・正解はA〜D・解説）
 *   /audio/{prefix}/{questionId}/q.mp3       問題文
 *   /audio/{prefix}/{questionId}/opt-{i}.mp3 選択肢i（0〜3）
 *   /audio/{prefix}/{questionId}/exp.mp3     解説
 *   /audio/glossary/{termId}/term.mp3    用語名
 *   /audio/glossary/{termId}/def.mp3     用語定義
 */

import type { Question } from "./content";

const MARKER_BASE = "/audio/markers";
const QUIZ_BASE = "/audio/ds-cert";
const GLOSSARY_BASE = "/audio/glossary";

const OPTION_MARKERS = ["option-a", "option-b", "option-c", "option-d"] as const;
const CORRECT_MARKERS = ["correct-a", "correct-b", "correct-c", "correct-d"] as const;

export function markerUrl(name: string): string {
  return `${MARKER_BASE}/${name}.mp3`;
}
export function questionUrl(id: string): string {
  return `${QUIZ_BASE}/${id}/q.mp3`;
}
export function optionUrl(id: string, idx: number): string {
  return `${QUIZ_BASE}/${id}/opt-${idx}.mp3`;
}
export function explanationUrl(id: string): string {
  return `${QUIZ_BASE}/${id}/exp.mp3`;
}
export function glossaryTermUrl(termId: string): string {
  return `${GLOSSARY_BASE}/${termId}/term.mp3`;
}
export function glossaryDefUrl(termId: string): string {
  return `${GLOSSARY_BASE}/${termId}/def.mp3`;
}

/**
 * 問題文＋全選択肢の読み上げキュー。
 * 「問題」マーカー → 問題文 → 「選択肢A」マーカー → A本文 → … → 「選択肢D」マーカー → D本文
 * 本テンプレの opt-{i}.mp3 にはプレフィックスが含まれていないため、マーカーで「選択肢A」等を読み上げる。
 */
export function buildQuestionQueue(q: Question): string[] {
  const urls: string[] = [markerUrl("question"), questionUrl(q.id)];
  for (let i = 0; i < q.options.length; i++) {
    urls.push(markerUrl(OPTION_MARKERS[i]));
    urls.push(optionUrl(q.id, i));
  }
  return urls;
}

/**
 * 解答発表＋解説のキュー：「正解はX」→「解説」マーカー→解説文
 */
export function buildAnswerQueue(q: Question): string[] {
  return [
    markerUrl(CORRECT_MARKERS[q.correctIndex]),
    markerUrl("explanation"),
    explanationUrl(q.id),
  ];
}

/** 聞き流しモード用：1問まるごと（問題＋選択肢→正解＋解説） */
export function buildListenQueue(q: Question): string[] {
  return [...buildQuestionQueue(q), ...buildAnswerQueue(q)];
}

// 再生速度
export const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0] as const;
export const SPEED_STORAGE_KEY = "ds-cert:audio-speed";
export const DEFAULT_SPEED = 1.25; // 学習効率重視

export function loadSpeed(): number {
  if (typeof window === "undefined") return DEFAULT_SPEED;
  try {
    const raw = window.localStorage.getItem(SPEED_STORAGE_KEY);
    const n = raw ? Number(raw) : DEFAULT_SPEED;
    return (SPEED_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_SPEED;
  } catch {
    return DEFAULT_SPEED;
  }
}

export function saveSpeed(speed: number): void {
  try {
    window.localStorage.setItem(SPEED_STORAGE_KEY, String(speed));
  } catch {
    /* ignore */
  }
}
