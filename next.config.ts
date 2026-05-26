import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Workers Static Assets で配信するため静的エクスポート
  output: "export",
  // 末尾スラッシュ統一（REUSABLE_STACK: trailingSlash + fetch URL の整合に注意）
  trailingSlash: true,
  // 静的エクスポートでは next/image の最適化が使えない
  images: { unoptimized: true },
  // ビルド時の型・lint エラーは CI 側で確認する方針（ビルドは止めない）
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
