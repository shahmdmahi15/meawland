import { Metadata } from "next";
import { getWishlistAction } from "@/actions/store/wishlist";
import { WishlistView } from "@/components/root/store/wishlist-view";
import { PawPrint, Heart, Sparkles, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "My Wishlist | Meawland Pet Store",
  description:
    "View and manage your saved pet food, accessories, and grooming essentials.",
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const result = await getWishlistAction();
  const products = result.products || [];

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Category-Style Wishlist Header Banner */}
      <section className="relative w-full pt-24 sm:pt-28 md:pt-34 pb-8 sm:pb-12 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] flex items-center justify-center overflow-hidden rounded-b-[2rem] md:rounded-b-[3.5rem] shadow-xs">
        {/* Decorative Paw Print SVGs */}
        <PawPrint
          className="absolute -right-8 top-4 text-[#B2E2FF] opacity-40 rotate-12 pointer-events-none"
          style={{ width: "180px", height: "180px" }}
        />
        <PawPrint
          className="absolute left-4 bottom-2 text-[#B2E2FF] opacity-20 -rotate-12 pointer-events-none"
          style={{ width: "120px", height: "120px" }}
        />
        <PawPrint
          className="absolute right-1/3 bottom-0 text-[#B2E2FF] opacity-10 pointer-events-none"
          style={{ width: "220px", height: "220px" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-3xl mx-auto">
          {/* Header Title */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
            My Wishlist
          </h1>

          {/* Subtitle / Description */}
          <p className="mt-2 text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-xl">
            Save and organize your favorite pet food, accessories, and grooming
            essentials in one place for quick and easy shopping.
          </p>

          {/* Stats and Perks Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-bold text-gray-800 border border-[#B2E2FF]/60 shadow-2xs">
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
              {products.length}{" "}
              {products.length === 1 ? "Saved Item" : "Saved Items"}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              100% Genuine Pet Essentials
            </span>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-bold text-[#0C1E3C] border border-[#B2E2FF]/60 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#56C8D8]" />
              Safe &amp; Easy Checkout
            </span>
          </div>
        </div>
      </section>

      {/* Wishlist Content */}
      <div className="mt-4 sm:mt-6">
        <WishlistView
          initialProducts={products}
          unauthorized={result.unauthorized || false}
        />
      </div>
    </main>
  );
}
