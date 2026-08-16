"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Package,
  Boxes,
  Truck,
  RotateCcw,
  AlertTriangle,
  Flame,
  SearchX,
  SlidersHorizontal,
  Bookmark,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Loader2,
  ArrowRight,
  HelpCircle,
  Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockEventType } from "@/generated/prisma/enums";
import {
  modifyStockAction,
  type StockItemSearchRow,
} from "@/actions/admin/management/inventory/modify-stock";

interface StockModifyFormProps {
  selectedItem: StockItemSearchRow | null;
  onSuccess: () => void;
  onClearSelection: () => void;
}

type EventConfig = {
  type: StockEventType;
  label: string;
  category: "INWARD" | "OUTWARD" | "ADJUSTMENT";
  icon: typeof Package;
  colorClass: string;
  badgeClass: string;
  defaultReason: string;
  description: string;
};

const EVENT_CONFIGS: EventConfig[] = [
  {
    type: StockEventType.PURCHASE,
    label: "Stock Purchase (Inward)",
    category: "INWARD",
    icon: Truck,
    colorClass:
      "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    badgeClass:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    defaultReason: "Supplier Purchase Order / Inward Shipment",
    description: "New stock received from supplier or manufacturer (+)",
  },
  {
    type: StockEventType.RETURN,
    label: "Customer / Warehouse Return",
    category: "INWARD",
    icon: RotateCcw,
    colorClass:
      "border-teal-500/40 bg-teal-500/5 text-teal-600 dark:text-teal-400",
    badgeClass:
      "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
    defaultReason: "Customer Return back to sellable inventory",
    description: "Item returned by customer and restored to inventory (+)",
  },
  {
    type: StockEventType.RESTOCK,
    label: "General Restock",
    category: "INWARD",
    icon: Boxes,
    colorClass:
      "border-cyan-500/40 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400",
    badgeClass:
      "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    defaultReason: "Warehouse Restock / Replenishment",
    description: "General inventory replenishment (+)",
  },
  {
    type: StockEventType.DAMAGE,
    label: "Damaged Stock",
    category: "OUTWARD",
    icon: Flame,
    colorClass:
      "border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400",
    badgeClass:
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    defaultReason: "Damaged during handling / warehouse damage",
    description: "Damaged or unsellable stock written off (-)",
  },
  {
    type: StockEventType.EXPIRED,
    label: "Expired Goods",
    category: "OUTWARD",
    icon: AlertTriangle,
    colorClass:
      "border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    badgeClass:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    defaultReason: "Expired shelf life / batch disposal",
    description: "Expired pet food or supplements removed (-)",
  },
  {
    type: StockEventType.LOSS,
    label: "Theft / Missing / Lost",
    category: "OUTWARD",
    icon: SearchX,
    colorClass: "border-red-500/40 bg-red-500/5 text-red-600 dark:text-red-400",
    badgeClass:
      "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    defaultReason: "Inventory Shrinkage / Missing during audit",
    description: "Discrepancies, missing units, or theft (-)",
  },
  {
    type: StockEventType.ADJUSTMENT,
    label: "Inventory Audit Count",
    category: "ADJUSTMENT",
    icon: SlidersHorizontal,
    colorClass:
      "border-blue-500/40 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    badgeClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    defaultReason: "Physical Inventory Cycle Count Reconciliation",
    description:
      "Audit correction or setting exact physical count (Set or Delta)",
  },
  {
    type: StockEventType.INITIAL,
    label: "Initial Stock Correction",
    category: "ADJUSTMENT",
    icon: Bookmark,
    colorClass:
      "border-purple-500/40 bg-purple-500/5 text-purple-600 dark:text-purple-400",
    badgeClass:
      "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    defaultReason: "Initial baseline stock calibration",
    description: "Reset or adjust baseline opening stock",
  },
];

const COMMON_REASONS = [
  "Supplier Purchase Order / Inward Shipment",
  "Customer Return Order (Inspected & Sellable)",
  "Physical Warehouse Cycle Count Reconciliation",
  "Damaged in Shipping / Transit",
  "Damaged during Warehouse Handling",
  "Expired Batch / Shelf Life Disposal",
  "Inventory Shrinkage / Missing Items",
  "Sample / Marketing Display Withdrawal",
  "Initial Opening Stock Setup Correction",
];

