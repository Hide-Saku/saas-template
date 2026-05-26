# インシデント対応メモ

DS検定研究室で**問題が発生した時の対応手順**。慌てた時の保険として A4 1 枚に集約。

## 🆘 緊急時の優先順位

1. **被害拡大の停止** (メンテナンスモード切替・APIキー失効)
2. **影響範囲の特定** (ログ確認・KV 状態確認)
3. **ユーザーへの説明** (X / お問い合わせ自動返信)
4. **再発防止策の検討と実装**

---

## 📋 想定インシデントと対応

### 1. Stripe API キー / Webhook Secret 漏洩

**症状**: GitHub Secret Scanning アラート / 不審な API 呼び出し増加 / 課金通知の異常

**3 行対応**:
1. https://dashboard.stripe.com/apikeys で**該当キーを即 Revoke** (rk_live_... と sk_live_...)
2. 新キー発行 → `npx wrangler secret put STRIPE_SECRET_KEY` で再登録 → `npx wrangler deploy`
3. 漏洩後の取引を Stripe Dashboard で確認、不審な決済は返金

---

### 2. Google OAuth Client Secret 漏洩

**症状**: GitHub Secret Scanning アラート / 不審なログイン試行

**3 行対応**:
1. https://console.cloud.google.com/apis/credentials で**該当 Client Secret をリセット**
2. `npx wrangler secret put GOOGLE_CLIENT_SECRET` で再登録 → `npx wrangler deploy`
3. 既存ユーザーは再ログインで継続利用可能 (セッションは KV に残るため即影響なし)

---

### 3. KV データ消失 / 破損

**症状**: 全ユーザーが「無料プラン」状態にロールバック / セッション喪失

**3 行対応**:
1. **メンテナンスモード ON** (`src/worker/index.ts:MAINTENANCE_MODE = true` → deploy)
2. `backups/kv-YYYY-MM-DD.json` から手動復元 (`npx wrangler kv key put --binding AUTH_SESSIONS "key" "value"`)
3. 復元後にメンテナンスモード OFF。X で「ログインし直してください」と案内

---

### 4. Cloudflare アカウント侵害

**症状**: ダッシュボードに身に覚えのない変更 / ドメイン設定の異常

**3 行対応**:
1. Cloudflare パスワードを即変更 + 2FA 再設定 (https://dash.cloudflare.com/profile/authentication)
2. **API トークンを全て Revoke** (https://dash.cloudflare.com/profile/api-tokens)
3. Worker / KV / DNS 設定を全件確認、不審な変更があれば revert + Cloudflare サポート連絡

---

### 5. サイト全体ダウン ({{DOMAIN}} にアクセスできない)

**症状**: UptimeRobot からアラート / ユーザーからの問い合わせ

**3 行対応**:
1. https://www.cloudflarestatus.com で Cloudflare 自体の障害か確認
2. `npx wrangler tail` で Worker のリアルタイムログを確認、エラー特定
3. 直近のデプロイをロールバック (`npx wrangler rollback`) または直前 commit から再ビルド・再デプロイ

---

### 6. 個人情報削除請求

**症状**: ユーザーからお問い合わせ「アカウントを削除してください」

**3 行対応**:
1. ユーザーに「`/account/` ページの『アカウントを削除する』ボタンをご利用ください」と案内
2. それでも対応不可なら、メールで本人確認後、`npx wrangler kv key delete --binding AUTH_SESSIONS "paid_email:{email}"` で手動削除
3. Stripe Customer は税務上の理由で保持 (購入履歴は法定保存期間中保持)。返金依頼があれば Stripe ダッシュボードから返金

---

### 7. 大量 Bot / DDoS 攻撃

**症状**: Cloudflare Analytics で異常なリクエスト増加 / KV writes 急増

**3 行対応**:
1. Cloudflare Dashboard → Security → 攻撃 IP の確認・Block 設定
2. 必要なら Cloudflare の "Under Attack Mode" を一時的に有効化 (要 Pro $20)
3. Worker 側で IP ベースの Rate limit を強化 (`worker/contact.ts` の手法を他 API にも適用)

---

### 8. プライバシーポリシー違反・GDPR 等の問い合わせ

**症状**: 法務関連のお問い合わせ / EU 圏ユーザーから請求

**3 行対応**:
1. お問い合わせフォームの内容を**即座に確認**、24 時間以内に一次返信
2. `/legal/privacy/` ポリシーに沿って対応 (開示・訂正・削除)
3. 法的判断が必要なら弁護士相談 (個人事業主向けの法律相談 1 時間 5,000 円程度を想定)

---

## 📞 連絡先・参考リンク

| 用途 | URL |
|---|---|
| Cloudflare サポート | https://dash.cloudflare.com/?to=/:account/support |
| Stripe サポート | https://support.stripe.com/ |
| Google Cloud サポート | https://cloud.google.com/support |
| Cloudflare 障害情報 | https://www.cloudflarestatus.com/ |
| Stripe 障害情報 | https://status.stripe.com/ |
| Google API 障害情報 | https://status.cloud.google.com/ |
| GitHub Secret Scanning | https://github.com/Hide-Saku/ds-kentei-lab/security/secret-scanning |

## 🛡️ 平時の備え

毎月 1 回:
- [ ] `node scripts/backup-kv.mjs` で KV バックアップ
- [ ] `npm audit` で脆弱性チェック (Dependabot からの通知)
- [ ] Cloudflare / Stripe / Google アカウントの 2FA 確認

毎四半期:
- [ ] API キーローテーション (Google / Stripe / Resend / Turnstile)
- [ ] アクセスログ・課金ログのレビュー
- [ ] このメモを最新運用に合わせて更新

---

最終更新: 2026-05-25
