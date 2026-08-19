"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { ScannedProductItem } from "@/schemas/admin/scan";
import { modifyStockWithEventAction } from "@/actions/admin/scan";
import { StockEventType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Package,
  Boxes,
  Plus,
  Minus,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { scannerAudio } from "./scanner-audio";

interface StockModifierCardProps {
  product: ScannedProductItem;
  onStockUpdated?: (newStock: number) => void;
  onAddToPOS?: (product: ScannedProductItem) => void;
}

export function StockModifierCard({
  product,
  onStockUpdated,
  onAddToPOS,
}: StockModifierCardProps) {
  const [activeVariantId, setActiveVariantId] = useState<string | undefined>(
    product.variantId || product.availableVariants?.[0]?.id,
  );
  const [variantsList, setVariantsList] = useState(
    product.availableVariants || [],
  );

  const activeVariant = variantsList.find((v) => v.id === activeVariantId);
  const displayStock = activeVariant ? activeVariant.stock : product.stock;
  const displaySku = activeVariant ? activeVariant.sku : product.sku;
  const displayPrice = activeVariant
    ? activeVariant.salePrice || activeVariant.regularPrice
    : product.salePrice || product.regularPrice;
  const displayLabel = activeVariant
    ? activeVariant.label
    : product.variantLabel;
  const displayThumbnail = activeVariant?.thumbnail || product.thumbnail;

  const [currentStock, setCurrentStock] = useState(displayStock);
  const [delta, setDelta] = useState<number>(1);
  const [changeType, setChangeType] = useState<StockEventType>(
    StockEventType.RESTOCK,
  );
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSelectVariant = (varId: string) => {
    setActiveVariantId(varId);
    const selected = variantsList.find((v) => v.id === varId);
    if (selected) {
      setCurrentStock(selected.stock);
    }
  };

  const previewNewStock = Math.max(0, currentStock + delta);

  const handleApplyStockChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) {
      toast.error("Stock change quantity cannot be zero.");
      return;
    }

    startTransition(async () => {
      const res = await modifyStockWithEventAction({
        productId: product.id,
        variantId: activeVariantId || product.variantId,
        changeType,
        quantityDelta: delta,
        reason: reason || undefined,
        note: note || undefined,
      });

      if (res.success && typeof res.newStock === "number") {
        scannerAudio.playSuccessBeep();
        toast.success(res.message);
        setCurrentStock(res.newStock);
        if (activeVariantId) {
          setVariantsList((prev) =>
            prev.map((v) =>
              v.id === activeVariantId ? { ...v, stock: res.newStock! } : v,
            ),
          );
        }
        onStockUpdated?.(res.newStock);
        setDelta(1);
        setReason("");
        setNote("");
      } else {
        scannerAudio.playErrorBuzz();
        toast.error(res.message || "Failed to update stock.");
      }
    });
  };

  const handleTriggerAddToPOS = () => {
    if (!onAddToPOS) return;
    const itemToAdd: ScannedProductItem = {
      ...product,
      sku: displaySku,
      variantId: activeVariantId || product.variantId,
      variantLabel: displayLabel,
      regularPrice: activeVariant?.regularPrice || product.regularPrice,
      salePrice: activeVariant?.salePrice || product.salePrice,
      stock: currentStock,
      thumbnail: displayThumbnail,
    };
    onAddToPOS(itemToAdd);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Product Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
            {displayThumbnail ? (
              <Image
                src={displayThumbnail}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={displayThumbnail.startsWith("data:")}
              />
            ) : (
              <Package className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-gray-900">
                {product.name}
              </h2>
              {product.isCombo && (
                <Badge className="text-[10px] bg-purple-100 text-purple-800 border-purple-200 font-black">
                  COMBO BUNDLE
                </Badge>
              )}
              {product.isVariable && !product.isCombo && (
                <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-200 font-black">
                  VARIABLE PRODUCT
                </Badge>
              )}
              {displayLabel && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-[#D4EEFC] text-[#0097a7] bg-[#EDF5FA] font-bold"
                >
                  {displayLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs font-mono text-gray-500 mt-0.5">
              Code:{" "}
              <span className="font-bold text-gray-800">{product.code}</span> •
              SKU: <span className="font-bold text-gray-800">{displaySku}</span>
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Category:{" "}
              <span className="font-semibold">{product.categoryName}</span> •
              Price:{" "}
              <span className="font-black text-emerald-700">
                ৳{displayPrice}
              </span>
            </p>
          </div>
        </div>

        {/* Current Stock Badge & POS Quick Add */}
        <div className="flex items-center gap-2.5">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {product.isCombo ? "Bundle Capacity" : "Available Stock"}
            </span>
            <span
              className={cn(
                "text-lg font-black",
                currentStock === 0
                  ? "text-rose-600"
                  : currentStock <= 5
                    ? "text-amber-600"
                    : "text-emerald-700",
              )}
            >
              {currentStock} {product.isCombo ? "bundles" : "units"}
            </span>
          </div>

          {onAddToPOS && (
            <Button
              type="button"
              onClick={handleTriggerAddToPOS}
              className="h-11 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
            >
              <Boxes className="w-4 h-4" />
              <span>Add to POS Cart</span>
            </Button>
          )}
        </div>
      </div>

      {/* Available Variants Switcher (for Variable Products) */}
      {product.isVariable && variantsList.length > 0 && (
        <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-blue-950 flex items-center gap-1.5">
              <span>✨ Available Product Variants ({variantsList.length})</span>
            </span>
            <span className="text-[11px] text-blue-700 font-medium">
              Click a variant to view and adjust its individual stock
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {variantsList.map((v) => {
              const isSelected = v.id === activeVariantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVariant(v.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer",
                    isSelected
                      ? "bg-white border-[#56C8D8] ring-2 ring-[#56C8D8]/30 shadow-xs"
                      : "bg-white/80 border-blue-100 hover:bg-white hover:border-blue-200",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 truncate">
                      {v.label}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      SKU: {v.sku} • ৳{v.salePrice || v.regularPrice}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-mono shrink-0",
                      v.stock === 0
                        ? "border-rose-300 text-rose-700 bg-rose-50"
                        : v.stock <= 5
                          ? "border-amber-300 text-amber-700 bg-amber-50"
                          : "border-emerald-300 text-emerald-700 bg-emerald-50",
                    )}
                  >
                    {v.stock} in stock
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Combo Bundle Included Items Breakdown (if Combo) */}
      {product.isCombo &&
        product.comboItems &&
        product.comboItems.length > 0 && (
          <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-purple-950 flex items-center gap-1.5">
                <span>
                  📦 Bundle Components ({product.comboItems.length} items)
                </span>
              </span>
              <span className="text-[11px] text-purple-700 font-medium">
                Bundle capacity is governed by the component with lowest stock
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.comboItems.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-white rounded-xl p-2.5 border border-purple-100 flex items-center justify-between gap-2 shadow-2xs text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {comp.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">
                      SKU: {comp.sku}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-mono shrink-0",
                      comp.stock <= 0
                        ? "border-rose-300 text-rose-700 bg-rose-50"
                        : "border-gray-200 text-gray-700 bg-gray-50",
                    )}
                  >
                    {comp.stock} in stock
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Stock Modification Form */}
      <form onSubmit={handleApplyStockChange} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#56C8D8]" />
            <span>Modify Stock &amp; Record StockEvent Audit</span>
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Preview:</span>
            <span className="font-mono font-bold text-gray-700">
              {currentStock}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            <span
              className={cn(
                "font-mono font-black text-sm px-2 py-0.5 rounded-lg",
                previewNewStock > currentStock
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : previewNewStock < currentStock
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-gray-100 text-gray-800",
              )}
            >
              {previewNewStock} units
            </span>
          </div>
        </div>

        {/* Quick Increment/Decrement Buttons */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-gray-700">
            Quick Adjustments
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
            {[1, 5, 10, 25, 50].map((num) => (
              <Button
                key={`add-${num}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDelta(num)}
                className={cn(
                  "rounded-xl text-xs font-bold gap-1 cursor-pointer",
                  delta === num
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 hover:text-white"
                    : "border-gray-200 text-emerald-700 hover:bg-emerald-50",
                )}
              >
                <Plus className="w-3 h-3" />
                <span>{num}</span>
              </Button>
            ))}

            {[-1, -5, -10].map((num) => (
              <Button
                key={`sub-${num}`}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDelta(num)}
                className={cn(
                  "rounded-xl text-xs font-bold gap-1 cursor-pointer",
                  delta === num
                    ? "bg-rose-600 text-white border-rose-600 hover:bg-rose-700 hover:text-white"
                    : "border-gray-200 text-rose-700 hover:bg-rose-50",
                )}
              >
                <Minus className="w-3 h-3" />
                <span>{Math.abs(num)}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Custom Delta Input */}
          <div className="sm:col-span-3 space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Quantity Delta (+/-)
            </Label>
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value) || 0)}
              required
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-mono font-bold"
            />
          </div>

          {/* Change Type */}
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Stock Event Type
            </Label>
            <Select
              value={changeType}
              onValueChange={(val) =>
                val && setChangeType(val as StockEventType)
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl bg-gray-50/80 border-gray-200 text-xs px-3">
                <SelectValue>
                  {changeType === StockEventType.RESTOCK && (
                    <span className="font-bold text-emerald-700">
                      RESTOCK (Shipment Inward)
                    </span>
                  )}
                  {changeType === StockEventType.PURCHASE && (
                    <span className="font-bold text-blue-700">
                      PURCHASE (Direct Purchase)
                    </span>
                  )}
                  {changeType === StockEventType.RETURN && (
                    <span className="font-bold text-indigo-700">
                      RETURN (Customer Inward)
                    </span>
                  )}
                  {changeType === StockEventType.DAMAGE && (
                    <span className="font-bold text-rose-700">
                      DAMAGE (Damaged / Broken)
                    </span>
                  )}
                  {changeType === StockEventType.EXPIRED && (
                    <span className="font-bold text-amber-700">
                      EXPIRED (Past Expiry Date)
                    </span>
                  )}
                  {changeType === StockEventType.LOSS && (
                    <span className="font-bold text-red-700">
                      LOSS (Missing / Inventory Loss)
                    </span>
                  )}
                  {changeType === StockEventType.ADJUSTMENT && (
                    <span className="font-bold text-gray-700">
                      ADJUSTMENT (Audit Reconciliation)
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-[280px] w-auto max-w-[min(90vw,360px)] bg-white border border-gray-200 shadow-xl rounded-2xl p-1 z-50"
              >
                <SelectItem
                  value={StockEventType.RESTOCK}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-emerald-700">RESTOCK</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Shipment Inward)
                  </span>
                </SelectItem>
                <SelectItem
                  value={StockEventType.PURCHASE}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-blue-700">PURCHASE</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Direct Purchase)
                  </span>
                </SelectItem>
                <SelectItem
                  value={StockEventType.RETURN}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-indigo-700">RETURN</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Customer Inward)
                  </span>
                </SelectItem>
                <SelectItem
                  value={StockEventType.DAMAGE}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-rose-700">DAMAGE</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Damaged / Broken)
                  </span>
                </SelectItem>
                <SelectItem
                  value={StockEventType.EXPIRED}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-amber-700">EXPIRED</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Past Expiry Date)
                  </span>
                </SelectItem>
                <SelectItem
                  value={StockEventType.LOSS}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-red-700">LOSS</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Missing / Inventory Loss)
                  </span>
                </SelectItem>
                <SelectItem
                  value={StockEventType.ADJUSTMENT}
                  className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                >
                  <span className="font-bold text-gray-700">ADJUSTMENT</span>
                  <span className="text-gray-500 text-[11px] ml-1.5">
                    (Audit Reconciliation)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="sm:col-span-5 space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Reason / Reference
            </Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Batch #902 restock from distributor"
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            type="submit"
            disabled={isPending || delta === 0}
            className="h-10 px-6 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold text-xs gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>Confirm &amp; Record StockEvent</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
