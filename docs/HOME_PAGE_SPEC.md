# ホーム画面統一化仕様書

このドキュメントは3姉妹サイト(DS検定研究室・G検定研究室・生成AIパス研究室)の
ホーム画面を統一構成にするための設計仕様です。

## 1. 状態モデル(2軸4象限)

ユーザー状態は「プラン × 進捗」の2軸で判定する。ログイン状態は
機能上ユーザーに影響しない技術詳細のため、UI判定には使わない。

|              | 進捗なし          | 進捗あり          |
|--------------|------------------|------------------|
| **無料**     | ① 新規訪問者     | ② 試用中(★最重要)|
| **有料**     | ③ 購入後未着手   | ④ 継続学習中     |

判定の擬似コード:

```typescript
const hasProgress = checkLocalStorage();  // 進捗データの有無
const isPaid = checkPaymentStatus();      // 有料会員フラグ

TopSection:     hasProgress ? <Dashboard /> : <Hero />
PricingSection: isPaid ? <PremiumThankYouBadge /> : <PricingCard />
```

## 2. ページ構造(8セクション)

```
【1】Header                          ← 常に同じ
【2】TopSection                      ← 状態依存(Hero or Dashboard)
【3】無料公開ハイライト              ← 進捗なしユーザーのみ
【4】学習に必要な4つの武器           ← ④継続学習中ユーザーは折りたたみ
【5】章カード(シラバス領域)         ← 常に表示
【6】料金プラン or プレミアム帯      ← 無料/有料で出し分け
【7】選ばれる3つの理由               ← ④継続学習中ユーザーは折りたたみ
【8】Footer (4列)                    ← 常に同じ
```

動的に切り替わるのは【2】【3】【4】【6】【7】の5箇所。残り3箇所は固定。

## 3. 共通コンポーネント仕様

### おかえりダッシュ
- 4数値:挑戦済み章 / 平均正答率 / 模試ベスト / 苦手問題数
- 3ボタン:学習続ける(主) / 苦手N問(副) / 模擬試験(副)
- 右上に「最終学習: YYYY-MM-DD」
- 模試未受験は「未受験」灰色表示

### 4つの武器(2x2グリッド)
各カード:アイコン + タイトル + 1行説明 + 数値バッジ

### 章カード
番号バッジ + 章名 + 問題数 + 1〜2行解説

### 料金比較
無料 vs プレミアム の2カラム、買い切り価格を強調

### Footer
4列構造:サービス / サポート / 法的情報 / サイト情報

## 4. ②試用中ユーザーへの訴求方針

このアプリにはアカウント機能上のメリット(他デバイス同期等)がないため、
製品機能の解放軸で訴求する。アカウント関連の文言は使わない。

- ✕ NG:「アカウント登録で他デバイスでも続きから」
- ✕ NG:「ログインして進捗を保護」
- ◯ OK:「すでに○問解答済み。残り○問+模試7回を解放」
- ◯ OK:「苦手問題が貯まってきました。復習機能で克服しましょう」

ダッシュボード付近にソフトなプレミアム導線を配置。

## 5. localStorage透明性の開示(3箇所)

### A. 別アカウントログイン時の通知(既存)
現状の生成AIパス研究室で実装済みのトップバナー通知をDSとGにも展開。
文言:「新しいアカウントでログインしました / 端末に残っていた前回の
学習進捗は、安全のためリセットされました。同じアカウントで別端末から
ログインしても進捗は同期されません(端末ごとに別管理)。」
数秒で自動的に閉じる非モーダル表示。

### B. 購入前の開示(新規)
料金プランカードの「プレミアム」の下、もしくは購入直前モーダルで明示:
「※ 学習進捗はご利用端末のブラウザに保存されます。
端末・ブラウザ間の同期機能はありません。」

### C. 初訪問時の静的注記(新規)
フッターまたはマイページに「学習データはこのブラウザに保存されています」と
小さく明記。アラート感は出さない。

## 6. ヒーローコピー統一テンプレ

3サイト共通で「○○対策を、[差別化]で[ベネフィット]。」テンプレに揃える。

- DS:「DS検定★対策を、音声で耳からもう一段。」
- G:「G検定対策を、音声で耳からもう一段。」(現状維持)
- 生成AI:「生成AIパス対策を、音声で耳からもう一段。」

