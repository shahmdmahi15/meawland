import { Header } from "@/components/root/header";
import { Footer } from "@/components/root/footer";
import { MobileBottomNav } from "@/components/root/mobile-bottom-nav";
import { getMeAction } from "@/actions/auth/get-me";
import { getCartAction } from "@/actions/store/cart";
import { CartProvider } from "@/context/cart-context";
import { CartDrawer } from "@/components/root/store/cart-drawer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, initialCart] = await Promise.all([
    getMeAction(),
    getCartAction(),
  ]);

  return (
    <CartProvider initialCart={initialCart}>
      <div className="relative min-h-screen bg-white text-gray-900 font-sans flex flex-col">
        <Header user={user} />

        <main className="flex-1 w-full overflow-hidden">{children}</main>

        <Footer />
        <MobileBottomNav user={user} />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
