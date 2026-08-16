"use client";

import { useState, useTransition } from "react";
import {
  Boxes,
  Package,
  AlertTriangle,
  XCircle,
  Truck,
  TrendingUp,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StockItemSearch } from "./stock-item-search";
import { StockModifyForm } from "./stock-modify-form";
import { RecentStockEventsTable } from "./recent-stock-events-table";
import {
  modifyStockAction,
  getRecentStockEventsAction,
  type StockItemSearchRow,
  type StockEventAuditRow,
  type ModifyStockMetrics,
} from "@/actions/admin/management/inventory/modify-stock";
import { StockEventType } from "@/generated/prisma/enums";

interface ModifyStockViewProps {
  initialMetrics: ModifyStockMetrics;
  initialEvents: StockEventAuditRow[];
  categories: string[];
}

export function ModifyStockView({
  initialMetrics,
  initialEvents,
  categories,
}: ModifyStockViewProps) {
  const [metrics, setMetrics] = useState<ModifyStockMetrics>(initialMetrics);
  const [events, setEvents] = useState<StockEventAuditRow[]>(initialEvents);
  const [selectedItem, setSelectedItem] = useState<StockItemSearchRow | null>(
    null,
  );
  const [isRefreshing, startTransition] = useTransition();

  const refreshEvents = () => {
    startTransition(async () => {
      const res = await getRecentStockEventsAction({ limit: 30 });
      if (res.success) {
        setEvents(res.events);
      }
    });
  };

  const handleStockModifiedSuccess = () => {
    refreshEvents();
  };

  // Quick adjust (+1, +5, +10, -1) directly from search list
  const handleQuickAdjust = async (item: StockItemSearchRow, delta: number) => {
    const isOutward = delta < 0;
    const absQty = Math.abs(delta);

    if (isOutward && item.currentStock < absQty) {
      toast.error(
        `Cannot reduce stock by ${absQty}. Current stock is only ${item.currentStock}.`,
      );
      return;
    }

    try {
      const res = await modifyStockAction({
        targetType: item.targetType,
        productId: item.productId,
        variantId: item.variantId,
        type: isOutward ? StockEventType.ADJUSTMENT : StockEventType.PURCHASE,
        adjustmentMode: "DELTA",
        quantity: absQty,
        reason: isOutward
          ? "Quick Inventory Reduction (-1)"
          : `Quick Restock (+${absQty})`,
        note: `Quick one-click adjustment directly from search table`,
      });

      if (res.success) {
        toast.success(
          `${item.name} stock updated: ${res.previousStock} → ${res.newStock}`,
        );
        refreshEvents();
        // If current selected item was updated, sync its stock
        if (selectedItem?.id === item.id) {
          setSelectedItem({
            ...selectedItem,
            currentStock: res.newStock ?? selectedItem.currentStock,
          });
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to apply quick adjustment.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Metrics Cards */}
      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-4">
        <Card className="border-border bg-card/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Stock Units
              </p>
              <h3
                suppressHydrationWarning
                className="text-xl sm:text-2xl font-bold text-foreground mt-0.5"
              >
                {metrics.totalStockUnits.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Products &amp; Variants
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.totalProducts + metrics.totalVariants}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Low Stock Warning (≤5)
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {metrics.lowStockCount}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Out of Stock (0)
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {metrics.outOfStockCount}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Search & Quick Selection */}
        <div className="lg:col-span-6 space-y-4">
          <StockItemSearch
            categories={categories}
            selectedItem={selectedItem}
            onSelectItem={(item) => setSelectedItem(item)}
            onQuickAdjust={handleQuickAdjust}
          />
        </div>

        {/* Right Column: Interactive Stock Modification Form */}
        <div className="lg:col-span-6 space-y-4">
          <StockModifyForm
            selectedItem={selectedItem}
            onSuccess={handleStockModifiedSuccess}
            onClearSelection={() => setSelectedItem(null)}
          />
        </div>
      </div>

      {/* Audit Log / Recent Stock Events Feed */}
      <div className="mt-2">
        <RecentStockEventsTable
          events={events}
          onRefresh={refreshEvents}
          isLoading={isRefreshing}
        />
      </div>
    </div>
  );
}
