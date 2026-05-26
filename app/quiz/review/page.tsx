import Header from "@/components/Header";
import ReviewClient from "@/components/ReviewClient";

export const metadata = { title: "苦手問題を復習 — {{SITE_NAME}}" };

export default function ReviewPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <a
          href="/quiz/"
          className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          ← 問題演習に戻る
        </a>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          <span className="mr-2">🎯</span>苦手問題を復習
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          これまでに間違えた問題を集中的に再演習します。正解すると苦手問題リストから自動的に削除されます。
        </p>
        <div className="mt-6">
          <ReviewClient />
        </div>
      </main>
    </>
  );
}
