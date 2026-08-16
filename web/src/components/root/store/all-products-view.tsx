"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  Flame,
  Layers3,
  Heart,
  Package,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ArrowUpDown,
  PawPrint,
  ShieldCheck,
  Truck,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  FilterableStoreProduct,
  StoreFilterMeta,
} from "@/actions/store/products/get-all-store-products";
import { Category } from "@/generated/prisma/enums";

type SortOption =
  | "NEWEST"
  | "PRICE_ASC"
  | "PRICE_DESC"
  | "NAME_ASC"
  | "NAME_DESC"
  | "DISCOUNT_DESC";

interface AllProductsViewProps {
  initialProducts: FilterableStoreProduct[];
  filterMeta: StoreFilterMeta;
}

export function AllProductsView({
  initialProducts,
  filterMeta,
}: AllProductsViewProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    [],
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<
    [number, number]
  >([0, filterMeta.maxPrice || 5000]);
  const [selectedPriceBracket, setSelectedPriceBracket] = useState<
    string | null
  >(null);

  // Layout & Sorting
  const [sortOption, setSortOption] = useState<SortOption>("NEWEST");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(16);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Subcategory toggling
  const handleSubCategoryToggle = (id: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setCurrentPage(1);
  };

  // Brand toggling
  const handleBrandToggle = (id: string) => {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
    setCurrentPage(1);
  };

  // Price Bracket selection
  const handlePriceBracket = (bracket: string, min: number, max: number) => {
    if (selectedPriceBracket === bracket) {
      setSelectedPriceBracket(null);
      setSelectedPriceRange([0, filterMeta.maxPrice || 5000]);
    } else {
      setSelectedPriceBracket(bracket);
      setSelectedPriceRange([min, max]);
    }
    setCurrentPage(1);
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedSubCategories([]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSelectedPriceBracket(null);
    setSelectedPriceRange([0, filterMeta.maxPrice || 5000]);
    setSortOption("NEWEST");
    setCurrentPage(1);
    toast.info("All filters have been reset.");
  };

  // Available SubCategories (filtered by selected category if any)
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === "ALL") return filterMeta.subCategories;
    return filterMeta.subCategories.filter(
      (sub) => sub.category === selectedCategory,
    );
  }, [selectedCategory, filterMeta.subCategories]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSku = product.sku.toLowerCase().includes(query);
        const matchesCode = product.code.toLowerCase().includes(query);
        const matchesBrand =
          product.brandName?.toLowerCase().includes(query) ?? false;
        const matchesSubCat =
          product.subCategoryName?.toLowerCase().includes(query) ?? false;

        if (
          !matchesName &&
          !matchesSku &&
          !matchesCode &&
          !matchesBrand &&
          !matchesSubCat
        ) {
          return false;
        }
      }

      // 2. Category Filter
      if (
        selectedCategory !== "ALL" &&
        product.categoryEnum !== selectedCategory
      ) {
        return false;
      }

      // 3. SubCategory Filter
      if (
        selectedSubCategories.length > 0 &&
        (!product.subCategoryId ||
          !selectedSubCategories.includes(product.subCategoryId))
      ) {
        return false;
      }

      // 4. Brand Filter
      if (
        selectedBrands.length > 0 &&
        (!product.brandId || !selectedBrands.includes(product.brandId))
      ) {
        return false;
      }

      // 5. In Stock Only
      if (inStockOnly && product.isStockOut) {
        return false;
      }

      // 6. On Sale Only
      if (
        onSaleOnly &&
        (!product.discountPercent || product.discountPercent <= 0)
      ) {
        return false;
      }

      // 7. Price Range
      if (
        product.numericPrice < selectedPriceRange[0] ||
        product.numericPrice > selectedPriceRange[1]
      ) {
        return false;
      }

      return true;
    });
  }, [
    initialProducts,
    searchQuery,
    selectedCategory,
    selectedSubCategories,
    selectedBrands,
    inStockOnly,
    onSaleOnly,
    selectedPriceRange,
  ]);

  // Sorting Logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortOption) {
      case "PRICE_ASC":
        return list.sort((a, b) => a.numericPrice - b.numericPrice);
      case "PRICE_DESC":
        return list.sort((a, b) => b.numericPrice - a.numericPrice);
      case "NAME_ASC":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "NAME_DESC":
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case "DISCOUNT_DESC":
        return list.sort(
          (a, b) => (b.discountPercent || 0) - (a.discountPercent || 0),
        );
      case "NEWEST":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [filteredProducts, sortOption]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "ALL" ||
    selectedSubCategories.length > 0 ||
    selectedBrands.length > 0 ||
    inStockOnly ||
    onSaleOnly ||
    selectedPriceBracket !== null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Banner with ample top padding to clear fixed header */}
      <section className="relative w-full pt-28 sm:pt-32 md:pt-36 pb-10 sm:pb-14 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[4rem] flex items-center justify-center overflow-hidden px-4 text-center shadow-xs">
        {/* Paw Prints Artwork */}
        <PawPrint
          className="absolute -right-8 top-6 text-[#B2E2FF] opacity-35 rotate-12 pointer-events-none"
          style={{ width: "180px", height: "180px" }}
        />
        <PawPrint
          className="absolute left-6 bottom-2 text-[#B2E2FF] opacity-20 -rotate-12 pointer-events-none"
          style={{ width: "130px", height: "130px" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <Sparkles className="w-3.5 h-3.5" />
            Complete Pet Marketplace
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            All Pet{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Products
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
            Discover authentic feline & canine nutrition, anti-fungal grooming
            care, handcrafted dresses, collars, and engaging toys.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-bold text-gray-800 border border-[#B2E2FF]/80 shadow-2xs">
              <Package className="h-3.5 w-3.5 text-[#56C8D8]" />
              {initialProducts.length} Total Products
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs text-xs font-bold text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              100% Genuine Guaranteed
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto mt-8 sm:mt-10">
        {/* Category Horizontal Quick Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-gray-100">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedSubCategories([]);
              setCurrentPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer",
              selectedCategory === "ALL"
                ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-xs scale-105"
                : "bg-[#F0F8FF]/80 text-gray-700 border-[#D4EEFC] hover:bg-white",
            )}
          >
            All Categories ({initialProducts.length})
          </button>

          {filterMeta.categories.map((cat) => {
            const isActive = selectedCategory === cat.enumValue;
            return (
              <button
                key={cat.enumValue}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.enumValue);
                  setSelectedSubCategories([]);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer",
                  isActive
                    ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-xs scale-105"
                    : "bg-[#F0F8FF]/80 text-gray-700 border-[#D4EEFC] hover:bg-white",
                )}
              >
                {cat.title} ({cat.count})
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Active Counts, Sort & View Mode */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-5 border-b border-gray-100">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products by name, code, SKU..."
              className="h-10 pl-9 pr-8 text-xs sm:text-sm bg-[#F0F8FF]/80 border-[#D4EEFC] rounded-2xl focus-visible:ring-[#56C8D8]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Sort & Mobile Filter & View Mode */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
            {/* Mobile Filter Button */}
            <Sheet
              open={isMobileFilterOpen}
              onOpenChange={setIsMobileFilterOpen}
            >
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden rounded-2xl border-[#D4EEFC] bg-[#F0F8FF] text-gray-800 text-xs font-bold gap-1.5 h-10 px-3 cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5 text-[#56C8D8]" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-[#56C8D8]" />
                    )}
                  </Button>
                }
              />
              <SheetContent
                side="left"
                className="w-[85vw] max-w-sm p-6 overflow-y-auto"
              >
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="text-lg font-black text-gray-900 flex items-center justify-between">
                    <span>Product Filters</span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleClearAllFilters}
                        className="text-xs text-[#56C8D8] font-bold hover:underline"
                      >
                        Reset All
                      </button>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-gray-500">
                    Refine results by price, brand, or availability
                  </SheetDescription>
                </SheetHeader>

                <div className="py-4">
                  <FilterSidebarContent
                    filterMeta={filterMeta}
                    availableSubCategories={availableSubCategories}
                    selectedSubCategories={selectedSubCategories}
                    onSubCategoryToggle={handleSubCategoryToggle}
                    selectedBrands={selectedBrands}
                    onBrandToggle={handleBrandToggle}
                    inStockOnly={inStockOnly}
                    onInStockToggle={() => setInStockOnly((prev) => !prev)}
                    onSaleOnly={onSaleOnly}
                    onSaleToggle={() => setOnSaleOnly((prev) => !prev)}
                    selectedPriceBracket={selectedPriceBracket}
                    onPriceBracket={handlePriceBracket}
                    onClearAll={handleClearAllFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#56C8D8]" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="NEWEST">Newest Arrivals</option>
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="NAME_ASC">Name: A to Z</option>
                <option value="NAME_DESC">Name: Z to A</option>
                <option value="DISCOUNT_DESC">Highest Discounts</option>
              </select>
            </div>

            {/* Layout Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl p-1 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("GRID")}
                className={cn(
                  "p-1.5 rounded-xl transition-all cursor-pointer",
                  viewMode === "GRID"
                    ? "bg-white text-[#56C8D8] shadow-xs"
                    : "text-gray-500 hover:text-gray-800",
                )}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={cn(
                  "p-1.5 rounded-xl transition-all cursor-pointer",
                  viewMode === "LIST"
                    ? "bg-white text-[#56C8D8] shadow-xs"
                    : "text-gray-500 hover:text-gray-800",
                )}
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap py-3 border-b border-gray-100 text-xs font-bold">
            <span className="text-gray-400">Active Filters:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-[#F0F8FF] text-gray-800 border border-[#D4EEFC] px-2.5 py-1 rounded-full">
                <span>&quot;{searchQuery}&quot;</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setSearchQuery("")}
                />
              </span>
            )}

            {selectedCategory !== "ALL" && (
              <span className="inline-flex items-center gap-1 bg-[#56C8D8]/10 text-[#56C8D8] border border-[#56C8D8]/30 px-2.5 py-1 rounded-full">
                <span>
                  {filterMeta.categories.find(
                    (c) => c.enumValue === selectedCategory,
                  )?.title || selectedCategory}
                </span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setSelectedCategory("ALL")}
                />
              </span>
            )}

            {selectedSubCategories.map((subId) => {
              const sub = filterMeta.subCategories.find((s) => s.id === subId);
              return (
                <span
                  key={subId}
                  className="inline-flex items-center gap-1 bg-[#F0F8FF] text-gray-800 border border-[#D4EEFC] px-2.5 py-1 rounded-full"
                >
                  <span>{sub?.name || "SubCategory"}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-500"
                    onClick={() => handleSubCategoryToggle(subId)}
                  />
                </span>
              );
            })}

            {selectedBrands.map((brandId) => {
              const b = filterMeta.brands.find((br) => br.id === brandId);
              return (
                <span
                  key={brandId}
                  className="inline-flex items-center gap-1 bg-[#F0F8FF] text-gray-800 border border-[#D4EEFC] px-2.5 py-1 rounded-full"
                >
                  <span>{b?.name || "Brand"}</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-rose-500"
                    onClick={() => handleBrandToggle(brandId)}
                  />
                </span>
              );
            })}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span>In Stock Only</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setInStockOnly(false)}
                />
              </span>
            )}

            {onSaleOnly && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full">
                <span>On Sale Only</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => setOnSaleOnly(false)}
                />
              </span>
            )}

            {selectedPriceBracket && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                <span>{selectedPriceBracket}</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:text-rose-500"
                  onClick={() => {
                    setSelectedPriceBracket(null);
                    setSelectedPriceRange([0, filterMeta.maxPrice || 5000]);
                  }}
                />
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAllFilters}
              className="text-[#56C8D8] hover:underline ml-auto font-black cursor-pointer text-xs"
            >
              Clear All
            </button>
          </div>
        )}

        {/* 2-Column Layout: Desktop Filters Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-28 bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4EEFC]">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#56C8D8]" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="text-xs text-[#56C8D8] font-bold hover:underline"
                  >
                    Reset All
                  </button>
                )}
              </div>

              <FilterSidebarContent
                filterMeta={filterMeta}
                availableSubCategories={availableSubCategories}
                selectedSubCategories={selectedSubCategories}
                onSubCategoryToggle={handleSubCategoryToggle}
                selectedBrands={selectedBrands}
                onBrandToggle={handleBrandToggle}
                inStockOnly={inStockOnly}
                onInStockToggle={() => setInStockOnly((prev) => !prev)}
                onSaleOnly={onSaleOnly}
                onSaleToggle={() => setOnSaleOnly((prev) => !prev)}
                selectedPriceBracket={selectedPriceBracket}
                onPriceBracket={handlePriceBracket}
                onClearAll={handleClearAllFilters}
              />
            </div>
          </aside>

          {/* Products Content Area */}
          <main className="lg:col-span-9 space-y-6">
            {/* Results Counter */}
            <div className="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>
                Showing{" "}
                {sortedProducts.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
                –{Math.min(currentPage * itemsPerPage, sortedProducts.length)}{" "}
                of {sortedProducts.length} items
              </span>

              <div className="flex items-center gap-2">
                <span>Items per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-xl px-2 py-1 text-xs font-bold text-gray-700 focus:outline-none"
                >
                  <option value={12}>12</option>
                  <option value={16}>16</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </div>
            </div>

            {/* Empty State */}
            {sortedProducts.length === 0 ? (
              <div className="bg-[#F0F8FF]/60 border border-dashed border-[#D4EEFC] rounded-3xl p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white border border-[#D4EEFC] text-gray-400 flex items-center justify-center mx-auto shadow-2xs">
                  <Package className="w-8 h-8 stroke-1" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900">
                    No products matched your filters
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-sm mx-auto">
                    Try adjusting your search terms, clearing specific filters,
                    or exploring other categories.
                  </p>
                </div>
                <Button
                  onClick={handleClearAllFilters}
                  className="rounded-full bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-bold text-xs px-6 py-2 shadow-md border-0"
                >
                  Reset All Filters
                </Button>
              </div>
            ) : viewMode === "GRID" ? (
              /* Grid Layout: 2 on mobile, 3 on tablet, 4 on laptop/desktop */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {paginatedProducts.map((product) => (
                  <StoreProductCard key={product.id} item={product} />
                ))}
              </div>
            ) : (
              /* List Layout */
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <StoreProductListCard key={product.id} item={product} />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="rounded-xl border-[#D4EEFC] text-xs font-bold"
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => {
                    const isCurrent = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer border",
                          isCurrent
                            ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-xs"
                            : "bg-[#F0F8FF] text-gray-700 border-[#D4EEFC] hover:bg-white",
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="rounded-xl border-[#D4EEFC] text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Subcomponents: Filter Sidebar Content
function FilterSidebarContent({
  filterMeta,
  availableSubCategories,
  selectedSubCategories,
  onSubCategoryToggle,
  selectedBrands,
  onBrandToggle,
  inStockOnly,
  onInStockToggle,
  onSaleOnly,
  onSaleToggle,
  selectedPriceBracket,
  onPriceBracket,
  onClearAll,
}: {
  filterMeta: StoreFilterMeta;
  availableSubCategories: StoreFilterMeta["subCategories"];
  selectedSubCategories: string[];
  onSubCategoryToggle: (id: string) => void;
  selectedBrands: string[];
  onBrandToggle: (id: string) => void;
  inStockOnly: boolean;
  onInStockToggle: () => void;
  onSaleOnly: boolean;
  onSaleToggle: () => void;
  selectedPriceBracket: string | null;
  onPriceBracket: (bracket: string, min: number, max: number) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="space-y-6 text-xs font-semibold text-gray-700">
      {/* Availability & Deals Toggles */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
          Product Status
        </span>

        <label className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#D4EEFC] cursor-pointer hover:border-[#56C8D8] transition-all">
          <span className="font-bold text-gray-800">In Stock Only</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onInStockToggle}
            className="w-4 h-4 rounded text-[#56C8D8] focus:ring-[#56C8D8] cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-[#D4EEFC] cursor-pointer hover:border-[#56C8D8] transition-all">
          <span className="font-bold text-gray-800">On Sale / Deals 🔥</span>
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={onSaleToggle}
            className="w-4 h-4 rounded text-[#56C8D8] focus:ring-[#56C8D8] cursor-pointer"
          />
        </label>
      </div>

      {/* Quick Price Brackets */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
          Price Bracket
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Under ৳500", min: 0, max: 500 },
            { label: "৳500–৳1000", min: 500, max: 1000 },
            { label: "৳1000–৳2000", min: 1000, max: 2000 },
            { label: "Above ৳2000", min: 2000, max: 10000 },
          ].map((b) => {
            const isActive = selectedPriceBracket === b.label;
            return (
              <button
                key={b.label}
                type="button"
                onClick={() => onPriceBracket(b.label, b.min, b.max)}
                className={cn(
                  "p-2 rounded-xl text-center text-[11px] font-bold transition-all border cursor-pointer",
                  isActive
                    ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-2xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#56C8D8]",
                )}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SubCategories (if any) */}
      {availableSubCategories.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
            Sub Categories
          </span>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {availableSubCategories.map((sub) => {
              const isChecked = selectedSubCategories.includes(sub.id);
              return (
                <label
                  key={sub.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[170px] text-gray-800">
                    {sub.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">
                      ({sub.count})
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onSubCategoryToggle(sub.id)}
                      className="w-3.5 h-3.5 rounded text-[#56C8D8] focus:ring-[#56C8D8] cursor-pointer"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Brands Filter */}
      {filterMeta.brands.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
            Featured Brands
          </span>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {filterMeta.brands.map((b) => {
              const isChecked = selectedBrands.includes(b.id);
              return (
                <label
                  key={b.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                >
                  <span className="truncate max-w-[170px] text-gray-800 font-bold">
                    {b.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">
                      ({b.count})
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onBrandToggle(b.id)}
                      className="w-3.5 h-3.5 rounded text-[#56C8D8] focus:ring-[#56C8D8] cursor-pointer"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Product Grid Card
function StoreProductCard({ item }: { item: FilterableStoreProduct }) {
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
      <div className="w-full h-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl sm:rounded-[2rem] p-2.5 sm:p-4 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-xl transition-all duration-300 group-hover:border-[#56C8D8]/50 cursor-pointer">
        {/* White Image Frame */}
        <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-white p-2 sm:p-3 border border-gray-100 flex items-center justify-center mb-2.5 sm:mb-3 overflow-hidden group-hover:border-[#56C8D8]/30 transition-all shadow-xs">
          {!imageError && item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
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

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {item.discountPercent && item.discountPercent > 0 && (
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
                "w-4 h-4 transition-colors",
                isWishlisted ? "fill-rose-500" : "",
              )}
            />
          </button>
        </div>

        {/* Subcategory Label */}
        {item.subCategoryName && (
          <p className="text-[11px] font-semibold text-[#56C8D8] truncate max-w-[180px] mb-1">
            {item.subCategoryName}
          </p>
        )}

        {/* Product Title */}
        <h3 className="text-xs sm:text-sm font-black text-gray-900 line-clamp-2 min-h-10 flex items-center justify-center text-center mb-2 leading-snug group-hover:text-[#56C8D8] transition-colors">
          {item.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {item.originalPrice && (
            <span className="text-xs text-gray-400 font-bold line-through">
              {item.originalPrice}
            </span>
          )}
          <span className="text-sm sm:text-base text-gray-900 font-black">
            {item.price}
          </span>
        </div>

        {/* CTA Button */}
        <div className="w-full mt-auto">
          <div className="w-full border-2 border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-black text-[10px] sm:text-xs tracking-wider uppercase rounded-2xl py-2 px-3 transition-all shadow-xs text-center">
            {item.isVariable ? "SELECT OPTIONS" : "VIEW PRODUCT"}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Product List Card
function StoreProductListCard({ item }: { item: FilterableStoreProduct }) {
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
    <Link href={`/product/${productSlug}`} className="block group select-none">
      <div className="w-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2rem] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 shadow-xs hover:shadow-xl transition-all duration-300 group-hover:border-[#56C8D8]/50 cursor-pointer">
        {/* Image Box */}
        <div className="relative w-32 sm:w-36 h-32 sm:h-36 rounded-2xl bg-white p-3 border border-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
          {!imageError && item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="144px"
              className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={item.image.startsWith("data:")}
            />
          ) : (
            <Package className="w-10 h-10 text-gray-300 stroke-1" />
          )}

          {item.discountPercent && item.discountPercent > 0 && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 uppercase">
              <Flame className="h-2.5 w-2.5" />
              {item.discountPercent}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-[#56C8D8]">
            {item.categoryName && <span>{item.categoryName}</span>}
            {item.subCategoryName && (
              <>
                <span>•</span>
                <span className="text-gray-500">{item.subCategoryName}</span>
              </>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-gray-900 group-hover:text-[#56C8D8] transition-colors leading-snug">
            {item.name}
          </h3>

          {item.shortDescription && (
            <p className="text-xs text-gray-600 line-clamp-2 font-medium">
              {item.shortDescription}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            {item.originalPrice && (
              <span className="text-xs text-gray-400 font-bold line-through">
                {item.originalPrice}
              </span>
            )}
            <span className="text-base sm:text-lg text-gray-900 font-black">
              {item.price}
            </span>
            {item.brandName && (
              <Badge
                variant="outline"
                className="text-[10px] bg-white border-gray-200 text-gray-600 font-bold"
              >
                {item.brandName}
              </Badge>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              "p-2.5 rounded-full bg-white border border-gray-100 transition-all cursor-pointer",
              isWishlisted
                ? "text-rose-500"
                : "text-gray-400 hover:text-rose-500",
            )}
            aria-label="Add to wishlist"
          >
            <Heart
              className={cn(
                "w-4 h-4",
                isWishlisted ? "fill-rose-500 text-rose-500" : "",
              )}
            />
          </button>

          <div className="flex-1 sm:flex-initial border-2 border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-black text-xs tracking-wider uppercase rounded-2xl py-2.5 px-5 transition-all text-center">
            {item.isVariable ? "OPTIONS" : "VIEW"}
          </div>
        </div>
      </div>
    </Link>
  );
}
