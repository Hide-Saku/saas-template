import Header from "@/components/Header";
import ChapterListClient from "@/components/ChapterListClient";
import { stats } from "@/lib/content";

export const metadata = { title: "問題集 — {{SITE_NAME}}" };

export default function QuizIndexPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          問題演習
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          学習したい章を選んでください。全{stats.totalQuestions}問が5つの章に分類されています。途中で中断しても、次回「続きから」で再開できます。
        </p>
        <ChapterListClient />
      </main>
    </>
  );
}
