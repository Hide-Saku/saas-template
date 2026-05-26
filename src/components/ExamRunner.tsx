"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { shuffleIndices, applyOrder, correctIndexAfter } from "@/lib/shuffle";
import { DOMAIN_LABEL, type Exam, type DomainId } from "@/lib/content";
import { saveExamAttempt } from "@/lib/exam-history";
import { recordActivity } from "@/lib/activity";

const LABELS = ["A", "B", "C", "D"];
const PASS_LINE = 0.8; // 合格目安ライン

type Phase = "intro" | "exam" | "result";

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ExamRunner({ exam }: { exam: Exam }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(exam.timeLimit);

  // 各問のシャッフル順（試験開始時に一度だけ確定）
  const orders = useMemo(() => {
    const m: Record<string, number[]> = {};
    for (const q of exam.questions) m[q.id] = shuffleIndices(q.options.length);
    return m;
  }, [exam]);

  // タイマー
  useEffect(() => {
    if (phase !== "exam") return;
    if (timeLeft <= 0) {
      setPhase("result");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  // 結果遷移時に受験履歴を保存（初回のみ）
  const savedRef = useRef(false);
  useEffect(() => {
    if (phase !== "result") return;
    if (savedRef.current) return;
    savedRef.current = true;
    let correctCount = 0;
    for (const q of exam.questions) {
      const order = orders[q.id];
      const correctDisp = correctIndexAfter(order, q.correctIndex);
      if (answers[q.id] === correctDisp) correctCount++;
    }
    saveExamAttempt(exam.id, correctCount, exam.questions.length);
    // 学習カレンダーに「回答した問題数」を記録
    const answeredCount = exam.questions.filter((q) => answers[q.id] !== undefined).length;
    if (answeredCount > 0) recordActivity(answeredCount);
  }, [phase, exam, answers, orders]);

  // ---- イントロ ----
  if (phase === "intro") {
    return (
      <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-8 text-center">
        <p className="text-fg-muted">{exam.description}</p>
        <p className="mt-4 text-sm">
          問題数 <b>{exam.questions.length}問</b> ／ 制限時間{" "}
          <b>{Math.round(exam.timeLimit / 60)}分</b>
        </p>
        <button
          onClick={() => setPhase("exam")}
          className="mt-6 rounded-lg bg-brand px-8 py-3 font-medium text-brand-fg hover:bg-brand-hover"
        >
          試験を開始する
        </button>
      </div>
    );
  }

  // ---- 結果 ----
  if (phase === "result") {
    let correct = 0;
    const byDomain: Record<string, { c: number; t: number }> = {};
    const review = exam.questions.map((q) => {
      const order = orders[q.id];
      const correctDisp = correctIndexAfter(order, q.correctIndex);
      const picked = answers[q.id];
      const isCorrect = picked === correctDisp;
      if (isCorrect) correct++;
      byDomain[q.domainId] ??= { c: 0, t: 0 };
      byDomain[q.domainId].t++;
      if (isCorrect) byDomain[q.domainId].c++;
      return { q, order, correctDisp, picked, isCorrect };
    });
    const rate = correct / exam.questions.length;
    const passed = rate >= PASS_LINE;

    return (
      <div className="mt-8">
        <div className="rounded-xl border border-border bg-bg-elevated p-8 text-center">
          <p className="text-3xl font-bold text-brand">
            {correct} / {exam.questions.length}
          </p>
          <p className="mt-1 text-fg-muted">正答率 {Math.round(rate * 100)}%</p>
          <p
            className={`mt-3 inline-block rounded-full px-4 py-1 text-sm ${
              passed
                ? "bg-brand text-brand-fg"
                : "border border-warning text-warning"
            }`}
          >
            {passed ? "合格圏（目安80%）" : "要復習（目安80%）"}
          </p>
        </div>

        {/* 領域別 — 横棒グラフ */}
        <h2 className="mt-8 font-bold">領域別正答率</h2>
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-bg-elevated p-5">
          {Object.entries(byDomain).map(([d, v]) => {
            const pct = Math.round((v.c / v.t) * 100);
            const barColor =
              pct >= 80 ? "bg-brand" : pct >= 60 ? "bg-warning" : "bg-danger";
            return (
              <div key={d}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {DOMAIN_LABEL[d as DomainId] ?? d}
                  </span>
                  <span className="text-fg-muted">
                    {v.c}/{v.t}（{pct}%）
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <p className="pt-2 text-xs text-fg-muted">
            <span className="inline-block h-2 w-3 rounded-sm bg-brand align-middle"></span>{" "}
            80%以上
            <span className="inline-block h-2 w-3 rounded-sm bg-warning align-middle"></span>{" "}
            60%以上
            <span className="inline-block h-2 w-3 rounded-sm bg-danger align-middle"></span>{" "}
            60%未満
          </p>
        </div>

        {/* 復習 */}
        <h2 className="mt-8 font-bold">復習</h2>
        <div className="mt-2 space-y-3">
          {review.map(({ q, order, correctDisp, picked, isCorrect }, i) => {
            const opts = applyOrder(q.options, order);
            return (
              <div
                key={q.id}
                className="rounded-xl border border-border bg-bg-elevated p-4"
              >
                <p className="text-sm">
                  <span
                    className={isCorrect ? "text-brand" : "text-danger"}
                  >
                    {isCorrect ? "正解" : "不正解"}
                  </span>{" "}
                  <span className="text-fg-muted">第{i + 1}問</span>
                </p>
                <p className="mt-1 font-medium">{q.question}</p>
                <p className="mt-2 text-sm">
                  正解: {LABELS[correctDisp]}. {opts[correctDisp]}
                  {picked !== undefined && !isCorrect && (
                    <span className="text-danger">
                      　あなた: {LABELS[picked]}. {opts[picked]}
                    </span>
                  )}
                  {picked === undefined && (
                    <span className="text-fg-muted">　（未回答）</span>
                  )}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- 試験中 ----
  const q = exam.questions[idx];
  const order = orders[q.id];
  const opts = applyOrder(q.options, order);
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="mt-4">
      {/* 上部バー */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-2">
        <span className="text-sm text-fg-muted">
          {idx + 1} / {exam.questions.length}
        </span>
        <span
          className={`font-mono font-bold ${
            timeLeft < 300 ? "text-danger" : ""
          }`}
        >
          残り {fmtTime(timeLeft)}
        </span>
        <span className="text-sm text-fg-muted">回答 {answeredCount}</span>
      </div>

      {/* 問題 */}
      <div className="mt-4 rounded-xl border border-border bg-bg-elevated p-6">
        <p className="text-xs text-fg-muted">{q.syllabusRef}</p>
        <h2 className="mt-2 text-lg font-medium leading-relaxed">
          {q.question}
        </h2>
        <div className="mt-5 grid gap-2.5">
          {opts.map((opt, i) => {
            const picked = answers[q.id] === i;
            return (
              <button
                key={i}
                onClick={() =>
                  setAnswers((a) => ({ ...a, [q.id]: i }))
                }
                className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition ${
                  picked
                    ? "border-brand bg-brand/10"
                    : "border-border bg-bg hover:border-brand"
                }`}
              >
                <span className="font-bold text-fg-muted">{LABELS[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ナビ */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="rounded-lg border border-border px-5 py-2 disabled:opacity-40"
        >
          ← 前
        </button>
        <button
          onClick={() =>
            setIdx((i) => Math.min(exam.questions.length - 1, i + 1))
          }
          disabled={idx === exam.questions.length - 1}
          className="rounded-lg border border-border px-5 py-2 disabled:opacity-40"
        >
          次 →
        </button>
      </div>

      {/* 問題パレット */}
      <div className="mt-5 grid grid-cols-10 gap-1.5">
        {exam.questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => setIdx(i)}
            className={`aspect-square rounded text-xs ${
              i === idx
                ? "bg-brand text-brand-fg"
                : answers[qq.id] !== undefined
                  ? "bg-brand/25"
                  : "border border-border bg-bg"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* 提出 */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            if (
              confirm(
                `回答 ${answeredCount}/${exam.questions.length} 問で提出しますか？`,
              )
            )
              setPhase("result");
          }}
          className="rounded-lg bg-brand px-8 py-3 font-medium text-brand-fg hover:bg-brand-hover"
        >
          採点する（提出）
        </button>
      </div>
    </div>
  );
}
