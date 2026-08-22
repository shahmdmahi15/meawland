"use client";

import Image from "next/image";
import { Star, CheckCircle2, Quote, Sparkles } from "lucide-react";
import type { StoreCustomerReview } from "@/actions/store/reviews/get-all";

export interface ReviewsProps {
  reviews?: StoreCustomerReview[];
}

export function Reviews({ reviews = [] }: ReviewsProps) {
  // If no reviews passed, provide fallback list
  const reviewList = reviews.length > 0 ? reviews : [];

  // Split reviews into two criss-cross rows
  const row1 = reviewList.slice(0, Math.ceil(reviewList.length / 2));
  const row2 = reviewList.slice(Math.ceil(reviewList.length / 2));

  // If one row is short, combine and duplicate so continuous marquee looks seamless
  const marqueeRow1 = [...row1, ...row1, ...row1, ...row1];
  const marqueeRow2 = [...row2, ...row2, ...row2, ...row2];

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F0F8FF]/50 to-white relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            Loved By Pet Parents
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Reviews of{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              MEAWLAND
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            Customer satisfaction through the best quality and healthy pet care
            is our highest priority.
          </p>
        </div>

        {/* Featured Cat GIF Showcase Banner */}
        <div className="max-w-5xl mx-auto bg-linear-to-r from-[#EBF7FF] via-[#F4FAFF] to-[#EBF7FF] border border-[#D4EEFC] rounded-[2.5rem] p-6 sm:p-8 mb-10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-amber-400 text-amber-400"
                />
              ))}
              <span className="ml-2 font-black text-gray-900 text-base">
                4.9 / 5.0 Rating
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">
              Trusted by 1,000+ Happy Cats & Kittens
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-md">
              Real feedback from pet owners across Bangladesh who rely on
              Meawland for genuine treats, grooming, and medicine.
            </p>
          </div>

          {/* Animated Review Cat GIF */}
          <div className="relative w-44 sm:w-56 md:w-64 h-36 sm:h-44 shrink-0 flex items-center justify-center">
            <Image
              src="/review-cat.gif"
              alt="Review Cat Animation"
              fill
              unoptimized
              sizes="280px"
              className="object-contain drop-shadow-md"
            />
          </div>
        </div>

        {/* Criss-Cross Marquee Sliders Container */}
        <div className="relative w-full overflow-hidden py-4 space-y-5">
          {/* Left & Right Gradient Fade Overlays */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-linear-to-r from-white via-white/80 to-transparent z-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-linear-to-l from-white via-white/80 to-transparent z-20" />

          {/* Row 1: Sliding Left (Criss) */}
          <div className="w-full overflow-hidden">
            <div className="animate-marquee gap-5 py-2">
              {marqueeRow1.map((review, idx) => (
                <ReviewCard key={`r1-${review.id}-${idx}`} review={review} />
              ))}
            </div>
          </div>

          {/* Row 2: Sliding Right (Cross) */}
          <div className="w-full overflow-hidden">
            <div className="animate-marquee-reverse gap-5 py-2">
              {marqueeRow2.map((review, idx) => (
                <ReviewCard key={`r2-${review.id}-${idx}`} review={review} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: StoreCustomerReview }) {
  return (
    <div className="w-[300px] sm:w-[380px] md:w-[420px] shrink-0 bg-[#F0F8FF]/80 hover:bg-white border border-[#D4EEFC] rounded-3xl p-4 sm:p-5 shadow-xs hover:shadow-xl transition-all duration-300 group cursor-default flex flex-col justify-between select-none">
      {/* Top Header: Avatar, Name, Verified Badge & Stars */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-2xs shrink-0">
            <Image
              src={review.avatar || "/review-user-avatar-1.png"}
              alt={review.name}
              fill
              sizes="52px"
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-black text-gray-900 leading-none group-hover:text-[#56C8D8] transition-colors">
                {review.name}
              </h4>
              {review.verifiedBuyer && (
                <span title="Verified Buyer" className="inline-flex">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100" />
                </span>
              )}
            </div>

            {review.petType && (
              <span className="text-[11px] font-semibold text-gray-500 block mt-1">
                {review.petType}
              </span>
            )}
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-0.5 text-amber-400 shrink-0">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star
              key={i}
              className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="relative my-2">
        <Quote className="absolute -top-2 -left-1 w-4 h-4 text-[#56C8D8]/20 rotate-180 pointer-events-none" />
        <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed pl-3 line-clamp-3">
          &quot;{review.text}&quot;
        </p>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between pt-2 border-t border-[#D4EEFC]/60 text-[10px] sm:text-[11px] font-semibold text-gray-400">
        <span>{review.location || "Bangladesh"}</span>
        {review.date && <span>{review.date}</span>}
      </div>
    </div>
  );
}
