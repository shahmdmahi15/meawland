"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminProductSearchResult } from "@/schemas/admin/search";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSearchResultsProps {
  products: AdminProductSearchResult[];
}

export function ProductSearchResults({ products }: ProductSearchResultsProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
        No products found matching this search.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
      <Table>
        <TableHeader className="bg-[#EDF5FA]/80">
          <TableRow>
            <TableHead className="text-xs font-bold text-gray-700">
              Product
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Code / SKU
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Category &amp; Brand
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Price
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Stock Status
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const isLowStock = p.stock > 0 && p.stock <= 5;
            const isOutOfStock = p.stock <= 0;

            const isPriceRange = p.sellingPrice.includes("-");
            const formattedPrice = isPriceRange
              ? `৳${p.sellingPrice}`
              : `৳${parseFloat(p.sellingPrice || "0").toLocaleString()}`;

            return (
              <TableRow key={p.id} className="hover:bg-gray-50/70">
                {/* Product Name & Thumbnail */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized={p.thumbnail.startsWith("data:")}
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 max-w-[260px]">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1 py-0 font-bold",
                            p.isVariable
                              ? "border-purple-200 text-purple-700 bg-purple-50"
                              : "border-blue-200 text-blue-700 bg-blue-50",
                          )}
                        >
                          {p.isVariable
                            ? `Variable (${p.variants?.length || 0} variants)`
                            : "Simple"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Code / SKU */}
                <TableCell>
                  <p className="font-mono text-xs font-bold text-gray-900">
                    #{p.code}
                  </p>
                  {p.sku && (
                    <p className="font-mono text-[10px] text-gray-500">
                      SKU: {p.sku}
                    </p>
                  )}
                  {p.variants && p.variants.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-1 max-w-[180px]">
                      {p.variants.slice(0, 3).map((v) => (
                        <span
                          key={v.id}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                          title={`${v.label} - ৳${parseFloat(v.price).toLocaleString()} (${v.stock} in stock)`}
                        >
                          {v.label}
                        </span>
                      ))}
                      {p.variants.length > 3 && (
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          +{p.variants.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Category & Brand */}
                <TableCell>
                  <p className="text-xs font-semibold text-gray-800">
                    {p.categoryName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {p.brandName || "Generic"}
                  </p>
                </TableCell>

                {/* Price */}
                <TableCell>
                  <span className="text-xs font-black text-[#56C8D8]">
                    {formattedPrice}
                  </span>
                </TableCell>

                {/* Stock Status */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-bold gap-1",
                      isOutOfStock &&
                        "border-rose-300 text-rose-600 bg-rose-50",
                      isLowStock &&
                        "border-amber-300 text-amber-600 bg-amber-50",
                      !isLowStock &&
                        !isOutOfStock &&
                        "border-emerald-300 text-emerald-600 bg-emerald-50",
                    )}
                  >
                    {isLowStock && (
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                    )}
                    <span>{p.stock} units</span>
                  </Badge>
                </TableCell>

                {/* Action Link */}
                <TableCell className="text-right">
                  <Link
                    href={`/admin/management/inventory/all-products?productId=${p.id}`}
                    target="_blank"
                    className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