## 7. ヘッダーナビ統一

3サイト共通の順序・語彙:
「問題演習 / 模試 / 用語集 / 聞き流し / マイページ」
(「問題集」「問題演習」などの語彙混在を避ける)

## 8. その他の統一事項

- α/β版表記:3サイトで揃える(全部つけるか全部外すか)
- ロゴサイズ:ヘッダー内で同じ高さに統一
- 「未受験」灰色表示パターン(G検定の実装をDS/生成AIにも)
- 連続学習日数(🔥 N 日連続)をダッシュ右上に表示
- 「あとN問で完答」モチベUI

## 9. 実装方針

1. DS検定研究室に上記すべてを完全適用(現状の不足が最大)
2. DSの実装をテンプレ化し、共通コンポーネントを
   `/components/home/` に集約
3. G検定研究室と生成AIパス研究室に横展開

## 10. 共通コンポーネント設計

`/components/home/` 配下に以下を配置(3サイトで参照):
- `HomeView.tsx` ― 状態判定とセクション組み立てのルート
- `Hero.tsx` ― 進捗なし用
- `Dashboard.tsx` ― 進捗あり用
- `FreeHighlightBox.tsx`
- `FourWeapons.tsx`
- `ChapterCards.tsx`
- `PricingCard.tsx` / `PremiumThankYouBadge.tsx`
- `ThreeReasons.tsx`
- `Footer.tsx`
- `LocalStorageDisclosure.tsx` ― 別アカウント通知バナー

---

## 11. DS検定研究室 実装記録 (2026-05-24)

### 11.1 確定した曖昧点 (Phase 2 Q&A)

実装時に決めた仕様詳細:

| 項目 | 採用した仕様 |
|---|---|
| 「進捗あり」判定 | 1問解答 OR 模試1回受験 OR 苦手1問 のいずれかで true |
| 「挑戦済み章」 | 1問でも解いた章をカウント (0〜5) |
| 「平均正答率」 | 全章合算 (全回答に対する正解率) |
| 「模試ベスト」 | 受験済み模試の最高 bestRate / 未受験は null → 「未受験」灰色表示 |
| 「最終学習日」 | `lib/activity.ts` の最新キー |
| 折りたたみ実装 | HTML5 `<details>` ネイティブ要素 |
| 音声サンプル | `/audio/ds-cert/q-foundation-0001/q.mp3` を `<audio>` 単体再生 |
| バナー位置 | `app/layout.tsx` 全ページ共通 |
| バナー自動非表示 | 8 秒 |

### 11.2 実装ファイル対応表

| 仕様書セクション | 実装ファイル |
|---|---|
| §1 状態判定 | `hooks/useHomeState.ts` |
| §1 ロジック純関数 | `lib/home-stats.ts` |
| §2【2】TopSection | `components/home/HomeView.tsx` (hasProgress 分岐) |
| §2【3】無料公開ハイライト | `components/home/FreeHighlightBox.tsx` |
| §2【4】4 つの武器 | `components/home/FourWeapons.tsx` |
| §2【5】章カード | `components/home/ChapterCards.tsx` ※ホーム用軽量版 |
| §2【6】料金 / 感謝帯 | `components/home/{PricingCard,PremiumThankYouBadge}.tsx` |
| §2【7】3 つの理由 | `components/home/ThreeReasons.tsx` |
| §3 おかえりダッシュ | `components/home/Dashboard.tsx` (StudyCalendar 内包) |
| §5-A バナー | `components/home/LocalStorageDisclosure.tsx` (layout 組込) |
| §5-B 購入前開示 | `PricingCard.tsx` 末尾注記 |
| §5-C 静的注記 | `components/Footer.tsx` サイト情報列 |
| §7 ナビ統一 | `components/Header.tsx` (問題集→問題演習) |

### 11.3 実装時に判明したこと

