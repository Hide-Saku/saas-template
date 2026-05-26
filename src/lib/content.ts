/**
 * content.ts — 問題データのアプリ用ローダー
 * src/data/*.json を型付きで読み込む。
 */

import questionsJson from "@/data/questions.json";
import examsJson from "@/data/exams.json";
import glossaryJson from "@/data/glossary.json";
import categoriesJson from "@/data/categories.json";

export type DomainId =
  | "foundation"
  | "datascience"
  | "dataengineering"
  | "value-creation"
  | "literacy";

export interface Question {
  id: string;
  domainId: DomainId;
  categoryId: string;
  subcategoryId: string;
  syllabusRef: string;
  chapter: number | null;
  level: 1 | 2 | 3;
  free: boolean;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tags: string[];
}

export interface ExamQuestion {
  id: string;
  order: number;
  domainId: DomainId;
  syllabusRef: string;
  level: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  tags: string[];
}

export interface Exam {
  id: string;
  title: string;
  free: boolean;
  timeLimit: number;
  description: string;
  questions: ExamQuestion[];
}

export interface GlossaryTerm {
  id: string;
  term: string;
  reading: string;
  domainIds: DomainId[];
  categoryId: string;
  description: string;
  relatedTermIds: string[];
  tags: string[];
}

export interface Category {
  id: DomainId;
  label: string;
  total: number;
  free: number;
  paid: number;
}

export const questions = questionsJson as Question[];
export const exams = examsJson as Exam[];
export const glossary = glossaryJson as GlossaryTerm[];
export const categories = categoriesJson as Category[];

/** ドメイン表示名 */
export const DOMAIN_LABEL: Record<DomainId, string> = {
  foundation: "基盤",
  datascience: "データサイエンス力",
  dataengineering: "データエンジニアリング力",
  "value-creation": "価値創造力",
  literacy: "データリテラシー",
};

export const getQuestionsByDomain = (d: DomainId) =>
  questions.filter((q) => q.domainId === d);

export const getFreeQuestions = () => questions.filter((q) => q.free);

export const getExam = (id: string) => exams.find((e) => e.id === id);

export const getGlossaryTerm = (id: string) => glossary.find((t) => t.id === id);

/** コンテンツ統計（トップページ等で使用） */
export const stats = {
  totalQuestions: questions.length,
  freeQuestions: questions.filter((q) => q.free).length,
  paidQuestions: questions.filter((q) => !q.free).length,
  examCount: exams.length,
  glossaryCount: glossary.length,
};
