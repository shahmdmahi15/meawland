"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function MiddleBanner() {
  return (
    <section className="py-12 md:py-18 bg-white overflow-hidden">
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto">
        <div className="relative w-full min-h-[360px] sm:min-h-[420px] md:min-h-[460px] rounded-3xl md:rounded-[3rem] overflow-hidden shadow-xl border border-[#D4EEFC] group flex items-center">
          {/* Panoramic Background Image with subtle zoom */}
          <Image
            src="/fallback-slider.webp"
            alt="Meawland Synthwave Sunset Banner"
            fill
            priority
            sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Gradient Overlay for high-contrast legibility */}
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-transparent z-10" />

          {/* Content Box */}
          <div className="relative z-20 max-w-2xl px-6 sm:px-10 md:px-14 py-10 space-y-4 sm:space-y-6 text-white">
            {/* Promo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>Special Seasonal Offers</span>
            </div>

            {/* Headline with Chewy Font */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-md">
              Give Your Pets the Care They{" "}
              <span
                className="text-[#56C8D8] font-[family-name:var(--font-chewy)] tracking-wider inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ fontFamily: "var(--font-chewy), cursive" }}
              >
                Deserve
              </span>
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-gray-200 font-medium max-w-lg leading-relaxed drop-shadow-xs">
              Discover authentic nutrition, anti-fungal grooming care, regal
              dresses, and engaging toys with fast home delivery anywhere in
              Bangladesh.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-full px-6 sm:px-8 py-5 sm:py-6 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border-0 cursor-pointer flex items-center gap-2"
                >
                  <span>Shop Collections</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-white/20 flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] sm:text-xs font-bold text-gray-200">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#56C8D8]" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Genuine Products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                <span>Dedicated Care Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
