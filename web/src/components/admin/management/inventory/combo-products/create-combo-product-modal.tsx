"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCategory } from "@/lib/utils";
import {
  createComboProductAction,
  type ComboSourceProduct,
} from "@/actions/admin/management/inventory/combo-products";
import { toast } from "sonner";
import {
  Plus,
  Sparkles,
  Layers3,
  Package2,
  CheckCircle2,
  Search,
  X,
  Percent,
  Upload,
  ImageIcon,
} from "lucide-react";
import type { Category } from "@/generated/prisma/enums";

interface CreateComboProductModalProps {
  products: ComboSourceProduct[];
  onCreated?: () => void;
}

export function CreateComboProductModal({
  products,
  onCreated,
}: CreateComboProductModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceCategory, setSourceCategory] = useState("ALL");
  const [selectedSimpleProductIds, setSelectedSimpleProductIds] = useState<
    string[]
  >([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  // Custom Image & Gallery states
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size exceeds 5MB limit.");
      return;
    }
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setMainImagePreview(null);
  };

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB limit.`);
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    setGalleryFiles((prev) => [...prev, ...validFiles]);
    setGalleryPreviews((prev) => [...prev, ...validPreviews]);
  };

  const handleRemoveGalleryItem = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.subCategory?.category) set.add(p.subCategory.category);
    });
    return Array.from(set);
  }, [products]);

  const simpleProducts = useMemo(
    () => products.filter((product) => !product.isVariable),
    [products],
  );

  const variableProducts = useMemo(
    () =>
      products.filter(
        (product) => product.isVariable && product.variants.length > 0,
      ),
    [products],
  );

  // Filtered source items based on search and category
  const filteredSimpleProducts = useMemo(() => {
    return simpleProducts.filter((product) => {
      if (
        sourceCategory !== "ALL" &&
        product.subCategory?.category !== sourceCategory
      ) {
        return false;
      }
      if (sourceSearch.trim()) {
        const q = sourceSearch.toLowerCase().trim();
        return (
          product.name.toLowerCase().includes(q) ||
          product.code.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [simpleProducts, sourceCategory, sourceSearch]);

  const filteredVariableProducts = useMemo(() => {
    return variableProducts
      .map((product) => {
        if (
          sourceCategory !== "ALL" &&
          product.subCategory?.category !== sourceCategory
        ) {
          return null;
        }

        if (sourceSearch.trim()) {
          const q = sourceSearch.toLowerCase().trim();
          const matchesProd =
            product.name.toLowerCase().includes(q) ||
            product.code.toLowerCase().includes(q);

          const matchingVariants = product.variants.filter(
            (v) =>
              v.sku.toLowerCase().includes(q) ||
              v.attributes.some(
                (a) =>
                  a.value.toLowerCase().includes(q) ||
                  a.name.toLowerCase().includes(q),
              ),
          );

          if (matchesProd) return product;
          if (matchingVariants.length > 0) {
            return { ...product, variants: matchingVariants };
          }
          return null;
        }

        return product;
      })
      .filter(Boolean) as ComboSourceProduct[];
  }, [variableProducts, sourceCategory, sourceSearch]);

  const selectedSimpleProducts = useMemo(
    () =>
      simpleProducts.filter((product) =>
        selectedSimpleProductIds.includes(product.id),
      ),
    [selectedSimpleProductIds, simpleProducts],
  );

  const selectedVariants = useMemo(
    () =>
      variableProducts.flatMap((product) =>
        product.variants
          .filter((variant) => selectedVariantIds.includes(variant.id))
          .map((variant) => ({ product, variant })),
      ),
    [selectedVariantIds, variableProducts],
  );

  const parsedNumber = (value: string | number | null | undefined) => {
    const normalized = Number(value ?? 0);
    return Number.isFinite(normalized) ? normalized : 0;
  };

  const sourceRegularPrice =
    selectedSimpleProducts.reduce(
      (sum, product) => sum + parsedNumber(product.regularPrice),
      0,
    ) +
    selectedVariants.reduce(
      (sum, item) => sum + parsedNumber(item.variant.regularPrice),
      0,
    );

  const sourceSalePrice =
    selectedSimpleProducts.reduce(
      (sum, product) =>
        sum + parsedNumber(product.salePrice || product.regularPrice),
      0,
    ) +
    selectedVariants.reduce(
      (sum, item) =>
        sum + parsedNumber(item.variant.salePrice || item.variant.regularPrice),
      0,
    );

  // Bundle Stock Capacity = min stock across all selected items
  const allSelectedStocks = [
    ...selectedSimpleProducts.map((p) => p.stock ?? 0),
    ...selectedVariants.map((v) => v.variant.stock ?? 0),
  ];

  const bundleCapacity =
    allSelectedStocks.length > 0 ? Math.min(...allSelectedStocks) : 0;

  const sourceImage =
    selectedVariants[0]?.variant.imageBase64 ||
    selectedSimpleProducts[0]?.imageBase64 ||
    selectedVariants[0]?.product.imageBase64 ||
    "";

  const selectionCount =
    selectedSimpleProducts.length + selectedVariants.length;

  const autoName =
    selectionCount === 0
      ? ""
      : `${
          selectedSimpleProducts[0]?.name ||
          selectedVariants[0]?.product.name ||
          "Combo"
        }${selectionCount > 1 ? ` + ${selectionCount - 1} more` : ""} Bundle`;

  const effectiveRegularPrice = Number(regularPrice || sourceRegularPrice || 0);
  const effectiveSalePrice = Number(
    salePrice || sourceSalePrice || effectiveRegularPrice,
  );
  const discountSavings = Math.max(
    0,
    effectiveRegularPrice - effectiveSalePrice,
  );
  const discountPercent =
    effectiveRegularPrice > 0
      ? Math.round((discountSavings / effectiveRegularPrice) * 100)
      : 0;

  const applyDiscountPreset = (percent: number) => {
    const base = sourceRegularPrice || Number(regularPrice) || 0;
    if (base <= 0) {
      toast.error("Please select items first to calculate discount price.");
      return;
    }
    const discounted = Math.round(base * (1 - percent / 100));
    setRegularPrice(String(base));
    setSalePrice(String(discounted));
    toast.success(`Applied ${percent}% OFF bundle price: ৳${discounted}`);
  };

  const toggleSimpleProduct = (productId: string) => {
    setSelectedSimpleProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const toggleVariant = (variantId: string) => {
    setSelectedVariantIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((id) => id !== variantId)
        : [...prev, variantId],
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedSimpleProductIds([]);
      setSelectedVariantIds([]);
      setName("");
      setRegularPrice("");
      setSalePrice("");
      setShortDescription("");
      setLongDescription("");
      setMainImageFile(null);
      setMainImagePreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setSourceSearch("");
      setSourceCategory("ALL");
    }
  };

  const handleSubmit = async () => {
    if (selectionCount === 0) {
      toast.error("Select at least one simple product or variant.");
      return;
    }

    setIsSubmitting(true);

    const result = await createComboProductAction({
      name: name || autoName,
      shortDescription: shortDescription.trim() || undefined,
      longDescription: longDescription.trim() || undefined,
      productIds: selectedSimpleProductIds,
      variantIds: selectedVariantIds,
      regularPrice: effectiveRegularPrice || undefined,
      salePrice: effectiveSalePrice || undefined,
      image: mainImageFile || undefined,
      gallery: galleryFiles,
      retainedGallery: [],
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    onCreated?.();
    handleOpenChange(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 whitespace-nowrap text-xs font-semibold"
      >
        <Plus className="h-4 w-4" />
        Create Combo Product
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[1050px] w-[min(96vw,1050px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
          <div className="flex flex-col gap-0">
            {/* Modal Header */}
            <DialogHeader className="border-b px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold">
                    Create Combo Product Bundle
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Bundle multiple simple products and variants into a
                    high-converting deal offer.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-12 items-start">
              {/* Left Column: Source Items Picker */}
              <div className="lg:col-span-6 space-y-3.5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    1. Select Source Products &amp; Variants ({selectionCount}{" "}
                    selected)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click items to bundle them together into this offer.
                  </p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      placeholder="Search items by name, SKU, code..."
                      className="pl-8 h-8 text-xs"
                    />
                  </div>

                  <Select
                    value={sourceCategory}
                    onValueChange={(val) => setSourceCategory(val || "ALL")}
                  >
                    <SelectTrigger className="h-8 text-xs w-[140px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {formatCategory(c as Category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Items Chips */}
                {selectionCount > 0 && (
                  <div className="rounded-lg border bg-primary/5 p-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-primary mb-1.5">
                      <span>Selected Items ({selectionCount})</span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        Source sum: ৳{sourceRegularPrice}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {selectedSimpleProducts.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground shadow-2xs"
                        >
                          <span className="truncate max-w-[120px]">
                            {p.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSimpleProduct(p.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}

                      {selectedVariants.map(({ product, variant }) => (
                        <span
                          key={variant.id}
                          className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground shadow-2xs"
                        >
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {variant.sku}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleVariant(variant.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Simple Products List */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Simple Products ({filteredSimpleProducts.length})
                  </span>
                  <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredSimpleProducts.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                        No matching simple products.
                      </div>
                    ) : (
                      filteredSimpleProducts.map((product) => {
                        const isSelected = selectedSimpleProductIds.includes(
                          product.id,
                        );
                        const stock = product.stock ?? 0;

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => toggleSimpleProduct(product.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2.5 rounded-lg border p-2 text-left transition-all",
                              isSelected
                                ? "border-primary bg-primary/10 shadow-2xs"
                                : "hover:bg-muted/40",
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border bg-muted/30">
                                {product.imageBase64 ? (
                                  <Image
                                    src={product.imageBase64}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <Package2 className="m-auto h-4 w-4 text-muted-foreground/60" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-foreground">
                                  {product.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  SKU: {product.sku} • ৳{product.regularPrice}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-mono font-medium ${
                                  stock === 0
                                    ? "text-destructive"
                                    : stock <= 5
                                      ? "text-amber-500"
                                      : "text-emerald-600"
                                }`}
                              >
                                {stock} stock
                              </span>
                              {isSelected ? (
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <Plus className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Variable Products Variants */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Variable Products &amp; Variants
                  </span>
                  <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
                    {filteredVariableProducts.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                        No matching variable products.
                      </div>
                    ) : (
                      filteredVariableProducts.map((product) => (
                        <div
                          key={product.id}
                          className="rounded-lg border bg-muted/15 p-2.5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground truncate max-w-[200px]">
                              {product.name}
                            </span>
                            <Badge variant="outline" className="text-[9px] h-4">
                              {product.variants.length} variant(s)
                            </Badge>
                          </div>

                          <div className="grid gap-1">
                            {product.variants.map((variant) => {
                              const isSelected = selectedVariantIds.includes(
                                variant.id,
                              );
                              const stock = variant.stock ?? 0;

                              return (
                                <button
                                  key={variant.id}
                                  type="button"
                                  onClick={() => toggleVariant(variant.id)}
                                  className={cn(
                                    "flex w-full items-center justify-between gap-2 rounded-md border p-1.5 text-left transition-all text-xs",
                                    isSelected
                                      ? "border-primary bg-primary/10 shadow-2xs"
                                      : "bg-background hover:bg-muted/40",
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border bg-muted/30">
                                      {variant.imageBase64 ||
                                      product.imageBase64 ? (
                                        <Image
                                          src={
                                            variant.imageBase64 ||
                                            product.imageBase64 ||
                                            ""
                                          }
                                          alt={variant.sku}
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      ) : (
                                        <Layers3 className="m-auto h-3.5 w-3.5 text-muted-foreground/60" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-mono text-[11px] font-medium truncate">
                                        {variant.sku}
                                      </p>
                                      {variant.attributes.length > 0 && (
                                        <p className="text-[10px] text-muted-foreground truncate">
                                          {variant.attributes
                                            .map((a) => `${a.name}: ${a.value}`)
                                            .join(", ")}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] font-semibold text-foreground">
                                      ৳{variant.regularPrice}
                                    </span>
                                    <span
                                      className={`text-[10px] font-mono ${
                                        stock === 0
                                          ? "text-destructive"
                                          : stock <= 5
                                            ? "text-amber-500"
                                            : "text-emerald-600"
                                      }`}
                                    >
                                      ({stock} in stock)
                                    </span>
                                    {isSelected ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                    ) : (
                                      <Plus className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Deal Details & Pricing Calculator */}
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    2. Bundle Deal Details &amp; Pricing
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure offer name, prices, discounts, and customer copy.
                  </p>
                </div>

                {/* Combo Name */}
                <div className="space-y-1">
                  <Label
                    htmlFor="create-combo-name"
                    className="text-xs font-medium"
                  >
                    Combo Bundle Name
                  </Label>
                  <Input
                    id="create-combo-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      autoName || "e.g. Royal Canin + Grooming Kit Bundle"
                    }
                    className="text-xs sm:text-sm"
                  />
                </div>

                {/* Combo Image & Gallery Upload Card */}
                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" /> Combo
                      Media &amp; Photos
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Optional custom thumbnail &amp; slider
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Image Picker */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Main Combo Thumbnail
                      </Label>
                      {mainImagePreview ? (
                        <div className="relative h-28 w-full overflow-hidden rounded-lg border bg-background flex items-center justify-center group">
                          <Image
                            src={mainImagePreview}
                            alt="Main preview"
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={handleRemoveMainImage}
                            className="absolute right-1.5 top-1.5 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-xs cursor-pointer"
                            title="Remove image"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="combo-main-image"
                          className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-background p-3 text-center cursor-pointer hover:bg-muted/40 transition-colors h-28"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Upload className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-semibold text-foreground">
                            Upload Custom Main Image
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            PNG, JPG, WebP up to 5MB (or uses item fallback)
                          </span>
                          <input
                            id="combo-main-image"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={handleMainImageChange}
                          />
                        </label>
                      )}
                    </div>

                    {/* Gallery Images Multi-Picker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">
                          Gallery Photos ({galleryPreviews.length})
                        </Label>
                      </div>

                      <label
                        htmlFor="combo-gallery-images"
                        className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-background p-2.5 text-center cursor-pointer hover:bg-muted/40 transition-colors h-28"
                      >
                        <Plus className="h-4 w-4 text-primary" />
                        <span className="text-[11px] font-semibold text-foreground">
                          Add Gallery Images
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          Select multiple images
                        </span>
                        <input
                          id="combo-gallery-images"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={handleGalleryAdd}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Gallery Thumbnails List */}
                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-1">
                      {galleryPreviews.map((preview, idx) => (
                        <div
                          key={idx}
                          className="group relative h-14 w-full overflow-hidden rounded-md border bg-background flex items-center justify-center shadow-2xs"
                        >
                          <Image
                            src={preview}
                            alt={`Gallery ${idx + 1}`}
                            fill
                            className="object-contain p-0.5"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryItem(idx)}
                            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white opacity-80 hover:opacity-100 cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing & Discount Presets */}
                <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-primary" /> Pricing
                      &amp; Discount Calculator
                    </span>
                    {sourceRegularPrice > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Items total:{" "}
                        <strong className="text-foreground">
                          ৳{sourceRegularPrice}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Quick Discount Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-1">
                      Quick Presets:
                    </span>
                    {[5, 10, 15, 20, 25, 30].map((pct) => (
                      <Button
                        key={pct}
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => applyDiscountPreset(pct)}
                        className="h-6 px-2 text-[11px] font-semibold"
                      >
                        {pct}% OFF
                      </Button>
                    ))}
                  </div>

                  {/* Price Inputs */}
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="combo-reg-price" className="text-xs">
                        Regular / Original Price (৳)
                      </Label>
                      <Input
                        id="combo-reg-price"
                        type="number"
                        min={0}
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                        placeholder={String(sourceRegularPrice || "0")}
                        className="text-sm font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor="combo-sale-price"
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                      >
                        Bundle Sale Price (৳)
                      </Label>
                      <Input
                        id="combo-sale-price"
                        type="number"
                        min={0}
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                        placeholder={String(sourceSalePrice || "0")}
                        className="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Customer Savings Breakdown Card */}
                  {effectiveRegularPrice > 0 && (
                    <div className="rounded-lg border bg-background p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">
                          Customer Discount:
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {discountPercent}% OFF (Saves ৳{discountSavings})
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-muted-foreground block text-[11px]">
                          Bundle Stock Capacity:
                        </span>
                        <span
                          className={`font-semibold ${
                            bundleCapacity === 0
                              ? "text-destructive"
                              : bundleCapacity <= 3
                                ? "text-amber-500"
                                : "text-foreground"
                          }`}
                        >
                          {bundleCapacity > 0
                            ? `${bundleCapacity} bundles available`
                            : "0 (Item Out of Stock)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                <div className="space-y-1">
                  <Label
                    htmlFor="combo-short-desc"
                    className="text-xs font-medium"
                  >
                    Short Description / Deal Highlight
                  </Label>
                  <Input
                    id="combo-short-desc"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="e.g. Save 20% on our premium cat nutrition bundle."
                    className="text-xs"
                  />
                </div>

                {/* Long Description */}
                <div className="space-y-1">
                  <Label
                    htmlFor="combo-long-desc"
                    className="text-xs font-medium"
                  >
                    Long Description / Offer Details
                  </Label>
                  <Textarea
                    id="combo-long-desc"
                    rows={3}
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    placeholder="Full bundle package details, instructions, or warranty notes..."
                    className="text-xs"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectionCount === 0}
                    className="text-xs font-semibold gap-1.5"
                  >
                    {isSubmitting
                      ? "Creating Bundle..."
                      : "Create Combo Bundle"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
