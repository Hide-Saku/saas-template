# {{SITE_NAME}}

> 日本向け Web SaaS テンプレート — Cloudflare Workers + Next.js 15 + Stripe + Google OAuth

このリポジトリは「Use this template」で新規プロジェクトの雛形として利用できる**個人開発 SaaS 完全テンプレート**です。

## 含まれている機能

### 🛡️ セキュリティ (商用レベル)
- Google OAuth 2.0 (Authorization Code Flow, state CSRF 対策)
- Opaque Session ID + HttpOnly Cookie (XSS 耐性)
- Stripe Webhook HMAC 検証 + 冪等性 (重複処理防止)
- セキュリティヘッダー全部入り (HSTS / CSP-RO / Permissions-Policy / X-Frame-Options / Referrer-Policy / X-Content-Type-Options)
- Cloudflare Turnstile (CAPTCHA・Bot 対策)
- AI クローラー 10 種ブロック (GPTBot/ClaudeBot/Google-Extended 等)
- Worker 層での有料コンテンツゲート (クライアント改ざん耐性)
- Dependabot 設定済 (依存脆弱性自動監視)

### 💳 決済
- Stripe Checkout (Hosted) — 買い切り単一商品構成
- Customer Portal (領収書ダウンロード)
- 自己修復ロジック (KV 欠損時 Stripe API でメールから自動検索)
- `customer_creation: "always"` でゲスト購入回避

### 🎨 UI/UX
- state-aware ホーム画面 (新規/試用/購入後/継続学習中で出し分け)
- Light / Dark モード完全対応
- 学習カレンダー (4 週グリッド + ストリーク)
- 苦手問題機能 + 復習モード
- 章別進捗 + 続きから / リセット
- レスポンシブ (スマホ片手操作可)

### 📜 法的・運用
- プライバシーポリシー雛形 (個人情報保護法準拠)
- 特商法表記
- 利用規約
- アカウント削除機能 (個人情報保護法対応)
- インシデント対応メモ (8 ケース x 3 行手順)
- KV バックアップ script

### 📚 ドキュメント
- `docs/HOME_PAGE_SPEC.md` — ホーム画面統一仕様 (3 サイト共通可)
- `docs/INCIDENT_RESPONSE.md` — トラブル時の対応手順
- `docs/DEPLOYMENT.md` — デプロイ手順
- `docs/LAUNCH_CHECKLIST.md` — 公開前チェックリスト

---

## 🚀 新規プロジェクトでの使い方

### Step 1: テンプレートから新リポジトリを作成

GitHub の **Use this template** ボタンから新リポジトリ作成。

### Step 2: ローカルにクローン + 初期化

```bash
git clone https://github.com/{your-account}/{new-project}
cd {new-project}
npm install
```

### Step 3: プレースホルダの置換

以下を全プロジェクト内で置換 (VSCode の Find & Replace 推奨):

| プレースホルダ | 置換例 |
|---|---|
| `{{SITE_NAME}}` | あなたのサービス名 (例: `生成AIパス研究室`) |
| `{{WORKER_NAME}}` | Cloudflare Worker 名 (例: `genai-pass-quiz`) |
| `{{DOMAIN}}` | 本番ドメイン (例: `ai-passport-quiz.com`) |
| `{{KV_NAMESPACE_ID}}` | 後述の Step 4 で取得 |
| `{{STRIPE_PRICE_ID}}` | Stripe Dashboard で作成した Price ID |
| `{{TURNSTILE_SITE_KEY}}` | Cloudflare Turnstile Dashboard で取得 |
| `{{CONTACT_EMAIL}}` | お問い合わせ受信先 |
| `ds-cert:` (localStorage prefix) | あなたのプロジェクト用 prefix (例: `genai-pass:`) |

ブランド固有のテキスト・章名・問題数等も実際のサービスに合わせて更新。

### Step 4: 外部サービスの設定

詳細手順は [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) を参照。

1. **Cloudflare KV**: `npx wrangler kv namespace create AUTH_SESSIONS` → `wrangler.jsonc` の `id` を更新
2. **Google OAuth Client**: https://console.cloud.google.com/apis/credentials で作成
3. **Stripe**: Live モードで買い切り商品作成、制限付きキー (`rk_live_`) 作成
4. **Cloudflare Turnstile**: https://dash.cloudflare.com/?to=/:account/turnstile でサイト作成
5. **Resend**: ドメイン認証 (SPF/DKIM 設定)
6. **Cloudflare ドメイン**: Auto-renew ON、workers.dev OFF、www→apex リダイレクト

Secrets を `wrangler secret put` で 6 個登録:
```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
```

### Step 5: コンテンツデータの追加

`src/data/` 配下に以下を作成 (元 DS検定研究室のスキーマ):

- `categories.json` — 領域（章）リスト
- `questions.json` — 問題リスト
- `exams.json` — 模擬試験リスト
- `glossary.json` — 用語集

スキーマは [`docs/HOME_PAGE_SPEC.md`](docs/HOME_PAGE_SPEC.md) と元プロジェクト (Hide-Saku/ds-kentei-lab) を参考に。

### Step 6: 音声ファイル配置 (任意)

