"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Sparkles,
  Flame,
  Layers,
  ShoppingBag,
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
  const [isMobile, setIsMobile] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Check screen width for responsive 3D offset calculation
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? combos.length - 1 : prev - 1));
  }, [combos.length]);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev === combos.length - 1 ? 0 : prev + 1));
  }, [combos.length]);

  // Autoplay functionality
  useEffect(() => {
    if (!isAutoPlaying || combos.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, combos.length, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  // Touch Swipe Handlers for Mobile 3D Rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsAutoPlaying(false);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsAutoPlaying(true);
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // If there are no combo products, do not show the section
  if (!combos || combos.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-linear-to-b from-white via-[#F0F8FF]/60 to-white overflow-hidden relative select-none">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#56C8D8]/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-orange-400/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container max-w-7xl px-3 sm:px-6 md:px-8 mx-auto relative z-10">
        {/* Title & Subtitle */}
        <div className="text-center mb-6 sm:mb-12 space-y-2 sm:space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
            <Flame className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            Curated Savings Bundles
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Combo{" "}
            <span
              className="text-[#56C8D8] font-[family-name:var(--font-chewy)] tracking-wider inline-block text-3xl sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Deals
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base px-2">
            Get more and save big with hand-picked bundles of our best-selling
            care, grooming &amp; treats.
          </p>
        </div>

        {/* Unified 3D Coverflow Showcase for Both Mobile & Desktop */}
        <div
          className="relative max-w-5xl mx-auto flex items-center justify-center min-h-[480px] sm:min-h-[560px] md:min-h-[580px] perspective-[900px] sm:perspective-[1200px]"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Navigation Arrow */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-1 sm:left-4 z-35 size-9 sm:size-12 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#56C8D8] hover:text-white border-gray-200 text-gray-800 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
            aria-label="Previous combo"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* 3D Stacked Tile Cards */}
          <div className="relative w-full h-[470px] sm:h-[540px] md:h-[560px] flex items-center justify-center [transform-style:preserve-3d]">
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
                transformStyles = isMobile
                  ? "translate3d(-135px, 0, -80px) scale(0.84) rotateY(18deg)"
                  : "translate3d(-240px, 0, -120px) scale(0.88) rotateY(16deg)";
                zIndex = 20;
                opacity = isMobile ? 0.65 : 0.75;
              } else if (isNext) {
                transformStyles = isMobile
                  ? "translate3d(135px, 0, -80px) scale(0.84) rotateY(-18deg)"
                  : "translate3d(240px, 0, -120px) scale(0.88) rotateY(-16deg)";
                zIndex = 20;
                opacity = isMobile ? 0.65 : 0.75;
              } else if (isFarLeft) {
                transformStyles = isMobile
                  ? "translate3d(-220px, 0, -150px) scale(0.68) rotateY(26deg)"
                  : "translate3d(-420px, 0, -240px) scale(0.75) rotateY(24deg)";
                zIndex = 10;
                opacity = isMobile ? 0.2 : 0.35;
              } else if (isFarRight) {
                transformStyles = isMobile
                  ? "translate3d(220px, 0, -150px) scale(0.68) rotateY(-26deg)"
                  : "translate3d(420px, 0, -240px) scale(0.75) rotateY(-24deg)";
                zIndex = 10;
                opacity = isMobile ? 0.2 : 0.35;
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
                    "absolute transition-all duration-500 sm:duration-600 ease-out border rounded-3xl sm:rounded-[2.2rem] p-3.5 sm:p-5 md:p-6 bg-white shadow-2xl flex flex-col justify-between items-center text-center select-none",
                    isCenter
                      ? "w-[84vw] max-w-[310px] sm:max-w-none sm:w-[380px] md:w-[420px] border-[#D4EEFC] ring-4 ring-[#56C8D8]/25 shadow-[#56C8D8]/20 cursor-default"
                      : "w-[76vw] max-w-[280px] sm:max-w-none sm:w-[340px] border-gray-200 cursor-pointer hover:opacity-90",
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
            className="absolute right-1 sm:right-4 z-35 size-9 sm:size-12 rounded-full bg-white/95 backdrop-blur-md hover:bg-[#56C8D8] hover:text-white border-gray-200 text-gray-800 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95"
            aria-label="Next combo"
          >
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Pagination Indicator Dots */}
        {combos.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-5 sm:mt-8">
            {combos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                  idx === activeIndex
                    ? "w-7 sm:w-8 bg-[#56C8D8]"
                    : "w-2 sm:w-2.5 bg-gray-200 hover:bg-gray-300",
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* View All Combos Banner Link */}
        <div className="text-center mt-6 sm:mt-10">
          <Link
            href="/combo-products"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-[#56C8D8] hover:text-[#38bdf8] hover:underline"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore All Money-Saving Combo Deals &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

// 3D Tile Card Component for All Screen Sizes
function ComboProductTileCard({
  combo,
  isCenter = false,
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
      tabIndex={isCenter ? 0 : -1}
    >
      <div className="w-full h-full flex flex-col justify-between">
        {/* Top Header Tags */}
        <div className="w-full flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <Badge className="bg-[#56C8D8] hover:bg-[#56C8D8] text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
              COMBO DEAL
            </Badge>

            {combo.campaignBadge && (
              <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-[9px] sm:text-[10px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 rounded-full shadow-2xs gap-1">
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="truncate max-w-[120px]">
                  {combo.campaignBadge.badgeText}
                </span>
              </Badge>
            )}

            {combo.discountPercent &&
              combo.discountPercent > 0 &&
              !combo.campaignBadge && (
                <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs gap-0.5">
                  <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {combo.discountPercent}% OFF
                </Badge>
              )}
          </div>
        </div>

        {/* Combo Product Image */}
        <div className="relative w-full h-36 sm:h-48 md:h-52 rounded-xl sm:rounded-2xl overflow-hidden bg-radial from-[#F0F8FF] to-white border border-gray-100 mb-2.5 sm:mb-3.5 flex items-center justify-center shadow-inner group">
          {!imageError && combo.image ? (
            <Image
              src={combo.image}
              alt={combo.name}
              fill
              sizes="(max-width: 640px) 280px, 400px"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={combo.image.startsWith("data:")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 p-3">
              <Package className="w-10 h-10 stroke-1 mb-1 text-[#56C8D8]" />
              <span className="text-[11px] font-bold text-gray-400">
                Meawland Combo
              </span>
            </div>
          )}

          {/* Included Items Count Tag */}
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 shadow-xs">
              <Layers className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#56C8D8]" />
              {combo.itemsCount} Items Bundled
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-3 text-center">
          <h3 className="text-xs sm:text-base md:text-lg font-black text-gray-900 line-clamp-1 group-hover:text-[#56C8D8] transition-colors">
            {combo.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
            {combo.description || "Premium bundled value deal for your pets."}
          </p>
        </div>

        {/* Pricing Breakdown & Savings */}
        <div className="bg-[#F0F8FF]/80 rounded-xl p-2 sm:p-2.5 border border-[#D4EEFC]/60 mb-2.5 sm:mb-3.5 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 block uppercase">
              Bundle Price
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-xl text-[#56C8D8] font-black">
                {combo.price}
              </span>
              {combo.originalPrice && (
                <span className="text-[10px] sm:text-xs text-gray-400 font-bold line-through">
                  {combo.originalPrice}
                </span>
              )}
            </div>
          </div>

          {combo.savingsAmount && combo.savingsAmount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 sm:py-1 border border-emerald-500/20">
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Save ৳{combo.savingsAmount}
            </span>
          )}
        </div>

        {/* CTA Button */}
        <div className="w-full">
          <div className="w-full bg-[#56C8D8] group-hover:bg-[#38bdf8] text-white font-black text-[11px] sm:text-xs md:text-sm uppercase tracking-wider rounded-2xl min-h-[40px] sm:min-h-[46px] flex items-center justify-center py-2.5 sm:py-3 px-3 sm:px-4 shadow-md text-center border-0 transition-all group-hover:shadow-lg">
            VIEW COMBO DEAL
          </div>
        </div>
      </div>
    </Link>
  );
}
