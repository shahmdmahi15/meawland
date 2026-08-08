"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
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
  const directionRef = useRef<1 | -1>(1);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const autoplayId = window.setInterval(() => {
      const lastSnap = emblaApi.scrollSnapList().length - 1;
      const currentSnap = emblaApi.selectedScrollSnap();

      if (currentSnap >= lastSnap) directionRef.current = -1;
      if (currentSnap <= 0) directionRef.current = 1;

      if (directionRef.current === 1) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }
    }, 3500);

    return () => window.clearInterval(autoplayId);
  }, [emblaApi]);

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container max-w-360 px-4 sm:px-6 md:px-8 mx-auto">
        <h2 className="text-3xl sm:text-4xl md:text-5xl text-center text-gray-900 mb-12 md:mb-16">
          Shop By <span className="font-chewy">Categories</span>
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
            <div className="flex gap-4 md:gap-5 py-3">
              {categoryList.map((cat) => (
                <div
                  key={cat.slug}
                  className="shrink-0 basis-[calc((100%-2rem)/3)] md:basis-[calc((100%-3.75rem)/4)] lg:basis-[calc((100%-5rem)/5)] min-w-0"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="flex w-full flex-col items-center gap-3 group"
                  >
                    <div className="relative aspect-square w-full max-w-48 rounded-3xl overflow-hidden transition-all duration-500 group-hover:scale-105 flex items-center justify-center">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 767px) 33vw, (max-width: 1023px) 25vw, 20vw"
                        className="object-contain"
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
