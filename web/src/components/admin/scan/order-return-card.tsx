"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ScannedOrderResult, OrderReturnInput } from "@/schemas/admin/scan";
import { processOrderReturnAction } from "@/actions/admin/scan";
import { OrderStatus } from "@/generated/prisma/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Package, RotateCcw, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { scannerAudio } from "./scanner-audio";

interface ItemReturnState {
  selected: boolean;
  quantityToReturn: number;
  restockInventory: boolean;
  condition: "GOOD" | "DAMAGED" | "EXPIRED" | "DEFECTIVE";
  reason: string;
}

interface OrderReturnCardProps {
  order: ScannedOrderResult;
  onOrderUpdated?: () => void;
}

export function OrderReturnCard({
  order,
  onOrderUpdated,
}: OrderReturnCardProps) {
  const [selectedItems, setSelectedItems] = useState<
    Record<string, ItemReturnState>
  >(() => {
    const init: Record<string, ItemReturnState> = {};
    for (const item of order.items) {
      init[item.id] = {
        selected: false,
        quantityToReturn: item.quantity,
        restockInventory: true,
        condition: "GOOD",
        reason: "Customer Return",
      };
    }
    return init;
  });

  const [returnNote, setReturnNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: checked,
      },
    }));
  };

  const handleUpdateItemField = <K extends keyof ItemReturnState>(
    itemId: string,
    field: K,
    value: ItemReturnState[K],
  ) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();

    const returnPayloadItems = order.items
      .filter((itm) => selectedItems[itm.id]?.selected)
      .map((itm) => {
        const state = selectedItems[itm.id];
        return {
          orderItemId: itm.id,
          productId: itm.productId,
          variantId: itm.variantId || undefined,
          quantityToReturn: state.quantityToReturn,
          restockInventory: state.restockInventory,
          condition: state.condition,
          reason: state.reason || "Customer Return",
        };
      });

    if (returnPayloadItems.length === 0) {
      toast.error("Please select at least one item to process for return.");
      return;
    }

    const isAllItemsReturned = returnPayloadItems.length === order.items.length;

    const payload: OrderReturnInput = {
      orderId: order.id,
      items: returnPayloadItems,
      newOrderStatus: isAllItemsReturned
        ? OrderStatus.RETURNED
        : OrderStatus.RETURNED_PARTIAL,
      note: returnNote || undefined,
    };

    startTransition(async () => {
      const res = await processOrderReturnAction(payload);
      if (res.success) {
        scannerAudio.playSuccessBeep();
        toast.success(res.message);
        onOrderUpdated?.();
      } else {
        scannerAudio.playErrorBuzz();
        toast.error(res.message || "Failed to process return.");
      }
    });
  };

  const selectedCount = Object.values(selectedItems).filter(
    (s) => s.selected,
  ).length;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              Invoice Order #{order.code}
            </h2>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold uppercase",
                order.status === OrderStatus.DELIVERED
                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                  : order.status === OrderStatus.RETURNED
                    ? "border-rose-300 text-rose-700 bg-rose-50"
                    : "border-gray-300 text-gray-700 bg-gray-50",
              )}
            >
              {order.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Customer:{" "}
            <span className="font-bold text-gray-900">
              {order.customerName}
            </span>{" "}
            ({order.customerPhone}) • {order.district}
          </p>
          <p className="text-xs text-gray-500">
            Total:{" "}
            <span className="font-black text-emerald-700">
              ৳{order.finalCost}
            </span>{" "}
            • {order.totalQuantity} items • Payment:{" "}
            <span className="font-bold">{order.paymentMethod}</span> (
            {order.paymentStatus})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/management/orders`}
            className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200"
          >
            <span>View in Orders Manager</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Return Items Selection Form */}
      <form onSubmit={handleProcessReturn} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-500" />
            <span>Process Return &amp; Auto-Restock Inventory</span>
          </h3>
          <span className="text-xs font-bold text-gray-500">
            {selectedCount} of {order.items.length} item(s) selected
          </span>
        </div>

        {/* Order Items Table */}
        <div className="rounded-2xl border border-gray-200/80 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700 w-10 text-center">
                  Return
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Item
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">
                  Purchased Qty
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">
                  Return Qty
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700">
                  Condition
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">
                  Restock?
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => {
                const isSelected = selectedItems[item.id]?.selected || false;
                const state = selectedItems[item.id] || {
                  quantityToReturn: item.quantity,
                  restockInventory: true,
                  condition: "GOOD",
                  reason: "Customer Return",
                };

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "transition-colors text-xs",
                      isSelected ? "bg-rose-50/30" : "hover:bg-gray-50/60",
                    )}
                  >
                    {/* Checkbox */}
                    <TableCell className="text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleToggleItem(item.id, !!checked)
                        }
                      />
                    </TableCell>

                    {/* Product */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.productName}
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized={item.thumbnail.startsWith("data:")}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[180px]">
                          <p className="font-bold text-gray-900 truncate">
                            {item.productName}
                          </p>
                          {item.variantLabel && (
                            <p className="text-[10px] text-gray-500">
                              {item.variantLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Purchased Qty */}
                    <TableCell className="text-center font-mono font-bold text-gray-700">
                      {item.quantity}
                    </TableCell>

                    {/* Return Qty Input */}
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={1}
                        max={item.quantity}
                        disabled={!isSelected}
                        value={state.quantityToReturn}
                        onChange={(e) =>
                          handleUpdateItemField(
                            item.id,
                            "quantityToReturn",
                            Math.min(
                              item.quantity,
                              Math.max(1, parseInt(e.target.value) || 1),
                            ),
                          )
                        }
                        className="w-16 h-8 text-center mx-auto rounded-lg text-xs font-mono font-bold bg-white"
                      />
                    </TableCell>

                    {/* Condition */}
                    <TableCell>
                      <Select
                        disabled={!isSelected}
                        value={state.condition}
                        onValueChange={(val) => {
                          if (val) {
                            handleUpdateItemField(item.id, "condition", val);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-32 rounded-lg text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="min-w-[180px] bg-white border border-gray-200 shadow-xl rounded-2xl p-1 z-50"
                        >
                          <SelectItem
                            value="GOOD"
                            className="text-xs py-1.5 px-2 rounded-xl cursor-pointer"
                          >
                            <span className="font-bold text-emerald-700">
                              Good (Resalable)
                            </span>
                          </SelectItem>
                          <SelectItem
                            value="DAMAGED"
                            className="text-xs py-1.5 px-2 rounded-xl cursor-pointer"
                          >
                            <span className="font-bold text-rose-600">
                              Damaged
                            </span>
                          </SelectItem>
                          <SelectItem
                            value="DEFECTIVE"
                            className="text-xs py-1.5 px-2 rounded-xl cursor-pointer"
                          >
                            <span className="font-bold text-amber-600">
                              Defective
                            </span>
                          </SelectItem>
                          <SelectItem
                            value="EXPIRED"
                            className="text-xs py-1.5 px-2 rounded-xl cursor-pointer"
                          >
                            <span className="font-bold text-red-600">
                              Expired
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Restock Toggle */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Checkbox
                          disabled={!isSelected}
                          checked={state.restockInventory}
                          onCheckedChange={(checked) =>
                            handleUpdateItemField(
                              item.id,
                              "restockInventory",
                              !!checked,
                            )
                          }
                        />
                        <span className="text-[10px] text-gray-600 font-medium">
                          {state.restockInventory ? "Yes" : "No"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-gray-700">
            Return Reason / Note
          </Label>
          <Input
            value={returnNote}
            onChange={(e) => setReturnNote(e.target.value)}
            placeholder="e.g. Size mismatch / Returned at counter in unopened packaging..."
            className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end">
          <Button
            type="submit"
            disabled={isPending || selectedCount === 0}
            className="h-10 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Process Return &amp; Restock ({selectedCount} items)</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
