/**
 * 領域（章）順序・ラベル・音声無料判定（本テンプレ固有）
 *
 * 本テンプレは 5 領域（=5章）構成。1章「基盤」のみ音声無料。
 */

import type { DomainId, Question } from "./content";

/** 章番号順での DomainId 配列（1章=foundation … 5章=literacy） */
export const DOMAIN_ORDER: DomainId[] = [
  "foundation",
  "datascience",
  "dataengineering",
  "value-creation",
  "literacy",
];

/** DomainId → 章番号（1〜5）。未知なら 0 */
export function chapterNumber(d: DomainId): number {
  const idx = DOMAIN_ORDER.indexOf(d);
  return idx === -1 ? 0 : idx + 1;
}

/** 「1章 基盤」「2章 データサイエンス力」… のラベル */
export const CHAPTER_LABEL: Record<DomainId, string> = {
  foundation: "1章 基盤",
  datascience: "2章 データサイエンス力",
  dataengineering: "3章 データエンジニアリング力",
  "value-creation": "4章 価値創造力",
  literacy: "5章 データリテラシー",
};

/** 章の解説文（一覧カードに表示） */
export const CHAPTER_DESCRIPTION: Record<DomainId, string> = {
  foundation:
    "線形代数・微積分・確率・統計・最適化・情報理論など、データサイエンスを支える数学的基礎。ベクトル/行列、確率分布、推定・検定、勾配・偏微分の基本まで網羅。",
  datascience:
    "機械学習・深層学習のアルゴリズム、教師あり/なし学習、強化学習、評価指標、特徴量設計、モデル選択・改善まで、データから価値を引き出す技術領域。",
  dataengineering:
    "データの収集・加工・蓄積、前処理、SQL/NoSQL、ETL/ELT、分散処理、クラウド・ビッグデータ基盤、データパイプライン構築など、データ基盤を扱う技術領域。",
  "value-creation":
    "ビジネス課題の設定、KPI設計、PoC・効果検証、データドリブン経営、データ活用プロセス、プロジェクトマネジメントなど、データを価値に変える領域。",
  literacy:
    "統計的思考、データ可視化、AI倫理・ガバナンス、個人情報保護、社会実装上の留意点など、データを正しく読み解き・伝える力。",
};

/**
 * この問題の音声を無料プランで再生して良いか。
 * 1章（基盤）のみ無料、それ以外は有料プラン限定。
 * （Worker 側の audioRequiresPaid と整合させる）
 */
export function isAudioFree(q: Question): boolean {
  return q.domainId === "foundation";
}