export function StockModifyForm({
  selectedItem,
  onSuccess,
  onClearSelection,
}: StockModifyFormProps) {
  const [eventType, setEventType] = useState<StockEventType>(
    StockEventType.PURCHASE,
  );
  const [adjustmentMode, setAdjustmentMode] = useState<"DELTA" | "SET_TOTAL">(
    "DELTA",
  );
  const [quantity, setQuantity] = useState<string>("10");
  const [reason, setReason] = useState<string>(
    "Supplier Purchase Order / Inward Shipment",
  );
  const [customReason, setCustomReason] = useState("");
  const [isCustomReason, setIsCustomReason] = useState(false);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedConfig = useMemo(
    () => EVENT_CONFIGS.find((c) => c.type === eventType) || EVENT_CONFIGS[0],
    [eventType],
  );

  // Auto-fill default reason on event type change
  useEffect(() => {
    if (!isCustomReason) {
      setReason(selectedConfig.defaultReason);
    }
  }, [eventType, selectedConfig, isCustomReason]);

  // If selected item changes or becomes empty, reset quantity
  useEffect(() => {
    if (selectedItem) {
      if (adjustmentMode === "SET_TOTAL") {
        setQuantity(String(selectedItem.currentStock));
      }
    }
  }, [selectedItem, adjustmentMode]);

  const numQuantity = Number(quantity) || 0;
  const currentStock = selectedItem?.currentStock ?? 0;

  // Calculate resulting stock preview
  const resultingStock = useMemo(() => {
    if (!selectedItem) return 0;

    if (adjustmentMode === "SET_TOTAL") {
      return numQuantity;
    }

    if (selectedConfig.category === "INWARD") {
      return currentStock + numQuantity;
    }

    if (selectedConfig.category === "OUTWARD") {
      return currentStock - numQuantity;
    }

    // ADJUSTMENT delta
    return currentStock + numQuantity;
  }, [
    selectedItem,
    adjustmentMode,
    selectedConfig.category,
    currentStock,
    numQuantity,
  ]);

  const isValidQuantity = numQuantity >= 0 && !isNaN(numQuantity);
  const isNegativeResult = resultingStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) {
      toast.error("Please select a product or variant from search.");
      return;
    }

    if (!isValidQuantity || (adjustmentMode === "DELTA" && numQuantity === 0)) {
      toast.error("Please enter a valid non-zero adjustment quantity.");
      return;
    }

    if (isNegativeResult) {
      toast.error(
        `Stock cannot fall below zero. Current stock is ${currentStock}, but requested deduction results in ${resultingStock}.`,
      );
      return;
    }

    const finalReason = isCustomReason ? customReason.trim() : reason.trim();
    if (!finalReason) {
      toast.error(
        "Please provide a reason or reference for this stock change.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await modifyStockAction({
        targetType: selectedItem.targetType,
        productId: selectedItem.productId,
        variantId: selectedItem.variantId,
        type: eventType,
        adjustmentMode,
        quantity: numQuantity,
        reason: finalReason,
        note: note.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        // Reset form values
        setQuantity("10");
        setNote("");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to modify stock.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedItem) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 sm:p-12 text-center text-muted-foreground shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/60 mb-4">
          <Boxes className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          No Inventory Item Selected
        </h3>
        <p className="mt-1 max-w-sm text-xs sm:text-sm">
          Select a simple product or variant from the search list to adjust
          stock, record purchases, write off damaged goods, or log returns.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6 shadow-sm"
    >
      {/* Selected Item Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border bg-background flex items-center justify-center">
            {selectedItem.imageBase64 ? (
              <Image
                src={selectedItem.imageBase64}
                alt={selectedItem.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                {selectedItem.name}
              </h3>
              <Badge
                variant={
                  selectedItem.targetType === "VARIANT"
                    ? "default"
                    : "secondary"
                }
                className="text-[10px] font-mono uppercase"
              >
                {selectedItem.targetType}
              </Badge>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                SKU:{" "}
                <code className="font-mono font-semibold text-foreground">
                  {selectedItem.sku}
                </code>
              </span>
              <span>•</span>
              <span>Code: {selectedItem.code}</span>
              {selectedItem.variantAttributes &&
                selectedItem.variantAttributes.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {selectedItem.variantAttributes
                        .map((a) => `${a.name}: ${a.value}`)
                        .join(", ")}
                    </span>
                  </>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block">
              Current Stock
            </span>
            <span className="text-base sm:text-lg font-bold text-foreground">
              {currentStock} units
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Change
          </Button>
        </div>
      </div>

      {/* Stock Event Type Selection Grid */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
          1. Select Stock Event / Operation Type
        </Label>

        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {EVENT_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            const isSelected = eventType === cfg.type;

            return (
              <button
                key={cfg.type}
                type="button"
                onClick={() => {
                  setEventType(cfg.type);
                  if (
                    cfg.type === StockEventType.ADJUSTMENT ||
                    cfg.type === StockEventType.INITIAL
                  ) {
                    setAdjustmentMode("DELTA");
                  }
                }}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? `${cfg.colorClass} ring-2 ring-primary/30 font-medium shadow-sm`
                    : "border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30 text-foreground"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider ${cfg.badgeClass}`}
                  >
                    {cfg.category === "INWARD"
                      ? "+ Inward"
                      : cfg.category === "OUTWARD"
                        ? "- Outward"
                        : "± Audit"}
                  </span>
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-1">
                  {cfg.label}
                </span>
                <span className="text-[10px] text-muted-foreground line-clamp-1 leading-normal">
                  {cfg.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode & Quantity Section */}
      <div className="grid gap-4 sm:grid-cols-12 items-start">
        {/* Adjustment Mode (for Audit/Initial) */}
        {(eventType === StockEventType.ADJUSTMENT ||
          eventType === StockEventType.INITIAL) && (
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Calculation Mode
            </Label>
            <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-1 bg-muted/20">
              <Button
                type="button"
                size="sm"
                variant={adjustmentMode === "DELTA" ? "default" : "ghost"}
                onClick={() => setAdjustmentMode("DELTA")}
                className="h-7 text-xs font-medium"
              >
                ± Delta
              </Button>
              <Button
                type="button"
                size="sm"
                variant={adjustmentMode === "SET_TOTAL" ? "default" : "ghost"}
                onClick={() => setAdjustmentMode("SET_TOTAL")}
                className="h-7 text-xs font-medium"
              >
                Set Total
              </Button>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div
          className={
            eventType === StockEventType.ADJUSTMENT ||
            eventType === StockEventType.INITIAL
              ? "sm:col-span-8 space-y-1.5"
              : "sm:col-span-12 space-y-1.5"
          }
        >
          <div className="flex items-center justify-between">
            <Label
              htmlFor="stock-qty"
              className="text-xs font-semibold text-foreground"
            >
              {adjustmentMode === "SET_TOTAL"
                ? "New Exact Total Stock Count"
                : `Quantity to ${
                    selectedConfig.category === "INWARD"
                      ? "Add (+)"
                      : selectedConfig.category === "OUTWARD"
                        ? "Deduct (-)"
                        : "Adjust"
                  }`}
            </Label>
            <div className="flex items-center gap-1">
              {[5, 10, 25, 50, 100].map((step) => (
                <Button
                  key={step}
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="h-5 px-1.5 text-[10px]"
                  onClick={() => setQuantity(String(step))}
                >
                  +{step}
                </Button>
              ))}
            </div>
          </div>

          <Input
            id="stock-qty"
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="text-base font-semibold font-mono"
            required
          />
        </div>
      </div>

      {/* Live Calculation Preview Banner */}
      <div
        className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border p-3.5 sm:p-4 transition-all ${
          isNegativeResult
            ? "border-destructive bg-destructive/10 text-destructive"
            : "border-primary/20 bg-primary/5 text-foreground"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background border shadow-xs">
            {selectedConfig.category === "INWARD" ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : selectedConfig.category === "OUTWARD" ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <SlidersHorizontal className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Stock Calculation Preview
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-sm font-semibold">
              <span>Current: {currentStock}</span>
              <span>&rarr;</span>
              <span
                className={
                  selectedConfig.category === "INWARD"
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : selectedConfig.category === "OUTWARD"
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : "text-blue-600 dark:text-blue-400 font-bold"
                }
              >
                {adjustmentMode === "SET_TOTAL"
                  ? `Set to ${numQuantity}`
                  : `${
                      selectedConfig.category === "INWARD"
                        ? `+${numQuantity}`
                        : `-${numQuantity}`
                    } (${selectedConfig.label})`}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
          <span className="text-[11px] text-muted-foreground">
            Resulting Inventory:
          </span>
          <span
            className={`text-lg sm:text-xl font-extrabold ${
              isNegativeResult
                ? "text-destructive"
                : resultingStock <= 5
                  ? "text-amber-500"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {resultingStock} units
          </span>
        </div>
      </div>

      {/* Reason & Reference Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            2. Reason / Reference Details
          </Label>
          <button
            type="button"
            onClick={() => setIsCustomReason(!isCustomReason)}
            className="text-xs text-primary hover:underline font-medium"
          >
            {isCustomReason ? "Select Predefined Reason" : "Type Custom Reason"}
          </button>
        </div>

        {isCustomReason ? (
          <Input
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="e.g. PO-2026-8942 / Customer Return Order #104 / Audit check"
            className="text-xs sm:text-sm"
            required
          />
        ) : (
          <Select value={reason} onValueChange={(val) => setReason(val ?? "")}>
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="Select reason or transaction reference">
                {reason || "Select reason or transaction reference"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {COMMON_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="space-y-1">
          <Label
            htmlFor="stock-notes"
            className="text-xs font-medium text-muted-foreground"
          >
            Optional Notes / Audit Memo
          </Label>
          <Textarea
            id="stock-notes"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Additional details (e.g. Supplier name, condition remarks, batch number)..."
            className="text-xs"
          />
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClearSelection}
          disabled={isSubmitting}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isNegativeResult || !isValidQuantity}
          className="gap-2 text-xs font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving Stock Event...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Save &amp; Record Stock Event
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
