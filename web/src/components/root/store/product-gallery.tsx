"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Heart,
  Sparkles,
  Flame,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ProductCampaignBadge } from "@/lib/campaign-helper";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  campaignBadge?: ProductCampaignBadge | null;
  discountPercent?: number;
  isOutOfStock?: boolean;
}

export function ProductGallery({
  images,
  productName,
  isWishlisted,
  onToggleWishlist,
  campaignBadge,
  discountPercent,
  isOutOfStock = false,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage =
    images[selectedIndex] || images[0] || "/fallback-product.png";

  const handleNext = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image Frame */}
      <div className="relative w-full aspect-square rounded-3xl bg-white border-2 border-[#D4EEFC] flex items-center justify-center overflow-hidden shadow-sm group">
        {activeImage ? (
          <div className="relative w-full h-full">
            <Image
              src={activeImage}
              alt={productName}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              unoptimized={activeImage.startsWith("data:")}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300">
            <Package className="w-16 h-16 stroke-1 mb-2" />
            <span className="text-xs text-gray-400 font-bold">
              Meawland Product
            </span>
          </div>
        )}

        {/* Floating Top-Left Badges */}
        <div className="absolute top-4 left-4 flex flex-col items-start gap-1.5 z-10">
          {campaignBadge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1 shadow-md uppercase tracking-wider">
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>{campaignBadge.badgeText}</span>
            </span>
          )}
          {discountPercent && discountPercent > 0 && !campaignBadge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 text-white font-black text-[10px] sm:text-xs px-3 py-1 shadow-md uppercase tracking-wider">
              <Flame className="h-3 w-3" />
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock Out Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] rounded-3xl flex items-center justify-center z-20">
            <Badge className="bg-black text-white font-black text-sm px-5 py-2 rounded-full border-2 border-white/20 shadow-xl uppercase tracking-widest">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Floating Wishlist Button */}
        <button
          type="button"
          onClick={onToggleWishlist}
          className={cn(
            "absolute top-4 right-4 p-2.5 sm:p-3 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-gray-100 transition-all cursor-pointer z-10 hover:scale-110 active:scale-95",
            isWishlisted
              ? "text-rose-500"
              : "text-gray-400 hover:text-rose-500",
          )}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label="Wishlist toggle"
        >
          <Heart
            className={cn(
              "w-5 h-5 transition-colors",
              isWishlisted ? "fill-rose-500 text-rose-500" : "",
            )}
          />
        </button>

        {/* Arrow Navigation (if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:text-[#56C8D8] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:text-[#56C8D8] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={cn(
                  "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-white border-2 overflow-hidden shrink-0 cursor-pointer transition-all duration-200",
                  isSelected
                    ? "border-[#56C8D8] shadow-md ring-2 ring-[#56C8D8]/30 scale-105"
                    : "border-gray-200 hover:border-[#56C8D8]/60 opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  fill
                  className="object-contain p-1"
                  unoptimized={img.startsWith("data:")}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
