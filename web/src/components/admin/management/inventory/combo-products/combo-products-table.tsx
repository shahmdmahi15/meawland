"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  LayoutGrid,
  List,
  Sparkles,
  Package2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ComboProductRow,
  ComboSourceProduct,
} from "@/actions/admin/management/inventory/combo-products";
import { ComboProductPreviewModal } from "./combo-product-preview-modal";
import { EditComboProductModal } from "./edit-combo-product-modal";
import { DeleteComboProductButton } from "./delete-combo-product-button";
import { formatDate } from "@/lib/utils";

interface ComboProductsTableProps {
  combos: ComboProductRow[];
  products: ComboSourceProduct[];
}

export function ComboProductsTable({
  combos,
  products,
}: ComboProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("ALL");
  const [discountFilter, setDiscountFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const filteredCombos = useMemo(() => {
    return combos
      .filter((combo) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = combo.name.toLowerCase().includes(q);
          const matchesCode = combo.code.toLowerCase().includes(q);
          const matchesSku = combo.sku.toLowerCase().includes(q);
          const matchesSlug = combo.slug.toLowerCase().includes(q);
          const matchesProducts = combo.products.some(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q),
          );
          const matchesVariants = combo.variants.some(
            (v) =>
              v.productName.toLowerCase().includes(q) ||
              v.sku.toLowerCase().includes(q),
          );

          if (
            !matchesName &&
            !matchesCode &&
            !matchesSku &&
            !matchesSlug &&
            !matchesProducts &&
            !matchesVariants
          ) {
            return false;
          }
        }

        // Stock availability filter
        if (stockFilter === "IN_STOCK" && !combo.isAvailable) return false;
        if (stockFilter === "DEPLETED" && combo.isAvailable) return false;

        // Discount filter
        if (discountFilter === "10_PLUS" && combo.discountPercent < 10)
          return false;
        if (discountFilter === "20_PLUS" && combo.discountPercent < 20)
          return false;
        if (discountFilter === "30_PLUS" && combo.discountPercent < 30)
          return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "NEWEST":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          case "OLDEST":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "PRICE_LOW":
            return (
              Number(a.salePrice || a.regularPrice || 0) -
              Number(b.salePrice || b.regularPrice || 0)
            );
          case "PRICE_HIGH":
            return (
              Number(b.salePrice || b.regularPrice || 0) -
              Number(a.salePrice || a.regularPrice || 0)
            );
          case "DISCOUNT_HIGH":
            return b.discountPercent - a.discountPercent;
          case "CAPACITY_HIGH":
            return b.bundleStockCapacity - a.bundleStockCapacity;
          case "NAME_ASC":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [combos, searchQuery, stockFilter, discountFilter, sortBy]);

  const totalPages = Math.ceil(filteredCombos.length / pageSize) || 1;
  const paginatedCombos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCombos.slice(start, start + pageSize);
  }, [filteredCombos, currentPage, pageSize]);

  const getCapacityBadge = (capacity: number) => {
    if (capacity === 0) {
      return (
        <Badge
          variant="destructive"
          className="gap-1 text-[10px] font-semibold"
        >
          <XCircle className="h-3 w-3" /> Stock Depleted
        </Badge>
      );
    }
    if (capacity <= 3) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Low ({capacity}{" "}
          left)
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {capacity}{" "}
        available
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls Bar: Search, Filters, Sort, View Toggle */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by combo name, SKU, code, or included products..."
              className="pl-9 text-xs sm:text-sm"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 border rounded-lg p-0.5 bg-muted/20">
            <Button
              type="button"
              variant={viewMode === "TABLE" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("TABLE")}
              className="h-7 w-7"
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "GRID" ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("GRID")}
              className="h-7 w-7"
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter & Sort Row */}
        <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 pt-1 border-t">
          {/* Stock Availability Filter */}
          <div>
            <Select
              value={stockFilter}
              onValueChange={(val) => {
                setStockFilter(val || "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Stock Availability">
                  {stockFilter === "ALL"
                    ? "All Stock Levels"
                    : stockFilter === "IN_STOCK"
                      ? "In Stock (Ready)"
                      : "Depleted / Out of Stock"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stock Levels</SelectItem>
                <SelectItem value="IN_STOCK">In Stock (Ready)</SelectItem>
                <SelectItem value="DEPLETED">
                  Depleted / Out of Stock
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discount Filter */}
          <div>
            <Select
              value={discountFilter}
              onValueChange={(val) => {
                setDiscountFilter(val || "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Discount Filter">
                  {discountFilter === "ALL"
                    ? "Any Discount"
                    : discountFilter === "10_PLUS"
                      ? "10%+ Savings"
                      : discountFilter === "20_PLUS"
                        ? "20%+ Savings"
                        : "30%+ Savings"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Discount</SelectItem>
                <SelectItem value="10_PLUS">10%+ Savings</SelectItem>
                <SelectItem value="20_PLUS">20%+ Savings</SelectItem>
                <SelectItem value="30_PLUS">30%+ Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val || "NEWEST");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort By">
                  {sortBy === "NEWEST"
                    ? "Newest First"
                    : sortBy === "OLDEST"
                      ? "Oldest First"
                      : sortBy === "PRICE_LOW"
                        ? "Price: Low to High"
                        : sortBy === "PRICE_HIGH"
                          ? "Price: High to Low"
                          : sortBy === "DISCOUNT_HIGH"
                            ? "Highest Discount %"
                            : sortBy === "CAPACITY_HIGH"
                              ? "Highest Bundle Capacity"
                              : "Name (A-Z)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWEST">Newest First</SelectItem>
                <SelectItem value="OLDEST">Oldest First</SelectItem>
                <SelectItem value="PRICE_LOW">Price: Low to High</SelectItem>
                <SelectItem value="PRICE_HIGH">Price: High to Low</SelectItem>
                <SelectItem value="DISCOUNT_HIGH">
                  Highest Discount %
                </SelectItem>
                <SelectItem value="CAPACITY_HIGH">
                  Highest Bundle Capacity
                </SelectItem>
                <SelectItem value="NAME_ASC">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Size */}
          <div>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Per Page">
                  {`${pageSize} per page`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
                <SelectItem value="48">48 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content Rendering: TABLE or GRID */}
      {filteredCombos.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center">
          <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-base font-semibold text-foreground">
            No Combo Products Found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery
              ? `No bundle matched "${searchQuery}". Try clearing search or modifying filters.`
              : "No combo bundles match the selected filter criteria."}
          </p>
        </div>
      ) : viewMode === "TABLE" ? (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold">
                  Combo Bundle
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Included Items
                </TableHead>
                <TableHead className="text-xs font-semibold text-center">
                  Bundle Capacity
                </TableHead>
                <TableHead className="text-xs font-semibold text-right">
                  Pricing &amp; Savings
                </TableHead>
                <TableHead className="text-xs font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCombos.map((combo) => {
                const totalItems =
                  combo.products.length + combo.variants.length;

                return (
                  <TableRow key={combo.id} className="hover:bg-muted/20">
                    {/* Bundle Info */}
                    <TableCell className="min-w-[240px]">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border bg-muted/30 flex items-center justify-center">
                          {combo.imageBase64 ? (
                            <Image
                              src={combo.imageBase64}
                              alt={combo.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package2 className="h-6 w-6 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-foreground line-clamp-1">
                            {combo.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground mt-0.5">
                            <span className="font-mono">{combo.code}</span>
                            <span>•</span>
                            <span className="font-mono">SKU: {combo.sku}</span>
                          </div>
                          <span
                            suppressHydrationWarning
                            className="text-[10px] text-muted-foreground/80 mt-0.5"
                          >
                            Created: {formatDate(new Date(combo.createdAt))}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Included Items */}
                    <TableCell className="min-w-[200px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono"
                          >
                            {totalItems} items ({combo.products.length} simple,{" "}
                            {combo.variants.length} var)
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 max-w-xs">
                          {[
                            ...combo.products.map((p) => p.name),
                            ...combo.variants.map(
                              (v) => `${v.productName} (${v.sku})`,
                            ),
                          ].join(" + ")}
                        </div>
                      </div>
                    </TableCell>

                    {/* Bundle Capacity */}
                    <TableCell className="text-center whitespace-nowrap">
                      {getCapacityBadge(combo.bundleStockCapacity)}
                    </TableCell>

                    {/* Pricing & Savings */}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          {combo.regularPrice &&
                            Number(combo.regularPrice) >
                              Number(combo.salePrice) && (
                              <span className="text-xs text-muted-foreground line-through">
                                ৳{combo.regularPrice}
                              </span>
                            )}
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            ৳{combo.salePrice || combo.regularPrice}
                          </span>
                        </div>
                        {combo.discountPercent > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <TrendingDown className="h-2.5 w-2.5" />
                            {combo.discountPercent}% OFF (Save ৳
                            {combo.discountAmount})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ComboProductPreviewModal combo={combo} />
                        <EditComboProductModal
                          combo={combo}
                          products={products}
                        />
                        <DeleteComboProductButton
                          comboId={combo.id}
                          comboName={combo.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCombos.map((combo) => {
            const totalItems = combo.products.length + combo.variants.length;

            return (
              <div
                key={combo.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-4 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <div>
                  {/* Top Image & Badge */}
                  <div className="relative h-44 w-full overflow-hidden rounded-lg border bg-muted/20 flex items-center justify-center">
                    {combo.imageBase64 ? (
                      <Image
                        src={combo.imageBase64}
                        alt={combo.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <Package2 className="h-10 w-10 text-muted-foreground/40" />
                    )}

                    {/* Discount Pill Overlay */}
                    {combo.discountPercent > 0 && (
                      <div className="absolute top-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs">
                        {combo.discountPercent}% OFF
                      </div>
                    )}

                    <div className="absolute top-2 right-2">
                      {getCapacityBadge(combo.bundleStockCapacity)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-3.5 space-y-1.5">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {combo.name}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono text-[11px]">
                        {combo.code}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono"
                      >
                        {totalItems} items bundled
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {combo.shortDescription ||
                        [
                          ...combo.products.map((p) => p.name),
                          ...combo.variants.map(
                            (v) => `${v.productName} (${v.sku})`,
                          ),
                        ].join(" + ")}
                    </p>
                  </div>
                </div>

                {/* Bottom Pricing & Actions */}
                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        ৳{combo.salePrice || combo.regularPrice}
                      </span>
                      {combo.regularPrice &&
                        Number(combo.regularPrice) >
                          Number(combo.salePrice) && (
                          <span className="text-xs text-muted-foreground line-through">
                            ৳{combo.regularPrice}
                          </span>
                        )}
                    </div>
                    {combo.discountAmount > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        Customer saves ৳{combo.discountAmount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <ComboProductPreviewModal combo={combo} />
                    <EditComboProductModal combo={combo} products={products} />
                    <DeleteComboProductButton
                      comboId={combo.id}
                      comboName={combo.name}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-xs">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredCombos.length)} of{" "}
            {filteredCombos.length} combo bundles
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            <span className="text-xs font-medium px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 gap-1 text-xs"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
