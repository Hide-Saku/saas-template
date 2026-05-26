"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 単音再生ボタン。クリックで再生／再クリックで停止。
 * 同時に複数音は鳴らない（モジュール内で1つのみアクティブ）。
 */

let active: HTMLAudioElement | null = null;

export default function AudioButton({
  src,
  label = "再生",
  size = "sm",
}: {
  src: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // 🔴 BUGFIX (2026-05-24): src が変わる度に Audio を作り直す。
  // 以前は ref.current = new Audio(src) が初回のみ実行されており、
  // 問題2以降に進んでも問題1の音声が再生され続ける致命的バグだった。
  useEffect(() => {
    // 既存があれば停止・破棄
    if (ref.current) {
      ref.current.pause();
      if (active === ref.current) active = null;
    }
    const a = new Audio(src);
    a.addEventListener("ended", () => {
      setPlaying(false);
      if (active === a) active = null;
    });
    ref.current = a;
    setPlaying(false);
    return () => {
      a.pause();
      if (active === a) active = null;
    };
  }, [src]);

  function toggle() {
    if (playing) {
      ref.current?.pause();
      setPlaying(false);
      return;
    }
    // 既に鳴っている他の音を停止
    if (active && active !== ref.current) {
      active.pause();
      active.currentTime = 0;
    }
    if (!ref.current) return;
    ref.current.currentTime = 0;
    ref.current.play().then(() => {
      active = ref.current;
      setPlaying(true);
    }).catch(() => setPlaying(false));
  }

  const px = size === "md" ? "px-3 py-1.5 text-sm" : "px-2 py-1 text-xs";
  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex items-center gap-1 rounded-md border border-border bg-bg ${px} hover:border-brand`}
    >
      <span aria-hidden>{playing ? "■" : "▶"}</span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
