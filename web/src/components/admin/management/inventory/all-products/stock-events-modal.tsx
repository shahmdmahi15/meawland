"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Activity,
  CircleDashed,
  Package,
  TrendingUp,
  TrendingDown,
  Boxes,
  Hash,
  Truck,
  RotateCcw,
  AlertTriangle,
  Flame,
  SearchX,
  SlidersHorizontal,
  Bookmark,
  Layers,
  Tag,
  ArrowRight,
  Filter,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FullProduct } from "@/actions/admin/management/inventory/get-all-products";
import { StockEventType } from "@/generated/prisma/enums";
import { formatDate, formatCategory } from "@/lib/utils";

interface StockEventsModalProps {
  product: FullProduct;
}

type UnifiedStockEvent = {
  id: string;
  type: StockEventType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  note: string | null;
  createdAt: Date;
  scope: "PRODUCT" | "VARIANT";
  variantId?: string;
  variantSku?: string;
  variantImage?: string;
  variantAttributes?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
};

export function StockEventsModal({ product }: StockEventsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("ALL");

  const allEvents = useMemo(() => {
    const eventMap = new Map<string, UnifiedStockEvent>();

    // 1. Map variant stock events first
    (product.variants ?? []).forEach((variant) => {
      (variant.stockEvents ?? []).forEach((event) => {
        eventMap.set(event.id, {
          id: event.id,
          type: event.type,
          quantity: event.quantity,
          previousStock: event.previousStock ?? 0,
          newStock: event.newStock ?? 0,
          reason: event.reason,
          note: event.note,
          createdAt: new Date(event.createdAt),
          scope: "VARIANT",
          variantId: variant.id,
          variantSku: variant.sku,
          variantImage: variant.imageBase64,
          variantAttributes: variant.attributes.map((a) => ({
            type: a.type,
            name: a.name,
            value: a.value,
          })),
        });
      });
    });

    // 2. Map product-level stock events (if not already mapped or if variantId exists)
    (product.stockEvents ?? []).forEach((event) => {
      if (!eventMap.has(event.id)) {
        if (event.variantId) {
          const matchingVariant = product.variants.find(
            (v) => v.id === event.variantId,
          );
          eventMap.set(event.id, {
            id: event.id,
            type: event.type,
            quantity: event.quantity,
            previousStock: event.previousStock ?? 0,
            newStock: event.newStock ?? 0,
            reason: event.reason,
            note: event.note,
            createdAt: new Date(event.createdAt),
            scope: "VARIANT",
            variantId: event.variantId,
            variantSku: matchingVariant?.sku || "Variant",
            variantImage: matchingVariant?.imageBase64,
            variantAttributes: matchingVariant?.attributes.map((a) => ({
              type: a.type,
              name: a.name,
              value: a.value,
            })),
          });
        } else {
          eventMap.set(event.id, {
            id: event.id,
            type: event.type,
            quantity: event.quantity,
            previousStock: event.previousStock ?? 0,
            newStock: event.newStock ?? 0,
            reason: event.reason,
            note: event.note,
            createdAt: new Date(event.createdAt),
            scope: "PRODUCT",
          });
        }
      }
    });

    return Array.from(eventMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [product]);

  const filteredEvents = useMemo(() => {
    if (selectedVariantId === "ALL") return allEvents;
    return allEvents.filter((e) => e.variantId === selectedVariantId);
  }, [allEvents, selectedVariantId]);

  const totalStock = product.isVariable
    ? product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
    : (product.stock ?? 0);

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1 text-[11px]">
          <XCircle className="h-3 w-3" /> Out of Stock ({stock})
        </Badge>
      );
    }
    if (stock <= 5) {
      return (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px]"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Low Stock (
          {stock})
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px]"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> In Stock ({stock})
      </Badge>
    );
  };

  const getEventBadge = (type: StockEventType) => {
    switch (type) {
      case StockEventType.PURCHASE:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
          >
            <Truck className="h-3 w-3" /> Stock Purchase (+ Inward)
          </Badge>
        );
      case StockEventType.RETURN:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-semibold"
          >
            <RotateCcw className="h-3 w-3" /> Customer Return (+)
          </Badge>
        );
      case StockEventType.RESTOCK:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-semibold"
          >
            <Boxes className="h-3 w-3" /> Restock (+)
          </Badge>
        );
      case StockEventType.DAMAGE:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-semibold"
          >
            <Flame className="h-3 w-3" /> Damaged (- Outward)
          </Badge>
        );
      case StockEventType.EXPIRED:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold"
          >
            <AlertTriangle className="h-3 w-3" /> Expired Goods (-)
          </Badge>
        );
      case StockEventType.LOSS:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold"
          >
            <SearchX className="h-3 w-3" /> Theft / Lost (-)
          </Badge>
        );
      case StockEventType.ADJUSTMENT:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold"
          >
            <SlidersHorizontal className="h-3 w-3" /> Audit Adjustment
          </Badge>
        );
      case StockEventType.INCREASE:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
          >
            <TrendingUp className="h-3 w-3" /> Stock Increase (+)
          </Badge>
        );
      case StockEventType.DECREASE:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-semibold"
          >
            <TrendingDown className="h-3 w-3" /> Stock Decrease (-)
          </Badge>
        );
      case StockEventType.INITIAL:
      default:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-semibold"
          >
            <Bookmark className="h-3 w-3" /> Initial Opening Stock
          </Badge>
        );
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsOpen(true)}
        title="View stock events & audit history"
        aria-label="View stock events"
      >
        <Activity className="h-4 w-4 text-muted-foreground hover:text-primary" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[950px] w-[min(96vw,950px)] max-w-full max-h-[88vh] overflow-hidden p-0">
          <div className="flex h-full max-h-[88vh] flex-col">
            {/* Header */}
            <DialogHeader className="border-b px-5 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border bg-muted/30 flex items-center justify-center">
                    {product.imageBase64 ? (
                      <Image
                        src={product.imageBase64}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                        {product.name}
                      </DialogTitle>
                      <Badge
                        variant={product.isVariable ? "default" : "secondary"}
                        className="text-[10px] uppercase font-mono tracking-wider"
                      >
                        {product.isVariable
                          ? "Variable Product"
                          : "Simple Product"}
                      </Badge>
                    </div>
                    <DialogDescription className="mt-0.5 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>
                        Code:{" "}
                        <code className="font-mono text-foreground font-semibold">
                          {product.code}
                        </code>
                      </span>
                      <span>•</span>
                      <span>
                        SKU:{" "}
                        <code className="font-mono text-foreground">
                          {product.sku}
                        </code>
                      </span>
                      <span>•</span>
                      <span>
                        Category: {formatCategory(product.subCategory.category)}{" "}
                        &rarr; {product.subCategory.name}
                      </span>
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {getStockBadge(totalStock)}
                  <Badge variant="outline" className="text-xs gap-1">
                    <Activity className="h-3.5 w-3.5 text-primary" />{" "}
                    {allEvents.length} events
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Product Stock Summary Banner */}
              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Current Inventory Level
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                      {totalStock} units
                    </p>
                  </div>

                  {product.isVariable && (
                    <div className="flex flex-col sm:items-end gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        Variants breakdown ({product.variants.length} total):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-w-lg">
                        {product.variants.map((v) => {
                          const isCurrentSelected = selectedVariantId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() =>
                                setSelectedVariantId(
                                  isCurrentSelected ? "ALL" : v.id,
                                )
                              }
                              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-all ${
                                isCurrentSelected
                                  ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                                  : "border-border bg-card hover:bg-muted/50 text-foreground"
                              }`}
                            >
                              <span className="font-mono">{v.sku}</span>
                              <span className="opacity-80">
                                ({v.stock} in stock)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Row for Variable Products */}
              {product.isVariable && product.variants.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Filter History by Variant:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedVariantId}
                      onValueChange={(val) =>
                        setSelectedVariantId(val ?? "ALL")
                      }
                    >
                      <SelectTrigger className="h-8 text-xs w-[220px]">
                        <SelectValue placeholder="All Variants">
                          {selectedVariantId === "ALL"
                            ? `All Variants (${allEvents.length} events)`
                            : product.variants.find(
                                (v) => v.id === selectedVariantId,
                              )?.sku}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          All Variants ({allEvents.length} events)
                        </SelectItem>
                        {product.variants.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.sku} (
                            {v.attributes
                              .map((a) => `${a.name}: ${a.value}`)
                              .join(", ") || "No attrs"}
                            )
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedVariantId !== "ALL" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVariantId("ALL")}
                        className="h-8 text-xs text-muted-foreground"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Events Timeline / List */}
              {filteredEvents.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-8 text-center text-muted-foreground">
                  <CircleDashed className="mb-2.5 h-10 w-10 opacity-50" />
                  <p className="text-sm font-semibold text-foreground">
                    No stock events recorded
                  </p>
                  <p className="mt-0.5 text-xs">
                    {selectedVariantId !== "ALL"
                      ? "No stock events found for the selected variant."
                      : "This product has no stock movements, purchase records, or adjustments yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const isPositive = event.newStock >= event.previousStock;

                    return (
                      <div
                        key={event.id}
                        className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 sm:p-4 hover:border-muted-foreground/30 transition-all shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Left: Event Type & Scope Details */}
                          <div className="flex items-start gap-3">
                            {/* Variant or Product Thumbnail */}
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted/30 flex items-center justify-center mt-0.5">
                              {event.variantImage || product.imageBase64 ? (
                                <Image
                                  src={
                                    event.variantImage ||
                                    product.imageBase64 ||
                                    ""
                                  }
                                  alt={event.variantSku || product.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground/60" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {getEventBadge(event.type)}
                                {event.scope === "VARIANT" ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-mono"
                                  >
                                    Variant: {event.variantSku}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    Simple Product
                                  </Badge>
                                )}
                              </div>

                              {/* Variant Attributes if variant scope */}
                              {event.variantAttributes &&
                                event.variantAttributes.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                                    {event.variantAttributes.map(
                                      (attr, idx) => (
                                        <span
                                          key={idx}
                                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
                                        >
                                          {attr.name}: {attr.value}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                )}

                              {/* Reason & Note */}
                              <div className="text-xs text-foreground font-medium pt-0.5">
                                {event.reason || "Stock update transaction"}
                              </div>
                              {event.note && (
                                <p className="text-[11px] text-muted-foreground italic">
                                  "{event.note}"
                                </p>
                              )}

                              {/* Timestamp */}
                              <p
                                suppressHydrationWarning
                                className="text-[11px] text-muted-foreground pt-0.5"
                              >
                                {formatDate(event.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Right: Quantity Delta & Transition Box */}
                          <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            {/* Quantity Delta */}
                            <div className="flex items-center gap-1.5 font-mono text-sm font-bold">
                              <span
                                className={
                                  event.newStock > event.previousStock
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : event.newStock < event.previousStock
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-blue-600 dark:text-blue-400"
                                }
                              >
                                {event.newStock > event.previousStock
                                  ? `+${event.quantity} units`
                                  : event.newStock < event.previousStock
                                    ? `-${event.quantity} units`
                                    : `±${event.quantity} units`}
                              </span>
                            </div>

                            {/* Transition Pill */}
                            <div className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 font-mono text-xs shadow-2xs">
                              <span className="text-muted-foreground">
                                Prev: {event.previousStock}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span className="font-bold text-foreground">
                                New: {event.newStock}
                              </span>
                            </div>

                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {event.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
