"use client";

/**
 * 模試カードに付ける受験履歴バッジ。
 * 未受験 → 何も表示しない
 * 受験済 → 「ベスト 76%」「85/100問」「N回受験」
 */

import { useEffect, useState } from "react";
import { getExamRecord, EXAM_PASS_RATIO, type ExamRecord } from "@/lib/exam-history";

export function MockHistoryBadge({ examId }: { examId: string }) {
  const [record, setRecord] = useState<ExamRecord | null>(null);

  useEffect(() => {
    setRecord(getExamRecord(examId));
  }, [examId]);

  if (!record) return null;

  const passed = record.bestRate >= EXAM_PASS_RATIO * 100;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
          passed
            ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        }`}
      >
        {passed ? "✓" : "→"} ベスト {record.bestRate}%
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        {record.bestCorrect}/{record.totalCount}問
      </span>
      <span className="text-slate-400 dark:text-slate-500">
        · {record.attemptCount}回受験
      </span>
    </div>
  );
}
