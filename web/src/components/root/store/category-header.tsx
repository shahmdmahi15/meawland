import Link from "next/link";
import { PawPrint, Sparkles, ArrowLeft, Package } from "lucide-react";

interface CategoryHeaderProps {
  title: string;
  subtitle?: string;
  totalProducts?: number;
  parentCategory?: {
    title: string;
    slug: string;
  };
}

export function CategoryHeader({
  title,
  subtitle,
  totalProducts,
  parentCategory,
}: CategoryHeaderProps) {
  return (
    <section className="relative w-full pt-24 sm:pt-28 md:pt-34 pb-8 sm:pb-12 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] flex items-center justify-center overflow-hidden rounded-b-[2rem] md:rounded-b-[3.5rem] shadow-xs">
      {/* Decorative Paw Print SVGs */}
      <PawPrint
        className="absolute -right-8 top-4 text-[#B2E2FF] opacity-40 rotate-12 pointer-events-none"
        style={{ width: "180px", height: "180px" }}
      />
      <PawPrint
        className="absolute left-4 bottom-2 text-[#B2E2FF] opacity-20 -rotate-12 pointer-events-none"
        style={{ width: "120px", height: "120px" }}
      />
      <PawPrint
        className="absolute right-1/3 bottom-0 text-[#B2E2FF] opacity-10 pointer-events-none"
        style={{ width: "220px", height: "220px" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-3xl mx-auto">
        {/* Parent Category Back Link (for subcategory pages) */}
        {parentCategory && (
          <Link
            href={`/category/${parentCategory.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 hover:bg-white text-gray-700 hover:text-[#56C8D8] text-xs font-bold shadow-xs transition-all mb-3 border border-[#B2E2FF]/40 backdrop-blur-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All {parentCategory.title}</span>
          </Link>
        )}

        {/* Header Title */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          {title}
        </h1>

        {/* Subtitle / Description */}
        {subtitle && (
          <p className="mt-2 text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-xl">
            {subtitle}
          </p>
        )}

        {/* Stats and Perks Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
          {typeof totalProducts === "number" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-bold text-gray-800 border border-[#B2E2FF]/60 shadow-2xs">
              <Package className="h-3.5 w-3.5 text-[#56C8D8]" />
              {totalProducts} {totalProducts === 1 ? "Product" : "Products"}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-xs text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            100% Genuine Pet Essentials
          </span>
        </div>
      </div>
    </section>
  );
}
