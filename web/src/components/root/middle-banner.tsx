"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MiddleBanner() {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container max-w-7xl px-4 mx-auto">
        <div className="relative w-full h-56 sm:h-72 md:h-80 rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 group">
          {/* Panoramic Image */}
          <Image
            src="/middle-banner-city.png"
            alt="Meawland Synthwave Sunset Banner"
            fill
            sizes="100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Centered Button Overlay */}
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Link href="/category/pet-food">
              <Button
                variant="default"
                className="bg-[#B2E2FF] hover:bg-[#56C8D8] text-white font-extrabold text-lg sm:text-xl md:text-2xl py-6 sm:py-7 px-8 sm:px-12 rounded-full transition-all active:scale-95 shadow-2xl border-0 cursor-pointer"
              >
                Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
