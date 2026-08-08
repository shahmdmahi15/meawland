import { Header } from "@/components/root/header";
import { Footer } from "@/components/root/footer";
import { MobileBottomNav } from "@/components/root/mobile-bottom-nav";
import { getNavbarAccountAction } from "@/actions/auth/get-navbar-account";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getNavbarAccountAction();
  return (
    <div className="relative min-h-screen bg-white text-gray-900 font-sans flex flex-col">
      <Header user={user} />

      <main className="flex-1 w-full overflow-hidden">{children}</main>

      <Footer />
      <MobileBottomNav user={user} />
    </div>
  );
}
