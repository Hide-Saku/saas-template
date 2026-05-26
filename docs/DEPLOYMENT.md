# デプロイ・外部設定ガイド

DS検定研究室を本番公開するための外部設定手順をまとめたものです。
**完了するまで `MAINTENANCE_MODE = true` のまま**で大丈夫です（誰からも準備中ページしか見えません）。

---

## 0. 前提

- Cloudflare アカウント（無料プランで可）
- Google Cloud Console アカウント（quiz-platform の `ai-passport-quiz` プロジェクト流用可）
- Stripe アカウント
- メールアドレス（Resend用・お問い合わせ受信用）

---

## 1. ドメイン取得・Cloudflare 紐付け

1. Cloudflare Registrar でドメインを取得（例：`ds-cert-quiz.com` など）
   - 年間 1,500 円程度
2. Cloudflare ダッシュボード → Workers & Pages で新規 Worker を作成（後でデプロイ時に上書きされる）
3. Worker → Settings → Triggers → Custom Domains にドメインを追加

**この時点で `wrangler.jsonc` の `APP_ORIGIN` を実ドメインに更新：**

```jsonc
"vars": {
  "APP_ORIGIN": "https://your-domain.com",
  ...
}
```

---

## 2. KV Namespace 作成

```powershell
cd C:\Users\hide0\Desktop\dev\20260515_DS_test
npx wrangler kv namespace create AUTH_SESSIONS
```

出力例：

```
🌀 Creating namespace with title "AUTH_SESSIONS"
✨ Success!
{ binding = "AUTH_SESSIONS", id = "abc123..." }
```

`wrangler.jsonc` の `kv_namespaces[0].id` を出力された id に置換：

```jsonc
"kv_namespaces": [
  { "binding": "AUTH_SESSIONS", "id": "abc123..." }
]
```

---

## 3. Google OAuth 認証情報

1. [Google Cloud Console](https://console.cloud.google.com/) → APIとサービス → 認証情報
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類：**ウェブアプリケーション**
4. **承認済みのリダイレクトURI** に追加：
   - `https://your-domain.com/api/auth/callback`（本番）
   - `http://localhost:8787/api/auth/callback`（ローカル wrangler dev 用）
5. 作成後、`クライアントID`・`クライアントシークレット`をコピー

シークレットを wrangler に登録（**1コマンドずつ・単独ステップ**）：

```powershell
# Step 1
npx wrangler secret put GOOGLE_CLIENT_ID
# プロンプトでクライアントIDを貼り付け

# Step 2
npx wrangler secret put GOOGLE_CLIENT_SECRET
# プロンプトでシークレットを貼り付け
```

---

## 4. Stripe 商品・Webhook 設定

### 4-1. 商品作成

[Stripe Dashboard](https://dashboard.stripe.com/products) で1商品を作成（買い切り単一）：

| 商品名 | 価格 | 課金タイプ |
|---|---|---|
| DS検定研究室 | ¥1,500 | 一回限り |

商品の **Price ID**（`price_xxx`）を `wrangler.jsonc` に：

```jsonc
"vars": {
  "STRIPE_PRICE_ID_ONETIME": "price_1Abc..."
}
```

### 4-2. シークレット登録

```powershell
# Step 1
npx wrangler secret put STRIPE_SECRET_KEY
# Stripeダッシュボードの「シークレットキー」（sk_live_... または sk_test_...）
```

### 4-3. Webhook エンドポイント設定

1. Stripe Dashboard → Developers → Webhooks → 「エンドポイントを追加」
2. URL：`https://your-domain.com/api/stripe/webhook`
3. **購読するイベント**（買い切りのみなのでサブスク系イベントは不要）：
   - `checkout.session.completed`
   - `charge.refunded`
4. 作成後、Webhook の **「署名シークレット」**（`whsec_...`）をコピー

```powershell
# Step 2
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4-4. Customer Portal 有効化

Stripe Dashboard → Settings → Billing → Customer Portal → デフォルト設定で「アクティブ化」

---

## 5. お問い合わせ機能（任意）

### 5-1. Cloudflare Turnstile

1. Cloudflare ダッシュボード → Turnstile → 「サイトを追加」
2. ドメイン入力 → Widget 作成
3. **Site Key** と **Secret Key** を取得

`app/contact/page.tsx` の `TURNSTILE_SITE_KEY` を Site Key に置換、または
`wrangler.jsonc` の `vars` に追加してビルド時に注入する設計に変更可。

```powershell
npx wrangler secret put TURNSTILE_SECRET
```

### 5-2. Resend

1. [Resend](https://resend.com/) でアカウント作成
2. ドメイン認証（SPF/DKIM/DMARC を Cloudflare DNS に追加）
3. API キー発行

```powershell
npx wrangler secret put RESEND_API_KEY
```

`wrangler.jsonc` の `vars` に追加：

```jsonc
"vars": {
  ...
  "CONTACT_TO_EMAIL": "support@your-domain.com",
  "CONTACT_FROM_EMAIL": "noreply@your-domain.com"
}
```

---

## 6. 法務ページの [要記入] 置換

以下のファイルを編集し、`[要記入：...]` 部分を実情報に書き換える：

- `app/legal/tokushoho/page.tsx`
  - 販売業者名
  - 運営統括責任者名
  - メールアドレス

---

## 7. デプロイ（メンテナンスモードのまま）

```powershell
# ビルド + デプロイ
npm run build
npx wrangler deploy
```

カスタムドメインで開いて確認：**全てのページが「準備中」（503）になることを確認**。
これで一般公開には見えませんが、内部での疎通確認が可能です。

---

## 8. ローカルでの動作確認（任意）

**手順**：

1. `src/worker/index.ts` の `MAINTENANCE_MODE = true` を **ローカルのみ一時的に** `false` に変更（コミットしない）
2. `npm run build && npx wrangler dev`
3. http://localhost:8787 で各機能を確認：
   - Google ログイン → 成功すること
   - Stripe Checkout（テストカード `4242 4242 4242 4242`）→ 決済成功で /account に paid=1 が表示
   - 2章の音声URLが 403 で弾かれ、ログイン＋有料化後にアクセス可になること
   - お問い合わせ送信 → メール受信
4. 確認後、必ず `MAINTENANCE_MODE = true` に戻す

---

## 9. GitHub リモート設定（推奨）

```powershell
# GitHub で Private リポジトリ ds-cert-quiz を作成後
git remote add origin https://github.com/Hide-Saku/ds-cert-quiz.git
git push -u origin main
```

---

## 10. 正式公開（最終ステップ）

すべての疎通確認が完了したら：

1. `src/worker/index.ts` の `MAINTENANCE_MODE = false` に変更
2. `app/robots.ts` の `DEV_MODE = false` に変更（AIクローラーのみブロック・通常検索Bot許可）
3. `npm run build && npx wrangler deploy`
4. UptimeRobot に登録（5分毎の監視・無料）
5. SNS等で告知

---

## チェックリスト（公開判断用）

公開前に [`docs/LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) を参照してください。
