import Header from "@/components/Header";
import MyPageClient from "@/components/MyPageClient";

export const metadata = { title: "マイページ — {{SITE_NAME}}" };

export default function MyPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-bold">マイページ</h1>
        <p className="mt-2 text-fg-muted">
          学習の進捗と領域別の正答率を確認できます。
        </p>
        <MyPageClient />
      </main>
    </>
  );
}
