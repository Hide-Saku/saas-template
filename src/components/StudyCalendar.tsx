"use client";

/**
 * 学習カレンダー — 過去 4 週間（28日）のアクティビティを
 * GitHub Contribution Grid 風に表示するコンパクト版。
 *
 * レイアウト: 横 7 曜日（日〜土） × 縦 4 週
 * セル濃淡: 0 / 1-5 / 6-15 / 16+ 問 の 4 段階
 *
 * データソース: localStorage ds-cert:activity
 * 記録元: QuizRunner / ExamRunner 解答時に recordActivity(N)
 */

import { useEffect, useState } from "react";
import {
  loadActivity,
  getStreak,
  getActiveDayCount,
} from "@/lib/activity";

const WEEKS = 4;
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type Cell = {
  dateKey: string;
  count: number;
  isToday: boolean;
  isFuture: boolean;
};

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildGrid(activity: Record<string, number>): Cell[][] {
  const todayKey = ymd(new Date());
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

  const start = new Date(endOfWeek);
  start.setDate(endOfWeek.getDate() - (WEEKS * 7 - 1));

  const rows: Cell[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const row: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      const key = ymd(cur);
      row.push({
        dateKey: key,
        count: activity[key] ?? 0,
        isToday: key === todayKey,
        isFuture: cur > today,
      });
    }
    rows.push(row);
  }
  return rows;
}

function cellColor(count: number): string {
  if (count === 0) return "bg-slate-100 dark:bg-slate-800";
  if (count <= 5) return "bg-teal-200 dark:bg-teal-900";
  if (count <= 15) return "bg-teal-400 dark:bg-teal-700";
  return "bg-teal-600 dark:bg-teal-500";
}

export function StudyCalendar() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [streak, setStreak] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    const activity = loadActivity();
    setGrid(buildGrid(activity));
    setStreak(getStreak());
    setActiveDays(getActiveDayCount());
  }, []);

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/60 dark:bg-teal-950/20">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          📅 学習カレンダー
        </p>
        <p className="text-[11px] text-teal-700 dark:text-teal-400">
          {streak > 0 && <span className="font-semibold">🔥 {streak}日連続</span>}
          {streak > 0 && activeDays > 0 && (
            <span className="mx-1 opacity-40">·</span>
          )}
          {activeDays > 0 && <span>累計 {activeDays}日</span>}
          {streak === 0 && activeDays === 0 && (
            <span className="opacity-60">まだ記録がありません</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[9px] leading-none text-slate-500 dark:text-slate-500">
        {WEEKDAY_LABELS.map((d, i) => (
          <span
            key={i}
            className={
              i === 0 ? "text-rose-500/70" : i === 6 ? "text-sky-500/70" : ""
            }
          >
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-1">
        {grid.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7 gap-1">
            {week.map((cell) => (
              <div
                key={cell.dateKey}
                title={
                  cell.isFuture
                    ? cell.dateKey
                    : `${cell.dateKey} (${cell.count}問)`
                }
                className={`h-3.5 w-full rounded-[3px] ${cellColor(
                  cell.count,
                )} ${cell.isFuture ? "opacity-25" : ""} ${
                  cell.isToday
                    ? "ring-1 ring-teal-500 dark:ring-teal-400"
                    : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
