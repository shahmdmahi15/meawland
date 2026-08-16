"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { StoreSubCategory } from "@/actions/store/sub-categories/get-by-category";

interface SubCategoryPillsProps {
  categorySlug: string;
  subCategories: StoreSubCategory[];
  activeSubSlug?: string;
}

export function SubCategoryPills({
  categorySlug,
  subCategories,
  activeSubSlug,
}: SubCategoryPillsProps) {
  if (subCategories.length === 0) return null;

  return (
    <div className="w-full bg-white/50 border-b border-gray-100 py-3">
      <div className="container max-w-7xl px-4 mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* "All" Pill */}
          <Link
            href={`/category/${categorySlug}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all shadow-2xs border",
              !activeSubSlug
                ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#56C8D8] hover:text-[#56C8D8]",
            )}
          >
            All Items
          </Link>

          {/* Subcategory Pills */}
          {subCategories.map((subCat) => {
            const isActive = activeSubSlug === subCat.slug;
            return (
              <Link
                key={subCat.id}
                href={`/category/${categorySlug}/${subCat.slug}`}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all shadow-2xs border flex items-center gap-1.5",
                  isActive
                    ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#56C8D8] hover:text-[#56C8D8]",
                )}
              >
                <span>{subCat.name}</span>
                {typeof subCat.productCount === "number" && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500",
                    )}
                  >
                    {subCat.productCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
