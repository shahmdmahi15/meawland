"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Sparkles,
  Flame,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoreComboProduct } from "@/actions/store/combo-products/get-all";

interface ComboDealsProps {
  combos?: StoreComboProduct[];
}

export function ComboDeals({ combos = [] }: ComboDealsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Mobile Embla Carousel (2 in a row on phones)
  const [emblaMobileRef, emblaMobileApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    loop: true,
    containScroll: "trimSnaps",
  });

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? combos.length - 1 : prev - 1));
  }, [combos.length]);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev === combos.length - 1 ? 0 : prev + 1));
  }, [combos.length]);

  // Autoplay functionality for 3D Desktop and Mobile
  useEffect(() => {
    if (!isAutoPlaying || combos.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
      if (emblaMobileApi) emblaMobileApi.scrollNext();
    }, 3800);
    return () => clearInterval(interval);
  }, [isAutoPlaying, combos.length, nextSlide, emblaMobileApi]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  // If there are no combo products, do not show the section
  if (!combos || combos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F0F8FF]/50 to-white overflow-hidden relative">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto relative z-10">
        {/* Title & Subtitle */}
        <div className="text-center mb-10 sm:mb-16 space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-500/10 text-orange-600 text-xs font-black uppercase tracking-wider shadow-2xs">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            Curated Savings Bundles
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Combo{" "}
            <span
              className="text-[#56C8D8] font-[family-name:var(--font-chewy)] tracking-wider inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Deals
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            Get more and save big with hand-picked bundles of our best-selling
            care, grooming & treats.
          </p>
        </div>

        {/* Mobile View (< sm): 2 Products in a Row Carousel */}
        <div
          className="block sm:hidden relative px-1"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="overflow-hidden px-1" ref={emblaMobileRef}>
            <div className="flex -ml-2.5 py-3">
              {combos.map((combo) => (
                <div
                  key={`mobile-${combo.id}`}
                  className="flex-none pl-2.5 basis-1/2 min-w-0"
                >
                  <MobileComboProductCard combo={combo} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tablet & Desktop View (>= sm): 3D Coverflow Showcase */}
        <div
          className="hidden sm:flex relative max-w-5xl mx-auto items-center justify-center min-h-[540px] sm:min-h-[580px] perspective-[1200px]"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Left Navigation Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 z-30 h-12 w-12 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#56C8D8] hover:text-white border-gray-200 text-gray-800 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
            aria-label="Previous combo"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* 3D Stacked Tile Cards */}
          <div className="relative w-full h-[520px] sm:h-[560px] flex items-center justify-center [transform-style:preserve-3d]">
            {combos.map((combo, idx) => {
              const count = combos.length;
              let offset = (idx - activeIndex + count) % count;
              if (offset > count / 2) {
                offset -= count;
              }

              const isCenter = offset === 0;
              const isPrev = offset === -1;
              const isNext = offset === 1;
              const isFarLeft = offset === -2;
              const isFarRight = offset === 2;

              if (
                !isCenter &&
                !isPrev &&
                !isNext &&
                !isFarLeft &&
                !isFarRight
              ) {
                return null;
              }

              let transformStyles = "";
              let zIndex = 10;
              let opacity = 1;

              if (isCenter) {
                transformStyles = "translate3d(0, 0, 0) scale(1) rotateY(0deg)";
                zIndex = 30;
                opacity = 1;
              } else if (isPrev) {
                transformStyles =
                  "translate3d(-240px, 0, -120px) scale(0.88) rotateY(16deg)";
                zIndex = 20;
                opacity = 0.75;
              } else if (isNext) {
                transformStyles =
                  "translate3d(240px, 0, -120px) scale(0.88) rotateY(-16deg)";
                zIndex = 20;
                opacity = 0.75;
              } else if (isFarLeft) {
                transformStyles =
                  "translate3d(-420px, 0, -240px) scale(0.75) rotateY(24deg)";
                zIndex = 10;
                opacity = 0.35;
              } else if (isFarRight) {
                transformStyles =
                  "translate3d(420px, 0, -240px) scale(0.75) rotateY(-24deg)";
                zIndex = 10;
                opacity = 0.35;
              }

              return (
                <div
                  key={combo.id}
                  onClick={() => !isCenter && setActiveIndex(idx)}
                  style={{
                    transform: transformStyles,
                    zIndex,
                    opacity,
                  }}
                  className={cn(
                    "absolute transition-all duration-600 ease-out border rounded-[2.2rem] p-5 sm:p-6 bg-white shadow-2xl flex flex-col justify-between items-center text-center select-none",
                    isCenter
                      ? "w-[320px] sm:w-[380px] md:w-[420px] border-[#D4EEFC] ring-4 ring-[#56C8D8]/20 shadow-[#56C8D8]/15 cursor-default"
                      : "w-[290px] sm:w-[340px] border-gray-200 cursor-pointer hover:opacity-90 flex",
                  )}
                >
                  <ComboProductTileCard combo={combo} isCenter={isCenter} />
                </div>
              );
            })}
          </div>

          {/* Right Navigation Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 z-30 h-12 w-12 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#56C8D8] hover:text-white border-gray-200 text-gray-800 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
            aria-label="Next combo"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Pagination Indicator Dots */}
        {combos.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {combos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  if (emblaMobileApi) emblaMobileApi.scrollTo(idx);
                }}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                  idx === activeIndex
                    ? "w-8 bg-[#56C8D8]"
                    : "w-2.5 bg-gray-200 hover:bg-gray-300",
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// 3D Tile Card for Desktop / Tablet
function ComboProductTileCard({
  combo,
}: {
  combo: StoreComboProduct;
  isCenter?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const comboSlug = combo.slug || combo.id;

  return (
    <Link
      href={`/product/${comboSlug}`}
      className="block w-full h-full group select-none text-left cursor-pointer"
    >
      <div className="w-full h-full flex flex-col justify-between">
        {/* Top Header Tags */}
        <div className="w-full flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-[#56C8D8] hover:bg-[#56C8D8] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
              COMBO DEAL
            </Badge>

            {combo.campaignBadge && (
              <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs gap-1">
                <Sparkles className="h-3 w-3" />
                {combo.campaignBadge.badgeText}
              </Badge>
            )}

            {combo.discountPercent &&
              combo.discountPercent > 0 &&
              !combo.campaignBadge && (
                <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs gap-0.5">
                  <Flame className="h-3 w-3" />
                  {combo.discountPercent}% OFF
                </Badge>
              )}
          </div>
        </div>

        {/* Combo Product Image */}
        <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-radial from-[#F0F8FF] to-white border border-gray-100 mb-3.5 flex items-center justify-center shadow-inner group">
          {!imageError && combo.image ? (
            <Image
              src={combo.image}
              alt={combo.name}
              fill
              sizes="400px"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={combo.image.startsWith("data:")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 p-4">
              <Package className="w-12 h-12 stroke-1 mb-1 text-[#56C8D8]" />
              <span className="text-xs font-bold text-gray-400">
                Meawland Combo
              </span>
            </div>
          )}

          {/* Included Items Count Tag */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 shadow-xs">
              <Layers className="h-3 w-3 text-[#56C8D8]" />
              {combo.itemsCount} Bundled Items
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1 mb-3 text-center">
          <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 line-clamp-1 group-hover:text-[#56C8D8] transition-colors">
            {combo.name}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
            {combo.description || "Premium bundled value deal for your pets."}
          </p>
        </div>

        {/* Pricing Breakdown & Savings */}
        <div className="bg-[#F0F8FF]/80 rounded-xl p-2 sm:p-2.5 border border-[#D4EEFC]/60 mb-3.5 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">
              Bundle Price
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl text-[#56C8D8] font-black">
                {combo.price}
              </span>
              {combo.originalPrice && (
                <span className="text-xs text-gray-400 font-bold line-through">
                  {combo.originalPrice}
                </span>
              )}
            </div>
          </div>

          {combo.savingsAmount && combo.savingsAmount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[10px] sm:text-[11px] font-black px-2 py-1 border border-emerald-500/20">
              <Sparkles className="h-3 w-3" />
              Save ৳{combo.savingsAmount}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <div className="w-full">
          <div className="w-full bg-[#56C8D8] group-hover:bg-[#38bdf8] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl py-3 shadow-md text-center border-0 transition-all group-hover:shadow-lg">
            VIEW COMBO DEAL
          </div>
        </div>
      </div>
    </Link>
  );
}

// Mobile 2-in-a-Row Card Component
function MobileComboProductCard({ combo }: { combo: StoreComboProduct }) {
  const [imageError, setImageError] = useState(false);
  const comboSlug = combo.slug || combo.id;

  return (
    <Link
      href={`/product/${comboSlug}`}
      className="block h-full group select-none"
    >
      <div className="w-full h-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl p-2.5 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-md transition-all cursor-pointer">
        {/* Image Frame */}
        <div className="relative w-full aspect-square rounded-xl bg-white p-2 border border-gray-100 flex items-center justify-center mb-2 overflow-hidden">
          {!imageError && combo.image ? (
            <Image
              src={combo.image}
              alt={combo.name}
              fill
              sizes="50vw"
              className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              unoptimized={combo.image.startsWith("data:")}
            />
          ) : (
            <Package className="w-8 h-8 text-gray-300 stroke-1" />
          )}

          {combo.campaignBadge ? (
            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[8px] px-1.5 py-0.2 uppercase shadow-xs">
              <Sparkles className="h-2 w-2" />
              {combo.campaignBadge.badgeText}
            </span>
          ) : combo.discountPercent && combo.discountPercent > 0 ? (
            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.2 uppercase">
              <Flame className="h-2.5 w-2.5" />
              {combo.discountPercent}%
            </span>
          ) : null}
        </div>

        {/* Combo Title */}
        <h3 className="text-xs font-black text-gray-900 line-clamp-2 min-h-8 mb-1 leading-snug">
          {combo.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {combo.originalPrice && (
            <span className="text-[10px] text-gray-400 font-bold line-through">
              {combo.originalPrice}
            </span>
          )}
          <span className="text-xs font-black text-[#56C8D8]">
            {combo.price}
          </span>
        </div>

        {/* CTA */}
        <div className="w-full mt-auto">
          <div className="w-full bg-[#56C8D8] text-white font-black text-[10px] tracking-wider uppercase rounded-xl py-1.5 px-2 text-center shadow-2xs">
            VIEW DEAL
          </div>
        </div>
      </div>
    </Link>
  );
}
