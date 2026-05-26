import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ListenGate from "@/components/ListenGate";
import {
  categories,
  questions,
  DOMAIN_LABEL,
  type DomainId,
} from "@/lib/content";
import { chapterNumber, CHAPTER_LABEL } from "@/lib/domain";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return categories.map((c) => ({ chapterId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const label =
    CHAPTER_LABEL[chapterId as DomainId] ??
    DOMAIN_LABEL[chapterId as DomainId];
  return {
    title: `${label ?? "聞き流し"} — 聞き流しモード — {{SITE_NAME}}`,
  };
}

export default async function ListenChapterPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const d = chapterId as DomainId;
  const label = DOMAIN_LABEL[d];
  if (!label) notFound();

  // 章内の問題を全件渡す（ListenGate がプラン判定）
  const chapterQuestions = questions.filter((q) => q.domainId === d);
  const chNum = chapterNumber(d);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <a
          href="/listen/"
          className="text-sm text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400"
        >
          ← 章選択に戻る
        </a>
        <div className="mt-2 mb-6">
          <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mb-1">
            聞き流しモード
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            <span className="mr-2 text-base font-semibold text-teal-600 dark:text-teal-400">
              {chNum}章
            </span>
            {label}
          </h1>
        </div>
        <ListenGate domainId={d} questions={chapterQuestions} />
      </main>
      <Footer />
    </>
  );
}
