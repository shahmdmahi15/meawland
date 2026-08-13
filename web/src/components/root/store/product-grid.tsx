"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Package } from "lucide-react";
import type { CategoryStoreProduct } from "@/actions/store/products/get-by-category";
import type { MockProduct } from "@/lib/mock-products";

export type ProductGridItem = CategoryStoreProduct | MockProduct;

interface ProductGridProps {
  products: ProductGridItem[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found in this category.",
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Package className="h-8 w-8 stroke-1" />
        </div>
        <p className="text-base sm:text-lg font-semibold text-gray-500">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container max-w-7xl px-4 mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductGridCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGridCard({ product }: { product: ProductGridItem }) {
  const [imageSrc, setImageSrc] = useState<string>(product.image || "");
  const [imageError, setImageError] = useState(false);

  const productSlug =
    "slug" in product && product.slug ? product.slug : product.id;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Wishlist action handler
  };

  return (
    <Link href={`/product/${productSlug}`} className="block h-full group">
      <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2rem] p-4 sm:p-5 flex flex-col justify-between items-center text-center h-full shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer">
        {/* White Image Container */}
        <div className="relative aspect-square w-full rounded-2xl bg-white p-3 border border-gray-100 flex items-center justify-center mb-4 overflow-hidden group-hover:border-[#56C8D8]/30 transition-all shadow-xs">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={imageSrc.startsWith("data:")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 p-2">
              <Package className="w-10 h-10 stroke-1 mb-1" />
              <span className="text-[10px] text-gray-400">Meawland</span>
            </div>
          )}

          {/* Heart Wishlist Trigger */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs shadow-xs text-gray-400 hover:text-red-500 border border-gray-100 transition-colors cursor-pointer z-10"
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
        <div className="w-full">
          <div className="w-full border-2 border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-2xl py-2 sm:py-2.5 px-3 transition-all shadow-xs text-center">
            VIEW PRODUCT
          </div>
        </div>
      </div>
    </Link>
  );
}
