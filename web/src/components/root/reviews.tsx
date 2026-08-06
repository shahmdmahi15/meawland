"use client";

import Image from "next/image";
import { Star } from "lucide-react";

interface ReviewItem {
  id: string;
  text: string;
  avatar: string;
  rating: number;
}

const reviewList: ReviewItem[] = [
  {
    id: "r1",
    text: "They sell very good and qualityfull products. I bought a female cat dress and ear cleaner for my cat. I have had a very good experience using them so far. I highly recommend their page.",
    avatar: "/review-user-avatar-1.png",
    rating: 5,
  },
  {
    id: "r2",
    text: "They sell very good and qualityfull products. I bought a female cat dress and ear cleaner for my cat. I have had a very good experience using them so far. I highly recommend their page.",
    avatar: "/review-user-avatar-2.png",
    rating: 5,
  },
];

export function Reviews() {
  return (
    <section className="py-12 md:py-16 bg-white overflow-hidden">
      <div className="container max-w-7xl px-4 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Reviews of <span className="uppercase">MEAWLAND</span>
          </h2>
          <p className="text-[#56C8D8] font-bold text-sm sm:text-base">
            Customer satisfaction through the best quality is our first
            priority.
          </p>
        </div>

        {/* Outer Light-Blue Card Container */}
        <div className="max-w-6xl mx-auto bg-[#EBF7FF] border border-[#D4EEFC] rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Review Cards Stack */}
            <div className="lg:col-span-7 space-y-4">
              {reviewList.map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex gap-4 items-center"
                >
                  <div className="relative w-16 sm:w-20 h-16 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                    <Image
                      src={review.avatar}
                      alt="Customer review avatar"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-col justify-between space-y-2 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 leading-relaxed">
                      &quot;{review.text}&quot;
                    </p>
                    <div className="flex gap-1 text-[#FFB84D]">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5 fill-[#FFB84D] text-[#FFB84D]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Animated Review GIF */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-sm h-64 sm:h-72 md:h-80">
                <Image
                  src="/review-cat.gif"
                  alt="Review Cat Animation"
                  fill
                  unoptimized
                  sizes="400px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
