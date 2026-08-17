"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Search, Package, Boxes, Users, X, Layers } from "lucide-react";
import {
  CouponCatalogUser,
  CouponCatalogProduct,
  CouponCatalogCombo,
} from "@/actions/admin/management/offers/coupons";

// =========================================================================
// 1. User Picker Component
// =========================================================================
interface UserPickerProps {
  users: CouponCatalogUser[];
  selectedUserIds: string[];
  onUserToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

export function UserPicker({
  users,
  selectedUserIds,
  onUserToggle,
  onSelectAll,
  onClearAll,
}: UserPickerProps) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 sm:p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Select Customers
          </span>
          <Badge
            variant={selectedUserIds.length > 0 ? "default" : "outline"}
            className="px-1.5 py-0 text-[10px] h-4.5"
          >
            {selectedUserIds.length} Selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="h-8 pl-8 pr-8 text-xs bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {onSelectAll && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="h-8 text-xs font-medium px-2.5 shrink-0"
            >
              Select All
            </Button>
          )}

          {onClearAll && selectedUserIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-8 text-xs font-medium px-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            No matching customers found.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);
            return (
              <div
                key={user.id}
                onClick={() => onUserToggle(user.id)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                    : "border-border/60 bg-background hover:bg-muted/40",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onUserToggle(user.id)}
                  className="shrink-0"
                />
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// =========================================================================
// 2. Product & Variant Picker Component
// =========================================================================
interface ProductVariantPickerProps {
  products: CouponCatalogProduct[];
  selectedProductIds: string[];
  selectedVariantIds: string[];
  onProductToggle: (id: string) => void;
  onVariantToggle: (id: string) => void;
  onSelectAllProducts?: () => void;
  onClearAllProducts?: () => void;
  onSelectAllVariants?: () => void;
  onClearAllVariants?: () => void;
}

export function ProductVariantPicker({
  products,
  selectedProductIds,
  selectedVariantIds,
  onProductToggle,
  onVariantToggle,
  onSelectAllProducts,
  onClearAllProducts,
  onSelectAllVariants,
  onClearAllVariants,
}: ProductVariantPickerProps) {
  const [activeTab, setActiveTab] = useState<"products" | "variants">(
    "products",
  );
  const [search, setSearch] = useState("");

  const allProducts = useMemo(() => products, [products]);

  const allVariants = useMemo(() => {
    return products.flatMap((p) =>
      (p.variants || []).map((v) => ({
        ...v,
        productName: p.name,
        productCode: p.code,
        attributes: v.attributes || [],
      })),
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        p.categoryName?.toLowerCase().includes(q),
    );
  }, [allProducts, search]);

  const filteredVariants = useMemo(() => {
    if (!search.trim()) return allVariants;
    const q = search.toLowerCase();
    return allVariants.filter(
      (v) =>
        v.productName.toLowerCase().includes(q) ||
        (v.sku && v.sku.toLowerCase().includes(q)) ||
        (v.attributes || []).some(
          (a) =>
            a.value.toLowerCase().includes(q) ||
            a.name?.toLowerCase().includes(q),
        ),
    );
  }, [allVariants, search]);

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 sm:p-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg">
          <Button
            type="button"
            variant={activeTab === "products" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("products")}
            className="h-8 text-xs font-medium gap-1.5 shadow-none"
          >
            <Package className="h-3.5 w-3.5" />
            Products
            <Badge
              variant={selectedProductIds.length > 0 ? "default" : "outline"}
              className="ml-0.5 px-1.5 py-0 text-[10px] h-4.5"
            >
              {selectedProductIds.length}
            </Badge>
          </Button>

          <Button
            type="button"
            variant={activeTab === "variants" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("variants")}
            className="h-8 text-xs font-medium gap-1.5 shadow-none"
          >
            <Layers className="h-3.5 w-3.5" />
            Individual Variants
            <Badge
              variant={selectedVariantIds.length > 0 ? "default" : "outline"}
              className="ml-0.5 px-1.5 py-0 text-[10px] h-4.5"
            >
              {selectedVariantIds.length}
            </Badge>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === "products" ? "products..." : "variants..."}`}
              className="h-8 pl-8 pr-8 text-xs bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {activeTab === "products" ? (
            <>
              {onSelectAllProducts && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSelectAllProducts}
                  className="h-8 text-xs font-medium px-2.5 shrink-0"
                >
                  Select All
                </Button>
              )}
              {onClearAllProducts && selectedProductIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearAllProducts}
                  className="h-8 text-xs font-medium px-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </>
          ) : (
            <>
              {onSelectAllVariants && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSelectAllVariants}
                  className="h-8 text-xs font-medium px-2.5 shrink-0"
                >
                  Select All
                </Button>
              )}
              {onClearAllVariants && selectedVariantIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearAllVariants}
                  className="h-8 text-xs font-medium px-2 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tab Content: Products (Simple & Variable) */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
              No matching products found.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = selectedProductIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => onProductToggle(product.id)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-left",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border/60 bg-background hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onProductToggle(product.id)}
                    className="shrink-0"
                  />
                  <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/40">
                    {product.imageBase64 ? (
                      <Image
                        src={product.imageBase64}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {product.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{product.code}</span>
                      {product.isVariable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab("variants");
                            setSearch(product.name);
                          }}
                          className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors"
                          title="Click to view and pick individual variants for this product"
                        >
                          <Layers className="h-2.5 w-2.5" />
                          Pick Variants ({product.variants?.length || 0})
                        </button>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-3.5 font-normal shrink-0"
                        >
                          Simple
                        </Badge>
                      )}
                      {product.salePrice ? (
                        <span className="font-medium text-foreground">
                          ৳{product.salePrice}
                        </span>
                      ) : product.regularPrice ? (
                        <span className="font-medium text-foreground">
                          ৳{product.regularPrice}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content: Variants */}
      {activeTab === "variants" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredVariants.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
              No matching variants found.
            </div>
          ) : (
            filteredVariants.map((variant) => {
              const isSelected = selectedVariantIds.includes(variant.id);
              return (
                <div
                  key={variant.id}
                  onClick={() => onVariantToggle(variant.id)}
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-left",
                    isSelected
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                      : "border-border/60 bg-background hover:bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onVariantToggle(variant.id)}
                    className="shrink-0"
                  />
                  <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/40">
                    {variant.imageBase64 ? (
                      <Image
                        src={variant.imageBase64}
                        alt={variant.sku}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Layers className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {variant.productName}
                    </p>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      <Badge
                        variant="outline"
                        className="px-1 py-0 text-[10px] font-mono h-3.5"
                      >
                        {variant.sku}
                      </Badge>
                      {variant.attributes.map((a) => (
                        <span
                          key={a.id}
                          className="text-[10px] text-muted-foreground"
                        >
                          {a.value}
                        </span>
                      ))}
                      {variant.salePrice ? (
                        <span className="text-[10px] font-semibold text-foreground ml-auto">
                          ৳{variant.salePrice}
                        </span>
                      ) : variant.regularPrice ? (
                        <span className="text-[10px] font-semibold text-foreground ml-auto">
                          ৳{variant.regularPrice}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 3. Combo Products Picker Component
// =========================================================================
interface ComboPickerProps {
  combos: CouponCatalogCombo[];
  selectedComboIds: string[];
  onComboToggle: (id: string) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

export function ComboPicker({
  combos,
  selectedComboIds,
  onComboToggle,
  onSelectAll,
  onClearAll,
}: ComboPickerProps) {
  const [search, setSearch] = useState("");

  const filteredCombos = useMemo(() => {
    if (!search.trim()) return combos;
    const q = search.toLowerCase();
    return combos.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.sku.toLowerCase().includes(q),
    );
  }, [combos, search]);

  return (
    <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 sm:p-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Select Combo Bundles
          </span>
          <Badge
            variant={selectedComboIds.length > 0 ? "default" : "outline"}
            className="px-1.5 py-0 text-[10px] h-4.5"
          >
            {selectedComboIds.length} Selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search combo bundles..."
              className="h-8 pl-8 pr-8 text-xs bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {onSelectAll && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="h-8 text-xs font-medium px-2.5 shrink-0"
            >
              Select All
            </Button>
          )}

          {onClearAll && selectedComboIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-8 text-xs font-medium px-2 shrink-0 text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
        {filteredCombos.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            No matching combo bundles found.
          </div>
        ) : (
          filteredCombos.map((combo) => {
            const isSelected = selectedComboIds.includes(combo.id);
            return (
              <div
                key={combo.id}
                onClick={() => onComboToggle(combo.id)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                    : "border-border/60 bg-background hover:bg-muted/40",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onComboToggle(combo.id)}
                  className="shrink-0"
                />
                <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted shrink-0 border border-border/40">
                  {combo.imageBase64 ? (
                    <Image
                      src={combo.imageBase64}
                      alt={combo.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Boxes className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {combo.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                    <span className="font-mono">{combo.code}</span>
                    {combo.salePrice && (
                      <span className="font-medium text-foreground">
                        ৳{combo.salePrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
