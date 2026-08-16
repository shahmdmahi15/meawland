"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryList = [
  {
    name: "Pet Accessories",
    slug: "pet-accessories",
    image: "/category/pet-accessories.png",
    countHint: "Collars & Belts",
  },
  {
    name: "Pet Care",
    slug: "pet-care",
    image: "/category/pet-care.png",
    countHint: "Shampoos & Hygiene",
  },
  {
    name: "Pet Food",
    slug: "pet-food",
    image: "/category/pet-food.png",
    countHint: "Nutrition & Treats",
  },
  {
    name: "Pet Medicine",
    slug: "pet-medicine",
    image: "/category/pet-medicine.png",
    countHint: "Wellness & Health",
  },
  {
    name: "Pet Dress",
    slug: "pet-dress",
    image: "/category/pet-dress.png",
    countHint: "Costumes & Gowns",
  },
  {
    name: "Pet Toy",
    slug: "pet-toy",
    image: "/category/pet-toy.png",
    countHint: "Teasers & Balls",
  },
  {
    name: "Pet Litter",
    slug: "pet-litter",
    image: "/category/pet-litter.png",
    countHint: "Sand & Boxes",
  },
];

export function Categories() {
  const [isHovered, setIsHovered] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Autoplay every 3.5s with hover pause
  useEffect(() => {
    if (!emblaApi || isHovered) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3500);
    return () => clearInterval(interval);
  }, [emblaApi, isHovered]);

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F8FBFE] to-[#F0F8FF]/60 relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto relative z-10 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <LayoutGrid className="h-3.5 w-3.5" />
            Explore Catalog
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Shop by{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Categories
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            Browse through specialized essentials curated specifically for
            feline & canine happiness, health, and comfort.
          </p>
        </div>

        {/* Carousel Container */}
        <div
          className="relative max-w-7xl mx-auto px-2 sm:px-6 md:px-10"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Previous Arrow Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="hidden sm:flex absolute -left-2 sm:-left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105 transition-all"
            aria-label="Previous category"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Embla Carousel Viewport */}
          <div className="overflow-hidden px-1" ref={emblaRef}>
            <div className="flex -ml-2.5 sm:-ml-4 md:-ml-5 py-3">
              {categoryList.map((cat) => (
                <div
                  key={cat.slug}
                  className="flex-none pl-2.5 sm:pl-4 md:pl-5 basis-1/3 sm:basis-1/4 md:basis-1/4 lg:basis-1/5 min-w-0"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="flex flex-col items-center p-2.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-[2rem] bg-white border border-[#D4EEFC] shadow-xs hover:shadow-xl hover:border-[#56C8D8]/60 transition-all duration-300 group cursor-pointer text-center h-full justify-between"
                  >
                    <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl bg-[#F0F8FF]/80 p-2 sm:p-3 overflow-hidden transition-transform duration-500 group-hover:scale-106 flex items-center justify-center border border-gray-100/80 mb-2 sm:mb-3">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-contain p-1 sm:p-2"
                      />
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-[11px] sm:text-sm md:text-base font-black text-gray-900 group-hover:text-[#56C8D8] transition-colors leading-tight line-clamp-2">
                        {cat.name}
                      </h3>
                      <span className="text-[9px] sm:text-[11px] font-semibold text-gray-400 block truncate">
                        {cat.countHint}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="hidden sm:flex absolute -right-2 sm:-right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105 transition-all"
            aria-label="Next category"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
