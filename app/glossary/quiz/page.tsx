import Header from "@/components/Header";
import GlossaryQuizClient from "@/components/GlossaryQuizClient";

export const metadata = { title: "用語クイズ — {{SITE_NAME}}" };

export default function GlossaryQuizPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <a
          href="/glossary/"
          className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          ← 用語集に戻る
        </a>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          <span className="mr-2">📝</span>用語クイズ
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
          用語名から定義を当てる 4 択クイズで、暗記が定着しているか確認しましょう。
        </p>
        <GlossaryQuizClient />
      </main>
    </>
  );
}
