"use client";

/**
 * 聞き流しモード（G検定研究室から移植）
 * 問題→ポーズ→正解＋解説→次問 を自動連続再生する。
 *
 * 本テンプレ: 1章（基盤）の無料音声のみ対応（呼び出し側でフィルタ済み前提）
 */

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { Question } from "@/lib/content";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import {
  buildQuestionQueue,
  buildAnswerQueue,
  SPEED_OPTIONS,
  loadSpeed,
  saveSpeed,
} from "@/lib/audio";

type Props = { questions: Question[]; chapterLabel?: string };

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
const PAUSE_MS = 2500;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ListenClient({
  questions,
  chapterLabel = "1章 基盤",
}: Props) {
  const [order, setOrder] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [speed, setSpeed] = useState(1.25);
  const audio = useAudioQueue();
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef({ order, index, speed, running });
  stateRef.current = { order, index, speed, running };

  useEffect(() => {
    setOrder(shuffle(questions));
    setSpeed(loadSpeed());
  }, [questions]);

  const clearPause = () => {
    if (pauseRef.current) {
      clearTimeout(pauseRef.current);
      pauseRef.current = null;
    }
  };

  const playQuestion = useCallback(
    (idx: number) => {
      const { order: ord, speed: spd } = stateRef.current;
      if (idx >= ord.length) {
        setRunning(false);
        return;
      }
      const q = ord[idx];
      setIndex(idx);
      setRevealed(false);
      audio.play(buildQuestionQueue(q), spd, () => {
        pauseRef.current = setTimeout(() => {
          setRevealed(true);
          audio.play(buildAnswerQueue(q), stateRef.current.speed, () => {
            playQuestion(idx + 1);
          });
        }, PAUSE_MS);
      });
    },
    [audio]
  );

  const start = useCallback(() => {
    setRunning(true);
    playQuestion(stateRef.current.index);
  }, [playQuestion]);

  const pause = useCallback(() => {
    setRunning(false);
    clearPause();
    audio.stop();
  }, [audio]);

  const skip = useCallback(() => {
    clearPause();
    audio.stop();
    const next = stateRef.current.index + 1;
    if (next >= stateRef.current.order.length) {
      setRunning(false);
      return;
    }
    if (stateRef.current.running) playQuestion(next);
    else {
      setIndex(next);
      setRevealed(false);
    }
  }, [audio, playQuestion]);

  const changeSpeed = useCallback((s: number) => {
    setSpeed(s);
    saveSpeed(s);
  }, []);

  useEffect(() => {
    return () => clearPause();
  }, []);

  if (order.length === 0) {
    return <p className="text-sm text-slate-400">準備中…</p>;
  }

  const q = order[index];

  return (
    <div className="space-y-5">
      {/* ステータス */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          {chapterLabel}：{index + 1} / {order.length}問
        </span>
        <span
          className={`font-semibold ${
            running ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
          }`}
        >
          {running ? (revealed ? "解説を再生中" : "問題を再生中") : "停止中"}
        </span>
      </div>

      {/* 現在の問題 */}
      <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {q.syllabusRef && (
          <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mb-2">
            シラバス {q.syllabusRef}
          </p>
        )}
        <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed mb-3">
          {q.question}
        </p>
        <div className="space-y-1.5">
          {q.options.map((opt, i) => (
            <p
              key={i}
              className={`text-sm ${
                revealed && i === q.correctIndex
                  ? "text-teal-700 dark:text-teal-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {OPTION_LABELS[i]}. {opt}
              {revealed && i === q.correctIndex && " ←正解"}
            </p>
          ))}
        </div>
        {revealed && (
          <p className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {q.explanation}
          </p>
        )}
      </div>

      {/* コントロール */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={running ? pause : start}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition"
        >
          {running ? "■ 一時停止" : "▶ 再生"}
        </button>
        <button
          onClick={skip}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
        >
          スキップ ⏭
        </button>
        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 ml-auto">
          <span>速度</span>
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-1.5 py-0.5 rounded transition ${
                speed === s
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        ※ 再生は端末の音量設定に従います。バックグラウンド再生中も学習が進みます。
      </p>

      <Link
        href="/listen/"
        className="inline-block text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
      >
        ← トップに戻る
      </Link>
    </div>
  );
}
