import Header from "@/components/Header";
import AudioButton from "@/components/AudioButton";
import {
  glossary,
  getGlossaryTerm,
  DOMAIN_LABEL,
  type DomainId,
} from "@/lib/content";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return glossary.map((t) => ({ termId: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const { termId } = await params;
  const t = getGlossaryTerm(termId);
  return {
    title: t ? `${t.term}とは — 用語集 — {{SITE_NAME}}` : "用語集",
    description: t?.description,
  };
}

export default async function TermPage({
  params,
}: {
  params: Promise<{ termId: string }>;
}) {
  const { termId } = await params;
  const term = getGlossaryTerm(termId);
  if (!term) notFound();

  const related = term.relatedTermIds
    .map((id) => getGlossaryTerm(id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <a href="/glossary/" className="text-sm text-fg-muted hover:text-brand">
          ← 用語集へ
        </a>

        <article className="mt-3 rounded-xl border border-border bg-bg-elevated p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{term.term}</h1>
              {term.reading && (
                <p className="mt-1 text-sm text-fg-muted">{term.reading}</p>
              )}
            </div>
            <AudioButton
              src={`/audio/glossary/${term.id}/term.mp3`}
              label="用語名を聞く"
              size="md"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {term.domainIds.map((d) => (
              <span
                key={d}
                className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand"
              >
                {DOMAIN_LABEL[d as DomainId] ?? d}
              </span>
            ))}
          </div>
          <div className="mt-4 flex items-start justify-between gap-3">
            <p className="flex-1 leading-relaxed">{term.description}</p>
            <AudioButton
              src={`/audio/glossary/${term.id}/def.mp3`}
              label="定義を聞く"
              size="md"
            />
          </div>
          <p className="mt-3 text-xs text-fg-muted">
            ※ 用語集音声は有料プランで開放予定
          </p>
        </article>

        {related.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold">関連用語</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {related.map((r) => (
                <a
                  key={r.id}
                  href={`/glossary/${r.id}/`}
                  className="rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm hover:border-brand"
                >
                  {r.term}
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
