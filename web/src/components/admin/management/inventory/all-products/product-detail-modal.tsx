"use client";

import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Package,
  Layers,
  Tag,
  DollarSign,
  Box,
  Calendar,
  Layers3,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { FullProduct } from "@/actions/admin/management/inventory/get-all-products";
import { formatCategory, formatDate } from "@/lib/utils";

interface ProductDetailModalProps {
  product: FullProduct;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onOpenChange,
}: ProductDetailModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allImages = useMemo(() => {
    return Array.from(
      new Set(
        [product.imageBase64, ...(product.galleryBase64 ?? [])].filter(
          (img): img is string => Boolean(img),
        ),
      ),
    );
  }, [product.imageBase64, product.galleryBase64]);

  const activeImage =
    selectedImage && allImages.includes(selectedImage)
      ? selectedImage
      : (allImages[0] ?? "");

  // Calculate stock status
  const totalStock = product.isVariable
    ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
    : (product.stock ?? 0);

  const getStockBadge = () => {
    if (totalStock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" /> Out of Stock ({totalStock})
        </Badge>
      );
    }
    if (totalStock <= 5) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" /> Low Stock (
          {totalStock})
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-500" /> In Stock (
        {totalStock})
      </Badge>
    );
  };

  const stockEventsCount = product.stockEvents?.length ?? 0;
  const formatCurrency = (value?: string | number | null) => {
    if (value === undefined || value === null || value === "") return "—";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "—";
    return `৳${parsed.toLocaleString()}`;
  };

  const summaryCards = [
    {
      label: "Product Type",
      value: product.isVariable ? "Variable" : "Simple",
      icon: Layers3,
    },
    {
      label: "Stock Events",
      value: `${stockEventsCount}`,
      icon: Package,
    },
    {
      label: "Created",
      value: formatDate(product.createdAt),
      icon: Calendar,
    },
    {
      label: "Updated",
      value: formatDate(product.updatedAt),
      icon: Calendar,
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          setSelectedImage(product.imageBase64 || "");
          handleOpenChange(true);
        }}
        title="View Product Details"
        aria-label="View Product Details"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[1180px] w-[min(96vw,1180px)] max-w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg font-bold sm:text-xl">
                  {product.name}
                </DialogTitle>
                <Badge
                  variant={product.isVariable ? "default" : "secondary"}
                  className="text-[10px] sm:text-xs"
                >
                  {product.isVariable ? "Variable Product" : "Simple Product"}
                </Badge>
              </div>
              <div>{getStockBadge()}</div>
            </div>
            <DialogDescription className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1 sm:gap-3">
              <span>
                Code:{" "}
                <code className="font-mono text-foreground font-semibold">
                  {product.code}
                </code>
              </span>
              <span>•</span>
              <span>
                SKU:{" "}
                <code className="font-mono text-foreground font-semibold">
                  {product.sku}
                </code>
              </span>
              <span>•</span>
              <span>
                Slug: <code className="font-mono">{product.slug}</code>
              </span>
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Left Column: Image Preview & Gallery */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-square w-full rounded-xl border bg-muted/30 overflow-hidden flex items-center justify-center">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-4">
                    <ImageIcon className="h-10 w-10 stroke-1 mb-1" />
                    <span className="text-xs">No image available</span>
                  </div>
                )}
              </div>

              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative h-14 w-14 shrink-0 rounded-lg border overflow-hidden transition-all ${
                        activeImage === img
                          ? "ring-2 ring-primary border-transparent"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} preview ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Key Details */}
            <div className="md:col-span-7 space-y-5">
              {/* Category, Subcategory, Brand */}
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/40 p-4 border text-sm sm:grid-cols-2">
                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Category & Subcategory
                  </span>
                  <p className="font-semibold mt-1">
                    {formatCategory(product.subCategory.category)} &rarr;{" "}
                    {product.subCategory.name}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" /> Brand
                  </span>
                  <p className="font-semibold mt-1">
                    {product.brand ? product.brand.name : "No Brand"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {summaryCards.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-lg border bg-muted/20 p-3 text-left"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase tracking-wider">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-foreground">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown for Simple Product */}
              {!product.isVariable && (
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Pricing & Financials
                  </h4>
                  <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                    <div className="p-2.5 rounded-lg bg-muted/30 border">
                      <span className="text-xs text-muted-foreground block">
                        Regular Price
                      </span>
                      <span className="text-lg font-bold">
                        {formatCurrency(product.regularPrice)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xs text-emerald-600 block font-medium">
                        Sale Price
                      </span>
                      <span className="text-lg font-bold text-emerald-700">
                        {formatCurrency(product.salePrice)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/30 border">
                      <span className="text-xs text-muted-foreground block">
                        Cost Price
                      </span>
                      <span className="text-lg font-semibold text-muted-foreground">
                        {formatCurrency(product.costPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Variable product quick summary */}
              {product.isVariable && (
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Layers3 className="h-4 w-4" /> Variant Summary
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Total Variants:
                    </span>
                    <Badge variant="outline" className="font-mono">
                      {product.variants.length} Variants
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Combined Total Stock:
                    </span>
                    <span className="font-semibold">{totalStock} Units</span>
                  </div>
                </div>
              )}

              {/* Short Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Short Description
                </h4>
                <p className="text-sm text-foreground/90 bg-muted/20 p-3 rounded-md border">
                  {product.shortDescription || "No short description provided."}
                </p>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Created:{" "}
                  {formatDate(product.createdAt)}
                </span>
                <span>Updated: {formatDate(product.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Long Description Section */}
          {product.longDescription && (
            <div className="mt-6 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Detailed Product Description
              </h4>
              <div className="text-sm p-4 rounded-lg bg-muted/20 border whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {product.longDescription}
              </div>
            </div>
          )}

          {/* Variants Table if Variable Product */}
          {product.isVariable && product.variants.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Box className="h-4 w-4 text-primary" /> Product Variants (
                {product.variants.length})
              </h4>
              <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Variant SKU</TableHead>
                      <TableHead>Attributes</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Regular</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variants.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          {v.imageBase64 ? (
                            <Image
                              src={v.imageBase64}
                              alt={v.sku}
                              width={36}
                              height={36}
                              className="h-9 w-9 rounded-md object-cover border"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                              No Image
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">
                          {v.sku}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {v.attributes.map((attr) => (
                              <Badge
                                key={attr.id}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {attr.name}: {attr.value}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          ৳{v.costPrice}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          ৳{v.regularPrice}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-emerald-600">
                          ৳{v.salePrice}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {v.stock === 0 ? (
                            <Badge
                              variant="destructive"
                              className="text-[10px] py-0"
                            >
                              Out
                            </Badge>
                          ) : v.stock <= 5 ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 text-amber-600 border-amber-500"
                            >
                              {v.stock}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] py-0"
                            >
                              {v.stock}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