`public/audio/` 配下に以下の構造で配置:
```
public/audio/
├── markers/                      # 共通マーカー (10 ファイル)
│   ├── question.mp3
│   ├── option-a.mp3 ... option-d.mp3
│   ├── correct-a.mp3 ... correct-d.mp3
│   └── explanation.mp3
├── {your-prefix}/                # 各問題の音声 (任意)
│   └── {question-id}/
│       ├── q.mp3
│       ├── opt-0.mp3 ... opt-3.mp3
│       └── exp.mp3
└── glossary/                     # 用語集音声 (任意)
    └── {term-id}/
        ├── term.mp3
        └── def.mp3
```

### Step 7: メンテナンスモードでデプロイ → 動作確認 → 公開

```bash
npm run deploy
```

`src/worker/index.ts` の `MAINTENANCE_MODE = true` で初回デプロイ → ログイン・決済等を全件テスト → `false` に変更して再デプロイで公開。

### Step 8: 公開前最終チェック

Claude セッションで以下を実行:

```
/audit-security     # セキュリティ 10 カテゴリ監査
/launch-readiness-check  # 公開前総合チェック
```

---

## 📁 ディレクトリ構成

```
.
├── .github/dependabot.yml      # 依存パッケージ自動監視
├── app/                        # Next.js App Router ページ
│   ├── account/                # アカウント管理
│   ├── contact/                # お問い合わせフォーム
│   ├── exam/                   # 模擬試験
│   ├── glossary/               # 用語集
│   ├── legal/                  # プライバシー/規約/特商法
│   ├── listen/                 # 聞き流しモード
│   ├── login/                  # ログイン
│   ├── mypage/                 # マイページ
│   ├── pricing/                # 料金プラン
│   ├── quiz/                   # 問題演習 (章別 + 復習)
│   ├── layout.tsx              # 共通レイアウト + LocalStorageDisclosure
│   ├── page.tsx                # ホーム (state-aware HomeView)
│   ├── robots.ts               # AI Bot ブロック設定
│   └── sitemap.ts              # SEO sitemap
├── src/
│   ├── components/
│   │   ├── home/               # ホーム用 state-aware 部品
│   │   ├── Header.tsx Footer.tsx
│   │   ├── QuizRunner.tsx ExamRunner.tsx ReviewClient.tsx
│   │   ├── ListenClient.tsx GlossaryList.tsx
│   │   └── StudyCalendar.tsx ChapterListClient.tsx
│   ├── hooks/                  # useAudioQueue, useHomeState
│   ├── lib/                    # auth-client, content, domain, audio,
│   │                           # progress, activity, wrong-questions,
│   │                           # exam-history, home-stats
│   ├── data/                   # JSON コンテンツ (要追加)
│   └── worker/                 # Cloudflare Worker (API)
│       ├── index.ts            # ルーティング + セキュリティヘッダー
│       ├── oauth.ts            # Google OAuth + アカウント削除
│       ├── session.ts          # KV ベースセッション
│       ├── plan.ts             # 有料プラン判定 + 永続化
│       ├── stripe.ts           # Checkout + Webhook + Portal + Idempotency
│       └── contact.ts          # Resend + Turnstile + Rate limit
├── docs/
│   ├── HOME_PAGE_SPEC.md       # ホーム画面統一仕様
│   ├── INCIDENT_RESPONSE.md    # トラブル対応 8 ケース
│   ├── DEPLOYMENT.md           # デプロイ手順
│   └── LAUNCH_CHECKLIST.md     # 公開前チェック
├── scripts/
│   └── backup-kv.mjs           # KV 月次バックアップ
├── public/                     # 静的アセット (要 favicon 等追加)
├── next.config.ts              # Static Export + Cloudflare 設定
├── wrangler.jsonc              # Cloudflare Workers 設定 (要 placeholder 置換)
├── package.json
└── CLAUDE.md                   # プロジェクト用 Claude 指示
```

---

## 💰 想定運用コスト

| 項目 | コスト |
|---|---|
| Cloudflare Workers | **¥0** (月 10 万 req まで無料) |
| Cloudflare KV | **¥0** (10 万 read/day 無料) |
| ドメイン | 年 ¥1,500 程度 (.com) |
| Stripe | 売上の 3.6% + ¥0/月 |
| Google OAuth | 無料 |
| Resend | 月 3,000 通まで無料 |
| Cloudflare Turnstile | 無料 |
| **合計** | **月 ¥0〜数百円** (売上連動のみ) |

---

## 📖 参考リンク (Claude 全プロジェクト共通)

- `~/.claude/docs/SECURITY_HARDENING_CHECKLIST.md` — セキュリティ 17 項目
- `~/.claude/docs/CLOUDFLARE_DOMAIN_BEST_PRACTICE.md` — Cloudflare 設定
- `~/.claude/rules/security-baseline.md` — セキュリティルール
- `~/.claude/rules/secrets-handling.md` — シークレット管理
- Skill: `/japanese-saas-init` `/audit-security` `/launch-readiness-check`

---

## 🛠️ 元になったプロジェクト

このテンプレートは [DS検定研究室](https://github.com/Hide-Saku/ds-kentei-lab) の機密・固有データを削除して汎用化したものです。実装パターンの参考として元プロジェクトも参照可。

---

## ライセンス

個人用テンプレート。再配布前提ではないため、ライセンス未設定。
