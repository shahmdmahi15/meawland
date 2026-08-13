"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComboItem {
  id: string;
  name: string;
  description: string;
  originalPrice?: string;
  price: string;
  image: string;
}

const comboList: ComboItem[] = [
  {
    id: "combo-1",
    name: "Meawland Complete Skin & Coat Solution",
    description:
      "Get ultimate 360-degree skin and coat care bundle for your cat.",
    originalPrice: "৳1500",
    price: "৳1450",
    image: "/combo-skin-coat-solution.png",
  },
  {
    id: "combo-2",
    name: "Meawland Premium Healthy Snacks Combo",
    description:
      "Ultimate premium cat treat bundle with nutritious sticks & cakes.",
    originalPrice: "৳1199",
    price: "৳1149",
    image: "/combo-healthy-snacks.png",
  },
  {
    id: "combo-3",
    name: "Meawland Essential Grooming & Hygiene Combo",
    description: "Anti-fungal shower gel, flea free spray & ear cleaner set.",
    originalPrice: "৳1600",
    price: "৳1500",
    image: "/combo-grooming-hygiene.png",
  },
  {
    id: "combo-4",
    name: "Meawland Essential Grooming & Hygiene Combo",
    description: "Anti-fungal shower gel, flea free spray & ear cleaner set.",
    originalPrice: "৳1600",
    price: "৳1500",
    image: "/combo-grooming-hygiene.png",
  },
  {
    id: "combo-5",
    name: "Meawland Essential Grooming & Hygiene Combo",
    description: "Anti-fungal shower gel, flea free spray & ear cleaner set.",
    originalPrice: "৳1600",
    price: "৳1500",
    image: "/combo-grooming-hygiene.png",
  },
  {
    id: "combo-6",
    name: "Meawland Essential Grooming & Hygiene Combo",
    description: "Anti-fungal shower gel, flea free spray & ear cleaner set.",
    originalPrice: "৳1600",
    price: "৳1500",
    image: "/combo-grooming-hygiene.png",
  },
];

export function ComboDeals() {
  const [activeIndex, setActiveIndex] = useState(0);

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? comboList.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev === comboList.length - 1 ? 0 : prev + 1));
  };

  const activeCombo = comboList[activeIndex];

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="container max-w-360 px-4 sm:px-6 md:px-8 mx-auto">
        {/* Title & Subtitle */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight">
            Combo <span className="text-[#56C8D8]">Deals</span>
          </h2>
          <p className="text-[#F97316] font-black text-sm sm:text-base md:text-lg uppercase tracking-widest">
            BEST VALUE BUNDLES FOR YOUR FURRY FRIENDS
          </p>
        </div>

        {/* 3D Stacked Coverflow Showcase */}
        <div className="relative max-w-5xl mx-auto flex items-center justify-center min-h-135">
          {/* Left Navigation Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 z-30 h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer"
            aria-label="Previous combo"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>

          {/* Stacked Cards Container */}
          <div className="relative w-full flex items-center justify-center">
            {comboList.map((combo, idx) => {
              const isCenter = idx === activeIndex;
              const isLeft =
                idx === (activeIndex - 1 + comboList.length) % comboList.length;
              const isRight = idx === (activeIndex + 1) % comboList.length;

              if (!isCenter && !isLeft && !isRight) return null;

              return (
                <div
                  key={combo.id}
                  className={`transition-all duration-500 ease-in-out border rounded-[2rem] p-6 bg-white shadow-xl flex flex-col justify-between items-center text-center ${
                    isCenter
                      ? "z-20 scale-100 opacity-100 w-84 sm:w-100 md:w-110 border-[#D4EEFC] ring-4 ring-[#56C8D8]/20"
                      : "z-10 scale-85 opacity-50 blur-[1px] hidden sm:flex w-72 border-gray-200"
                  } ${
                    isLeft ? "-translate-x-36 md:-translate-x-56" : ""
                  } ${isRight ? "translate-x-36 md:translate-x-56" : ""}`}
                >
                  {/* Top Badge */}
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="bg-[#56C8D8] text-white text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider">
                      COMBO
                    </span>
                    <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Combo Product Image */}
                  <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 mb-5 flex items-center justify-center">
                    <Image
                      src={combo.image}
                      alt={combo.name}
                      fill
                      sizes="440px"
                      className="object-contain p-3"
                    />
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 mb-5">
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 line-clamp-1">
                      {combo.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 font-bold line-clamp-2 leading-relaxed">
                      {combo.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center justify-center gap-3 mb-5">
                    {combo.originalPrice && (
                      <span className="text-sm text-gray-400 font-bold line-through">
                        {combo.originalPrice}
                      </span>
                    )}
                    <span className="text-xl sm:text-2xl text-[#56C8D8] font-black">
                      {combo.price}
                    </span>
                  </div>

                  {/* CTA Button */}
                  <Link href={`/product/${combo.id}`} className="w-full">
                    <Button className="w-full bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl py-3.5 shadow-md cursor-pointer border-0">
                      VIEW COMBO
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right Navigation Arrow */}
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 z-30 h-12 w-12 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer"
            aria-label="Next combo"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Pagination Indicator Dots */}
        <div className="flex justify-center items-center gap-2.5 mt-10">
          {comboList.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-3 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? "w-10 bg-[#56C8D8]"
                  : "w-3 bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
