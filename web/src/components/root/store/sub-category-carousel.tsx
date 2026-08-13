"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreSubCategory } from "@/actions/store/sub-categories/get-by-category";

const BLOB_COLORS = [
  "#FFB067",
  "#7CDBCB",
  "#D9F166",
  "#FFC0BB",
  "#98D2EB",
  "#F4A261",
];

interface SubCategoryCarouselProps {
  categorySlug: string;
  subCategories: StoreSubCategory[];
}

export function SubCategoryCarousel({
  categorySlug,
  subCategories,
}: SubCategoryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (subCategories.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-8 bg-white border-b border-gray-100">
      <div className="container max-w-7xl px-4 mx-auto">
        <div className="relative px-2 sm:px-6 md:px-12">
          {/* Previous Arrow Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="hidden sm:flex absolute -left-2 sm:-left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 h-9 w-9 border-0 bg-white/80 hover:bg-white text-gray-900 shadow-md backdrop-blur-md rounded-full cursor-pointer transition-all"
            aria-label="Previous sub-category"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 md:gap-6 py-2">
              {subCategories.map((subCat, index) => {
                const blobColor = BLOB_COLORS[index % BLOB_COLORS.length];
                return (
                  <div
                    key={subCat.id}
                    className="flex-none basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-1/6 xl:basis-1/7 min-w-0"
                  >
                    <Link
                      href={`/category/${categorySlug}/${subCat.slug}`}
                      className="flex flex-col items-center gap-2 md:gap-3 group cursor-pointer"
                    >
                      {/* Organic Blob Frame */}
                      <div className="relative w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                        <div
                          className="absolute inset-0 transition-all duration-500 opacity-25 group-hover:opacity-40"
                          style={{
                            backgroundColor: blobColor,
                            borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
                          }}
                        />
                        <div className="relative w-14 sm:w-16 md:w-20 h-14 sm:h-16 md:h-20 overflow-hidden rounded-full border-2 border-white shadow-sm md:shadow-md transition-all duration-300 group-hover:border-[#56C8D8]/50 group-hover:shadow-lg">
                          <Image
                            src={subCat.image}
                            alt={subCat.name}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            unoptimized={subCat.image.startsWith("data:")}
                          />
                        </div>
                      </div>

                      {/* Title & Product Count */}
                      <div className="text-center w-full px-0.5">
                        <p className="text-[11px] sm:text-xs md:text-sm font-black text-gray-900 group-hover:text-[#56C8D8] transition-colors leading-tight line-clamp-2">
                          {subCat.name}
                        </p>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-semibold mt-0.5 line-clamp-1">
                          {subCat.productCount} Items
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Arrow Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="hidden sm:flex absolute -right-2 sm:-right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 h-9 w-9 border-0 bg-white/80 hover:bg-white text-gray-900 shadow-md backdrop-blur-md rounded-full cursor-pointer transition-all"
            aria-label="Next sub-category"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
