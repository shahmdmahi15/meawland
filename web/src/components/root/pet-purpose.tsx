"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  Heart,
  ArrowLeft,
  ArrowRight,
  Flame,
  Sparkles,
  Layers3,
  Package,
  Shirt,
  Sparkle,
  Bath,
  Utensils,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  StorePurposeProduct,
  PurposeCategoryTab,
} from "@/actions/store/products/get-by-purpose";

export interface PetPurposeProps {
  products?: StorePurposeProduct[];
}

const TABS: Array<{
  id: PurposeCategoryTab;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "ALL", label: "All Curations", icon: Sparkles },
  { id: "FASHION", label: "Dresses & Gowns", icon: Shirt },
  { id: "ACCESSORIES", label: "Collars & Belts", icon: Sparkle },
  { id: "CARE", label: "Grooming & Care", icon: Bath },
  { id: "FOOD", label: "Food & Treats", icon: Utensils },
  { id: "TOYS", label: "Toys & Play", icon: Gamepad2 },
];

export function PetPurpose({ products = [] }: PetPurposeProps) {
  const [activeTab, setActiveTab] = useState<PurposeCategoryTab>("ALL");
  const [isHovered1, setIsHovered1] = useState(false);
  const [isHovered2, setIsHovered2] = useState(false);

  // Filter products by selected tab
  const filteredProducts = useMemo(() => {
    if (activeTab === "ALL") return products;
    return products.filter((p) => p.purposeTag === activeTab);
  }, [products, activeTab]);

  // Split into Row 1 & Row 2 for dual slider layout
  const { row1List, row2List } = useMemo(() => {
    const list = filteredProducts.length > 0 ? filteredProducts : products;
    const mid = Math.ceil(list.length / 2);
    const r1 = list.slice(0, mid);
    const r2 = list.slice(mid);

    // If one row is empty, duplicate to keep dual aesthetic
    const finalR1 = r1.length > 0 ? r1 : list;
    const finalR2 = r2.length > 0 ? r2 : list;

    return { row1List: finalR1, row2List: finalR2 };
  }, [filteredProducts, products]);

  // Carousel 1 Setup
  const [emblaRef1, emblaApi1] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    loop: true,
    containScroll: "trimSnaps",
  });

  // Carousel 2 Setup
  const [emblaRef2, emblaApi2] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    loop: true,
    containScroll: "trimSnaps",
  });

  // Autoplay for Row 1
  useEffect(() => {
    if (!emblaApi1 || isHovered1 || row1List.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi1.scrollNext();
    }, 3600);
    return () => clearInterval(interval);
  }, [emblaApi1, isHovered1, row1List.length]);

  // Autoplay for Row 2 (slightly offset interval for natural staggered motion)
  useEffect(() => {
    if (!emblaApi2 || isHovered2 || row2List.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi2.scrollNext();
    }, 4200);
    return () => clearInterval(interval);
  }, [emblaApi2, isHovered2, row2List.length]);

  const scrollPrev1 = useCallback(() => {
    if (emblaApi1) emblaApi1.scrollPrev();
  }, [emblaApi1]);

  const scrollNext1 = useCallback(() => {
    if (emblaApi1) emblaApi1.scrollNext();
  }, [emblaApi1]);

  const scrollPrev2 = useCallback(() => {
    if (emblaApi2) emblaApi2.scrollPrev();
  }, [emblaApi2]);

  const scrollNext2 = useCallback(() => {
    if (emblaApi2) emblaApi2.scrollNext();
  }, [emblaApi2]);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F0F8FF]/60 to-white relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto relative z-10 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            Curated For Every Occasion
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Shop by Pet &{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Purpose
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            From regal dresses and charming accessories to essential grooming
            and nutrient-packed food — find what fits your furry friend.
          </p>
        </div>

        {/* Category & Purpose Tab Selector */}
        <div className="flex items-center justify-center gap-2 flex-wrap py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-black transition-all shadow-2xs cursor-pointer border",
                  isActive
                    ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-md scale-105"
                    : "bg-[#F0F8FF]/80 text-gray-700 border-[#D4EEFC] hover:bg-white hover:border-[#56C8D8]",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-white" : "text-[#56C8D8]",
                  )}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 1 Slider Container */}
        <div
          className="relative px-2 sm:px-6 md:px-10"
          onMouseEnter={() => setIsHovered1(true)}
          onMouseLeave={() => setIsHovered1(false)}
        >
          {/* Row 1 Nav Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev1}
            className="hidden sm:flex absolute -left-2 sm:-left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105 transition-all"
            aria-label="Previous row 1 items"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="overflow-hidden px-1" ref={emblaRef1}>
            <div className="flex -ml-2.5 sm:-ml-4 md:-ml-6 py-3">
              {row1List.map((item, idx) => (
                <div
                  key={`r1-${item.id}-${idx}`}
                  className="flex-none pl-2.5 sm:pl-4 md:pl-6 basis-1/2 sm:basis-1/3 md:basis-1/3 lg:basis-1/4 xl:basis-1/4 min-w-0"
                >
                  <PurposeProductCard item={item} />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext1}
            className="hidden sm:flex absolute -right-2 sm:-right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105 transition-all"
            aria-label="Next row 1 items"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Row 2 Slider Container */}
        <div
          className="relative px-2 sm:px-6 md:px-10"
          onMouseEnter={() => setIsHovered2(true)}
          onMouseLeave={() => setIsHovered2(false)}
        >
          {/* Row 2 Nav Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev2}
            className="hidden sm:flex absolute -left-2 sm:-left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105 transition-all"
            aria-label="Previous row 2 items"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="overflow-hidden px-1" ref={emblaRef2}>
            <div className="flex -ml-2.5 sm:-ml-4 md:-ml-6 py-3">
              {row2List.map((item, idx) => (
                <div
                  key={`r2-${item.id}-${idx}`}
                  className="flex-none pl-2.5 sm:pl-4 md:pl-6 basis-1/2 sm:basis-1/3 md:basis-1/3 lg:basis-1/4 xl:basis-1/4 min-w-0"
                >
                  <PurposeProductCard item={item} />
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext2}
            className="hidden sm:flex absolute -right-2 sm:-right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105 transition-all"
            aria-label="Next row 2 items"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function PurposeProductCard({ item }: { item: StorePurposeProduct }) {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productSlug = item.slug || item.id;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isWishlisted;
    setIsWishlisted(next);
    if (next) {
      toast.success(`Added ${item.name} to Wishlist! ❤️`);
    } else {
      toast.info(`Removed from Wishlist`);
    }
  };

  return (
    <Link
      href={`/product/${productSlug}`}
      className="block h-full group select-none"
    >
      <div className="w-full h-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl sm:rounded-[2rem] p-2.5 sm:p-4 md:p-5 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-xl transition-all duration-300 group-hover:border-[#56C8D8]/50 cursor-pointer">
        {/* White Image Container */}
        <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-white p-2 sm:p-3 border border-gray-100 flex items-center justify-center mb-2.5 sm:mb-3.5 overflow-hidden group-hover:border-[#56C8D8]/30 transition-all shadow-xs">
          {!imageError && item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={item.image.startsWith("data:")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 p-2">
              <Package className="w-10 h-10 stroke-1 mb-1" />
              <span className="text-[10px] text-gray-400">Meawland</span>
            </div>
          )}

          {/* Badges Stack */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10">
            {item.campaignBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[9px] sm:text-[10px] px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[140px]">
                  {item.campaignBadge.badgeText}
                </span>
              </span>
            )}
            {item.discountPercent &&
              item.discountPercent > 0 &&
              !item.campaignBadge && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 shadow-xs uppercase tracking-wider">
                  <Flame className="h-3 w-3" />
                  {item.discountPercent}% OFF
                </span>
              )}
            {item.isVariable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-bold text-[9px] px-2 py-0.5 shadow-xs">
                <Layers3 className="h-2.5 w-2.5" />
                Variants
              </span>
            )}
          </div>

          {/* Stock Out Overlay */}
          {item.isStockOut && (
            <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-20">
              <Badge className="bg-black/90 text-white font-black text-xs px-3.5 py-1 rounded-full border-0 shadow-md uppercase tracking-wider">
                Stock Out
              </Badge>
            </div>
          )}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              "absolute top-2.5 right-2.5 p-2 rounded-full bg-white/95 backdrop-blur-xs shadow-xs border border-gray-100 transition-all cursor-pointer z-10",
              isWishlisted
                ? "text-rose-500 scale-110"
                : "text-gray-400 hover:text-rose-500 hover:scale-105",
            )}
            aria-label="Add to wishlist"
          >
            <Heart
              className={cn(
                "w-4 h-4 sm:w-4.5 sm:h-4.5 transition-colors",
                isWishlisted ? "fill-rose-500" : "",
              )}
            />
          </button>
        </div>

        {/* Subcategory Name */}
        {item.subCategoryName && (
          <p className="text-[11px] font-semibold text-[#56C8D8] truncate max-w-[180px] mb-1">
            {item.subCategoryName}
          </p>
        )}

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm md:text-base font-black text-gray-900 line-clamp-2 min-h-10 sm:min-h-12 flex items-center justify-center text-center mb-2 leading-snug group-hover:text-[#56C8D8] transition-colors">
          {item.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {item.originalPrice && (
            <span className="text-xs sm:text-sm text-gray-400 font-bold line-through">
              {item.originalPrice}
            </span>
          )}
          <span className="text-sm sm:text-lg text-gray-900 font-black">
            {item.price}
          </span>
        </div>

        {/* View Product CTA Button */}
        <div className="w-full mt-auto">
          <div className="w-full border-2 border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-2xl py-2 sm:py-2.5 px-3 transition-all shadow-xs text-center">
            {item.isVariable ? "SELECT OPTIONS" : "VIEW PRODUCT"}
          </div>
        </div>
      </div>
    </Link>
  );
}
