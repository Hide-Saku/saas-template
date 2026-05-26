"use client";

/**
 * 苦手問題 復習モード
 *
 * localStorage の苦手問題 ID リストから、利用可能な問題を抽出して順次出題。
 * QuizRunner と同じ UI/挙動だが:
 *  - setup フェーズなし（即 playing 開始）
 *  - 完了後の「もう一度」は再度未克服の苦手問題のみ
 *  - 正解で苦手問題リストから自動削除
 */

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import { questions, type Question } from "@/lib/content";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import { useAuth } from "@/lib/auth-client";
import { isAudioFree, chapterNumber, CHAPTER_LABEL } from "@/lib/domain";
import { OptionButton } from "./OptionButton";
import { ExplanationPanel } from "./ExplanationPanel";
import { AudioToggle } from "./AudioToggle";
import { AudioSpeedSelector } from "./AudioSpeedSelector";
import {
  buildQuestionQueue,
  buildAnswerQueue,
  loadSpeed,
  saveSpeed,
} from "@/lib/audio";
import {
  getWrongQuestionIds,
  addWrongQuestion,
  removeWrongQuestion,
} from "@/lib/wrong-questions";
import { recordActivity } from "@/lib/activity";

const LABELS = ["A", "B", "C", "D"] as const;
const AUDIO_MODE_KEY = "ds-cert:audio-mode";

