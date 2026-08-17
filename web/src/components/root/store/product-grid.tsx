"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Package,
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  Flame,
  Layers3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/actions/store/wishlist";
import { useRouter } from "next/navigation";
import type { CategoryStoreProduct } from "@/actions/store/products/get-by-category";

export type ProductGridItem = CategoryStoreProduct;

type SortOption =
  "featured" | "price_asc" | "price_desc" | "name_asc" | "discount";

type PriceBracket =
  "ALL" | "UNDER_500" | "500_1000" | "1000_2500" | "OVER_2500";

interface ProductGridProps {
  products: ProductGridItem[];
  emptyMessage?: string;
  categoryTitle?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found in this category.",
  categoryTitle,
}: ProductGridProps) {
  // Filter & Search states
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedPriceBracket, setSelectedPriceBracket] =
    useState<PriceBracket>("ALL");
  const [selectedType, setSelectedType] = useState<
    "ALL" | "SIMPLE" | "VARIABLE"
  >("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Extract available brands
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if ("brandName" in p && p.brandName) {
        brandsSet.add(p.brandName);
      }
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Helper to extract numeric price from product
  const getProductNumericPrice = (p: ProductGridItem): number => {
    if ("numericPrice" in p && typeof p.numericPrice === "number") {
      return p.numericPrice;
    }
    const cleanStr = p.price.replace(/[^\d.]/g, "");
    return parseFloat(cleanStr) || 0;
  };

  const getProductNumericOriginalPrice = (
    p: ProductGridItem,
  ): number | undefined => {
    if (
      "numericOriginalPrice" in p &&
      typeof p.numericOriginalPrice === "number"
    ) {
      return p.numericOriginalPrice;
    }
    if (p.originalPrice) {
      const cleanStr = p.originalPrice.replace(/[^\d.]/g, "");
      const val = parseFloat(cleanStr);
      return !isNaN(val) ? val : undefined;
    }
    return undefined;
  };

  // Filter & Sort computation
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Search filter
        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchesName = product.name.toLowerCase().includes(q);
          const matchesBrand =
            "brandName" in product &&
            product.brandName?.toLowerCase().includes(q);
          const matchesSku =
            "sku" in product && product.sku?.toLowerCase().includes(q);
          const matchesSubCat =
            "subCategoryName" in product &&
            product.subCategoryName?.toLowerCase().includes(q);

          if (!matchesName && !matchesBrand && !matchesSku && !matchesSubCat) {
            return false;
          }
        }

        // Brand filter
        if (selectedBrand !== "ALL") {
          if (
            !("brandName" in product) ||
            product.brandName !== selectedBrand
          ) {
            return false;
          }
        }

        // Product type filter
        if (selectedType !== "ALL") {
          const isVar = "isVariable" in product ? product.isVariable : false;
          if (selectedType === "SIMPLE" && isVar) return false;
          if (selectedType === "VARIABLE" && !isVar) return false;
        }

        // Price range filter
        const price = getProductNumericPrice(product);
        if (selectedPriceBracket === "UNDER_500" && price > 500) return false;
        if (
          selectedPriceBracket === "500_1000" &&
          (price < 500 || price > 1000)
        )
          return false;
        if (
          selectedPriceBracket === "1000_2500" &&
          (price < 1000 || price > 2500)
        )
          return false;
        if (selectedPriceBracket === "OVER_2500" && price < 2500) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = getProductNumericPrice(a);
        const priceB = getProductNumericPrice(b);

        switch (sortBy) {
          case "price_asc":
            return priceA - priceB;
          case "price_desc":
            return priceB - priceA;
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "discount": {
            const origA = getProductNumericOriginalPrice(a) || priceA;
            const origB = getProductNumericOriginalPrice(b) || priceB;
            const discountA = origA > priceA ? origA - priceA : 0;
            const discountB = origB > priceB ? origB - priceB : 0;
            return discountB - discountA;
          }
          case "featured":
          default:
            return 0;
        }
      });
  }, [
    products,
    search,
    selectedBrand,
    selectedPriceBracket,
    selectedType,
    sortBy,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedBrand("ALL");
    setSelectedPriceBracket("ALL");
    setSelectedType("ALL");
    setSortBy("featured");
  };

  const hasActiveFilters =
    search !== "" ||
    selectedBrand !== "ALL" ||
    selectedPriceBracket !== "ALL" ||
    selectedType !== "ALL" ||
    sortBy !== "featured";

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container max-w-7xl px-4 mx-auto space-y-6">
        {/* Top Control Bar: Search, Filters, Sort, View Toggle */}
        <div className="bg-[#F0F8FF]/80 backdrop-blur-xs border border-[#D4EEFC] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search within category */}
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${categoryTitle || "this category"}...`}
                className="h-10 pl-9 pr-9 text-xs sm:text-sm bg-white border-gray-200 rounded-xl focus-visible:ring-[#56C8D8]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort & View Mode Tools */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
                  Sort:
                </span>
                <Select
                  value={sortBy}
                  onValueChange={(val) => setSortBy(val as SortOption)}
                >
                  <SelectTrigger className="h-9 min-w-[150px] text-xs font-bold bg-white border-gray-200 rounded-xl">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">✨ Featured Items</SelectItem>
                    <SelectItem value="price_asc">
                      💵 Price: Low to High
                    </SelectItem>
                    <SelectItem value="price_desc">
                      💎 Price: High to Low
                    </SelectItem>
                    <SelectItem value="name_asc">🔤 Name: A to Z</SelectItem>
                    <SelectItem value="discount">
                      🔥 Highest Discount
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-0.5 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "GRID"
                      ? "bg-[#56C8D8] text-white shadow-2xs"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("LIST")}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    viewMode === "LIST"
                      ? "bg-[#56C8D8] text-white shadow-2xs"
                      : "text-gray-500 hover:text-gray-900",
                  )}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 text-xs gap-1.5 rounded-xl border-gray-200 hover:bg-gray-100 font-bold"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Granular Filter Row: Price brackets, Brands, Product Types */}
          <div className="pt-2 border-t border-[#D4EEFC]/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-gray-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#56C8D8]" />
              Filters:
            </span>

            {/* Price Brackets Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedPriceBracket("ALL")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all border text-[11px]",
                  selectedPriceBracket === "ALL"
                    ? "bg-[#56C8D8] text-white border-[#56C8D8]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#56C8D8]",
                )}
              >
                All Prices
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceBracket("UNDER_500")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all border text-[11px]",
                  selectedPriceBracket === "UNDER_500"
                    ? "bg-[#56C8D8] text-white border-[#56C8D8]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#56C8D8]",
                )}
              >
                Under ৳500
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceBracket("500_1000")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all border text-[11px]",
                  selectedPriceBracket === "500_1000"
                    ? "bg-[#56C8D8] text-white border-[#56C8D8]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#56C8D8]",
                )}
              >
                ৳500 - ৳1,000
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceBracket("1000_2500")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all border text-[11px]",
                  selectedPriceBracket === "1000_2500"
                    ? "bg-[#56C8D8] text-white border-[#56C8D8]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#56C8D8]",
                )}
              >
                ৳1,000 - ৳2,500
              </button>
              <button
                type="button"
                onClick={() => setSelectedPriceBracket("OVER_2500")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all border text-[11px]",
                  selectedPriceBracket === "OVER_2500"
                    ? "bg-[#56C8D8] text-white border-[#56C8D8]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#56C8D8]",
                )}
              >
                Above ৳2,500
              </button>
            </div>

            {/* Brand Filter Selector if available */}
            {availableBrands.length > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <Select
                  value={selectedBrand}
                  onValueChange={(val) => setSelectedBrand(val ?? "ALL")}
                >
                  <SelectTrigger className="h-7 text-[11px] font-bold bg-white border-gray-200 rounded-lg">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Brands</SelectItem>
                    {availableBrands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Results Counter Banner */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 px-1 font-semibold">
          <p>
            Showing{" "}
            <span className="font-black text-gray-900">
              {filteredAndSortedProducts.length}
            </span>{" "}
            of{" "}
            <span className="font-black text-gray-900">{products.length}</span>{" "}
            products
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#56C8D8] hover:underline font-bold"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Main Products Rendering */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center gap-3 bg-[#F0F8FF]/40 rounded-3xl border border-dashed border-[#D4EEFC] px-4">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
              <Image
                src="/empty-cat.gif"
                alt="Empty products"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="text-base sm:text-lg font-black text-gray-800">
              {emptyMessage}
            </p>
            <p className="text-xs text-gray-500 max-w-sm">
              We couldn&apos;t find any items matching your active search or
              filters. Try clearing your filters to explore more items.
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="mt-2 rounded-full font-bold border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white cursor-pointer"
              >
                Clear All Filters
              </Button>
            ) : (
              <Link href="/products">
                <Button
                  size="sm"
                  className="mt-2 rounded-full font-bold bg-[#56C8D8] hover:bg-[#38bdf8] text-white border-0 cursor-pointer shadow-xs"
                >
                  Explore All Products
                </Button>
              </Link>
            )}
          </div>
        ) : viewMode === "GRID" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductGridCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-4">
            {filteredAndSortedProducts.map((product) => (
              <ProductListCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Grid Product Card ──
function ProductGridCard({ product }: { product: ProductGridItem }) {
  const router = useRouter();
  const imageSrc = product.image || "";
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productSlug =
    "slug" in product && product.slug ? product.slug : product.id;

  // Calculate discount amount & percentage
  const numPrice = parseFloat(product.price.replace(/[^\d.]/g, "")) || 0;
  const numOrig = product.originalPrice
    ? parseFloat(product.originalPrice.replace(/[^\d.]/g, "")) || 0
    : 0;

  const hasDiscount = numOrig > numPrice && numPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((numOrig - numPrice) / numOrig) * 100)
    : 0;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await toggleWishlistAction(product.id);
    if (res.unauthorized) {
      toast.error("Please login to add to wishlist", {
        action: {
          label: "Login",
          onClick: () => router.push("/login?redirect=/wishlist"),
        },
      });
      return;
    }
    if (res.success) {
      setIsWishlisted(Boolean(res.isWishlisted));
      if (res.isWishlisted) {
        toast.success(`Added ${product.name} to your Wishlist! ❤️`);
      } else {
        toast.info(`Removed from Wishlist`);
      }
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Link href={`/product/${productSlug}`} className="block h-full group">
      <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2rem] p-4 sm:p-5 flex flex-col justify-between items-center text-center h-full shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-[#56C8D8]/50">
        {/* White Image Container */}
        <div className="relative aspect-square w-full rounded-2xl bg-white p-3 border border-gray-100 flex items-center justify-center mb-3 overflow-hidden group-hover:border-[#56C8D8]/30 transition-all shadow-xs">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={imageSrc.startsWith("data:")}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 p-2">
              <Package className="w-10 h-10 stroke-1 mb-1" />
              <span className="text-[10px] text-gray-400">Meawland</span>
            </div>
          )}

          {/* Badges Stack (Campaign, Discount & Variable) */}
          <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10">
            {"campaignBadge" in product && product.campaignBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[9px] sm:text-[10px] px-2.5 py-0.5 shadow-xs uppercase tracking-wider">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[140px]">
                  {product.campaignBadge.badgeText}
                </span>
              </span>
            )}
            {hasDiscount &&
              discountPercent > 0 &&
              !("campaignBadge" in product && product.campaignBadge) && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 shadow-xs uppercase tracking-wider">
                  <Flame className="h-3 w-3" />
                  {discountPercent}% OFF
                </span>
              )}
            {"isVariable" in product && product.isVariable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-bold text-[9px] px-2 py-0.5 shadow-xs">
                <Layers3 className="h-2.5 w-2.5" />
                Variants
              </span>
            )}
          </div>

          {/* Heart Wishlist Trigger */}
          <button
            type="button"
            onClick={handleWishlistClick}
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

        {/* Subcategory & Brand info */}
        <div className="w-full flex items-center justify-center gap-1.5 mb-1 text-[11px] font-semibold text-gray-400">
          {"brandName" in product && product.brandName && (
            <span className="text-[#56C8D8] font-bold">
              {product.brandName}
            </span>
          )}
          {"brandName" in product && product.brandName && <span>•</span>}
          {"subCategoryName" in product && (
            <span className="truncate max-w-[120px]">
              {product.subCategoryName}
            </span>
          )}
        </div>

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
            {"isVariable" in product && product.isVariable
              ? "SELECT OPTIONS"
              : "VIEW PRODUCT"}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── List Product Card ──
function ProductListCard({ product }: { product: ProductGridItem }) {
  const router = useRouter();
  const imageSrc = product.image || "";
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productSlug =
    "slug" in product && product.slug ? product.slug : product.id;

  // Calculate discount amount & percentage
  const numPrice = parseFloat(product.price.replace(/[^\d.]/g, "")) || 0;
  const numOrig = product.originalPrice
    ? parseFloat(product.originalPrice.replace(/[^\d.]/g, "")) || 0
    : 0;

  const hasDiscount = numOrig > numPrice && numPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((numOrig - numPrice) / numOrig) * 100)
    : 0;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const res = await toggleWishlistAction(product.id);
    if (res.unauthorized) {
      toast.error("Please login to add to wishlist", {
        action: {
          label: "Login",
          onClick: () => router.push("/login?redirect=/wishlist"),
        },
      });
      return;
    }
    if (res.success) {
      setIsWishlisted(Boolean(res.isWishlisted));
      if (res.isWishlisted) {
        toast.success(`Added ${product.name} to Wishlist! ❤️`);
      } else {
        toast.info(`Removed from Wishlist`);
      }
    } else {
      toast.error(res.message);
    }
  };

  return (
    <Link href={`/product/${productSlug}`} className="block group">
      <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-xs hover:shadow-lg transition-all duration-300 hover:border-[#56C8D8]/50">
        {/* Image Box */}
        <div className="relative h-28 w-28 sm:h-36 sm:w-36 shrink-0 rounded-2xl bg-white p-2 border border-gray-100 flex items-center justify-center overflow-hidden shadow-2xs">
          {!imageError && imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={imageSrc.startsWith("data:")}
            />
          ) : (
            <Package className="w-8 h-8 text-gray-300" />
          )}

          {"campaignBadge" in product && product.campaignBadge ? (
            <span className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 shadow-xs uppercase flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              {product.campaignBadge.badgeText}
            </span>
          ) : hasDiscount ? (
            <span className="absolute top-2 left-2 rounded-full bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.2 shadow-xs uppercase">
              {discountPercent}% OFF
            </span>
          ) : null}
        </div>

        {/* Product Info */}
        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-gray-400">
            {"brandName" in product && product.brandName && (
              <span className="text-[#56C8D8] font-bold">
                {product.brandName}
              </span>
            )}
            {"subCategoryName" in product && (
              <span>• {product.subCategoryName}</span>
            )}
            {"isVariable" in product && product.isVariable && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                Variants
              </Badge>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-black text-gray-900 group-hover:text-[#56C8D8] transition-colors line-clamp-2">
            {product.name}
          </h3>

          {"shortDescription" in product && product.shortDescription && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            {product.originalPrice && (
              <span className="text-xs text-gray-400 font-bold line-through">
                {product.originalPrice}
              </span>
            )}
            <span className="text-base sm:text-lg text-gray-900 font-black">
              {product.price}
            </span>
          </div>
        </div>

        {/* Action Button & Wishlist */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-center">
          <button
            type="button"
            onClick={handleWishlistClick}
            className={cn(
              "p-2.5 rounded-full bg-white shadow-xs border border-gray-200 transition-colors",
              isWishlisted
                ? "text-rose-500"
                : "text-gray-400 hover:text-rose-500",
            )}
          >
            <Heart
              className={cn("w-4 h-4", isWishlisted ? "fill-rose-500" : "")}
            />
          </button>

          <div className="border-2 border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-black text-xs tracking-wider uppercase rounded-2xl py-2 px-4 transition-all text-center">
            View Details
          </div>
        </div>
      </div>
    </Link>
  );
}
