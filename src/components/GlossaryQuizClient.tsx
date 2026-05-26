"use client";

/**
 * 用語クイズ — 用語名から定義を当てる 4 択クイズ
 *
 * 「用語名X の意味として正しいものはどれか」→ 4つの定義から正しいものを選ぶ。
 * 誤答は他の用語の description からランダム抽出。
 *
 * 進捗は localStorage 独立保存 (ds-cert:glossary-quiz)。
 * QuizRunner は domainId 必須のため、別の軽量実装を用意。
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { glossary, type GlossaryTerm } from "@/lib/content";
import { OptionButton } from "./OptionButton";
import { ExplanationPanel } from "./ExplanationPanel";
import { addWrongQuestion, removeWrongQuestion } from "@/lib/wrong-questions";
import { recordActivity } from "@/lib/activity";

const LABELS = ["A", "B", "C", "D"] as const;
const COUNT_CHOICES = [10, 20, 50] as const;
const HISTORY_KEY = "ds-cert:glossary-quiz-progress";

type QuizItem = {
  termId: string;
  term: string;
  options: string[]; // 4つの定義
  correctIndex: number;
  explanation: string;
};

type Phase = "setup" | "playing" | "result";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 用語をクイズ問題化（誤答は他用語の description から抽出） */
function buildQuizItems(targets: GlossaryTerm[], pool: GlossaryTerm[]): QuizItem[] {
  return targets.map((t) => {
    const others = pool.filter((p) => p.id !== t.id);
    const distractors = shuffle(others).slice(0, 3).map((p) => p.description);
    const all = shuffle([t.description, ...distractors]);
    const correctIndex = all.indexOf(t.description);
    return {
      termId: t.id,
      term: t.term,
      options: all,
      correctIndex,
      explanation: t.description,
    };
  });
}

export default function GlossaryQuizClient() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [items, setItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const startQuiz = useCallback((count: number) => {
    const targets = shuffle(glossary).slice(0, Math.min(count, glossary.length));
    const set = buildQuizItems(targets, glossary);
    setItems(set);
    setAnswers(new Array(set.length).fill(null));
    setCurrentIndex(0);
    setSelectedIndex(null);
    setPhase("playing");
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (selectedIndex !== null) return;
      const it = items[currentIndex];
      const correct = index === it.correctIndex;
      setSelectedIndex(index);
      setAnswers((prev) => {
        const next = [...prev];
        next[currentIndex] = index;
        return next;
      });
      // 苦手問題リストと連動（用語IDで管理）
      if (correct) removeWrongQuestion(it.termId);
      else addWrongQuestion(it.termId);
      recordActivity(1);
    },
    [selectedIndex, currentIndex, items],
  );

  const goNext = useCallback(() => {
    if (currentIndex + 1 >= items.length) {
      setPhase("result");
      window.scrollTo({ top: 0 });
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setSelectedIndex(null);
  }, [currentIndex, items]);

  const restart = useCallback(() => {
    setPhase("setup");
    setItems([]);
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswers([]);
  }, []);

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

  // 永続化: 完了時に最終スコアを記録（最小）
  useEffect(() => {
    if (phase !== "result") return;
    try {
      const score = answers.filter(
        (a, i) => a !== null && a === items[i]?.correctIndex,
      ).length;
      window.localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify({ count: items.length, score, at: Date.now() }),
      );
    } catch {
      /* ignore */
    }
  }, [phase, answers, items]);

  // ===== セットアップ =====
  if (phase === "setup") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
            出題数を選んでください
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            「用語名 の意味として正しいものはどれか」→ 4 択。誤答は他の用語の定義からランダム抽出されます。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COUNT_CHOICES.map((c) => (
              <button
                key={c}
                onClick={() => startQuiz(c)}
                disabled={glossary.length < c}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 hover:shadow-md transition font-bold text-slate-900 dark:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {c}問
              </button>
            ))}
            <button
              onClick={() => startQuiz(glossary.length)}
              disabled={glossary.length === 0}
              className="p-4 rounded-xl border border-teal-500 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition font-bold text-teal-700 dark:text-teal-300 disabled:opacity-40"
            >
              全{glossary.length}語
            </button>
          </div>
        </div>
        <Link
          href="/glossary/"
          className="inline-block text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
        >
          ← 用語集に戻る
        </Link>
      </div>
    );
  }

  // ===== 結果 =====
  if (phase === "result") {
    const score = answers.filter(
      (a, i) => a !== null && a === items[i]?.correctIndex,
    ).length;
    const pct = items.length > 0 ? Math.round((score / items.length) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            用語クイズ結果
          </p>
          <p className="text-5xl font-bold text-teal-600 dark:text-teal-400 mb-2">
            {score}
            <span className="text-2xl text-slate-400"> / {items.length}</span>
          </p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            正答率 {pct}%
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={restart}
            className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition"
          >
            もう一度
          </button>
          <Link
            href="/glossary/"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-center hover:border-teal-500 transition"
          >
            用語集に戻る
          </Link>
        </div>
      </div>
    );
  }

  // ===== プレイ =====
  const it = items[currentIndex];
  if (!it) return null;
  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === it.correctIndex;
  const isLast = currentIndex === items.length - 1;

  function getOptionState(
    index: number,
  ): "idle" | "correct" | "wrong" | "missed" {
    if (!isAnswered) return "idle";
    if (index === it.correctIndex) return "correct";
    if (index === selectedIndex) return "wrong";
    return "idle";
  }

  return (
    <div className="flex flex-col">
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-teal-600 transition-all duration-300 dark:bg-teal-500"
          style={{
            width: `${((currentIndex + (isAnswered ? 1 : 0)) / items.length) * 100}%`,
          }}
        />
      </div>

      <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          問 {currentIndex + 1}{" "}
          <span className="text-slate-400 dark:text-slate-500">
            / {items.length}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-900/40 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:text-teal-200">
          📝 用語クイズ
        </span>
      </div>

      <p className="mb-4 text-base font-medium leading-relaxed text-slate-900 dark:text-white">
        <span className="text-teal-700 dark:text-teal-400 font-bold">
          「{it.term}」
        </span>{" "}
        の意味として正しいものはどれか
      </p>

      <div className="mb-6 flex flex-col gap-3">
        {it.options.map((option, index) => (
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
          explanation={it.explanation}
          correctIndex={it.correctIndex}
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
