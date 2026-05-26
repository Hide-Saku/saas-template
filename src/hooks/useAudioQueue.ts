"use client";

/**
 * 複数音声URLを順番に再生するキューフック。
 * G検定研究室から移植（変更なし）。
 *
 * 同じ HTMLAudioElement を再利用して src を切り替えることで、
 * ブラウザの Autoplay Policy 制限を回避する。
 */

import { useRef, useState, useEffect, useCallback } from "react";

export function useAudioQueue() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const speedRef = useRef<number>(1.0);
  const onDoneRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);

  const playNextRef = useRef<() => void>(() => {});

  function getOrCreateAudio(): HTMLAudioElement {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.onended = () => playNextRef.current();
      audio.onerror = () => {
        console.warn("[AudioQueue] failed:", audio.src);
        playNextRef.current();
      };
      audioRef.current = audio;
    }
    return audioRef.current;
  }

  function teardownAudio() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore */
      }
      audio.removeAttribute("src");
      try {
        audio.load();
      } catch {
        /* ignore */
      }
      audioRef.current = null;
    }
    queueRef.current = [];
    onDoneRef.current = null;
  }

  playNextRef.current = () => {
    const url = queueRef.current.shift();
    if (!url) {
      setPlaying(false);
      const done = onDoneRef.current;
      onDoneRef.current = null;
      done?.();
      return;
    }
    const audio = getOrCreateAudio();
    audio.src = url;
    audio.playbackRate = speedRef.current;
    audio.play().catch(() => setPlaying(false));
  };

  const play = useCallback((urls: string[], speed = 1.0, onDone?: () => void) => {
    if (urls.length === 0) return;
    const audio = getOrCreateAudio();
    audio.pause();

    queueRef.current = [...urls];
    speedRef.current = speed;
    onDoneRef.current = onDone ?? null;

    const first = queueRef.current.shift()!;
    audio.src = first;
    audio.playbackRate = speed;
    setPlaying(true);
    audio.play().catch(() => setPlaying(false));
  }, []);

  const stop = useCallback(() => {
    teardownAudio();
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      teardownAudio();
    };
  }, []);

  return { play, stop, playing };
}