type Phase = "loading" | "empty" | "playing" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewClient() {
  const { plan } = useAuth();
  const isPaid = plan === "paid";

  const [phase, setPhase] = useState<Phase>("loading");
  const [quizSet, setQuizSet] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [audioMode, setAudioMode] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.25);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const { play: playQueue, stop: stopQueue, playing: audioPlaying } =
    useAudioQueue();

  // 苦手問題から実 Question を抽出
  const loadSet = useCallback((): Question[] => {
    const ids = new Set(getWrongQuestionIds());
    const list = questions.filter(
      (q) => ids.has(q.id) && (isPaid || q.free),
    );
    return shuffle(list);
  }, [isPaid]);

  // 初期ロード
  useEffect(() => {
    setAudioSpeed(loadSpeed());
    try {
      setAudioMode(window.localStorage.getItem(AUDIO_MODE_KEY) === "true");
    } catch {
      /* ignore */
    }
    const set = loadSet();
    if (set.length === 0) {
      setPhase("empty");
      return;
    }
    setQuizSet(set);
    setAnswers(new Array(set.length).fill(null));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setPhase("playing");
    // 音声モード自動再生（音声利用可なら）
    const first = set[0];
    if (
      first &&
      (isAudioFree(first) || isPaid) &&
      window.localStorage.getItem(AUDIO_MODE_KEY) === "true"
    ) {
      playQueue(buildQuestionQueue(first), loadSpeed());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeSpeed = useCallback((s: number) => {
    setAudioSpeed(s);
    saveSpeed(s);
  }, []);

  const toggleAudioMode = useCallback(() => {
    const next = !audioMode;
    setAudioMode(next);
    try {
      window.localStorage.setItem(AUDIO_MODE_KEY, String(next));
    } catch {
      /* ignore */
    }
    if (!next) stopQueue();
    else if (phase === "playing" && selectedIndex === null) {
      const q = quizSet[currentIndex];
      if (q && (isAudioFree(q) || isPaid)) {
        playQueue(buildQuestionQueue(q), audioSpeed);
      }
    }
  }, [
    audioMode,
    phase,
    selectedIndex,
    isPaid,
    quizSet,
    currentIndex,
    audioSpeed,
    playQueue,
    stopQueue,
  ]);

  const handleSelect = useCallback(
    (index: number) => {
      if (selectedIndex !== null) return;
      const q = quizSet[currentIndex];
      const correct = index === q.correctIndex;
      setSelectedIndex(index);
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = index;
        return next;
      });
      // 苦手問題リストの更新
      if (correct) removeWrongQuestion(q.id);
      else addWrongQuestion(q.id);
      // 学習カレンダーに 1 問記録
      recordActivity(1);
      if (audioMode && (isAudioFree(q) || isPaid)) {
        stopQueue();
        playQueue(buildAnswerQueue(q), audioSpeed);
      } else {
        stopQueue();
      }
    },
    [
      selectedIndex,
      currentIndex,
      quizSet,
      audioMode,
      isPaid,
      audioSpeed,
      playQueue,
      stopQueue,
    ],
  );

  const goNext = useCallback(() => {
    stopQueue();
    if (currentIndex + 1 >= quizSet.length) {
      setPhase("result");
      window.scrollTo({ top: 0 });
      return;
    }
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setSelectedIndex(null);
    if (audioMode) {
      const nextQ = quizSet[nextIdx];
      if (nextQ && (isAudioFree(nextQ) || isPaid)) {
        playQueue(buildQuestionQueue(nextQ), audioSpeed);
      }
    }
  }, [
    currentIndex,
    quizSet,
    audioMode,
    isPaid,
    audioSpeed,
    playQueue,
    stopQueue,
  ]);

  const handleManualPlay = useCallback(() => {
    const q = quizSet[currentIndex];
    if (!q) return;
    if (!isAudioFree(q) && !isPaid) return;
    stopQueue();
    if (selectedIndex === null) playQueue(buildQuestionQueue(q), audioSpeed);
    else playQueue(buildAnswerQueue(q), audioSpeed);
  }, [
    quizSet,
    currentIndex,
    selectedIndex,
    isPaid,
    audioSpeed,
    playQueue,
    stopQueue,
  ]);

  const restartFromRemaining = useCallback(() => {
    stopQueue();
    const set = loadSet();
    if (set.length === 0) {
      setPhase("empty");
      return;
    }
    setQuizSet(set);
    setAnswers(new Array(set.length).fill(null));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setPhase("playing");
  }, [loadSet, stopQueue]);

  useEffect(() => {
    if (phase !== "playing" || selectedIndex === null) return;
    nextButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, selectedIndex, currentIndex, goNext]);

  const score = useMemo(
    () =>
      answers.filter(
        (a, i) => a !== null && a === quizSet[i]?.correctIndex,
      ).length,
    [answers, quizSet],
  );

  // ===== ロード中 =====
  if (phase === "loading") {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">読み込み中…</p>
    );
  }

  // ===== 苦手問題なし =====
  if (phase === "empty") {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          苦手問題はありません
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          すべての問題を正解しました。問題集を演習して、間違えた問題があればここに集まります。
        </p>
        <Link
          href="/quiz/"
          className="mt-5 inline-block rounded-xl bg-teal-600 hover:bg-teal-700 px-6 py-2.5 text-sm font-bold text-white transition"
        >
          問題集に戻る
        </Link>
      </div>
    );
  }

  // ===== 結果 =====
  if (phase === "result") {
    const pct = Math.round((score / quizSet.length) * 100);
    const remainingWrong = getWrongQuestionIds().length;
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            復習結果
          </p>
          <p className="text-5xl font-bold text-teal-600 dark:text-teal-400 mb-2">
            {score}
            <span className="text-2xl text-slate-400"> / {quizSet.length}</span>
          </p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            正答率 {pct}%
          </p>
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
            残りの苦手問題: {remainingWrong} 問
          </p>
        </div>
        <div className="flex gap-3">
          {remainingWrong > 0 ? (
            <button
              onClick={restartFromRemaining}
              className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition"
            >
              残りの苦手問題を続ける
            </button>
          ) : (
            <div className="flex-1 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold text-center">
              🎉 苦手問題をすべて克服しました
            </div>
          )}
          <Link
            href="/quiz/"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-center hover:border-teal-500 transition"
          >
            問題集に戻る
          </Link>
        </div>
      </div>
    );
  }

  // ===== プレイ =====
  const q = quizSet[currentIndex];
  if (!q) return null;
  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === q.correctIndex;
  const isLast = currentIndex === quizSet.length - 1;
  const canPlayCurrent = isAudioFree(q) || isPaid;
  const chapNum = chapterNumber(q.domainId);

  function getOptionState(
    index: number,
  ): "idle" | "correct" | "wrong" | "missed" {
    if (!isAnswered) return "idle";
    if (index === q.correctIndex) return "correct";
    if (index === selectedIndex) return "wrong";
    return "idle";
  }

  return (
    <div className="flex flex-col">
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{
            width: `${((currentIndex + (isAnswered ? 1 : 0)) / quizSet.length) * 100}%`,
          }}
        />
      </div>

      <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
              🎯 苦手復習
            </span>
            問 {currentIndex + 1}{" "}
            <span className="text-slate-400 dark:text-slate-500">
              / {quizSet.length}
            </span>
          </span>
          <Link
            href="/quiz/"
            onClick={() => stopQueue()}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-teal-400"
          >
            <span aria-hidden="true">←</span> 章選択
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canPlayCurrent && (
            <AudioToggle enabled={audioMode} onToggle={toggleAudioMode} />
          )}
          {audioMode && canPlayCurrent && (
            <AudioSpeedSelector speed={audioSpeed} onChangeSpeed={changeSpeed} />
          )}
        </div>
      </div>

      {chapNum > 0 && (
        <p className="mb-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
          {CHAPTER_LABEL[q.domainId]}
        </p>
      )}

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleManualPlay}
          disabled={!canPlayCurrent}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition"
        >
          <span aria-hidden="true">▶</span> 再生
        </button>
        <button
          type="button"
          onClick={() => stopQueue()}
          disabled={!audioPlaying}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-teal-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
        >
          <span aria-hidden="true">■</span> 停止
        </button>
      </div>

      <p className="mb-4 text-base font-medium leading-relaxed text-slate-900 dark:text-white">
        {q.question}
      </p>

      <div className="mb-6 flex flex-col gap-3">
        {q.options.map((option, index) => (
          <OptionButton
            key={index}
            label={LABELS[index]}
            text={option}
            state={getOptionState(index)}
            disabled={isAnswered}
            onClick={() => handleSelect(index)}
          />
        ))}
      </div>

      {isAnswered && (
        <ExplanationPanel
          isCorrect={isCorrect}
          explanation={q.explanation}
          correctIndex={q.correctIndex}
          syllabusRef={q.syllabusRef}
          actionLabel={isLast ? "結果を見る →" : "次の問題へ →"}
          onAction={goNext}
          actionRef={nextButtonRef}
        />
      )}

      {isAnswered && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-3 shadow-lg sm:hidden dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={goNext}
            className="w-full rounded-xl bg-slate-700 py-3 text-sm font-semibold text-white dark:bg-slate-600"
          >
            {isLast ? "結果を見る →" : "次の問題へ →"}
          </button>
        </div>
      )}
      <div className={isAnswered ? "h-20 sm:hidden" : ""} />
    </div>
  );
}
