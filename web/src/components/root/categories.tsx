"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const categoryList = [
  {
    name: "Pet Accessories",
    slug: "pet-accessories",
    image: "/category/pet-accessories.png",
  },
  {
    name: "Pet Care",
    slug: "pet-care",
    image: "/category/pet-care.png",
  },
  {
    name: "Pet Food",
    slug: "pet-food",
    image: "/category/pet-food.png",
  },
  {
    name: "Pet Medicine",
    slug: "pet-medicine",
    image: "/category/pet-medicine.png",
  },
  {
    name: "Pet Dress",
    slug: "pet-dress",
    image: "/category/pet-dress.png",
  },
  {
    name: "Pet Toy",
    slug: "pet-toy",
    image: "/category/pet-toy.png",
  },
  {
    name: "Pet Litter",
    slug: "pet-litter",
    image: "/category/pet-litter.png",
  },
];

export function Categories() {
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

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container max-w-[1440px] px-4 sm:px-6 md:px-8 mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-center text-gray-900 mb-12 md:mb-16 tracking-tight">
          Shop By Categories
        </h2>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-12 md:px-16">
          {/* Previous Arrow Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            className="absolute -left-2 sm:left-2 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer transition-all"
            aria-label="Previous category"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Embla Carousel Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6 sm:gap-8 md:gap-12 py-3">
              {categoryList.map((cat) => (
                <div
                  key={cat.slug}
                  className="flex-none basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 min-w-0 flex justify-center"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="flex flex-col items-center gap-4 group shrink-0 w-36 sm:w-44 md:w-52"
                  >
                    <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-3xl overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl bg-gray-50 flex items-center justify-center border border-gray-100 p-3">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="200px"
                        className="object-contain p-2"
                      />
                    </div>
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 group-hover:text-[#56C8D8] text-center transition-colors">
                      {cat.name}
                    </h3>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            className="absolute -right-2 sm:right-2 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer transition-all"
            aria-label="Next category"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
