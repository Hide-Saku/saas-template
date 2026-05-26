import { Suspense } from "react";
import Header from "@/components/Header";
import QuizRunner from "@/components/QuizRunner";
import {
  categories,
  questions,
  DOMAIN_LABEL,
  type DomainId,
} from "@/lib/content";
import { chapterNumber, CHAPTER_LABEL } from "@/lib/domain";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return categories.map((c) => ({ domain: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const label =
    CHAPTER_LABEL[domain as DomainId] ?? DOMAIN_LABEL[domain as DomainId];
  return { title: `${label ?? "問題集"} — {{SITE_NAME}}` };
}

export default async function DomainQuizPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const d = domain as DomainId;
  const label = DOMAIN_LABEL[d];
  if (!label) notFound();

  const all = questions.filter((q) => q.domainId === d);
  const chNum = chapterNumber(d);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <a
          href="/quiz/"
          className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          ← 領域選択へ
        </a>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {chNum > 0 && (
            <span className="mr-2 text-base font-semibold text-teal-600 dark:text-teal-400">
              {chNum}章
            </span>
          )}
          {label}
        </h1>
        <div className="mt-6">
          <Suspense
            fallback={
              <p className="text-sm text-slate-500 dark:text-slate-400">
                読み込み中…
              </p>
            }
          >
            <QuizRunner questions={all} domainId={d} />
          </Suspense>
        </div>
      </main>
    </>
  );
}
