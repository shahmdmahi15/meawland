"use client";

import Image from "next/image";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Leaf,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WhyBest() {
  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F4FAFE] to-white relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto space-y-12 sm:space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <Award className="h-3.5 w-3.5" />
            Uncompromising Quality
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Why Our Products are{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Best
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            Crafted with deep love for pets, scientific nutrition, and
            dermatologically safe ingredients for optimal happiness & health.
          </p>
        </div>

        {/* Feature Showcase Grid */}
        <div className="space-y-8 max-w-6xl mx-auto">
          {/* Card 1: Nutrition & Treats */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 bg-linear-to-r from-[#F0F8FF] via-[#F8FBFF] to-[#EBF7FF] border border-[#D4EEFC] rounded-3xl md:rounded-[3rem] p-6 sm:p-10 shadow-xs hover:shadow-lg transition-all">
            {/* Animated Cat GIF */}
            <div className="relative w-52 sm:w-64 md:w-72 h-52 sm:h-64 shrink-0 flex items-center justify-center">
              <Image
                src="/best-product-cat.gif"
                alt="Best product cat animation"
                fill
                unoptimized
                sizes="288px"
                className="object-contain drop-shadow-md"
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black">
                <Leaf className="w-3.5 h-3.5" />
                100% Pure & Nutritious
              </div>

              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-snug">
                Made with Healthy Ingredients & Soft Textures Cats Adore
              </h3>

              <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-xl">
                From our handmade Cat Paw Cakes to organic hairball remedy grass
                sticks and freeze-dried treats, every bite is enriched with
                essential taurine, vitamins, and natural proteins without
                artificial preservatives.
              </p>

              {/* Perks Pills */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2 text-xs font-bold text-gray-700">
                <span className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Zero Artificial Preservatives
                </span>
                <span className="inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Easy Digestibility Formula
                </span>
              </div>
            </div>
          </div>

          {/* Dual Row Cards: Grooming Care & Comfort Wear */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Card 2: Dermatological Care */}
            <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#D4EEFC] text-[#56C8D8] flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900">
                  Dermatologically Safe & Anti-Fungal
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  Formulated with botanical extracts to soothe sensitive skin,
                  eliminate ticks and fleas, and provide a radiant, silky coat
                  without harsh chemicals.
                </p>
              </div>

              <div className="pt-2 border-t border-[#D4EEFC]/60 flex items-center gap-2 text-xs font-bold text-[#56C8D8]">
                <Sparkles className="w-4 h-4" />
                <span>pH-Balanced for Pet Skin</span>
              </div>
            </div>

            {/* Card 3: Handcrafted Pet Comfort */}
            <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#D4EEFC] text-rose-500 flex items-center justify-center shadow-xs">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900">
                  Tailored Comfort & Regal Elegance
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                  Each gown, dress, collar, and harness is crafted with soft,
                  breathable fabrics and break-away safety mechanisms to keep
                  your pets safe and stylish.
                </p>
              </div>

              <div className="pt-2 border-t border-[#D4EEFC]/60 flex items-center gap-2 text-xs font-bold text-rose-500">
                <Sparkles className="w-4 h-4" />
                <span>100% Breathable & Lightweight</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
