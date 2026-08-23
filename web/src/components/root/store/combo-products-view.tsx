"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles,
  Flame,
  Package,
  Layers,
  X,
  Filter,
  CheckCircle2,
  ShoppingCart,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Gift,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackMetaPixelEvent, generateBrowserEventId } from "@/lib/meta-pixel";
import { trackMetaSearchAction } from "@/actions/meta";
import type {
  StoreComboProduct,
  StoreComboFilterMeta,
} from "@/actions/store/combo-products/get-all";
import type { ComboSortOption } from "@/schemas/store/combo-products";

const ITEMS_PER_PAGE = 12;

interface ComboProductsViewProps {
  initialCombos: StoreComboProduct[];
  filterMeta: StoreComboFilterMeta;
  initialSearchQuery?: string;
  initialSort?: ComboSortOption;
}

export function ComboProductsView({
  initialCombos,
  filterMeta,
  initialSearchQuery = "",
  initialSort = "NEWEST",
}: ComboProductsViewProps) {
  const { addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [minPrice, setMinPrice] = useState<number>(filterMeta.minPrice || 0);
  const [maxPrice, setMaxPrice] = useState<number>(
    filterMeta.maxPrice || 10000,
  );
  const [stockFilter, setStockFilter] = useState<
    "ALL" | "IN_STOCK" | "OUT_OF_STOCK"
  >("ALL");
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<ComboSortOption>(initialSort);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Debounced search tracking for Meta Pixel
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length >= 2) {
      const timer = setTimeout(() => {
        const eventId = generateBrowserEventId("srch");
        trackMetaPixelEvent(
          "Search",
          {
            search_string: q,
            content_category: "Combo Deals",
          },
          eventId,
        );
        trackMetaSearchAction({ query: q, eventId }).catch(() => {});
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Filtering Logic
  const filteredCombos = useMemo(() => {
    return initialCombos.filter((combo) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = combo.name.toLowerCase().includes(query);
        const matchesCode = combo.code.toLowerCase().includes(query);
        const matchesDesc = (combo.description || "")
          .toLowerCase()
          .includes(query);
        const matchesIncluded = combo.includedItems.some((item) =>
          item.name.toLowerCase().includes(query),
        );

        if (!matchesName && !matchesCode && !matchesDesc && !matchesIncluded) {
          return false;
        }
      }

      // 2. Price Range
      if (combo.numericPrice < minPrice || combo.numericPrice > maxPrice) {
        return false;
      }

      // 3. Stock Status
      if (stockFilter === "IN_STOCK" && !combo.isAvailable) {
        return false;
      }
      if (stockFilter === "OUT_OF_STOCK" && combo.isAvailable) {
        return false;
      }

      // 4. Min Discount
      if (minDiscount > 0) {
        if (!combo.discountPercent || combo.discountPercent < minDiscount) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialCombos,
    searchQuery,
    minPrice,
    maxPrice,
    stockFilter,
    minDiscount,
  ]);

  // Sorting Logic
  const sortedCombos = useMemo(() => {
    const list = [...filteredCombos];
    switch (sortBy) {
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
      case "SAVINGS_DESC":
        return list.sort(
          (a, b) => (b.savingsAmount || 0) - (a.savingsAmount || 0),
        );
      case "NEWEST":
      default:
        return list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [filteredCombos, sortBy]);

  // Pagination Slice
  const totalPages = Math.ceil(sortedCombos.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedCombos = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return sortedCombos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedCombos, safeCurrentPage]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      minPrice > (filterMeta.minPrice || 0) ||
      maxPrice < (filterMeta.maxPrice || 10000) ||
      stockFilter !== "ALL" ||
      minDiscount > 0
    );
  }, [searchQuery, minPrice, maxPrice, stockFilter, minDiscount, filterMeta]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setMinPrice(filterMeta.minPrice || 0);
    setMaxPrice(filterMeta.maxPrice || 10000);
    setStockFilter("ALL");
    setMinDiscount(0);
    setSortBy("NEWEST");
    setCurrentPage(1);
  };

  const handleAddToCart = async (
    combo: StoreComboProduct,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!combo.isAvailable) {
      toast.error("This bundle is currently out of stock.");
      return;
    }

    setAddingId(combo.id);
    try {
      const success = await addToCart({
        comboProductId: combo.id,
        quantity: 1,
      });
      if (success) {
        const eventId = generateBrowserEventId("atc");
        trackMetaPixelEvent(
          "AddToCart",
          {
            content_name: combo.name,
            content_ids: [combo.id],
            content_type: "product_group",
            value: combo.numericPrice,
            currency: "BDT",
          },
          eventId,
        );
      }
    } catch {
      toast.error("Could not add bundle to cart.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. HERO HEADER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F0F8FF] via-[#E5F4FD]/50 to-white pt-28 pb-10 sm:pt-36 sm:pb-14 border-b border-[#D4EEFC]/60">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-20 w-96 h-96 bg-[#56C8D8]/15 rounded-full blur-3xl" />
          <div className="absolute top-10 right-0 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl" />
        </div>

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            {/* Promo Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-black uppercase tracking-wider shadow-2xs">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>Curated Value Bundles</span>
            </div>

            {/* Headline with Chewy Font */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              Combo{" "}
              <span
                className="text-[#56C8D8] font-[family-name:var(--font-chewy)] tracking-wider inline-block text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ fontFamily: "var(--font-chewy), cursive" }}
              >
                Deals
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
              Explore hand-picked bundles combining top nutrition, anti-fungal
              grooming care, royal apparel, and interactive toys at massive
              discounts.
            </p>

            {/* Quick Hero Search Bar */}
            <div className="pt-2 max-w-lg mx-auto">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bundles by name, product or SKU..."
                  className="h-12 pl-11 pr-10 rounded-full bg-white border-gray-200 shadow-md text-xs sm:text-sm font-medium placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#56C8D8]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats Overview Pill */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold text-gray-600">
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                <Gift className="w-3.5 h-3.5 text-[#56C8D8]" />
                {filterMeta.totalCombos} Bundles Available
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Up to 40% Bundle Savings
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
                <Package className="w-3.5 h-3.5 text-orange-500" />
                {filterMeta.inStockCount} In-Stock Bundles
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN CATALOG CONTENT */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* DESKTOP SIDEBAR FILTER */}
            <aside className="hidden lg:block lg:col-span-1 space-y-6">
              <div className="sticky top-28 space-y-6 p-6 rounded-3xl bg-[#F0F8FF]/60 border border-[#D4EEFC] shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#D4EEFC]">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#56C8D8]" />
                    Filter Bundles
                  </h3>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                {/* Filter 1: Stock Status */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-gray-800 block">
                    Stock Availability
                  </label>
                  <div className="space-y-1.5">
                    {[
                      {
                        id: "ALL",
                        label: "All Bundles",
                        count: initialCombos.length,
                      },
                      {
                        id: "IN_STOCK",
                        label: "In Stock Only",
                        count: filterMeta.inStockCount,
                      },
                      {
                        id: "OUT_OF_STOCK",
                        label: "Out of Stock",
                        count: filterMeta.outOfStockCount,
                      },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          setStockFilter(st.id as typeof stockFilter)
                        }
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                          stockFilter === st.id
                            ? "bg-[#56C8D8] text-white shadow-xs font-bold"
                            : "bg-white/80 hover:bg-white text-gray-700 border border-gray-100",
                        )}
                      >
                        <span>{st.label}</span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded-full",
                            stockFilter === st.id
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {st.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter 2: Price Range */}
                <div className="space-y-3 pt-3 border-t border-[#D4EEFC]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800">
                      Price Range (৳)
                    </label>
                    <span className="text-[11px] font-mono font-bold text-[#0097a7]">
                      ৳{minPrice} - ৳{maxPrice}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                        Min Price
                      </span>
                      <Input
                        type="number"
                        value={minPrice}
                        min={filterMeta.minPrice}
                        max={maxPrice}
                        onChange={(e) =>
                          setMinPrice(Number(e.target.value) || 0)
                        }
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                        Max Price
                      </span>
                      <Input
                        type="number"
                        value={maxPrice}
                        min={minPrice}
                        max={filterMeta.maxPrice || 10000}
                        onChange={(e) =>
                          setMaxPrice(Number(e.target.value) || 10000)
                        }
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter 3: Minimum Discount */}
                <div className="space-y-2.5 pt-3 border-t border-[#D4EEFC]">
                  <label className="text-xs font-bold text-gray-800 block">
                    Special Discount
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { value: 0, label: "Any Deal" },
                      { value: 10, label: "10%+ OFF" },
                      { value: 20, label: "20%+ OFF" },
                      { value: 30, label: "30%+ OFF" },
                    ].map((disc) => (
                      <button
                        key={disc.value}
                        type="button"
                        onClick={() => setMinDiscount(disc.value)}
                        className={cn(
                          "p-2 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer",
                          minDiscount === disc.value
                            ? "bg-orange-500 text-white font-bold shadow-xs"
                            : "bg-white/80 hover:bg-white text-gray-700 border border-gray-100",
                        )}
                      >
                        {disc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Campaign Info Card */}
                {filterMeta.availableCampaigns.length > 0 && (
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-300/40 text-xs space-y-1.5">
                    <span className="font-black text-amber-900 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Live Offers Active
                    </span>
                    <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                      Select bundles with campaign tags to get extra cart
                      discounts &amp; gift perks.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* MAIN RESULTS COLUMN */}
            <main className="lg:col-span-3 space-y-6">
              {/* Controls Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200/80">
                {/* Left Results Counter & Mobile Filter Toggle */}
                <div className="flex items-center gap-3">
                  {/* Mobile Sheet Trigger */}
                  <Sheet
                    open={mobileFilterOpen}
                    onOpenChange={setMobileFilterOpen}
                  >
                    <SheetTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          className="lg:hidden h-9 text-xs font-bold gap-1.5 border-gray-300 bg-white"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#56C8D8]" />
                          <span>Filters</span>
                          {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-[#56C8D8]" />
                          )}
                        </Button>
                      }
                    />
                    <SheetContent
                      side="left"
                      className="p-6 bg-white overflow-y-auto max-w-xs"
                    >
                      <SheetHeader className="text-left pb-4 border-b border-gray-100">
                        <SheetTitle className="text-base font-black text-gray-900 flex items-center gap-2">
                          <Filter className="w-4 h-4 text-[#56C8D8]" />
                          Filter Bundles
                        </SheetTitle>
                        <SheetDescription className="text-xs text-gray-500">
                          Narrow down by stock, price range and savings.
                        </SheetDescription>
                      </SheetHeader>

                      <div className="py-6 space-y-6">
                        {/* Mobile Stock */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-800">
                            Availability
                          </label>
                          <div className="space-y-1">
                            {[
                              { id: "ALL", label: "All Bundles" },
                              { id: "IN_STOCK", label: "In Stock Only" },
                              { id: "OUT_OF_STOCK", label: "Out of Stock" },
                            ].map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  setStockFilter(st.id as typeof stockFilter);
                                }}
                                className={cn(
                                  "w-full text-left p-2 rounded-xl text-xs font-semibold",
                                  stockFilter === st.id
                                    ? "bg-[#56C8D8] text-white"
                                    : "bg-gray-50 text-gray-700",
                                )}
                              >
                                {st.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Mobile Price */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-800">
                            Price Range (৳)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              value={minPrice}
                              onChange={(e) =>
                                setMinPrice(Number(e.target.value) || 0)
                              }
                              className="h-8 text-xs"
                              placeholder="Min"
                            />
                            <Input
                              type="number"
                              value={maxPrice}
                              onChange={(e) =>
                                setMaxPrice(Number(e.target.value) || 10000)
                              }
                              className="h-8 text-xs"
                              placeholder="Max"
                            />
                          </div>
                        </div>

                        {/* Mobile Discount */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-800">
                            Min Discount
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { value: 0, label: "Any" },
                              { value: 10, label: "10%+ OFF" },
                              { value: 20, label: "20%+ OFF" },
                              { value: 30, label: "30%+ OFF" },
                            ].map((disc) => (
                              <button
                                key={disc.value}
                                type="button"
                                onClick={() => setMinDiscount(disc.value)}
                                className={cn(
                                  "p-2 rounded-xl text-xs font-semibold",
                                  minDiscount === disc.value
                                    ? "bg-orange-500 text-white font-bold"
                                    : "bg-gray-50 text-gray-700",
                                )}
                              >
                                {disc.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                          <Button
                            type="button"
                            onClick={() => setMobileFilterOpen(false)}
                            className="flex-1 bg-[#56C8D8] text-white text-xs font-bold rounded-xl"
                          >
                            Apply Filters
                          </Button>
                          {hasActiveFilters && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleResetFilters}
                              className="text-xs font-bold text-rose-600 rounded-xl"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div>
                    <span className="text-xs font-black text-gray-900 block">
                      Showing {sortedCombos.length} Bundle
                      {sortedCombos.length === 1 ? "" : "s"}
                    </span>
                    {hasActiveFilters && (
                      <span className="text-[11px] text-gray-500">
                        Filters active on {initialCombos.length} total
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Sort & View Controls */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Sorting Select */}
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-xs font-bold text-gray-500">
                      Sort:
                    </span>
                    <Select
                      value={sortBy}
                      onValueChange={(val) => setSortBy(val as ComboSortOption)}
                    >
                      <SelectTrigger className="h-9 text-xs font-semibold bg-white border-gray-200 w-44 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="NEWEST">Newest Added</SelectItem>
                        <SelectItem value="SAVINGS_DESC">
                          Biggest Savings (৳)
                        </SelectItem>
                        <SelectItem value="DISCOUNT_DESC">
                          Highest Discount (%)
                        </SelectItem>
                        <SelectItem value="PRICE_ASC">
                          Price: Low to High
                        </SelectItem>
                        <SelectItem value="PRICE_DESC">
                          Price: High to Low
                        </SelectItem>
                        <SelectItem value="NAME_ASC">Name: A to Z</SelectItem>
                        <SelectItem value="NAME_DESC">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center p-1 bg-gray-200/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors cursor-pointer",
                        viewMode === "grid"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-800",
                      )}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors cursor-pointer",
                        viewMode === "list"
                          ? "bg-white text-gray-900 shadow-2xs"
                          : "text-gray-500 hover:text-gray-800",
                      )}
                      aria-label="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filter Pills Bar */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Active:
                  </span>

                  {searchQuery.trim() && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold gap-1.5 bg-[#F0F8FF] border border-[#D4EEFC] text-gray-800"
                    >
                      Search: &ldquo;{searchQuery}&rdquo;
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-rose-600"
                        onClick={() => setSearchQuery("")}
                      />
                    </Badge>
                  )}

                  {stockFilter !== "ALL" && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold gap-1.5 bg-[#F0F8FF] border border-[#D4EEFC] text-gray-800"
                    >
                      {stockFilter === "IN_STOCK" ? "In Stock" : "Out of Stock"}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-rose-600"
                        onClick={() => setStockFilter("ALL")}
                      />
                    </Badge>
                  )}

                  {(minPrice > (filterMeta.minPrice || 0) ||
                    maxPrice < (filterMeta.maxPrice || 10000)) && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold gap-1.5 bg-[#F0F8FF] border border-[#D4EEFC] text-gray-800"
                    >
                      ৳{minPrice} - ৳{maxPrice}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-rose-600"
                        onClick={() => {
                          setMinPrice(filterMeta.minPrice || 0);
                          setMaxPrice(filterMeta.maxPrice || 10000);
                        }}
                      />
                    </Badge>
                  )}

                  {minDiscount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold gap-1.5 bg-orange-50 border border-orange-200 text-orange-700"
                    >
                      {minDiscount}%+ Discount
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-rose-600"
                        onClick={() => setMinDiscount(0)}
                      />
                    </Badge>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-rose-600 hover:underline ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* 3. PRODUCT LISTING */}
              {paginatedCombos.length === 0 ? (
                /* EMPTY STATE */
                <div className="py-16 px-4 rounded-3xl bg-gray-50 border border-dashed border-gray-200 text-center space-y-4">
                  <div className="relative w-36 h-36 mx-auto">
                    <Image
                      src="/search.gif"
                      alt="No combo deals found"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h3 className="text-base font-black text-gray-900">
                      No Combo Deals Found
                    </h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      We couldn&apos;t find any bundles matching your current
                      filters. Try widening your price range or clearing the
                      search terms.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleResetFilters}
                    className="bg-[#56C8D8] hover:bg-[#38bdf8] text-white text-xs font-bold rounded-full px-6 shadow-md"
                  >
                    Reset All Filters
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paginatedCombos.map((combo) => (
                    <ComboGridCard
                      key={combo.id}
                      combo={combo}
                      isAdding={addingId === combo.id}
                      onAddToCart={(e) => handleAddToCart(combo, e)}
                    />
                  ))}
                </div>
              ) : (
                /* LIST VIEW */
                <div className="space-y-4">
                  {paginatedCombos.map((combo) => (
                    <ComboListCard
                      key={combo.id}
                      combo={combo}
                      isAdding={addingId === combo.id}
                      onAddToCart={(e) => handleAddToCart(combo, e)}
                    />
                  ))}
                </div>
              )}

              {/* 4. PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-semibold">
                    Page {safeCurrentPage} of {totalPages}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 text-xs font-bold rounded-xl gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </Button>

                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={cn(
                              "w-8 h-8 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                              safeCurrentPage === pageNum
                                ? "bg-[#56C8D8] text-white shadow-xs"
                                : "text-gray-600 hover:bg-gray-100",
                            )}
                          >
                            {pageNum}
                          </button>
                        ),
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="h-8 text-xs font-bold rounded-xl gap-1"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// GRID CARD COMPONENT
// -------------------------------------------------------------
function ComboGridCard({
  combo,
  isAdding,
  onAddToCart,
}: {
  combo: StoreComboProduct;
  isAdding: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const comboSlug = combo.slug || combo.id;

  return (
    <div className="group rounded-3xl bg-white border border-gray-200/90 hover:border-[#56C8D8]/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top Badges Row */}
      <div className="p-4 pb-0 flex items-start justify-between gap-2 z-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="bg-[#56C8D8] hover:bg-[#56C8D8] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
            COMBO DEAL
          </Badge>

          {combo.campaignBadge && (
            <Badge className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-2xs gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              {combo.campaignBadge.badgeText}
            </Badge>
          )}

          {combo.discountPercent && combo.discountPercent > 0 && (
            <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs gap-0.5">
              <Flame className="h-2.5 w-2.5" />
              {combo.discountPercent}% OFF
            </Badge>
          )}
        </div>

        {/* Stock Status Badge */}
        {!combo.isAvailable ? (
          <Badge
            variant="outline"
            className="text-[10px] font-bold bg-gray-100 text-gray-500 border-gray-200 shrink-0"
          >
            Sold Out
          </Badge>
        ) : combo.bundleStockCapacity <= 5 ? (
          <Badge
            variant="outline"
            className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200 shrink-0"
          >
            Only {combo.bundleStockCapacity} Left
          </Badge>
        ) : null}
      </div>

      {/* Main Image Link */}
      <Link
        href={`/product/${comboSlug}`}
        className="block px-4 pt-3 group/img"
      >
        <div className="relative w-full aspect-square rounded-2xl bg-radial from-[#F0F8FF] to-white border border-gray-100 flex items-center justify-center overflow-hidden p-3 shadow-inner">
          {!imageError && combo.image ? (
            <Image
              src={combo.image}
              alt={combo.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain p-2 group-hover/img:scale-105 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized={combo.image.startsWith("data:")}
            />
          ) : (
            <Package className="w-12 h-12 text-[#56C8D8]/50" />
          )}

          {/* Bundled Items Count Pill */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 shadow-xs">
              <Layers className="h-3 w-3 text-[#56C8D8]" />
              {combo.itemsCount} Items Bundle
            </span>
          </div>
        </div>
      </Link>

      {/* Details Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <Link href={`/product/${comboSlug}`}>
            <h3 className="text-sm sm:text-base font-black text-gray-900 hover:text-[#56C8D8] transition-colors line-clamp-1">
              {combo.name}
            </h3>
          </Link>

          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed font-medium">
            {combo.description ||
              "Curated value package combining our favorite essentials."}
          </p>

          {/* Included Items Mini-List */}
          {combo.includedItems.length > 0 && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-1">
                {combo.includedItems.slice(0, 3).map((item, idx) => (
                  <span
                    key={`${item.id}-${idx}`}
                    className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200/80 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 max-w-[130px] truncate"
                    title={item.name}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </span>
                ))}
                {combo.includedItems.length > 3 && (
                  <span className="text-[10px] font-bold text-[#56C8D8] self-center">
                    +{combo.includedItems.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Savings Box */}
        <div className="pt-2 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Bundle Price
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-gray-900">
                  {combo.price}
                </span>
                {combo.originalPrice && (
                  <span className="text-xs text-gray-400 font-bold line-through">
                    {combo.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {combo.savingsAmount && combo.savingsAmount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 border border-emerald-200">
                <TrendingDown className="h-3 w-3" />
                Save ৳{combo.savingsAmount}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href={`/product/${comboSlug}`}
              className="w-full text-center py-2.5 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
            >
              View Deal
            </Link>

            <Button
              type="button"
              disabled={!combo.isAvailable || isAdding}
              onClick={onAddToCart}
              className={cn(
                "w-full h-auto py-2.5 px-3 rounded-2xl text-xs font-bold text-white transition-all shadow-md gap-1.5 cursor-pointer",
                combo.isAvailable
                  ? "bg-[#56C8D8] hover:bg-[#38bdf8]"
                  : "bg-gray-300 cursor-not-allowed",
              )}
            >
              {isAdding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5" />
              )}
              <span>{combo.isAvailable ? "Add Bundle" : "Sold Out"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// LIST CARD COMPONENT
// -------------------------------------------------------------
function ComboListCard({
  combo,
  isAdding,
  onAddToCart,
}: {
  combo: StoreComboProduct;
  isAdding: boolean;
  onAddToCart: (e: React.MouseEvent) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const comboSlug = combo.slug || combo.id;

  return (
    <div className="group rounded-3xl bg-white border border-gray-200 hover:border-[#56C8D8]/60 hover:shadow-lg transition-all p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-center justify-between">
      {/* Left Image */}
      <Link
        href={`/product/${comboSlug}`}
        className="relative w-full sm:w-44 h-44 rounded-2xl bg-radial from-[#F0F8FF] to-white border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center p-2"
      >
        {!imageError && combo.image ? (
          <Image
            src={combo.image}
            alt={combo.name}
            fill
            sizes="200px"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            unoptimized={combo.image.startsWith("data:")}
          />
        ) : (
          <Package className="w-10 h-10 text-[#56C8D8]/50" />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {combo.discountPercent && combo.discountPercent > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 uppercase shadow-2xs">
              <Flame className="h-2.5 w-2.5" />
              {combo.discountPercent}% OFF
            </span>
          )}
        </div>
      </Link>

      {/* Middle Content */}
      <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <Badge className="bg-[#56C8D8] text-white text-[10px] font-black uppercase">
            COMBO DEAL
          </Badge>
          {combo.campaignBadge && (
            <Badge className="bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] font-bold">
              {combo.campaignBadge.badgeText}
            </Badge>
          )}
          {!combo.isAvailable && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold text-gray-500"
            >
              Sold Out
            </Badge>
          )}
        </div>

        <Link href={`/product/${comboSlug}`}>
          <h3 className="text-base sm:text-lg font-black text-gray-900 hover:text-[#56C8D8] transition-colors">
            {combo.name}
          </h3>
        </Link>

        <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
          {combo.description ||
            "Curated value package combining our favorite essentials."}
        </p>

        {/* Included Items */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-400">Includes:</span>
          {combo.includedItems.map((item, idx) => (
            <span
              key={`${item.id}-${idx}`}
              className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-gray-700"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              {item.name}
            </span>
          ))}
        </div>
      </div>

      {/* Right Price & Actions */}
      <div className="flex flex-col items-center sm:items-end justify-between gap-3 shrink-0 sm:pl-4 sm:border-l sm:border-gray-100 w-full sm:w-auto">
        <div className="text-center sm:text-right">
          <span className="text-xs text-gray-400 font-bold uppercase block">
            Bundle Price
          </span>
          <div className="flex items-baseline justify-center sm:justify-end gap-2">
            <span className="text-xl font-black text-gray-900">
              {combo.price}
            </span>
            {combo.originalPrice && (
              <span className="text-xs text-gray-400 font-bold line-through">
                {combo.originalPrice}
              </span>
            )}
          </div>
          {combo.savingsAmount && combo.savingsAmount > 0 && (
            <span className="text-[11px] font-black text-emerald-600 block mt-0.5">
              Save ৳{combo.savingsAmount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href={`/product/${comboSlug}`}
            className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold text-center"
          >
            Details
          </Link>
          <Button
            type="button"
            disabled={!combo.isAvailable || isAdding}
            onClick={onAddToCart}
            className="flex-1 sm:flex-none h-9 text-xs font-bold text-white bg-[#56C8D8] hover:bg-[#38bdf8] rounded-xl gap-1.5 shadow-xs"
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5" />
            )}
            <span>{combo.isAvailable ? "Add Bundle" : "Sold Out"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
