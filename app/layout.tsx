import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import LocalStorageDisclosure from "@/components/home/LocalStorageDisclosure";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

// TODO: テンプレ利用側でドメイン・サイト名・説明文・OGP 文言を置換
export const metadata: Metadata = {
  metadataBase: new URL("https://{{DOMAIN}}"),
  title: "{{SITE_NAME}} — {{SITE_TAGLINE}}",
  description:
    "{{SITE_DESCRIPTION}}",
  robots: { index: true, follow: true },
  openGraph: {
    title: "{{SITE_NAME}} — {{SITE_TAGLINE}}",
    description: "{{OG_DESCRIPTION}}",
    type: "website",
    locale: "ja_JP",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "{{SITE_NAME}}",
    description: "{{OG_DESCRIPTION_SHORT}}",
    images: ["/og-image.png"],
  },
};

// ダークモード FOUC 対策（REUSABLE_STACK #4）
const themeScript = `(function(){try{var s=localStorage.getItem('ds-cert:theme');
if(s==='dark'||(s==null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){
document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <LocalStorageDisclosure />
        {children}
      </body>
    </html>
  );
}
