import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { categories, DOMAIN_LABEL } from "@/lib/content";
import { chapterNumber } from "@/lib/domain";

export const metadata = { title: "聞き流しモード — {{SITE_NAME}}" };

export default function ListenIndexPage() {
  const sorted = [...categories].sort(
    (a, b) => chapterNumber(a.id) - chapterNumber(b.id),
  );
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          聞き流しモード
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
          問題・選択肢・解説を自動で連続再生します。通勤・家事の合間など、手を使えない時間がそのまま学習時間に変わります。章を選んで再生してください。
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {sorted.map((c) => {
            const chNum = chapterNumber(c.id);
            const isFree = c.id === "foundation";
            return (
              <Link
                key={c.id}
                href={`/listen/${c.id}/`}
                className="block p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition group"
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
                    第{chNum}章
                  </span>
                  <div className="flex items-center gap-2">
                    {isFree ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-semibold">
                        無料
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
                        有料プラン
                      </span>
                    )}
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {c.free + c.paid}問
                    </span>
                  </div>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition leading-snug">
                  {DOMAIN_LABEL[c.id] ?? c.label}
                </h2>
                <p className="mt-2 text-sm text-teal-600 dark:text-teal-400 font-semibold">
                  聞き流しを開始 →
                </p>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
