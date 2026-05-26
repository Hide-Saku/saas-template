"use client";

import { type RefObject } from "react";

type Props = {
  isCorrect: boolean;
  explanation: string;
  correctIndex?: number;
  syllabusRef?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionRef?: RefObject<HTMLButtonElement | null>;
};

const LABELS = ["A", "B", "C", "D"] as const;

export function ExplanationPanel({
  isCorrect,
  explanation,
  correctIndex,
  syllabusRef,
  actionLabel,
  onAction,
  actionRef,
}: Props) {
  return (
    <div
      className={`rounded-xl border-l-4 p-4 ${
        isCorrect
          ? "border-green-500 bg-green-50 dark:bg-green-950/40"
          : "border-amber-500 bg-amber-50 dark:bg-amber-950/40"
      }`}
    >
      <div className="mb-3 flex items-stretch gap-3">
        <span
          className={`flex shrink-0 items-center rounded-lg px-3 text-sm font-bold ${
            isCorrect
              ? "bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
          }`}
        >
          {isCorrect ? "✓ 正解" : "✗ 不正解"}
        </span>
        {correctIndex !== undefined && !isCorrect && (
          <span className="flex shrink-0 items-center rounded-lg bg-slate-100 px-3 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            正解は {LABELS[correctIndex]}
          </span>
        )}
        <div className="hidden flex-1 sm:block" />
        {actionLabel && onAction && (
          <button
            ref={actionRef}
            type="button"
            onClick={onAction}
            className="hidden w-1/2 items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 sm:inline-flex dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500 dark:focus:ring-offset-slate-900"
          >
            <span>{actionLabel}</span>
            <kbd className="rounded border border-white/30 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium dark:border-slate-900/30 dark:bg-slate-900/10">
              Enter ↵
            </kbd>
          </button>
        )}
      </div>

      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-100 whitespace-pre-wrap">
        {explanation}
      </p>

      {syllabusRef && (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          📖 シラバス {syllabusRef}
        </p>
      )}
    </div>
  );
}
