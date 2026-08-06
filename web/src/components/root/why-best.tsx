"use client";

import Image from "next/image";

export function WhyBest() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container max-w-[1440px] px-4 sm:px-6 md:px-8 mx-auto space-y-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center text-gray-900 tracking-tight">
          Why Our products are best.
        </h2>

        {/* Card 1 */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="relative w-60 sm:w-72 h-60 sm:h-72 shrink-0">
            <Image
              src="/best-product-cat.gif"
              alt="Best product cat animation"
              fill
              unoptimized
              sizes="288px"
              className="object-contain"
            />
          </div>

          <div className="flex-1 w-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2.5rem] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
            <p className="text-base sm:text-lg md:text-xl font-black text-gray-800 leading-relaxed max-w-xl">
              Made with nutritious ingredients and a soft, easy-to-eat texture,
              our Cat Paw Cake is a healthy and fun treat your cat will love.
            </p>

            <div className="relative w-full md:w-56 h-48 sm:h-52 shrink-0 rounded-2xl overflow-hidden shadow-md border border-gray-100">
              <Image
                src="/middle-banner-city.png"
                alt="Product preview"
                fill
                sizes="224px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2.5rem] p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-sm">
          <p className="text-base sm:text-lg md:text-xl font-black text-gray-800 leading-relaxed max-w-2xl">
            Made with nutritious ingredients and a soft, easy-to-eat texture,
            our Cat Paw Cake is a healthy and fun treat your cat will love.
          </p>

          <div className="relative w-full lg:w-96 h-52 sm:h-64 shrink-0 rounded-2xl overflow-hidden shadow-md border border-gray-100">
            <Image
              src="/middle-banner-city.png"
              alt="Feature preview"
              fill
              sizes="384px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
