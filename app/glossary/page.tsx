import { Suspense } from "react";
import Header from "@/components/Header";
import GlossaryList from "@/components/GlossaryList";
import { glossary } from "@/lib/content";

export const metadata = { title: "用語集 — {{SITE_NAME}}" };

export default function GlossaryIndexPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          AI・データサイエンス用語集
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {/* TODO: テンプレ利用側で資格名・シラバス名に置換 */}
          {"{{CERT_NAME}}"}{"{{SYLLABUS_VERSION}}"}の重要用語を{glossary.length}語収録。問題演習中に分からない用語が出てきたら、ここで引けます。
        </p>
        <Suspense
          fallback={
            <p className="text-sm text-slate-500 dark:text-slate-400">
              読み込み中…
            </p>
          }
        >
          <GlossaryList terms={glossary} />
        </Suspense>
      </main>
    </>
  );
}
