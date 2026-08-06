import { Header } from "@/components/root/header";
import { Footer } from "@/components/root/footer";
import { MobileBottomNav } from "@/components/root/mobile-bottom-nav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <Header />

      <main className="flex-1 w-full overflow-hidden">{children}</main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
