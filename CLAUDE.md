# CLAUDE.md — {{SITE_NAME}}

このファイルは Claude Code がこのプロジェクトで作業する際の指針です。

## プロジェクト概要

> **このテンプレートを使った新規プロジェクトです。**
> 詳細な使い方は [`README.md`](README.md) を参照してください。

- **サイト名**: {{SITE_NAME}}
- **ドメイン**: https://{{DOMAIN}}
- **目的**: TODO (本サービスが何を提供するか記載)
- **ターゲット**: TODO (誰向けか)
- **マネタイズ**: 買い切り ¥{{PRICE}} (Stripe Checkout)

## 技術判断ルール (MUST)

すべての技術設計・アーキテクチャ判断時、`@docs/AI_AGENT_DECISION_RULES.md` の4ステップ(外部情報による検証 → AIツール推奨参照 → 7基準評価 → 競合時の優先ルール)を遵守する。

7基準: 最高UX / 最高UI / 最高安全 / 最高開発効率 / 低コスト開発 / 低コスト運用 / 最高完成度。

省略不可。Hide による 2026-05-27 指示。

## 技術スタック

| レイヤー | 採用 |
|---|---|
| フロントエンド | Next.js 15 (App Router) + TypeScript + Static Export |
| スタイル | Tailwind CSS v4 |
| ホスティング | Cloudflare Workers Static Assets |
| データ | Cloudflare KV (セッション・プラン・rate limit を統合) |
| 認証 | Google OAuth 2.0 (自前実装) |
| 決済 | Stripe Checkout (Hosted) |
| メール | Resend |
| Bot対策 | Cloudflare Turnstile |

## 重要な約束事

1. **メンテナンスモード**: `src/worker/index.ts` の `MAINTENANCE_MODE = true` の間は全リクエスト 503。公開時は false。
2. **デプロイは明示承認後**: 私の許可なく `npx wrangler deploy` を実行しない。
3. **コミットは明示承認後**: 私の指示なくコミットしない。
4. **セキュリティ**: `~/.claude/docs/SECURITY_HARDENING_CHECKLIST.md` の 17 項目をすべて実装済 (DS検定研究室から継承)。

## ディレクトリ規約

- `src/worker/` — Cloudflare Worker (API)
- `src/components/home/` — ホーム画面 state-aware 部品
- `src/lib/` — 共通ロジック (auth-client / progress / activity 等)
- `src/hooks/` — React hooks (useAudioQueue / useHomeState)
- `src/data/` — JSON コンテンツ (要追加)
- `app/` — Next.js App Router ページ
- `docs/` — プロジェクト用ドキュメント
- `scripts/` — メンテナンス用スクリプト

## TODO (テンプレート初期化時)

- [ ] プレースホルダの置換 (`{{SITE_NAME}}`, `{{DOMAIN}}`, etc.)
- [ ] `src/data/` にコンテンツ JSON を配置
- [ ] `public/` に favicon, og-image.png, audio 等を配置
- [ ] Cloudflare KV namespace 作成 → wrangler.jsonc 更新
- [ ] Google OAuth Client 作成 + secret 登録
- [ ] Stripe 商品作成 + secret 登録
- [ ] Cloudflare Turnstile サイト作成 + secret 登録
- [ ] Resend ドメイン認証 + secret 登録
- [ ] ドメイン取得 + Cloudflare 接続 (workers_dev OFF / www→apex)
- [ ] `app/legal/privacy/page.tsx` のサイト固有情報更新
- [ ] `app/legal/terms/page.tsx` のサイト固有情報更新
- [ ] `app/legal/tokushoho/page.tsx` の運営者情報更新
- [ ] OGP 画像生成 (`/generate-ogp-image` Skill)
- [ ] 公開前 `/audit-security` 実行
- [ ] 公開前 `/launch-readiness-check` 実行

## 関連 Skill

| Skill | 用途 |
|---|---|
| `/japanese-saas-init` | 新規日本向け SaaS の立ち上げ全体ガイド |
| `/setup-stripe-checkout` | Stripe 決済の詳細セットアップ |
| `/generate-ogp-image` | OGP 画像生成 |
| `/audit-ui-design` | UI/UX 14 原則レビュー |
| `/audit-security` | セキュリティ 10 カテゴリ監査 |
| `/launch-readiness-check` | 公開前総合チェック |
