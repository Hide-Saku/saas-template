import Header from "@/components/Header";

export const metadata = { title: "特定商取引法に基づく表記 — {{SITE_NAME}}" };

export default function TokushohoPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">特定商取引法に基づく表記</h1>

        <dl className="mt-8 space-y-5 text-sm leading-relaxed">
          <Row title="販売業者">[要記入：氏名または屋号]</Row>
          <Row title="運営統括責任者">[要記入：氏名]</Row>
          <Row title="所在地">
            お問い合わせ時に遅滞なく開示します。請求は「お問い合わせフォーム」よりご連絡ください。
          </Row>
          <Row title="電話番号">
            お問い合わせ時に遅滞なく開示します。請求は「お問い合わせフォーム」よりご連絡ください。
          </Row>
          <Row title="メールアドレス">[要記入：support@example.com]</Row>
          <Row title="販売価格">
            買い切りプラン：¥1,500（税込）
          </Row>
          <Row title="商品代金以外の必要料金">
            インターネット接続料・通信料はお客様のご負担となります。
          </Row>
          <Row title="支払方法">クレジットカード（Stripe Checkout）</Row>
          <Row title="支払時期">
            購入時に一括（以降の追加課金なし）
          </Row>
          <Row title="商品の引渡時期">
            決済完了直後より、対象のコンテンツがご利用可能になります。
          </Row>
          <Row title="返品・キャンセル">
            デジタルコンテンツの性質上、原則として返金は承っておりません。
            未提供のサービスや当方の重大な不具合に起因する場合は個別にご対応します。
          </Row>
          <Row title="動作環境">
            最新版の Google Chrome / Safari / Edge / Firefox。JavaScript と Cookie の有効化が必要です。
          </Row>
        </dl>

        <p className="mt-10 text-xs text-fg-muted">
          ※「[要記入]」の項目は正式公開前に運営者情報に置き換えます。
        </p>
      </main>
    </>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border pb-4 sm:grid-cols-[180px_1fr]">
      <dt className="font-medium text-fg-muted">{title}</dt>
      <dd>{children}</dd>
    </div>
  );
}
