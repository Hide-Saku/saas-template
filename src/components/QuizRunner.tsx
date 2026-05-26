"use client";

/**
 * QuizRunner — 本テンプレ標準の UX/UI
 *
 * setup → playing → result の3フェーズ。
 * - 上部に「音声ON/OFF」「再生速度」「難易度」「進捗バー」
 * - OptionButton（円形ラベル + 本文）
 * - 回答後は ExplanationPanel（正解/不正解 + Enter次へ）
 * - 音声モードON時：問題＋選択肢を自動再生 → 回答後に解説を自動再生 → 次問で自動再生
 *
 * 注:
 *  - 本テンプレは optionNotes / citation を持たないため、ExplanationPanel に渡さない
 *  - 音声無料判定は domain.ts の isAudioFree（1章=基盤のみ無料）
 *  - 進捗保存キーは ds-cert:progress:{domainId}
 */

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Question, DomainId } from "@/lib/content";
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
import { addWrongQuestion, removeWrongQuestion } from "@/lib/wrong-questions";
import { recordActivity } from "@/lib/activity";

type Props = {
  questions: Question[];   // 無料 + 有料の全問（プランで自動フィルタ）
  domainId: DomainId;
};

type Phase = "setup" | "playing" | "result";

const LABELS = ["A", "B", "C", "D"] as const;
const COUNT_CHOICES = [10, 20, 50] as const;
const AUDIO_MODE_KEY = "ds-cert:audio-mode";

const progressKey = (domainId: string) => `ds-cert:progress:${domainId}`;

type StoredProgress = {
  [questionId: string]: { correct: boolean; answeredAt: number };
};

function loadProgress(domainId: string): StoredProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(progressKey(domainId));
    return raw ? (JSON.parse(raw) as StoredProgress) : {};
  } catch {
    return {};
  }
}

