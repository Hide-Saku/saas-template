import Header from "@/components/Header";
import ExamGate from "@/components/ExamGate";
import { exams, getExam } from "@/lib/content";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return exams.map((e) => ({ examId: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  return { title: `${getExam(examId)?.title ?? "模擬試験"} — {{SITE_NAME}}` };
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const exam = getExam(examId);
  if (!exam) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <a href="/exam/" className="text-sm text-fg-muted hover:text-brand">
          ← 模試一覧へ
        </a>
        <h1 className="mt-2 text-2xl font-bold">{exam.title}</h1>
        <ExamGate exam={exam} />
      </main>
    </>
  );
}
