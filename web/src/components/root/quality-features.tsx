"use client";

import {
  Truck,
  ThumbsUp,
  PackageCheck,
  Headphones,
  Sparkles,
  ShieldCheck,
  Heart,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Truck,
    title: "Fast Delivery",
    tagline: "24-48 Hours Nationwide",
    description:
      "Rapid dispatch and dependable courier delivery straight to your doorstep across all 64 districts in Bangladesh.",
    color: "text-[#56C8D8]",
    bg: "bg-[#56C8D8]/10",
    border: "border-[#56C8D8]/30",
  },
  {
    icon: ShieldCheck,
    title: "Best Quality",
    tagline: "100% Genuine & Vet-Tested",
    description:
      "Every product is certified non-toxic, dermatologically safe, and scientifically crafted for your pet's vitality.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    icon: PackageCheck,
    title: "Easy Returns",
    tagline: "7-Day Satisfaction Guarantee",
    description:
      "Hassle-free 7-day exchange or refund if you or your cat aren't completely delighted with your purchase.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    icon: Headphones,
    title: "24/7 Pet Support",
    tagline: "Expert Advice on WhatsApp",
    description:
      "Dedicated pet-care advisors ready around the clock to guide you on sizes, nutrition formulas, and grooming tips.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
];

export function QualityFeatures() {
  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F4FAFE] to-[#F0F8FF] relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto space-y-12 sm:space-y-16 relative z-10">
        {/* Title & Subtitle */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            The Meawland Promise
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            We Provide High Quality{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Goods
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            We ensure top veterinary quality, lightning-fast delivery, and
            hassle-free care for your beloved pet&apos;s ultimate satisfaction.
          </p>
        </div>

        {/* 4 Feature Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex flex-col justify-between items-center text-center p-6 sm:p-7 bg-[#F0F8FF]/80 hover:bg-white border border-[#D4EEFC] rounded-3xl md:rounded-[2.5rem] shadow-xs hover:shadow-xl transition-all duration-300 group cursor-default hover:border-[#56C8D8]/60 space-y-4"
              >
                {/* Icon Circle */}
                <div
                  className={cn(
                    "p-4 sm:p-5 rounded-3xl transition-transform duration-300 group-hover:scale-110 shadow-xs border",
                    feature.bg,
                    feature.color,
                    feature.border,
                  )}
                >
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.75]" />
                </div>

                {/* Content */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 group-hover:text-[#56C8D8] transition-colors">
                    {feature.title}
                  </h3>
                  <span className="text-xs font-bold text-[#56C8D8] block">
                    {feature.tagline}
                  </span>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed pt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
