import Header from "@/components/Header";
import ExamListClient from "@/components/ExamListClient";

export const metadata = { title: "模擬試験 — {{SITE_NAME}}" };

export default function ExamIndexPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          模擬試験
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          本番形式（100問・100分）の模試で、本番想定の総合演習ができます。
        </p>
        <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
          100分・100問・カウントダウンタイマー付き
        </p>
        <ExamListClient />
      </main>
    </>
  );
}
