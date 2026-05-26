import type { MetadataRoute } from "next";
import { categories, exams, glossary } from "@/lib/content";

// Static Export 用
export const dynamic = "force-static";

const BASE = "https://example.com"; // 公開時に正式ドメインに置換

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = [
    "/",
    "/quiz/",
    "/exam/",
    "/glossary/",
    "/listen/",
    "/mypage/",
    "/pricing/",
    "/legal/tokushoho/",
    "/legal/privacy/",
    "/legal/terms/",
    "/contact/",
  ].map((p) => ({ url: `${BASE}${p}`, lastModified: now }));

  const quizPages = categories.map((c) => ({
    url: `${BASE}/quiz/${c.id}/`,
    lastModified: now,
  }));

  const examPages = exams.map((e) => ({
    url: `${BASE}/exam/${e.id}/`,
    lastModified: now,
  }));

  const termPages = glossary.map((t) => ({
    url: `${BASE}/glossary/${t.id}/`,
    lastModified: now,
  }));

  return [...staticPages, ...quizPages, ...examPages, ...termPages];
}
