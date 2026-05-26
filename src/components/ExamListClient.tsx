"use client";

/**
 * 模試一覧 — G検定研究室の MockIndexPage パターンを移植
 *
 * - 2 カラムグリッド
 * - 各カード:
 *    - 「第N回模擬試験 (サブタイトル)」
 *    - 「100問 / 100分」
 *    - 「無料」/「有料プラン」/「解放済 ✓」バッジ（右上）
 *    - 受験履歴があれば MockHistoryBadge（ベスト N% など）
 * - 下部に説明ブロック
 */

import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { exams } from "@/lib/content";
import { MockHistoryBadge } from "./MockHistoryBadge";

/** 「第1回模擬試験（基礎確認）」を「第1回模擬試験」と「基礎確認」に分割 */
function splitTitle(title: string): { main: string; sub?: string } {
  const m = title.match(/^(.*?)[（(]([^)）]+)[)）]\s*$/);
  if (m) return { main: m[1].trim(), sub: m[2].trim() };
  return { main: title };
}

export default function ExamListClient() {
  const { loading, plan } = useAuth();
  const isPaid = plan === "paid";

  return (
    <>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {exams.map((e) => {
          const unlocked = e.free || isPaid;
          const href = unlocked ? `/exam/${e.id}/` : "/pricing/";
          const { main, sub } = splitTitle(e.title);
          return (
            <Link
              key={e.id}
              href={href}
              className="block p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition group"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug">
                  {main}
                  {sub && (
                    <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                      （{sub}）
                    </span>
                  )}
                </span>
                {e.free ? (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold">
                    無料
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
                    有料プラン
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {e.questions.length}問 / {Math.round(e.timeLimit / 60)}分
              </p>
              <MockHistoryBadge examId={e.id} />
            </Link>
          );
        })}
      </div>

      <div className="mt-10 p-5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          無料プランでは第1〜3回、有料プランでは全{exams.length}回の模擬試験を受験できます。各模試は本番形式（100問・100分）で、制限時間内に解答すると合格目安（80%）の判定と領域別正答率が表示されます。
        </p>
      </div>
    </>
  );
}
