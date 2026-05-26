import Header from "@/components/Header";

export const metadata = { title: "ページが見つかりません — {{SITE_NAME}}" };

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        <p className="text-5xl font-bold text-fg-muted">404</p>
        <h1 className="mt-3 text-xl font-bold">ページが見つかりません</h1>
        <p className="mt-2 text-fg-muted">
          お探しのページは移動・削除されたか、URLが間違っている可能性があります。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/"
            className="rounded-lg bg-brand px-5 py-2 font-medium text-brand-fg hover:bg-brand-hover"
          >
            トップへ戻る
          </a>
          <a
            href="/quiz/"
            className="rounded-lg border border-border px-5 py-2 hover:border-brand"
          >
            問題集を見る
          </a>
        </div>
      </main>
    </>
  );
}
