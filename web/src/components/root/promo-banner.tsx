"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, Truck, Clock } from "lucide-react";

export function PromoBanner() {
  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-white to-[#B2E2FF]/20 overflow-hidden">
      <div className="container max-w-7xl px-4 mx-auto">
        <div className="relative rounded-3xl md:rounded-[2.5rem] bg-gradient-to-r from-[#5b7fff] via-[#56C8D8] to-[#B2E2FF] p-8 md:p-14 text-white overflow-hidden shadow-2xl">
          {/* Subtle Decorative Background Graphic */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-black text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Special Cat Lover Offer
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight drop-shadow-md">
                Give Your Cat The Care & Love They Deserve
              </h2>

              <p className="text-white/90 text-sm sm:text-base md:text-lg font-medium max-w-xl">
                Explore our premium collection of nutritious cat food, cozy
                dresses, fun toys, and hygienic litters carefully selected for
                your pet&quot;s happiness.
              </p>

              {/* Feature Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-2xl p-3">
                  <Truck className="w-5 h-5 text-white shrink-0" />
                  <span className="text-xs font-bold">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-2xl p-3">
                  <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                  <span className="text-xs font-bold">100% Quality</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-2xl p-3">
                  <Clock className="w-5 h-5 text-white shrink-0" />
                  <span className="text-xs font-bold">24/7 Support</span>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/category/pet-food">
                  <Button className="bg-[#F97316] hover:bg-[#ea580c] text-white font-extrabold text-base sm:text-lg py-6 px-8 rounded-full shadow-lg border-0 cursor-pointer active:scale-95 transition-all">
                    Explore All Collections
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Banner Image Column */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-sm h-72 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/30">
                <Image
                  src="/promo-banner-cat.png"
                  alt="Special Meawland Offer Cat"
                  fill
                  sizes="(max-width: 1024px) 100vw, 400px"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
