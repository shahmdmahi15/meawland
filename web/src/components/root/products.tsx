"use client";

import { useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { StoreBrandProduct } from "@/actions/store/products/get-by-brand";

export interface ProductItem {
  id: string;
  name: string;
  originalPrice: string;
  price: string;
  image: string;
  stockOut?: boolean;
}

export interface ProductsProps {
  products?: StoreBrandProduct[];
}

export function Products({ products = [] }: ProductsProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    loop: true,
    containScroll: "trimSnaps",
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  // Autoplay with hover pause
  useEffect(() => {
    if (!emblaApi || isHovered || products.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3500);
    return () => clearInterval(interval);
  }, [emblaApi, isHovered, products.length]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  // If there are no products with meawland brand, do not show the section
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section
      className="py-16 md:py-24 bg-linear-to-b from-[#F0F8FF]/60 via-white to-white relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-1/2 -left-32 w-80 h-80 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#56C8D8]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto relative z-10">
        {/* Centered Section Header */}
        <div className="text-center mb-10 md:mb-14 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            In-House Signature Brand
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Products of{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              MEAWLAND
            </span>
          </h2>

          <p className="text-gray-500 font-medium text-sm sm:text-base md:text-lg">
            Specially formulated care, nutrient-rich treats, and grooming
            essentials designed for your cat&apos;s wellness.
          </p>
        </div>

        {/* Carousel Container with Absolute Nav Buttons */}
        <div className="relative px-2 sm:px-6 md:px-10">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className={cn(
              "hidden sm:flex absolute -left-2 sm:-left-3 md:-left-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md transition-all",
              !canScrollPrev
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105",
            )}
            aria-label="Previous products"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Embla Viewport */}
          <div className="overflow-hidden px-1" ref={emblaRef}>
            <div className="flex -ml-2.5 sm:-ml-4 md:-ml-6 py-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-none pl-2.5 sm:pl-4 md:pl-6 basis-1/2 sm:basis-1/3 md:basis-1/3 lg:basis-1/4 xl:basis-1/4 min-w-0"
                >
                  <MeawlandProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className={cn(
              "hidden sm:flex absolute -right-2 sm:-right-3 md:-right-5 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full border-gray-200 bg-white/95 backdrop-blur-xs shadow-md transition-all",
              !canScrollNext
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-[#56C8D8] hover:text-white hover:border-[#56C8D8] cursor-pointer hover:scale-105",
            )}
            aria-label="Next products"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Carousel Pagination Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  selectedIndex === index
                    ? "w-7 bg-[#56C8D8]"
                    : "w-2 bg-gray-200 hover:bg-gray-300",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MeawlandProductCard({ product }: { product: StoreBrandProduct }) {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productSlug = product.slug || product.id;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isWishlisted;
    setIsWishlisted(next);
    if (next) {
      toast.success(`Added ${product.name} to Wishlist! ❤️`);
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
          {!imageError && product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={product.image.startsWith("data:")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 p-2">
              <Package className="w-10 h-10 stroke-1 mb-1" />
              <span className="text-[10px] text-gray-400">Meawland</span>
            </div>
          )}

          {/* Badges Stack */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 shadow-xs uppercase tracking-wider">
                <Flame className="h-3 w-3" />
                {product.discountPercent}% OFF
              </span>
            )}
            {product.isVariable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-bold text-[9px] px-2 py-0.5 shadow-xs">
                <Layers3 className="h-2.5 w-2.5" />
                Variants
              </span>
            )}
          </div>

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
        {product.subCategoryName && (
          <p className="text-[11px] font-semibold text-[#56C8D8] truncate max-w-[180px] mb-1">
            {product.subCategoryName}
          </p>
        )}

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm md:text-base font-black text-gray-900 line-clamp-2 min-h-10 sm:min-h-12 flex items-center justify-center text-center mb-2 leading-snug group-hover:text-[#56C8D8] transition-colors">
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {product.originalPrice && (
            <span className="text-xs sm:text-sm text-gray-400 font-bold line-through">
              {product.originalPrice}
            </span>
          )}
          <span className="text-sm sm:text-lg text-gray-900 font-black">
            {product.price}
          </span>
        </div>

        {/* View Product CTA Button */}
        <div className="w-full mt-auto">
          <div className="w-full border-2 border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-2xl py-2 sm:py-2.5 px-3 transition-all shadow-xs text-center">
            {product.isVariable ? "SELECT OPTIONS" : "VIEW PRODUCT"}
          </div>
        </div>
      </div>
    </Link>
  );
}
