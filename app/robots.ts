import type { MetadataRoute } from "next";

// Static Export 用
export const dynamic = "force-static";

// 2026-05-24: 公開（DEV_MODE = false）
// AI クローラーのみブロック・通常検索Botは許可
const DEV_MODE = false;

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "CCBot",
  "FacebookBot",
  "Amazonbot",
  "Bytespider",
];

export default function robots(): MetadataRoute.Robots {
  if (DEV_MODE) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      ...AI_CRAWLERS.map((ua) => ({ userAgent: ua, disallow: "/" })),
      { userAgent: "*", allow: "/", disallow: ["/api/", "/account/", "/login/"] },
    ],
    sitemap: "https://ds-kentei-lab.com/sitemap.xml",
  };
}
