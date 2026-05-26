# 公開前チェックリスト

正式公開（`MAINTENANCE_MODE = false`）前に全項目を確認してください。

---

## 🔐 セキュリティ・認証

- [ ] `.env` が `.gitignore` に含まれ、Git にコミットされていない
- [ ] Cloudflare アカウント MFA 有効化済
- [ ] Google Cloud アカウント MFA 有効化済
- [ ] Stripe アカウント MFA 有効化済
- [ ] GitHub アカウント MFA 有効化済（リモート使用時）
- [ ] `wrangler secret list` で必要なシークレットがすべて登録済み
  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
  - STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
  - （任意）TURNSTILE_SECRET / RESEND_API_KEY

## 💳 決済

- [ ] Stripe **本番モード**に切り替え済（テストモードのキーを使っていない）
- [ ] 商品（買い切り¥1,500）が本番モードで作成済
- [ ] Price ID が `wrangler.jsonc` の本番値になっている
- [ ] Webhook エンドポイントが本番ドメイン向けに設定済
- [ ] Customer Portal がアクティブ化済
- [ ] テスト決済を **本番モードで** 1回通して確認した（決済成功→/accountに反映→返金→free降格）

## 📜 法務

- [ ] `app/legal/tokushoho/page.tsx` の `[要記入]` を実情報に置換
  - 販売業者名 / 運営統括責任者 / メールアドレス
- [ ] プライバシーポリシー・利用規約の内容を最終確認
- [ ] サービス名・ドメイン名がページ・OGP画像と一致

## 🔍 SEO・公開設定

- [ ] `app/robots.ts` の `DEV_MODE = false` に変更
- [ ] `app/sitemap.ts` の `BASE` を実ドメインに変更
- [ ] `app/layout.tsx` の OGP画像URLが正しい
- [ ] `public/og-image.png` のテキスト・ブランドが最新

## 🎧 機能動作

- [ ] Google ログインが本番ドメインで成功
- [ ] 問題集（無料300問）が動作・採点・解説が正しい
- [ ] 模擬試験（3回・タイマー）が動作
- [ ] 用語集（333語）が表示・検索動作
- [ ] 1章音声が再生される（未ログインでも）
- [ ] 2章以降の音声URLが未ログインで 403 を返す
- [ ] ログイン＋有料化後、2章以降と用語集音声が再生可能
- [ ] お問い合わせフォームから送信→メール受信（任意機能を使う場合）

## 🌐 インフラ

- [ ] カスタムドメインが Cloudflare で Worker に紐付け済
- [ ] HTTPS が動作（証明書自動発行）
- [ ] KV Namespace ID が `wrangler.jsonc` で本番のもの
- [ ] DNS は Cloudflare 管理（DNS only ではなく Proxied 推奨）
- [ ] **www → apex の 301 リダイレクト設定**
  - Cloudflare Dashboard → `{{DOMAIN}}` → Rules → Redirect Rules → Create rule
  - Rule name: `Redirect www to apex`
  - Field: `Hostname` / Operator: `equals` / Value: `www.{{DOMAIN}}`
  - Type: `Dynamic` / Expression: `concat("https://{{DOMAIN}}", http.request.uri.path)`
  - Status code: `301` / Preserve query string: ON
  - 確認: `curl.exe -I https://www.{{DOMAIN}}` → `HTTP/2 301` + `Location: https://{{DOMAIN}}/`
  - 参照: `~/.claude/docs/CLOUDFLARE_DOMAIN_BEST_PRACTICE.md`
  - （SEO 重複コンテンツ防止。G検定研究室・生成AIパス研究室は 2026-05-24 に対応済み）

## 📊 監視

- [ ] UptimeRobot にトップページ URL を登録（5分毎・無料）
- [ ] Cloudflare Workers の observability が有効
- [ ] Stripe ダッシュボードで Webhook 配信成功を確認

## 🚀 公開

- [ ] `src/worker/index.ts` の `MAINTENANCE_MODE = false` に変更
- [ ] `npm run build && npx wrangler deploy`
- [ ] 本番URLを開いて全ページが正常表示されることを確認
- [ ] 検索エンジン登録（Google Search Console）

## 📣 告知

- [ ] X（旧Twitter）等のSNSで公開告知
- [ ] OGP画像が正しく表示されるか共有確認
- [ ] 関連コミュニティ・知人への告知

---

## 緊急時のロールバック

問題が発生したら：

```powershell
# 方法A: Cloudflare ダッシュボードから過去デプロイにロールバック（30秒）
# Workers & Pages → 該当 Worker → Deployments → 過去バージョン → Rollback

# 方法B: git revert
git revert HEAD
npm run build && npx wrangler deploy
```

メンテナンス再開（緊急停止）：

1. `src/worker/index.ts` の `MAINTENANCE_MODE = true` に戻す
2. `npm run build && npx wrangler deploy`

これで全リクエストが 503 「準備中」に戻ります。
