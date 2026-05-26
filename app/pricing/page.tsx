import Header from "@/components/Header";
import CheckoutButton from "@/components/CheckoutButton";
import { stats } from "@/lib/content";

export const metadata = { title: "料金プラン — {{SITE_NAME}}" };

interface Plan {
  name: string;
  price: string;
  sub: string;
  features: string[];
  primary?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  checkout?: "onetime";
}

const PLANS: Plan[] = [
  {
    name: "無料",
    price: "¥0",
    sub: "ずっと無料",
    features: [
      "問題集 300問（解説付き）",
      "模擬試験 3回分（100問×3）",
      "用語集すべて（テキスト）",
      "1章（基盤）の音声再生・聞き流し",
      "進捗管理（端末内）",
    ],
    ctaHref: "/quiz/",
    ctaLabel: "問題集を解く",
  },
  {
    name: "買い切り",
    price: "¥1,500",
    sub: "1回限り・ずっと利用可・追加課金なし",
    features: [
      "無料プランのすべて",
      "問題集を全 945問に開放（+645問）",
      "模擬試験 全9回（+6回）",
      "全章の音声・聞き流し",
      "用語集音声（333語）",
    ],
    primary: true,
    checkout: "onetime",
    ctaLabel: "買い切りで購入",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-center text-3xl font-bold">料金プラン</h1>
        <p className="mt-2 text-center text-fg-muted">
          無料{stats.freeQuestions}問でまず体験。本気で受かりたい方は買い切り
          ¥1,500 で全機能解放、追加課金は一切ありません。
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border bg-bg-elevated p-6 ${
                p.primary ? "border-brand shadow-lg shadow-brand/10" : "border-border"
              }`}
            >
              {p.primary && (
                <div className="mb-3 inline-block rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-fg">
                  おすすめ
                </div>
              )}
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="mt-2 text-3xl font-bold text-brand">{p.price}</p>
              <p className="text-xs text-fg-muted">{p.sub}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-brand">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {p.checkout ? (
                <CheckoutButton primary={p.primary}>
                  {p.ctaLabel}
                </CheckoutButton>
              ) : (
                <a
                  href={p.ctaHref}
                  className={`mt-6 block rounded-lg px-4 py-2.5 text-center font-medium transition ${
                    p.primary
                      ? "bg-brand text-brand-fg hover:bg-brand-hover"
                      : "border border-border hover:border-brand"
                  }`}
                >
                  {p.ctaLabel}
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-bg-elevated p-5 text-sm text-fg-muted">
          <p>
            <strong className="text-fg">📝 ログインが必要です。</strong>
            購入には Google ログインが必要です（購入の復元に使用）。決済は Stripe Checkout で行われ、当サイトはカード情報を保持しません。
          </p>
        </div>
      </main>
    </>
  );
}
