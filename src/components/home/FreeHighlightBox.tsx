"use client";

/**
 * FreeHighlightBox — 無料公開ハイライト + 音声サンプル試聴。
 * 仕様書 §2【3】無料ユーザーのみ表示。
 *
 * 音声サンプル: foundation 章の最初の問題（無料・1章=基盤）の問題文音声を再生
 */

import { useRef, useState } from "react";
import { stats } from "@/lib/content";

const SAMPLE_AUDIO_URL = "/audio/ds-cert/q-foundation-0001/q.mp3";

export default function FreeHighlightBox() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    if (!audioRef.current) {
      const a = new Audio(SAMPLE_AUDIO_URL);
      a.addEventListener("ended", () => setPlaying(false));
      audioRef.current = a;
    }
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }

  return (
    <section className="my-6">
      <div className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/60 dark:bg-teal-950/20 p-5 text-center">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          🎯 <strong>{stats.freeQuestions}問の実戦演習</strong>　＋
          　📚 <strong>{stats.glossaryCount}語の用語集</strong>　＋
          　🎧 <strong>1章の音声学習</strong>
          <br />
          <span className="mt-2 inline-block rounded-full bg-teal-600 px-3 py-0.5 text-xs font-bold text-white">
            完全無料公開
          </span>
        </p>
        <button
          type="button"
          onClick={toggle}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-teal-300 dark:border-teal-800/60 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition"
          aria-label="第1章の音声サンプルを聞く"
        >
          {playing ? "■ 停止" : "▶ 第1章の音声サンプルを聞く"}
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            （約10秒）
          </span>
        </button>
      </div>
    </section>
  );
}
