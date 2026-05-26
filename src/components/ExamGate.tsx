"use client";

import { useAuth } from "@/lib/auth-client";
import ExamRunner from "./ExamRunner";
import type { Exam } from "@/lib/content";

/**
 * 模試ゲート — サーバページ（SSG）からクライアント側に切り替えて
 * ユーザーの実プランを判定する。
 *
 * 🔴 BUGFIX (2026-05-24):
 *   以前はサーバ側で exam.free のみで判定しており、
 *   買い切り購入済み（plan = "paid"）でも exam-04〜09 がロックされていた。
 */
export default function ExamGate({ exam }: { exam: Exam }) {
  const { loading, plan } = useAuth();

  // 無料模試は即表示
  if (exam.free) return <ExamRunner exam={exam} />;

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-8 text-center text-sm text-fg-muted">
        プランを確認中…
      </div>
    );
  }

  if (plan === "paid") return <ExamRunner exam={exam} />;

  return (
    <div className="mt-8 rounded-xl border border-warning/40 bg-warning/5 p-8 text-center">
      <p className="font-medium text-warning">この模試は有料プラン限定です</p>
      <p className="mt-2 text-sm text-fg-muted">
        買い切り¥1,500（追加課金なし）でご利用いただけます。
      </p>
      <a
        href="/pricing/"
        className="mt-5 inline-block rounded-lg bg-brand px-6 py-2.5 font-medium text-brand-fg hover:bg-brand-hover"
      >
        プランを見る
      </a>
    </div>
  );
}
