# REUSABLE_STACK 監査 — 生成AIパス研究室の 16 パターン適合状況

**監査対象**: saas-template (commit `9d1ea0f`)
**比較元**: 生成AIパス研究室 (`C:/Users/hide0/Desktop/dev/20260505_quiz-platform/`) の `docs/REUSABLE_STACK.md` 16 パターン
**監査日**: 2026-05-27

## 凡例

- ✅ 同等の実装あり (ほぼ同じ)
- 🟡 違う実装で同じ目的を達成
- ❌ 未実装
- ➖ このプロジェクトには不要 (設計思想として該当しない)

## 判定結果

| # | パターン名 | 状態 | 実装ファイル(あれば) | 生成AI版との差分(あれば) |
|---|---|:-:|---|---|
| 1 | Google OAuth 2.0 | ✅ | `src/worker/oauth.ts` (`handleAuthStart` / `handleAuthCallback`) | state CSRF + KV `oauth_state:{state}` + `session:{id}` + HttpOnly Cookie の構成は同等。生成AI版は `index.ts` 内に集約しているが、本テンプレは `oauth.ts` に分離して保守性向上 |
| 2 | Stripe サブスク | 🟡 | `src/worker/stripe.ts` | Hosted Checkout + Webhook HMAC 検証 + 冪等性 (`webhook_event:{id}` KV 24h dedupe) は同等。**ただし本テンプレは買い切り単一商品構成にスコープ縮小** (サブスクモード削除済、Task #42 で削除確認)。月額サブスクが必要なら生成AI版から移植が必要 |
| 3 | コンタクトフォーム | 🟡 | `src/worker/contact.ts` + `app/contact/page.tsx` | Turnstile + Resend + IP rate limit (5回/1h KV) は同等。**Zod が未導入** — 入力検証は手書き (`Body` interface + 文字列長 if 文)。生成AI版は `z.object()` で一元化 |
| 4 | ダークモード FOUC 対策 | ✅ | `app/layout.tsx:36-48` + `src/components/Header.tsx` | layout に themeScript inline で localStorage 同期。`localStorage` key 名が `ds-cert:theme` 固定 (生成AI版とは key prefix が違う) |
| 5 | メンテモード | 🟡 | `src/worker/index.ts:28` | `const MAINTENANCE_MODE = false` の**ハードコード**。**生成AI版は `env.MAINTENANCE_MODE === "true"` で環境変数化済**。本テンプレは文書(REUSABLE_STACK.md)記載の baseline 実装を踏襲、wrangler.jsonc vars 経由化は未対応 |
| 6 | 有料メール永続化 | ✅ | `src/worker/plan.ts:11` (`PAID_EMAIL_TTL = 60*60*24*365*10` = 10 年) + `restoreSessionPlan()` | `paid_email:{email}` KV キーで 10 年永続化、`grantPlanByEmail` / `revokePlanByEmail` 関数も実装。生成AI版と同等 |
| 7 | 無料プレビュー | 🟡 | `src/worker/index.ts:130-160` (`audioRequiresPaid()`) | `audioRequiresPaid()` が path で章別判定: `/audio/markers/` `/audio/ds-cert/q-foundation-*/` は無料、その他 `/audio/ds-cert/*` と `/audio/glossary/` は有料。生成AI版の `/audio/ai-passport/ch01-preview/` 専用パス分岐とは方式が異なるが目的(認証なし配信)は同じ |
| 8 | セキュリティヘッダー | 🟡 | `src/worker/index.ts:38-72` (`SECURITY_HEADERS` const + CSP_REPORT_ONLY + PERMISSIONS_POLICY) | 6 種 + Permissions-Policy 付与は同等。**生成AI版は `env.CSP_MODE` で Report-Only ↔ enforcing 切替可能な進化版、本テンプレは Report-Only 固定** |
| 9 | Set-Cookie 複数値 | ✅ | `src/worker/oauth.ts:57,119,123,132,172` | `headers.append("Set-Cookie", ...)` で複数 Cookie 設定。OAuth callback で state クリア + session セットを正しく append。生成AI版と同等 |
| 10 | charge.refunded 自動解除 | ✅ | `src/worker/stripe.ts:159-165` + `src/worker/plan.ts:50` (`revokePlanByEmail`) | `event.type === "charge.refunded"` 時に `charge.refunded === true \|\| charge.amount_refunded >= charge.amount` で全額返金判定 → `revokePlanByEmail` 実行。生成AI版と同等 |
| 11 | optionOrder シャッフル (表示順保存) | 🟡 | `src/lib/shuffle.ts` + `src/components/ExamRunner.tsx` | `ExamRunner` は `shuffleIndices/applyOrder/correctIndexAfter` を使い表示順を `examOrderMap` に保存 (✅)。**しかし `QuizRunner.tsx:79` と `ReviewClient.tsx:47` は local `shuffle<T>()` 関数で配列を直接 shuffle しているのみで表示順を永続化していない** — 復習時に同じ順で再現できない |
| 12 | Single Source of Truth | ✅ | `src/lib/home-stats.ts:90,116` + `src/lib/exam-history.ts:47` | `Math.max(...examKeys.map(k => examHist[k].bestRate))` や `Math.max(0, freeIds.size - seenFreeCount)` で読む時に集約。二重書きを避ける設計。生成AI版と同等 |
| 13 | localStorage オーナー追跡 (useProgressOwnership) | ❌ | (なし) | `src/hooks/` には `useAudioQueue.ts` と `useHomeState.ts` のみ。**`useProgressOwnership` 相当のメアド変更検知 → 進捗自動クリアフックは未実装**。Header の auth 状態取得はあるが、メアド切替時の localStorage 浄化ロジックは存在せず |
| 14 | OGP 画像 SVG→PNG | ❌ | (依存パッケージのみ) | `@resvg/resvg-js ^2.6.2` は `package.json` devDependencies に記載あり、しかし**実際の `gen-og-image.ts` スクリプトは `scripts/` 配下に存在しない** (テンプレ化時に削除済)。`/generate-ogp-image` skill 利用前提 |
| 15 | TTS 音声大量生成 | ❌ | (なし) | `scripts/generate_audio_*.mjs` 完全削除済 (テンプレ化時)。`scripts/` には `backup-kv.mjs` 1 本のみ。音声教材が必要なテンプレ利用側で生成AI版から移植する必要 |
| 16 | SUPPORT_TEMPLATES.md | ❌ | (なし) | `docs/` 4 本 (`DEPLOYMENT` / `HOME_PAGE_SPEC` / `INCIDENT_RESPONSE` / `LAUNCH_CHECKLIST`) のみ。返信雛形ドキュメントは未配置 |

## サマリー

| 状態 | 件数 | 該当パターン |
|---|---:|---|
| ✅ 同等実装 | **6** | #1 OAuth / #4 ダークモード FOUC / #6 有料メール永続化 / #9 Set-Cookie 複数値 / #10 charge.refunded / #12 Single Source of Truth |
| 🟡 違う実装で同目的 | **6** | #2 Stripe (買い切りのみ) / #3 Contact (Zod なし) / #5 メンテモード (hardcode) / #7 プレビュー (path 判定) / #8 セキュリティヘッダー (Report-Only 固定) / #11 シャッフル (Exam のみ完全) |
| ❌ 未実装 | **4** | #13 オーナー追跡 / #14 OGP 生成 script / #15 TTS 生成 / #16 SUPPORT_TEMPLATES |
| ➖ 不要 | 0 | — |

**カバレッジ**: 12 / 16 = **75%** が実装または同等実装で達成済。

## ギャップ別の補完優先度 (テンプレ完成度を上げる観点)

### 🔴 高 (テンプレ利用者がほぼ全員ハマる)
- **#13 useProgressOwnership** — メアド変更時の進捗漏洩バグの温床。汎用性が高い (生成AI版マトリクス: Net +3)
- **#3 Zod 導入** — 入力検証の一元化。/api/contact 以外の API が増えた時のために早めに入れる価値あり

### 🟡 中 (テンプレ利用者の運用段階で必要になる)
- **#5 メンテモード env 化** — 「コード変更なしで切替」のセキュリティルール準拠
- **#8 CSP enforcing 切替** — 公開後 1-2 週で Report-Only から enforcing に進化させる仕組み
- **#16 SUPPORT_TEMPLATES** — 公開後の顧客対応工数を減らす雛形

### 🟢 低 (利用側の業態次第)
- **#11 QuizRunner/ReviewClient のシャッフル順永続化** — 復習時の整合性が必要なら対応
- **#14 OGP 生成 script** — `/generate-ogp-image` skill を都度呼べば OK
- **#15 TTS 生成** — 音声教材を使う場合のみ生成AI版から移植
- **#2 Stripe サブスク** — 月額課金が必要な利用ケースでのみ復活

## 抽出難易度・再利用価値マトリクス (本テンプレ視点)

生成AI版のマトリクスをベースに、本テンプレでの**保守必要度**を追加:

| # | パターン | 本テンプレ状態 | 抽出難易度 | 再利用価値 | Net | 保守必要度 |
|---|---|:-:|:-:|:-:|:-:|:-:|
| 4 | ダークモード FOUC | ✅ | 1 | 5 | +4 | 低 |
| 5 | メンテモード | 🟡 | 1 | 5 | +4 | **中** (env 化) |
| 8 | セキュリティヘッダー | 🟡 | 1 | 5 | +4 | **中** (enforcing 切替) |
| 9 | Set-Cookie 複数値 | ✅ | 1 | 5 | +4 | 低 |
| 16 | SUPPORT_TEMPLATES | ❌ | 1 | 5 | +4 | **中** (新規作成) |
| 1 | Google OAuth 2.0 | ✅ | 2 | 5 | +3 | 低 |
| 3 | コンタクトフォーム | 🟡 | 2 | 5 | +3 | **中** (Zod) |
| 13 | localStorage オーナー追跡 | ❌ | 1 | 4 | +3 | **高** (新規作成) |
| 14 | OGP 画像生成 | ❌ | 2 | 5 | +3 | 低 (skill 代替) |
| 2 | Stripe サブスク | 🟡 | 3 | 5 | +2 | 低 (買い切りで十分) |
| 6 | 有料メール永続化 | ✅ | 2 | 4 | +2 | 低 |
| 10 | charge.refunded | ✅ | 2 | 4 | +2 | 低 |
| 12 | Single Source of Truth | ✅ | 4 | 4 | 0 | 低 |
| 15 | TTS 大量生成 | ❌ | 3 | 2 | −1 | 低 |
| 7 | 無料プレビュー | 🟡 | 4 | 3 | −1 | 低 |
| 11 | optionOrder シャッフル | 🟡 | 3 | 2 | −1 | **中** (QuizRunner 統一) |

## 結論

本テンプレは生成AIパス研究室の 16 パターンを**コア部分(認証・決済・セキュリティ・コンタクト) でほぼ網羅** しており、テンプレートとしては十分実用的。

ただし以下の **3 件は早めに補完推奨**:

1. **#13 useProgressOwnership** (新規実装、半日) — メアド変更検知。実害が出やすい
2. **#5 メンテモード env 化** (15 分) — セキュリティルール準拠
3. **#16 SUPPORT_TEMPLATES.md** (30 分) — 公開後の運用効率化

**TTS / OGP 生成 / Stripe サブスク**は利用側のサービス内容次第で生成AI版から個別移植する想定で OK。

---

## 改訂履歴

| 日付 | 内容 |
|---|---|
| 2026-05-27 | 初版作成 (commit `9d1ea0f` 時点の監査) |