- **`<details>` を使った折りたたみ**: Tailwind の `group-open:rotate-90` が `<summary>` の状態に応じて働き、JSの状態管理不要で実装できた
- **SSR/CSR ハイドレーション差**: `useHomeState().loading=true` の間はプレースホルダー (高さだけ確保) を返すことで CLS を防止
- **ホーム用 ChapterCards と /quiz/ の ChapterListClient は別物**: ホームは「ショールーム」(クリックで詳細ページへ)、/quiz/ は「操作センター」(続きから / リセット / 進捗バッジ)。共通化せず別ファイルとした
- **音声サンプル試聴で `useAudioQueue` を使わなかった理由**: 単体音声を1つ再生するだけなので raw `Audio()` で十分軽量

### 11.4 未実装事項 (Phase 4 候補)

仕様書 §8 のうち、今回のスコープ外:

- [ ] **「あと N 問で完答」モチベ UI** (各章カードのバッジ or Dashboard サブテキスト)
- [ ] **チャートビジュアル**: 章別正答率の horizontal bar 表示
- [ ] **音声サンプル試聴の強化**: `useAudioQueue` でマーカー含む完全な「問題→選択肢→解説」体験
- [ ] **「今日の目標問題数」設定**: 5/10/20問の目標 → 進捗バー
- [ ] **進捗のエクスポート / インポート**: 端末乗り換え救済

---

## 12. G・生成AIパス研究室への横展開準備メモ

DS の実装で気づいた、3 サイト統一時の注意点:

### 12.1 サイト固有値の外部化

以下を `config/site.ts` 的なファイルに集約し、各サイトで1ファイル変更で完結する構造にすると保守が楽:

| 値 | DS の例 |
|---|---|
| ブランド名 | "DS検定研究室" |
| キャッチコピー第1行 | "DS検定★対策を、" |
| キャッチコピー第2行 | "音声で耳から" |
| キャッチコピー第3行 | "もう一段。" |
| localStorage プレフィックス | "ds-cert:" |
| 総問題数 / 章数 / 模試回数 / 用語数 | content.ts の stats から派生 |
| 料金 (買い切り or サブスク) | "買い切り ¥1,500" |
| ローンチ記念バッジ表示有無 | true / false |
| 1章=無料音声章 | "foundation" |

### 12.2 localStorage キーの共通化

DS では `ds-cert:` プレフィックス。G は `g-test:`、生成AIパスは `quiz-platform:` (推定)。
`lib/storage-keys.ts` のようなファイルに集約推奨:

```typescript
// 横展開時の理想形
import { STORAGE_PREFIX } from '../config/site';
export const PROGRESS_KEY = (domainId: string) => `${STORAGE_PREFIX}:progress:${domainId}`;
export const WRONG_KEY = `${STORAGE_PREFIX}:wrong`;
// etc.
```

### 12.3 DS固有の差分 (G/生成AIには変更必要)

- **章名・章数**: DS は 5 領域、G は 5 章、生成AI は ? 章。`CHAPTER_LABEL` / `CHAPTER_DESCRIPTION` をサイト別に持つ
- **importance フィールド**: G にあって DS にない。GlossaryList は両対応にする必要あり
- **音声無料判定 `isAudioFree`**: DS は domainId="foundation" のみ、G は audioFree フラグ。サイト別の判定関数
- **subcategory / categoryId**: DS にあって G にない。互換 adapter 必要

### 12.4 共通化の優先度

| 優先度 | 項目 |
|---|---|
| ★★★ | `home-stats.ts` の集計純関数 (localStorage 構造が同じなら即流用可) |
| ★★★ | `useHomeState` フック (auth-client が同じ形なら流用可) |
| ★★ | `Hero.tsx` / `Dashboard.tsx` (コピーをサイト変数化すれば共通化可) |
| ★★ | `FourWeapons.tsx` / `ThreeReasons.tsx` (配列をサイト別 config に) |
| ★ | `PricingCard.tsx` (買い切り vs サブスクで構造が違う場合は別実装) |
| - | `ChapterCards.tsx` (章データ構造の差が大きく、別実装の方が早い) |

### 12.5 横展開実施時のコミット粒度推奨

各サイトへの適用は以下の単位でコミット分割:

1. `feat(home): config/site.ts + storage-keys を分離`
2. `feat(home): lib/home-stats と useHomeState を移植`
3. `feat(home): components/home/* を移植 + サイト固有値で調整`
4. `feat(home): page.tsx を HomeView に置換`
5. `feat(home): Header/Footer/Layout の §7§3§5-A§5-C 統一`

