import Header from "@/components/Header";

export const metadata = { title: "プライバシーポリシー — {{SITE_NAME}}" };

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
        <p className="mt-2 text-sm text-fg-muted">最終更新日：2026年5月25日</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base">1. 取得する情報</h2>
            <p className="mt-2">当サービスは以下の情報を取得します。</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Googleアカウント情報</strong>：メールアドレス・氏名・プロフィール画像
              </li>
              <li>
                <strong>決済情報</strong>：Stripe経由の購入履歴（カード番号は当方で保持しません）
              </li>
              <li>
                <strong>学習進捗</strong>：ブラウザのlocalStorage（端末内のみ・サーバー送信なし）
              </li>
              <li>
                <strong>お問い合わせ内容</strong>：氏名・メールアドレス・件名・本文・送信元IP
              </li>
              <li>
                <strong>アクセスログ</strong>：IPアドレス・User-Agent・閲覧URL（Cloudflareの標準ログ）
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base">2. 利用目的</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>ユーザー認証および有料プランの提供</li>
              <li>サービス品質・セキュリティの維持</li>
              <li>不正利用の防止・スパム対策</li>
              <li>お問い合わせ対応</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base">3. 第三者提供</h2>
            <p className="mt-2">
              法令に基づく場合を除き、ご本人の同意なく第三者へ個人情報を提供しません。
              ただし以下の業務委託先・連携先は除きます。
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Cloudflare, Inc.（インフラ・配信・Bot対策 Turnstile）</li>
              <li>Google LLC（OAuth認証）</li>
              <li>Stripe, Inc.（決済処理・領収書発行）</li>
              <li>Resend（お問い合わせメール送信）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base">4. 保管期間</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>セッション情報</strong>：最終利用から30日間（その後自動削除）
              </li>
              <li>
                <strong>有料プラン記録</strong>：購入から最大10年間（その後自動削除。お客様が削除請求した場合は即時削除）
              </li>
              <li>
                <strong>学習進捗</strong>：お客様の端末（localStorage）にのみ保存され、当方サーバーには送信されません。ブラウザのキャッシュ削除等で消去できます
              </li>
              <li>
                <strong>お問い合わせ内容</strong>：受信メールとして3年間保管後、削除します
              </li>
              <li>
                <strong>アクセスログ</strong>：Cloudflareの標準保持期間（通常7日〜30日）に従います
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base">5. 開示・訂正・削除請求</h2>
            <p className="mt-2">
              お客様自身の情報の開示・訂正・利用停止・削除を希望される場合は、以下の方法でご請求いただけます。
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>削除</strong>：マイページ→アカウントの「
                <a href="/account/" className="text-brand hover:underline">
                  アカウントを削除する
                </a>
                」ボタンから即時実行可能
              </li>
              <li>
                <strong>その他のご請求</strong>：
                <a href="/contact/" className="text-brand hover:underline">
                  お問い合わせフォーム
                </a>
                よりご連絡ください。本人確認の上、合理的な期間内に対応します
              </li>
            </ul>
            <p className="mt-2 text-xs text-fg-muted">
              ※ 税務処理上必要なStripe側の購入履歴・領収書は法定保存期間中は保持されます（個人情報ではなく取引記録）。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">6. Cookieについて</h2>
            <p className="mt-2">
              ログイン状態の維持・CSRF対策に必要最低限のCookieを使用します（HttpOnly・Secure・SameSite=Lax属性付き）。
              トラッキング目的の第三者Cookieは使用していません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">7. 学習データの取り扱い</h2>
            <p className="mt-2">
              問題演習の進捗・苦手問題・模試スコア等の学習データは、お客様の端末のブラウザ（localStorage）に保存されます。
              当サービスのサーバーには送信されず、端末・ブラウザ間での同期機能はありません。
              別のアカウントでログインされた場合、端末内の学習データは安全のため自動的にリセットされます。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">8. お問い合わせ</h2>
            <p className="mt-2">
              本ポリシーに関するご質問は{" "}
              <a href="/contact/" className="text-brand hover:underline">
                お問い合わせフォーム
              </a>{" "}
              よりご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">9. 改定</h2>
            <p className="mt-2">
              本ポリシーは適宜改定されることがあります。重要な変更がある場合は本ページにて告知します。
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
