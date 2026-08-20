"use client";

import React from "react";
import { DashboardInventoryMetrics } from "@/actions/admin/dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Layers,
  AlertTriangle,
  Flame,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface InventoryHealthCardProps {
  inventory: DashboardInventoryMetrics;
}

export function InventoryHealthCard({ inventory }: InventoryHealthCardProps) {
  return (
    <Card className="rounded-3xl border-gray-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#56C8D8]" />
            <span>Product Catalog &amp; Stock Health</span>
          </h2>
          <p className="text-xs text-gray-500">
            {inventory.totalProducts} products • {inventory.totalVariantsCount} variants • {inventory.totalUnitsInStock.toLocaleString()} total units
          </p>
        </div>

        <Link
          href="/admin/management/inventory/all-products"
          className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
        >
          <span>Inventory</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stock Health & Catalog Type Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">
            Single Products
          </span>
          <span className="text-base font-black text-gray-900">
            {inventory.singleProductsCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC]">
          <span className="text-[10px] font-bold text-[#0097a7] uppercase block">
            Variable Products
          </span>
          <span className="text-base font-black text-[#0097a7]">
            {inventory.variableProductsCount} ({inventory.totalVariantsCount} SKUs)
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
          <span className="text-[10px] font-bold text-amber-700 uppercase block">
            Low Stock (&le; 5)
          </span>
          <span className="text-base font-black text-amber-700">
            {inventory.lowStockItemsCount} items
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
          <span className="text-[10px] font-bold text-rose-700 uppercase block">
            Out of Stock
          </span>
          <span className="text-base font-black text-rose-700">
            {inventory.outOfStockItemsCount} items
          </span>
        </div>
      </div>

      {/* Low Stock Urgent Alerts (if any) */}
      {inventory.lowStockAlerts.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Warning &amp; Replenishment Alerts</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inventory.lowStockAlerts.map((item) => (
              <Badge
                key={item.id}
                variant="outline"
                className={`text-[10px] font-bold ${
                  item.currentStock === 0
                    ? "bg-rose-100 text-rose-700 border-rose-300"
                    : "bg-white text-amber-800 border-amber-300"
                }`}
              >
                {item.name} &bull; {item.currentStock} left
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Top Best-Selling Products */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-700 block flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" /> Top Selling Pet Products
        </span>

        {inventory.topSellingProducts.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">
            No sales recorded yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {inventory.topSellingProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-2.5 rounded-2xl bg-gray-50/70 border border-gray-200/70 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-500 shrink-0">
                    <Package className="w-3.5 h-3.5 text-[#56C8D8]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {prod.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {prod.category.replace(/_/g, " ")} • {prod.stockRemaining} in stock
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="font-black text-[#0097a7] block">
                    {prod.unitsSold} sold
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ৳{prod.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-700 block flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-500" /> Category Valuation Distribution
        </span>
        <div className="space-y-2">
          {inventory.categoryBreakdown.map((cat) => {
            const pct =
              inventory.totalInventoryValuation > 0
                ? Math.round((cat.valuation / inventory.totalInventoryValuation) * 100)
                : 0;
            return (
              <div key={cat.category} className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-semibold text-gray-700">
                  <span>{cat.category} ({cat.count} products)</span>
                  <span>৳{cat.valuation.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#56C8D8]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
