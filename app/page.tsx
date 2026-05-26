import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeView from "@/components/home/HomeView";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HomeView />
      </main>
      <Footer />
    </>
  );
}
