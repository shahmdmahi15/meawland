"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

// Slides – replace with DB-fetched slides when the Slider model is ready
const slides = [
  {
    id: 1,
    src: "/fallback-slider.webp",
    alt: "Meawland Products",
  },
];

export function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="relative w-full h-[90vh] min-h-[540px] overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-2xl">
      {/* Embla Carousel */}
      <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative flex-none w-full h-full min-w-0"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlay – stronger on the left like the original */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex items-center justify-start text-left px-8 sm:px-14 md:px-20 lg:px-28">
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-left-16 duration-700">
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] xl:text-[110px] font-black text-white leading-none tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            Meawland
          </h1>
          <div>
            <Link href="/category/pet-food">
              <Button className="bg-[#B2E2FF]/90 hover:bg-[#56C8D8] text-white font-black text-xl sm:text-2xl md:text-[1.6rem] py-6 sm:py-7 md:py-8 px-10 sm:px-14 md:px-16 rounded-full transition-all active:scale-95 shadow-2xl border-0 cursor-pointer backdrop-blur-sm">
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicator Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => emblaApi?.scrollTo(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === selectedIndex
                  ? "w-8 h-2.5 bg-white"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
