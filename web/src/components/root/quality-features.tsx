"use client";

import { Truck, ThumbsUp, PackageCheck } from "lucide-react";

export function QualityFeatures() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-[1440px] px-4 sm:px-6 md:px-8 mx-auto space-y-16">
        {/* Title & Subtitle */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">
            We Provide High Quality Goods
          </h2>
          <p className="text-[#56C8D8] font-black text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            We ensure top quality, fast delivery, and hassle-free returns for
            your pet's satisfaction.
          </p>
        </div>

        {/* 3 Feature Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="flex flex-col items-center space-y-4 p-6 bg-[#F0F8FF]/50 border border-[#D4EEFC]/60 rounded-[2.5rem]">
            <div className="p-5 rounded-3xl text-[#56C8D8] bg-[#F0F8FF] border border-[#D4EEFC] mb-2 shadow-xs">
              <Truck className="w-12 h-12 stroke-[1.75]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              Fast Delivery
            </h3>
            <p className="text-sm sm:text-base text-gray-600 font-bold leading-relaxed max-w-sm">
              Quick and dependable express shipping straight to your doorstep
              across the nation.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center space-y-4 p-6 bg-[#F0F8FF]/50 border border-[#D4EEFC]/60 rounded-[2.5rem]">
            <div className="p-5 rounded-3xl text-[#56C8D8] bg-[#F0F8FF] border border-[#D4EEFC] mb-2 shadow-xs">
              <ThumbsUp className="w-12 h-12 stroke-[1.75]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              Best Quality
            </h3>
            <p className="text-sm sm:text-base text-gray-600 font-bold leading-relaxed max-w-sm">
              100% genuine & vet-approved healthy products handcrafted for your
              pet&apos;s happiness.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center space-y-4 p-6 bg-[#F0F8FF]/50 border border-[#D4EEFC]/60 rounded-[2.5rem]">
            <div className="p-5 rounded-3xl text-[#56C8D8] bg-[#F0F8FF] border border-[#D4EEFC] mb-2 shadow-xs">
              <PackageCheck className="w-12 h-12 stroke-[1.75]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              Free Return
            </h3>
            <p className="text-sm sm:text-base text-gray-600 font-bold leading-relaxed max-w-sm">
              Hassle-free 7-day return guarantee if you or your cat aren&apos;t
              completely delighted.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