function saveProgress(domainId: string, progress: StoredProgress) {
  try {
    window.localStorage.setItem(progressKey(domainId), JSON.stringify(progress));
  } catch {
    /* ignore */
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizRunner({ questions, domainId }: Props) {
  const searchParams = useSearchParams();
  const isResumeRequest = searchParams?.get("resume") === "true";
  const isStartAllRequest = searchParams?.get("start") === "all";
  const autoStartHandledRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [quizSet, setQuizSet] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [progress, setProgress] = useState<StoredProgress>({});
  const [audioMode, setAudioMode] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1.25);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const { play: playQueue, stop: stopQueue, playing: audioPlaying } = useAudioQueue();
  const { plan } = useAuth();
  const isPaid = plan === "paid";

  // 無料プランは free=true の問題のみ
  const availableQuestions = useMemo(
    () => (isPaid ? questions : questions.filter((q) => q.free)),
    [questions, isPaid]
  );
  const lockedCount = questions.length - availableQuestions.length;

  useEffect(() => {
    setProgress(loadProgress(domainId));
    setAudioSpeed(loadSpeed());
    try {
      setAudioMode(window.localStorage.getItem(AUDIO_MODE_KEY) === "true");
    } catch {
      /* ignore */
    }
  }, [domainId]);

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
    if (!next) {
      stopQueue();
    } else if (phase === "playing" && selectedIndex === null) {
      const q = quizSet[currentIndex];
      if (q && (isAudioFree(q) || isPaid)) playQueue(buildQuestionQueue(q), audioSpeed);
    }
  }, [audioMode, phase, selectedIndex, isPaid, quizSet, currentIndex, audioSpeed, playQueue, stopQueue]);

  const startQuiz = useCallback(
    (count: number, options?: { resume?: boolean }) => {
      // resume=true のときは既解問題を pool から除外
      let pool = availableQuestions;
      if (options?.resume) {
        const seenIds = new Set(Object.keys(progress));
        pool = pool.filter((q) => !seenIds.has(q.id));
      }
      if (pool.length === 0) return;
      const shuffled = shuffle(pool);
      const set = count >= pool.length ? shuffled : shuffled.slice(0, count);
      setQuizSet(set);
      setAnswers(new Array(set.length).fill(null));
      setCurrentIndex(0);
      setSelectedIndex(null);
      setPhase("playing");
      const first = set[0];
      if (audioMode && first && (isAudioFree(first) || isPaid)) {
        playQueue(buildQuestionQueue(first), audioSpeed);
      }
    },
    [availableQuestions, progress, audioMode, isPaid, audioSpeed, playQueue]
  );

  // 「続きから」用：残り未解答数
  const remainingCount = useMemo(() => {
    const seen = new Set(Object.keys(progress));
    return availableQuestions.filter((q) => !seen.has(q.id)).length;
  }, [availableQuestions, progress]);

  // ?resume=true → 残り未解答だけで自動開始
  // ?start=all  → 全問（既解含む）でランダム自動開始
  useEffect(() => {
    if (autoStartHandledRef.current) return;
    if (phase !== "setup") return;
    if (availableQuestions.length === 0) return;
    if (isResumeRequest && remainingCount > 0) {
      autoStartHandledRef.current = true;
      startQuiz(remainingCount, { resume: true });
      return;
    }
    if (isStartAllRequest) {
      autoStartHandledRef.current = true;
      startQuiz(availableQuestions.length);
    }
  }, [
    isResumeRequest,
    isStartAllRequest,
    phase,
    availableQuestions,
    remainingCount,
    startQuiz,
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
      setProgress((prev) => {
        const next: StoredProgress = {
          ...prev,
          [q.id]: { correct, answeredAt: Date.now() },
        };
        saveProgress(domainId, next);
        return next;
      });
      // 苦手問題リストの更新：正解→克服、不正解→追加
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
    [selectedIndex, currentIndex, quizSet, domainId, audioMode, isPaid, audioSpeed, playQueue, stopQueue]
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
      if (nextQ && (isAudioFree(nextQ) || isPaid)) playQueue(buildQuestionQueue(nextQ), audioSpeed);
    }
  }, [currentIndex, quizSet, audioMode, isPaid, audioSpeed, playQueue, stopQueue]);

  const handleManualPlay = useCallback(() => {
    const q = quizSet[currentIndex];
    if (!q) return;
    if (!isAudioFree(q) && !isPaid) return;
    stopQueue();
    if (selectedIndex === null) {
      playQueue(buildQuestionQueue(q), audioSpeed);
    } else {
      playQueue(buildAnswerQueue(q), audioSpeed);
    }
  }, [quizSet, currentIndex, selectedIndex, isPaid, audioSpeed, playQueue, stopQueue]);

  const handleSkipAudio = useCallback(() => {
    stopQueue();
  }, [stopQueue]);

  const restart = useCallback(() => {
    stopQueue();
    setPhase("setup");
    setQuizSet([]);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
  }, [stopQueue]);

  // Enter キーで次へ
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
    () => answers.filter((a, i) => a !== null && a === quizSet[i]?.correctIndex).length,
    [answers, quizSet]
  );

  const answeredInProgress = Object.keys(progress).length;
  const correctInProgress = Object.values(progress).filter((p) => p.correct).length;

  // ===== セットアップ =====
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        {answeredInProgress > 0 && (
          <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50">
            <p className="text-sm text-teal-800 dark:text-teal-300">
              この章の学習履歴：{answeredInProgress}問回答済み（正解 {correctInProgress}問・
              正答率 {Math.round((correctInProgress / answeredInProgress) * 100)}%）
            </p>
            {remainingCount > 0 && (
              <button
                onClick={() => startQuiz(remainingCount, { resume: true })}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-sm font-bold text-white transition"
              >
                ▶ 続きから（残り{remainingCount}問）
              </button>
            )}
            {remainingCount === 0 && (
              <p className="mt-2 text-xs text-teal-700 dark:text-teal-400">
                この章のすべての問題に回答済みです。下のボタンで再演習できます。
              </p>
            )}
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
            出題数を選んでください
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            問題はランダムな順序で出題されます。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COUNT_CHOICES.map((c) => (
              <button
                key={c}
                onClick={() => startQuiz(c)}
                disabled={availableQuestions.length < c}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition font-bold text-slate-900 dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {c}問
              </button>
            ))}
            <button
              onClick={() => startQuiz(availableQuestions.length)}
              disabled={availableQuestions.length === 0}
              className="p-4 rounded-xl border border-teal-500 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition font-bold text-teal-700 dark:text-teal-300 disabled:opacity-40"
            >
              全{availableQuestions.length}問
            </button>
          </div>
        </div>

        {lockedCount > 0 && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              🔒 この章にあと{lockedCount}問の有料限定問題があります
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
              買い切り¥1,500（追加課金なし）で全{questions.length}問が解放されます。
            </p>
            <Link
              href="/pricing/"
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline"
            >
              プランを見る →
            </Link>
          </div>
        )}

        <div>
          <Link
            href="/quiz/"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
          >
            ← 章選択に戻る
          </Link>
        </div>
      </div>
    );
  }

  // ===== 結果 =====
  if (phase === "result") {
    const pct = Math.round((score / quizSet.length) * 100);
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">演習結果</p>
          <p className="text-5xl font-bold text-teal-600 dark:text-teal-400 mb-2">
            {score}
            <span className="text-2xl text-slate-400"> / {quizSet.length}</span>
          </p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            正答率 {pct}%
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">回答の振り返り</h3>
          {quizSet.map((qq, i) => {
            const a = answers[i];
            const ok = a === qq.correctIndex;
            return (
              <div
                key={qq.id}
                className={`p-3 rounded-lg border text-sm ${
                  ok
                    ? "border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20"
                    : a === null
                      ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30"
                      : "border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={ok ? "text-green-600" : a === null ? "text-slate-400" : "text-amber-600"}>
                    {ok ? "○" : a === null ? "—" : "✕"}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 leading-snug">
                    {i + 1}. {qq.question}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={restart}
            className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition"
          >
            もう一度演習する
          </button>
          <Link
            href="/quiz/"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-center hover:border-teal-500 transition"
          >
            章選択に戻る
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
  const answeredCount = answers.filter((a) => a !== null).length;
  const canPlayCurrent = isAudioFree(q) || isPaid;
  const chapNum = chapterNumber(q.domainId);

  function getOptionState(index: number): "idle" | "correct" | "wrong" | "missed" {
    if (!isAnswered) return "idle";
    if (index === q.correctIndex) return "correct";
    if (index === selectedIndex) return "wrong";
    return "idle";
  }

  return (
    <div className="flex flex-col">
      {/* プログレスバー */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-teal-600 transition-all duration-300 dark:bg-teal-500"
          style={{
            width: `${((currentIndex + (isAnswered ? 1 : 0)) / quizSet.length) * 100}%`,
          }}
        />
      </div>

      {/* 上部ヘッダー */}
      <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            問 {currentIndex + 1}{" "}
            <span className="text-slate-400 dark:text-slate-500">
              / {quizSet.length}
            </span>
          </span>
          <Link
            href="/quiz/"
            onClick={() => stopQueue()}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-600 transition dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-teal-400"
            aria-label="章選択に戻る"
          >
            <span aria-hidden="true">←</span> 章選択
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canPlayCurrent ? (
            <AudioToggle enabled={audioMode} onToggle={toggleAudioMode} />
          ) : (
            <Link
              href="/pricing/"
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700"
              aria-label="この問題の音声は有料プランで利用できます"
            >
              🔒 音声OFF
            </Link>
          )}
          {audioMode && canPlayCurrent && (
            <AudioSpeedSelector speed={audioSpeed} onChangeSpeed={changeSpeed} />
          )}
          {answeredCount > 0 && !isLast && (
            <button
              type="button"
              onClick={() => setShowFinishConfirm(true)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              ✋ ここまでの正解率を見る
            </button>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            aria-label={`難易度 ${q.level} / 3`}
          >
            <span className="text-amber-500">{"★".repeat(q.level)}</span>
            <span className="text-slate-300 dark:text-slate-600">{"★".repeat(3 - q.level)}</span>
            <span className="ml-1">難易度</span>
          </span>
        </div>
      </div>

      {/* 章ラベル */}
      {chapNum > 0 && (
        <p className="mb-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
          {CHAPTER_LABEL[q.domainId]}
        </p>
      )}

      {/* 途中終了の確認 */}
      {showFinishConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={() => setShowFinishConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
              ここまでの正解率を確認しますか？
            </h2>
            <p className="mb-5 text-sm text-slate-600 dark:text-slate-400">
              これまで解答した <strong>{answeredCount}問</strong> の正解率を表示します。
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowFinishConfirm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                続ける
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishConfirm(false);
                  stopQueue();
                  setPhase("result");
                  window.scrollTo({ top: 0 });
                }}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                正解率を見る →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 再生 / 停止 ボタン */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleManualPlay}
          disabled={!canPlayCurrent}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition"
          aria-label="現在の音声を再生"
        >
          <span aria-hidden="true">▶</span> 再生
        </button>
        <button
          type="button"
          onClick={handleSkipAudio}
          disabled={!audioPlaying}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-teal-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          aria-label="再生中の音声を停止"
        >
          <span aria-hidden="true">■</span> 停止
        </button>
        {!canPlayCurrent && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            🔒 この問題は音声なし（有料プランで全問対応）
          </span>
        )}
      </div>

      {/* 問題文 */}
      <p className="mb-4 text-base font-medium leading-relaxed text-slate-900 dark:text-white">
        {q.question}
      </p>

      {/* 選択肢 */}
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

      {/* 解説 */}
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

      {/* モバイル固定フッター */}
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
