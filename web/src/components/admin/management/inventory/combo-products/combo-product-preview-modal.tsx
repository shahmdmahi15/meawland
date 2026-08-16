"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  PackagePlus,
  Package2,
  Layers3,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Boxes,
} from "lucide-react";
import type { ComboProductRow } from "@/actions/admin/management/inventory/combo-products";

interface ComboProductPreviewModalProps {
  combo: ComboProductRow;
}

export function ComboProductPreviewModal({
  combo,
}: ComboProductPreviewModalProps) {
  const [open, setOpen] = useState(false);

  const totalItems = combo.products.length + combo.variants.length;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => setOpen(true)}
        title="Preview combo product bundle"
        aria-label="Preview combo product"
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[850px] w-[min(96vw,850px)] max-w-full max-h-[88vh] overflow-y-auto p-0">
          <div className="flex flex-col gap-0">
            {/* Header */}
            <DialogHeader className="border-b px-5 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg sm:text-xl font-bold">
                      {combo.name}
                    </DialogTitle>
                    {combo.discountPercent > 0 && (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                        {combo.discountPercent}% OFF
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Code:{" "}
                    <code className="font-mono text-foreground font-semibold">
                      {combo.code}
                    </code>{" "}
                    • SKU:{" "}
                    <code className="font-mono text-foreground">
                      {combo.sku}
                    </code>
                  </DialogDescription>
                </div>

                <Badge variant="outline" className="w-fit gap-1 text-xs">
                  <Boxes className="h-3.5 w-3.5 text-primary" /> {totalItems}{" "}
                  items bundled
                </Badge>
              </div>
            </DialogHeader>

            <div className="p-4 sm:p-6 space-y-5">
              {/* Top Overview: Cover Image & Financial Breakdown */}
              <div className="grid gap-5 sm:grid-cols-12 items-start">
                <div className="sm:col-span-4">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted/20 flex items-center justify-center">
                    {combo.imageBase64 ? (
                      <Image
                        src={combo.imageBase64}
                        alt={combo.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <PackagePlus className="h-10 w-10 text-muted-foreground/50" />
                    )}
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-3.5">
                  {/* Pricing & Savings Card */}
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Items Original Total
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-muted-foreground line-through">
                          ৳
                          {combo.totalOriginalPrice ||
                            combo.regularPrice ||
                            "0"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Bundle Deal Price
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          ৳{combo.salePrice || combo.regularPrice || "0"}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Customer Saves
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">
                          ৳{combo.discountAmount} ({combo.discountPercent}% OFF)
                        </p>
                      </div>
                    </div>

                    {/* Stock Capacity Status */}
                    <div className="border-t pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Live Bundle Stock Capacity:
                      </span>
                      {combo.bundleStockCapacity === 0 ? (
                        <Badge
                          variant="destructive"
                          className="gap-1 text-[10px]"
                        >
                          <XCircle className="h-3 w-3" /> 0 Available (Stock
                          Depleted)
                        </Badge>
                      ) : combo.bundleStockCapacity <= 3 ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-500" />{" "}
                          Low ({combo.bundleStockCapacity} bundles available)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px]"
                        >
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />{" "}
                          {combo.bundleStockCapacity} bundles ready to ship
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Descriptions */}
                  {combo.shortDescription && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Deal Highlight
                      </p>
                      <p className="mt-0.5 text-xs sm:text-sm text-foreground">
                        {combo.shortDescription}
                      </p>
                    </div>
                  )}

                  {combo.longDescription && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                        Full Description
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed">
                        {combo.longDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bundled Items Breakdown */}
              <div className="space-y-2.5 border-t pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Bundled Products &amp; Variants ({totalItems})
                </h4>

                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Simple Products */}
                  {combo.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-2.5 rounded-lg border bg-card p-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/20 flex items-center justify-center">
                          <Package2 className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-foreground block">
                          ৳{product.regularPrice || product.salePrice || "0"}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            product.stock === 0
                              ? "text-destructive"
                              : product.stock <= 5
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          {product.stock} in stock
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Variants */}
                  {combo.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between gap-2.5 rounded-lg border bg-card p-2.5 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/20 flex items-center justify-center">
                          <Layers3 className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {variant.productName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            SKU: {variant.sku}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold text-foreground block">
                          ৳{variant.regularPrice || variant.salePrice || "0"}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${
                            variant.stock === 0
                              ? "text-destructive"
                              : variant.stock <= 5
                                ? "text-amber-500"
                                : "text-muted-foreground"
                          }`}
                        >
                          {variant.stock} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
