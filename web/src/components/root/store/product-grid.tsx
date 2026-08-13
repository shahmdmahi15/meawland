"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MockProduct } from "@/lib/mock-products";

interface ProductGridProps {
  products: MockProduct[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found in this category.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container max-w-7xl px-4 mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="block h-full">
              <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2rem] p-4 sm:p-5 flex flex-col justify-between items-center text-center h-full shadow-xs hover:shadow-xl transition-all duration-300 group cursor-pointer">
                {/* White Image Container */}
                <div className="relative aspect-square w-full rounded-2xl bg-white p-3 border border-gray-100 flex items-center justify-center mb-4 overflow-hidden group-hover:border-[#56C8D8]/30 transition-all shadow-xs">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Heart Wishlist Trigger */}
                  <button
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs shadow-xs text-gray-400 hover:text-red-500 border border-gray-100 transition-colors cursor-pointer"
                    aria-label="Add to wishlist"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Product Title */}
                <h3 className="text-xs sm:text-sm md:text-base font-black text-gray-900 line-clamp-2 min-h-10 sm:min-h-12 flex items-center justify-center text-center mb-2 leading-snug group-hover:text-[#56C8D8] transition-colors">
                  {product.name}
                </h3>

                {/* Pricing */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs sm:text-sm text-gray-400 font-bold line-through">
                    {product.originalPrice}
                  </span>
                  <span className="text-sm sm:text-lg text-gray-900 font-black">
                    {product.price}
                  </span>
                </div>

                {/* View Product CTA Button */}
                <Link href={`/product/${product.id}`} className="w-full">
                  <Button
                    variant="outline"
                    className="w-full border-2 border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-2xl py-2 sm:py-2.5 px-3 transition-all shadow-xs cursor-pointer"
                  >
                    VIEW PRODUCT
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
