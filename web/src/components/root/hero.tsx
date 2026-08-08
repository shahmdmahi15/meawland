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
    text: "Meawland",
    button: "Shop Now",
    url: "/product",
  },
  {
    id: 2,
    src: "/fallback-slider.webp",
    alt: "Meawland Products",
    text: "RoyalMotion",
    button: "Subscribe",
    url: "/product",
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

    return () => {
      emblaApi.off("select", onSelect);
    };
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
    <section className="relative w-full h-[40vh] md:h-[60vh] lg:h-[80vh] xl:h-[90vh] overflow-hidden rounded-b-[2.5rem] md:rounded-b-[4rem] shadow-2xl">
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
      <div className="absolute inset-0 z-10 pointer-events-none bg-linear-to-r from-black/40 via-black/20 to-transparent" />

      {/* Hero Content */}
      <div className="absolute inset-0 z-20 flex items-center justify-start text-left px-6 sm:px-12 md:px-18 lg:px-26">
        <div
          key={slides[selectedIndex].id}
          className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-left-16 duration-700"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-none tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {slides[selectedIndex].text}
          </h1>
          <div>
            <Link href={slides[selectedIndex].url}>
              <Button className="bg-[#B2E2FF]/90 hover:bg-[#56C8D8] text-white font-black text-sm md:text-md lg:text-lg xl:text-xl py-5 md:py-6 lg:py-7 px-7 md:px-8 lg:px-9 xl:px-10 rounded-full transition-all active:scale-95 shadow-2xl border-0 cursor-pointer backdrop-blur-sm">
                {slides[selectedIndex].button}
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
