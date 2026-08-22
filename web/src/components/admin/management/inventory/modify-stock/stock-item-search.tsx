"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Search,
  Package,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Minus,
  Loader2,
  RefreshCw,
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
  searchStockInventoryAction,
  type StockItemSearchRow,
} from "@/actions/admin/management/inventory/modify-stock";
import { formatCategory } from "@/lib/utils";
import type { Category } from "@/generated/prisma/enums";

interface StockItemSearchProps {
  categories: string[];
  selectedItem: StockItemSearchRow | null;
  onSelectItem: (item: StockItemSearchRow) => void;
  onQuickAdjust?: (item: StockItemSearchRow, delta: number) => void;
}

export function StockItemSearch({
  categories,
  selectedItem,
  onSelectItem,
  onQuickAdjust,
}: StockItemSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");
  const [items, setItems] = useState<StockItemSearchRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (
    searchQuery: string,
    cat: string,
    filter: "all" | "in_stock" | "low_stock" | "out_of_stock",
  ) => {
    startTransition(async () => {
      const res = await searchStockInventoryAction({
        query: searchQuery,
        category: cat === "ALL" ? undefined : cat,
        stockFilter: filter,
        limit: 40,
      });
      if (res.success) {
        setItems(res.items);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, category, stockFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, category, stockFilter]);

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge
          variant="destructive"
          className="gap-1 text-[11px] font-semibold"
        >
          <XCircle className="h-3 w-3" /> Out of Stock ({stock})
        </Badge>
      );
    }
    if (stock <= 5) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Low Stock (
          {stock})
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> In Stock ({stock})
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Search className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Search Products & Variants
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSearch(query, category, stockFilter)}
            disabled={isPending}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Find items by Product Name, SKU, Code, Slug, or Variant SKU to modify
          inventory.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="grid gap-2.5 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, SKU, code, slug..."
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <Select
            value={category}
            onValueChange={(val) => setCategory(val || "ALL")}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="All Categories">
                {category === "ALL"
                  ? "All Categories"
                  : formatCategory(category as Category)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {formatCategory(cat as Category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-3">
          <Select
            value={stockFilter}
            onValueChange={(val) =>
              setStockFilter(
                (val as "all" | "in_stock" | "low_stock" | "out_of_stock") ||
                  "all",
              )
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Stock Status">
                {stockFilter === "all"
                  ? "All Stock Levels"
                  : stockFilter === "in_stock"
                    ? "In Stock (>5)"
                    : stockFilter === "low_stock"
                      ? "Low Stock (1-5)"
                      : "Out of Stock (0)"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock Levels</SelectItem>
              <SelectItem value="in_stock">In Stock (&gt;5)</SelectItem>
              <SelectItem value="low_stock">Low Stock (1-5)</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock (0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search Results List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Results: {items.length} items found</span>
          {isPending && (
            <span className="flex items-center gap-1 text-primary">
              <Loader2 className="h-3 w-3 animate-spin" /> Searching...
            </span>
          )}
        </div>

        <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
          {items.length === 0 && !isPending ? (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center text-muted-foreground">
              <Package className="h-8 w-8 opacity-40 mb-2" />
              <p className="text-sm font-medium text-foreground">
                No matching inventory items
              </p>
              <p className="text-xs mt-0.5">
                Try searching with a different SKU, code, product name, or clear
                filters.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`group relative flex flex-col gap-3 rounded-xl border p-3 sm:p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border bg-muted/40 flex items-center justify-center">
                      {item.imageBase64 ? (
                        <Image
                          src={item.imageBase64}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground line-clamp-1">
                          {item.name}
                        </span>
                        <Badge
                          variant={
                            item.targetType === "VARIANT"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] uppercase font-mono tracking-wider h-4 px-1.5"
                        >
                          {item.targetType}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          SKU:{" "}
                          <code className="font-mono font-semibold text-foreground">
                            {item.sku}
                          </code>
                        </span>
                        <span>•</span>
                        <span>
                          Code:{" "}
                          <code className="font-mono text-foreground">
                            {item.code}
                          </code>
                        </span>
                        <span>•</span>
                        <span>
                          Category: {formatCategory(item.category as Category)}
                        </span>
                      </div>

                      {/* Variant Attributes if any */}
                      {item.variantAttributes &&
                        item.variantAttributes.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1">
                            {item.variantAttributes.map((attr, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                              >
                                {attr.name}: {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* Stock Status & Selection Action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getStockBadge(item.currentStock)}
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className="h-7 text-xs gap-1 font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>

                  {/* Quick Adjust Buttons */}
                  {onQuickAdjust && (
                    <div
                      className="flex items-center justify-between border-t pt-2 mt-1 text-xs text-muted-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px]">
                        Quick Restock / Audit:
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="h-6 w-6"
                          disabled={item.currentStock <= 0}
                          onClick={() => onQuickAdjust(item, -1)}
                          title="Reduce stock by 1"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="h-6 px-1.5 text-[11px]"
                          onClick={() => onQuickAdjust(item, 1)}
                          title="Add 1 unit"
                        >
                          +1
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="h-6 px-1.5 text-[11px]"
                          onClick={() => onQuickAdjust(item, 5)}
                          title="Add 5 units"
                        >
                          +5
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          className="h-6 px-1.5 text-[11px]"
                          onClick={() => onQuickAdjust(item, 10)}
                          title="Add 10 units"
                        >
                          +10
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
