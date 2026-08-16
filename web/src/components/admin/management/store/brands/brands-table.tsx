"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Package } from "lucide-react";
import { DeleteBrandButton } from "./delete-brand-button";
import { EditBrandButton } from "./edit-brand-button";
import type { BrandWithCount } from "@/actions/admin/management/store/brands/get-all";

export function BrandsTable({ brands }: { brands: BrandWithCount[] }) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  // Filter brands based on search
  const filteredBrands = brands.filter((brand) => {
    if (!normalizedSearch) return true;
    return (
      brand.name.toLowerCase().includes(normalizedSearch) ||
      brand.slug.toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div>
      {/* Search and Filter Header */}
      <div className="border-b p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or slug"
            aria-label="Search brands by name or slug"
            className="h-9 pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setSearch("")}
              className="absolute right-1 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X />
            </Button>
          )}
        </div>

        {/* Search stats */}
        {search && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {filteredBrands.length} of {brands.length} brands
            </p>
          </div>
        )}
      </div>

      {/* Brands Table */}
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-6">Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Image</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Products
              </span>
            </TableHead>
            <TableHead className="pr-6 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBrands.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-sm text-muted-foreground py-8"
              >
                No brands found.
              </TableCell>
            </TableRow>
          ) : (
            filteredBrands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="pl-6 font-medium">{brand.name}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                    {brand.slug}
                  </code>
                </TableCell>
                <TableCell>
                  {brand.image && (
                    <Image
                      src={brand.image}
                      alt={brand.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {brand.productCount > 0 ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {brand.productCount}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditBrandButton
                      brand={{
                        id: brand.id,
                        name: brand.name,
                        slug: brand.slug,
                        image: brand.image,
                      }}
                    />
                    <DeleteBrandButton
                      brandId={brand.id}
                      brandName={brand.name}
                      productCount={brand.productCount}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
