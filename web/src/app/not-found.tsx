import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { Home, ShoppingBag, PawPrint, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Meawland Pet Store",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function GlobalNotFound() {
  return (
    <main className="min-h-screen bg-linear-to-b from-white via-[#F0F8FF]/60 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
      {/* Decorative Background Paw Prints */}
      <PawPrint
        className="absolute -right-8 top-12 text-[#B2E2FF] opacity-30 rotate-12 pointer-events-none"
        style={{ width: "200px", height: "200px" }}
      />
      <PawPrint
        className="absolute left-6 bottom-8 text-[#B2E2FF] opacity-20 -rotate-12 pointer-events-none"
        style={{ width: "160px", height: "160px" }}
      />

      <div className="relative z-10 max-w-xl w-full text-center space-y-6">
        {/* Cat 404 Animation */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto">
          <Image
            src="/not-found-cat.gif"
            alt="Page Not Found"
            fill
            priority
            className="object-contain"
            unoptimized
          />
        </div>

        {/* 404 Headline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/15 text-[#56C8D8] text-xs font-black border border-[#56C8D8]/30 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Error 404 • Lost in Cat Grass</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Oops! Page Not Found
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-md mx-auto leading-relaxed">
            The page you are searching for might have been moved, renamed, or is
            taking a cozy cat nap. Let&apos;s get you back to the pet goodies!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button className="h-11 px-6 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-105">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          <Link href="/products">
            <Button
              variant="outline"
              className="h-11 px-6 rounded-full border-[#56C8D8] text-[#56C8D8] hover:bg-[#F0F8FF] font-bold text-xs sm:text-sm shadow-xs gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" />
              Explore Products
            </Button>
          </Link>
        </div>

        {/* Popular Quick Links */}
        <div className="pt-6 border-t border-[#D4EEFC] space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Popular Pet Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/category/pet-food"
              className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#56C8D8] hover:text-[#56C8D8] text-xs font-bold text-gray-700 shadow-2xs transition-all"
            >
              Pet Food
            </Link>
            <Link
              href="/category/pet-care"
              className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#56C8D8] hover:text-[#56C8D8] text-xs font-bold text-gray-700 shadow-2xs transition-all"
            >
              Pet Care
            </Link>
            <Link
              href="/category/pet-accessories"
              className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#56C8D8] hover:text-[#56C8D8] text-xs font-bold text-gray-700 shadow-2xs transition-all"
            >
              Accessories
            </Link>
            <Link
              href="/category/pet-toy"
              className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-[#56C8D8] hover:text-[#56C8D8] text-xs font-bold text-gray-700 shadow-2xs transition-all"
            >
              Toys
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
