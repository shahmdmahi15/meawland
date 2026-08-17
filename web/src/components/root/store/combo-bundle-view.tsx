"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { type ComboBundleItem } from "@/actions/store/products/get-product-details";
import { Package, CheckCircle2 } from "lucide-react";

interface ComboBundleViewProps {
  comboProducts?: ComboBundleItem[];
}

export function ComboBundleView({ comboProducts = [] }: ComboBundleViewProps) {
  if (comboProducts.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-[#F0F8FF] border border-[#D4EEFC] space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#56C8D8]/20 text-[#56C8D8] flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-gray-900">
            Combo Bundle Includes ({comboProducts.length} Items):
          </h4>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Bundle Deal
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {comboProducts.map((cp) => (
          <Link
            key={cp.id}
            href={`/product/${cp.slug}`}
            className="flex items-center gap-2.5 p-2 rounded-2xl bg-white border border-gray-100 hover:border-[#56C8D8]/40 hover:shadow-xs transition-all group"
          >
            <div className="relative w-12 h-12 rounded-xl bg-gray-50 p-1 border border-gray-100 shrink-0 overflow-hidden">
              <Image
                src={cp.image}
                alt={cp.name}
                fill
                className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                unoptimized={cp.image.startsWith("data:")}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 group-hover:text-[#56C8D8] transition-colors truncate">
                {cp.name}
              </p>
              <div className="flex items-center gap-1.5">
                {cp.salePrice && (
                  <span className="text-[11px] font-black text-[#56C8D8]">
                    {cp.salePrice}
                  </span>
                )}
                {cp.variantTitle && (
                  <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                    {cp.variantTitle}
                  </span>
                )}
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
