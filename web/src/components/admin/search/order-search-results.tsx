"use client";

import React from "react";
import Link from "next/link";
import { AdminOrderSearchResult } from "@/schemas/admin/search";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatus } from "@/generated/prisma/enums";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderSearchResultsProps {
  orders: AdminOrderSearchResult[];
}

export function OrderSearchResults({ orders }: OrderSearchResultsProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
        No orders found matching this search.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-[#EDF5FA]/80">
          <TableRow>
            <TableHead className="text-xs font-bold text-gray-700">
              Order #
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Customer
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Items &amp; Value
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Payment
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Status
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Date
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id} className="hover:bg-gray-50/70">
              {/* Order Code */}
              <TableCell className="font-mono text-xs font-bold text-gray-900">
                #{o.code}
              </TableCell>

              {/* Customer */}
              <TableCell>
                <p className="text-xs font-bold text-gray-900">
                  {o.customerName}
                </p>
                <p className="text-[11px] text-gray-500 font-mono">
                  {o.customerPhone || o.customerEmail}
                </p>
              </TableCell>

              {/* Items & Total */}
              <TableCell>
                <p className="text-xs font-black text-[#56C8D8]">
                  ৳{parseFloat(o.finalCost || "0").toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-500">
                  {o.totalQuantity} items
                </p>
              </TableCell>

              {/* Payment Status */}
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {o.paymentStatus}
                </Badge>
              </TableCell>

              {/* Order Status */}
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    o.status === OrderStatus.DELIVERED &&
                      "border-emerald-300 text-emerald-600 bg-emerald-50",
                    o.status === OrderStatus.CANCELLED &&
                      "border-rose-300 text-rose-600 bg-rose-50",
                    o.status === OrderStatus.PENDING &&
                      "border-amber-300 text-amber-600 bg-amber-50",
                  )}
                >
                  {o.status}
                </Badge>
              </TableCell>

              {/* Date */}
              <TableCell className="text-xs text-gray-500">
                {new Date(o.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Link
                  href={`/admin/management/orders/all-orders?orderId=${o.id}`}
                  target="_blank"
                  className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
