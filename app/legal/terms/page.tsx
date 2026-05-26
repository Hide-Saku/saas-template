import Header from "@/components/Header";

export const metadata = { title: "利用規約 — {{SITE_NAME}}" };

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">利用規約</h1>
        <p className="mt-2 text-sm text-fg-muted">最終更新日：2026年5月23日</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-bold text-base">第1条（適用）</h2>
            <p className="mt-2">
              本規約は、{"{{SITE_NAME}}"}（以下「本サービス」）の利用に関する条件を、本サービス利用者（以下「利用者」）と運営者の間で定めるものです。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">第2条（サービス内容）</h2>
            <p className="mt-2">
              {/* TODO: テンプレ利用側で資格名・運営団体に置換 */}
              本サービスは{"{{CERT_NAME}}"}の学習を支援する問題集・模擬試験・用語集・音声教材を提供します。
              本サービスは{"{{OFFICIAL_BODY}}"}の公式サービスではありません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">第3条（アカウント）</h2>
            <p className="mt-2">
              一部機能はGoogleアカウントによるログインが必要です。利用者は自己の責任においてアカウントを管理してください。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">第4条（料金・解約）</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>買い切りプラン（¥1,500）：購入時に一括課金され、以降は追加課金されません。</li>
              <li>デジタルコンテンツの性質上、原則として返金は承っておりません。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base">第5条（禁止事項）</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>本サービスのコンテンツの無断複製・転載・再配布</li>
              <li>逆コンパイル・リバースエンジニアリング</li>
              <li>サーバーへの過度な負荷をかける行為（スクレイピング等）</li>
              <li>他の利用者・運営者・第三者への迷惑行為</li>
              <li>法令または公序良俗に反する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base">第6条（コンテンツの正確性・免責）</h2>
            <p className="mt-2">
              本サービスの問題・解説は{"{{CERT_NAME}}"}のシラバスに基づき作成していますが、内容の正確性・完全性・最新性を保証するものではありません。
              本サービスの利用または利用不能により生じた損害について、運営者は一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">第7条（サービス変更・終了）</h2>
            <p className="mt-2">
              運営者は事前の通知なくサービス内容を変更できます。サービスを終了する場合は、原則として90日前までに本ページにて告知します。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">第8条（アカウント削除）</h2>
            <p className="mt-2">
              利用者はお問い合わせフォームよりアカウント削除を依頼できます。削除後は購入履歴・進捗データへのアクセスができなくなります。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base">第9条（準拠法・管轄）</h2>
            <p className="mt-2">
              本規約は日本法を準拠法とし、本サービスに関する一切の紛争は運営者の所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
