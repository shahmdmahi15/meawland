"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  X,
  Image as ImageIcon,
  Pencil,
  Upload,
  Plus,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatCategory } from "@/lib/utils";
import { Category, AttributeType } from "@/generated/prisma/enums";
import type { FullProduct } from "@/actions/admin/management/inventory/get-all-products";
import { updateProductAction } from "@/actions/admin/management/inventory/update-product";

interface EditProductModalProps {
  product: FullProduct;
  subCategories: Array<{
    id: string;
    name: string;
    category: string;
    slug: string;
  }>;
  brands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

type EditableAttribute = {
  id?: string;
  type: AttributeType;
  name: string;
  value: string;
};

type EditableVariant = {
  id: string;
  sku: string;
  costPrice: string;
  regularPrice: string;
  salePrice: string;
  stock: number;
  attributes: EditableAttribute[];
  imageFile?: File;
  imagePreview: string;
};

type NewVariantFormItem = {
  tempId: string;
  sku: string;
  costPrice: string;
  regularPrice: string;
  salePrice: string;
  stock: number;
  attributes: Array<{
    type: AttributeType;
    name: string;
    value: string;
  }>;
  imageFile?: File;
  imagePreview: string;
};

const getAttributePlaceholders = (type: AttributeType) => {
  if (type === AttributeType.COLOR) {
    return { namePlaceholder: "e.g. White", valuePlaceholder: "e.g. #ffffff" };
  }
  if (type === AttributeType.SIZE) {
    return {
      namePlaceholder: "e.g. Small",
      valuePlaceholder: "e.g. S, M, L, XL",
    };
  }
  return {
    namePlaceholder: "e.g. Half kg",
    valuePlaceholder: "e.g. 500g, 1kg",
  };
};

export function EditProductModal({
  product,
  subCategories,
  brands,
}: EditProductModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [slug, setSlug] = useState(product.slug);
  const [shortDescription, setShortDescription] = useState(
    product.shortDescription,
  );
  const [longDescription, setLongDescription] = useState(
    product.longDescription,
  );
  const [subCategoryId, setSubCategoryId] = useState(product.subCategoryId);
  const [brandId, setBrandId] = useState(product.brandId || "NONE");

  const [costPrice, setCostPrice] = useState(product.costPrice || "");
  const [regularPrice, setRegularPrice] = useState(product.regularPrice || "");
  const [salePrice, setSalePrice] = useState(product.salePrice || "");

  const [variantEdits, setVariantEdits] = useState<EditableVariant[]>(
    product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      costPrice: variant.costPrice,
      regularPrice: variant.regularPrice,
      salePrice: variant.salePrice,
      stock: variant.stock,
      attributes: (variant.attributes ?? []).map((attr) => ({
        id: attr.id,
        type: attr.type,
        name: attr.name,
        value: attr.value,
      })),
      imagePreview: variant.imageBase64 || "",
    })),
  );

  const [removedVariantIds, setRemovedVariantIds] = useState<string[]>([]);
  const [newVariants, setNewVariants] = useState<NewVariantFormItem[]>([]);

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState<string>(
    product.imageBase64 || "",
  );

  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [removedGalleryKeys, setRemovedGalleryKeys] = useState<string[]>([]);

  const existingGallery = useMemo(
    () =>
      product.gallery.map((key, index) => ({
        key,
        preview: product.galleryBase64?.[index] || "",
      })),
    [product.gallery, product.galleryBase64],
  );

  useEffect(() => {
    if (!open) return;
    setName(product.name);
    setSku(product.sku);
    setSlug(product.slug);
    setShortDescription(product.shortDescription);
    setLongDescription(product.longDescription);
    setSubCategoryId(product.subCategoryId);
    setBrandId(product.brandId || "NONE");
    setCostPrice(product.costPrice || "");
    setRegularPrice(product.regularPrice || "");
    setSalePrice(product.salePrice || "");
    setVariantEdits(
      product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        costPrice: variant.costPrice,
        regularPrice: variant.regularPrice,
        salePrice: variant.salePrice,
        stock: variant.stock,
        attributes: (variant.attributes ?? []).map((attr) => ({
          id: attr.id,
          type: attr.type,
          name: attr.name,
          value: attr.value,
        })),
        imagePreview: variant.imageBase64 || "",
      })),
    );
    setRemovedVariantIds([]);
    setNewVariants([]);
    setMainImageFile(null);
    setMainImagePreview(product.imageBase64 || "");
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
    setRemovedGalleryKeys([]);
  }, [open, product]);

  const handleVariantFieldChange = (
    variantId: string,
    field: "sku" | "costPrice" | "regularPrice" | "salePrice",
    value: string,
  ) => {
    setVariantEdits((prev) =>
      prev.map((variant) =>
        variant.id === variantId ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const addExistingVariantAttribute = (variantId: string) => {
    setVariantEdits((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              attributes: [
                ...variant.attributes,
                { type: AttributeType.SIZE, name: "Small", value: "S" },
              ],
            }
          : variant,
      ),
    );
  };

  const removeExistingVariantAttribute = (variantId: string, index: number) => {
    setVariantEdits((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              attributes: variant.attributes.filter((_, i) => i !== index),
            }
          : variant,
      ),
    );
  };

  const updateExistingVariantAttribute = (
    variantId: string,
    index: number,
    field: "type" | "name" | "value",
    value: string,
  ) => {
    setVariantEdits((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        const newAttrs = [...variant.attributes];
        const target = { ...newAttrs[index] };
        if (field === "type") {
          const nextType = value as AttributeType;
          target.type = nextType;
          if (nextType === AttributeType.COLOR) {
            target.name = "White";
            target.value = "#ffffff";
          } else if (nextType === AttributeType.SIZE) {
            target.name = "Small";
            target.value = "S";
          } else if (nextType === AttributeType.WEIGHT) {
            target.name = "Half kg";
            target.value = "500g";
          }
        } else {
          target[field] = value;
        }
        newAttrs[index] = target;
        return { ...variant, attributes: newAttrs };
      }),
    );
  };

  const handleVariantImageChange = (
    variantId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Variant image must be PNG, JPG, or WebP format");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Variant image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setVariantEdits((prev) =>
        prev.map((variant) =>
          variant.id === variantId
            ? {
                ...variant,
                imageFile: file,
                imagePreview: reader.result as string,
              }
            : variant,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const toggleRemoveVariant = (variantId: string) => {
    setRemovedVariantIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((id) => id !== variantId)
        : [...prev, variantId],
    );
  };

  const addNewVariantCard = () => {
    const tempId = `new-v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const defaultSku = `${product.sku}-VAR-${(variantEdits.length + newVariants.length + 1).toString().padStart(2, "0")}`;
    setNewVariants((prev) => [
      ...prev,
      {
        tempId,
        sku: defaultSku,
        costPrice: costPrice || "0",
        regularPrice: regularPrice || "0",
        salePrice: salePrice || "0",
        stock: 0,
        attributes: [{ type: AttributeType.SIZE, name: "Small", value: "S" }],
        imagePreview: "",
      },
    ]);
  };

  const removeNewVariantCard = (tempId: string) => {
    setNewVariants((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const updateNewVariantField = (
    tempId: string,
    field: "sku" | "costPrice" | "regularPrice" | "salePrice" | "stock",
    value: string | number,
  ) => {
    setNewVariants((prev) =>
      prev.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleNewVariantImageChange = (
    tempId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Variant image must be PNG, JPG, or WebP format");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Variant image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewVariants((prev) =>
        prev.map((item) =>
          item.tempId === tempId
            ? {
                ...item,
                imageFile: file,
                imagePreview: reader.result as string,
              }
            : item,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const addNewVariantAttribute = (tempId: string) => {
    setNewVariants((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              attributes: [
                ...item.attributes,
                { type: AttributeType.SIZE, name: "Small", value: "S" },
              ],
            }
          : item,
      ),
    );
  };

  const removeNewVariantAttribute = (tempId: string, index: number) => {
    setNewVariants((prev) =>
      prev.map((item) =>
        item.tempId === tempId
          ? {
              ...item,
              attributes: item.attributes.filter((_, i) => i !== index),
            }
          : item,
      ),
    );
  };

  const updateNewVariantAttribute = (
    tempId: string,
    index: number,
    field: "type" | "name" | "value",
    value: string,
  ) => {
    setNewVariants((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const newAttrs = [...item.attributes];
        const target = { ...newAttrs[index] };
        if (field === "type") {
          const nextType = value as AttributeType;
          target.type = nextType;
          if (nextType === AttributeType.COLOR) {
            target.name = "White";
            target.value = "#ffffff";
          } else if (nextType === AttributeType.SIZE) {
            target.name = "Small";
            target.value = "S";
          } else if (nextType === AttributeType.WEIGHT) {
            target.name = "Half kg";
            target.value = "500g";
          }
        } else {
          target[field] = value;
        }
        newAttrs[index] = target;
        return { ...item, attributes: newAttrs };
      }),
    );
  };

  const remainingGalleryCount = existingGallery.filter(
    (item) => !removedGalleryKeys.includes(item.key),
  ).length;

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Image must be PNG, JPG, or WebP format");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setMainImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      const isValidType = ["image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      );
      const isValidSize = file.size <= 5 * 1024 * 1024;
      if (!isValidType) toast.error(`${file.name} is not PNG/JPG/WebP`);
      if (!isValidSize) toast.error(`${file.name} exceeds 5MB limit`);
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    const previews = await Promise.all(
      validFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          }),
      ),
    );

    setNewGalleryFiles((prev) => [...prev, ...validFiles]);
    setNewGalleryPreviews((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeNewGalleryAt = (index: number) => {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleExistingGalleryRemoval = (key: string) => {
    setRemovedGalleryKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    if (!subCategoryId) {
      toast.error("Sub-category is required");
      return;
    }

    if (!product.isVariable) {
      if (!costPrice || !regularPrice || !salePrice) {
        toast.error(
          "Cost, regular, and sale prices are required for simple products",
        );
        return;
      }
    } else {
      const activeExistingVariants = variantEdits.filter(
        (variant) => !removedVariantIds.includes(variant.id),
      );

      if (activeExistingVariants.length + newVariants.length === 0) {
        toast.error(
          "At least one active variant is required for variable products",
        );
        return;
      }

      const hasInvalidExisting = activeExistingVariants.some(
        (variant) =>
          !variant.sku.trim() ||
          !variant.costPrice.trim() ||
          !variant.regularPrice.trim() ||
          !variant.salePrice.trim() ||
          variant.attributes.some((a) => !a.name.trim() || !a.value.trim()),
      );

      if (hasInvalidExisting) {
        toast.error(
          "Each existing variant must include SKU, cost, regular, sale price, and valid attribute name & value",
        );
        return;
      }

      const hasInvalidNew = newVariants.some((nv) => {
        if (
          !nv.sku.trim() ||
          !nv.costPrice.trim() ||
          !nv.regularPrice.trim() ||
          !nv.salePrice.trim()
        ) {
          return true;
        }
        if (!nv.attributes || nv.attributes.length === 0) return true;
        return nv.attributes.some((a) => !a.name.trim() || !a.value.trim());
      });

      if (hasInvalidNew) {
        toast.error(
          "Each new variant must have SKU, prices, stock, and at least one attribute with name & value",
        );
        return;
      }
    }

    setIsSubmitting(true);

    const result = await updateProductAction({
      id: product.id,
      isVariable: product.isVariable,
      name: name.trim(),
      sku: sku.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim(),
      longDescription: longDescription.trim(),
      subCategoryId,
      brandId: brandId === "NONE" ? null : brandId,
      image: mainImageFile || undefined,
      galleryAdd: newGalleryFiles,
      removeGalleryKeys: removedGalleryKeys,
      costPrice: product.isVariable ? undefined : costPrice,
      regularPrice: product.isVariable ? undefined : regularPrice,
      salePrice: product.isVariable ? undefined : salePrice,
      variants: product.isVariable
        ? variantEdits.map((variant) => ({
            id: variant.id,
            sku: variant.sku.trim(),
            costPrice: variant.costPrice.trim(),
            regularPrice: variant.regularPrice.trim(),
            salePrice: variant.salePrice.trim(),
            attributes: (variant.attributes ?? []).map((attr) => ({
              type: attr.type,
              name: attr.name.trim(),
              value: attr.value.trim(),
            })),
            image: variant.imageFile,
          }))
        : [],
      removeVariantIds: product.isVariable ? removedVariantIds : [],
      newVariants: product.isVariable
        ? newVariants.map((nv) => ({
            sku: nv.sku.trim(),
            costPrice: nv.costPrice.trim(),
            regularPrice: nv.regularPrice.trim(),
            salePrice: nv.salePrice.trim(),
            stock: Number(nv.stock ?? 0),
            attributes: nv.attributes.map((attr) => ({
              type: attr.type,
              name: attr.name.trim(),
              value: attr.value.trim(),
            })),
            image: nv.imageFile,
          }))
        : [],
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.message || "Failed to update product");
      return;
    }

    toast.success(result.message || "Product updated successfully");
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Edit product"
        aria-label="Edit product"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[1100px] w-[min(96vw,1100px)] max-w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold sm:text-xl">
              Edit Product
            </DialogTitle>
            <DialogDescription>
              Update product details, images, and variants. Main image is
              mandatory so it can be replaced only, while gallery images and
              variants can be managed flexibly.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Main Image (Replace Only)</Label>
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted/20">
                  {mainImagePreview ? (
                    <Image
                      src={mainImagePreview}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor={`edit-product-main-${product.id}`}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm hover:bg-muted/30"
                >
                  <Upload className="h-4 w-4" /> Replace main image
                </label>
                <input
                  id={`edit-product-main-${product.id}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleMainImageChange}
                />
              </div>

              <div className="space-y-2">
                <Label>Existing Gallery (Optional, can remove all)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {existingGallery.length === 0 ? (
                    <div className="col-span-3 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                      No gallery images currently attached.
                    </div>
                  ) : (
                    existingGallery.map((item) => {
                      const willRemove = removedGalleryKeys.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => toggleExistingGalleryRemoval(item.key)}
                          className={`relative aspect-square overflow-hidden rounded-md border ${
                            willRemove
                              ? "ring-2 ring-destructive opacity-60"
                              : ""
                          }`}
                        >
                          {item.preview ? (
                            <Image
                              src={item.preview}
                              alt="Gallery"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          {willRemove && (
                            <span className="absolute inset-x-1 bottom-1 rounded bg-destructive px-1 py-0.5 text-[10px] font-medium text-destructive-foreground">
                              Will remove
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Remaining existing gallery: {remainingGalleryCount}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Add New Gallery Images</Label>
                <label
                  htmlFor={`edit-product-gallery-${product.id}`}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm hover:bg-muted/30"
                >
                  <Upload className="h-4 w-4" /> Add gallery images
                </label>
                <input
                  id={`edit-product-gallery-${product.id}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  multiple
                  onChange={handleAddGallery}
                />
                {newGalleryPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {newGalleryPreviews.map((preview, index) => (
                      <div
                        key={`${preview}-${index}`}
                        className="relative aspect-square overflow-hidden rounded-md border"
                      >
                        <Image
                          src={preview}
                          alt="New gallery"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-xs"
                          className="absolute right-1 top-1"
                          onClick={() => removeNewGalleryAt(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`edit-product-name-${product.id}`}>
                    Name
                  </Label>
                  <Input
                    id={`edit-product-name-${product.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-product-sku-${product.id}`}>SKU</Label>
                  <Input
                    id={`edit-product-sku-${product.id}`}
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-product-slug-${product.id}`}>
                    Slug
                  </Label>
                  <Input
                    id={`edit-product-slug-${product.id}`}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sub Category</Label>
                  <Select
                    value={subCategoryId}
                    onValueChange={(value) => setSubCategoryId(value ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-category">
                        {(() => {
                          const selected = subCategories.find(
                            (item) => item.id === subCategoryId,
                          );
                          if (!selected) return "Select sub-category";
                          return `${selected.name} (${formatCategory(selected.category as Category)})`;
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (
                          {formatCategory(item.category as Category)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select
                    value={brandId}
                    onValueChange={(value) => setBrandId(value ?? "NONE")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand">
                        {(() => {
                          if (brandId === "NONE" || !brandId) return "No Brand";
                          const selected = brands.find(
                            (item) => item.id === brandId,
                          );
                          return selected ? selected.name : "Select brand";
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No Brand</SelectItem>
                      {brands.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-product-short-${product.id}`}>
                  Short Description
                </Label>
                <Input
                  id={`edit-product-short-${product.id}`}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-product-long-${product.id}`}>
                  Long Description
                </Label>
                <Textarea
                  id={`edit-product-long-${product.id}`}
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant={product.isVariable ? "default" : "secondary"}>
                    {product.isVariable ? "Variable Product" : "Simple Product"}
                  </Badge>
                  {product.isVariable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addNewVariantCard}
                      className="gap-1.5 text-xs font-medium"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variant
                    </Button>
                  )}
                </div>

                {product.isVariable ? (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Update, add, or remove product variants. Each variant
                      requires a unique SKU, pricing, and attributes.
                    </p>

                    {/* Existing Variants List */}
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Existing Variants (
                        {variantEdits.length - removedVariantIds.length} active)
                      </Label>

                      {variantEdits.map((variant) => {
                        const isRemoved = removedVariantIds.includes(
                          variant.id,
                        );
                        const originalVariant = product.variants.find(
                          (v) => v.id === variant.id,
                        );

                        return (
                          <div
                            key={variant.id}
                            className={`rounded-lg border bg-background p-3 transition-all ${
                              isRemoved
                                ? "opacity-50 ring-2 ring-destructive bg-destructive/5"
                                : ""
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted/20">
                                  {variant.imagePreview ? (
                                    <Image
                                      src={variant.imagePreview}
                                      alt={variant.sku}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                      <ImageIcon className="h-4 w-4" />
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <Badge
                                      variant="outline"
                                      className="text-[11px]"
                                    >
                                      Stock: {variant.stock}
                                    </Badge>
                                    {isRemoved && (
                                      <Badge
                                        variant="destructive"
                                        className="text-[10px]"
                                      >
                                        Will Be Removed
                                      </Badge>
                                    )}
                                  </div>
                                  {originalVariant?.attributes &&
                                    originalVariant.attributes.length > 0 && (
                                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                                        {originalVariant.attributes.map(
                                          (attr) => (
                                            <span
                                              key={attr.id}
                                              className="rounded bg-muted px-1.5 py-0.5"
                                            >
                                              {attr.name}: {attr.value}
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {!isRemoved && (
                                  <>
                                    <label
                                      htmlFor={`variant-image-${variant.id}`}
                                      className="cursor-pointer rounded-md border px-2 py-1 text-[11px] font-medium hover:bg-muted/30"
                                    >
                                      Replace Image
                                    </label>
                                    <input
                                      id={`variant-image-${variant.id}`}
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp"
                                      className="hidden"
                                      onChange={(event) =>
                                        handleVariantImageChange(
                                          variant.id,
                                          event,
                                        )
                                      }
                                    />
                                  </>
                                )}

                                <Button
                                  type="button"
                                  variant={
                                    isRemoved ? "outline" : "destructive"
                                  }
                                  size="sm"
                                  onClick={() =>
                                    toggleRemoveVariant(variant.id)
                                  }
                                  className="h-8 gap-1 px-2.5 text-xs"
                                >
                                  {isRemoved ? (
                                    <>
                                      <RotateCcw className="h-3.5 w-3.5" /> Keep
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-3.5 w-3.5" /> Remove
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {!isRemoved && (
                              <>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`variant-sku-${variant.id}`}
                                    >
                                      Variant SKU
                                    </Label>
                                    <Input
                                      id={`variant-sku-${variant.id}`}
                                      value={variant.sku}
                                      onChange={(event) =>
                                        handleVariantFieldChange(
                                          variant.id,
                                          "sku",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`variant-cost-${variant.id}`}
                                    >
                                      Cost Price
                                    </Label>
                                    <Input
                                      id={`variant-cost-${variant.id}`}
                                      value={variant.costPrice}
                                      onChange={(event) =>
                                        handleVariantFieldChange(
                                          variant.id,
                                          "costPrice",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`variant-regular-${variant.id}`}
                                    >
                                      Regular Price
                                    </Label>
                                    <Input
                                      id={`variant-regular-${variant.id}`}
                                      value={variant.regularPrice}
                                      onChange={(event) =>
                                        handleVariantFieldChange(
                                          variant.id,
                                          "regularPrice",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`variant-sale-${variant.id}`}
                                    >
                                      Sale Price
                                    </Label>
                                    <Input
                                      id={`variant-sale-${variant.id}`}
                                      value={variant.salePrice}
                                      onChange={(event) =>
                                        handleVariantFieldChange(
                                          variant.id,
                                          "salePrice",
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                {/* Attributes section for Existing Variant */}
                                <div className="mt-3 space-y-2 border-t pt-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">
                                      Attributes
                                    </Label>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        addExistingVariantAttribute(variant.id)
                                      }
                                      className="h-6 gap-1 text-[11px]"
                                    >
                                      <Plus className="h-3 w-3" /> Add Attribute
                                    </Button>
                                  </div>

                                  {variant.attributes.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">
                                      No attributes configured. Click &quot;Add
                                      Attribute&quot; to assign attributes.
                                    </p>
                                  ) : (
                                    variant.attributes.map((attr, attrIdx) => {
                                      const {
                                        namePlaceholder,
                                        valuePlaceholder,
                                      } = getAttributePlaceholders(attr.type);

                                      return (
                                        <div
                                          key={attrIdx}
                                          className="grid items-center gap-2 grid-cols-[110px_1fr_1fr_auto]"
                                        >
                                          <Select
                                            value={attr.type}
                                            onValueChange={(val) => {
                                              if (val) {
                                                updateExistingVariantAttribute(
                                                  variant.id,
                                                  attrIdx,
                                                  "type",
                                                  val as AttributeType,
                                                );
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="h-8 text-xs">
                                              <SelectValue placeholder="Type">
                                                {attr.type ===
                                                AttributeType.COLOR
                                                  ? "Color"
                                                  : attr.type ===
                                                      AttributeType.SIZE
                                                    ? "Size"
                                                    : attr.type ===
                                                        AttributeType.WEIGHT
                                                      ? "Weight"
                                                      : "Type"}
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem
                                                value={AttributeType.COLOR}
                                              >
                                                Color
                                              </SelectItem>
                                              <SelectItem
                                                value={AttributeType.SIZE}
                                              >
                                                Size
                                              </SelectItem>
                                              <SelectItem
                                                value={AttributeType.WEIGHT}
                                              >
                                                Weight
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>

                                          <Input
                                            className="h-8 text-xs"
                                            placeholder={namePlaceholder}
                                            value={attr.name}
                                            onChange={(e) =>
                                              updateExistingVariantAttribute(
                                                variant.id,
                                                attrIdx,
                                                "name",
                                                e.target.value,
                                              )
                                            }
                                          />

                                          <Input
                                            className="h-8 text-xs"
                                            placeholder={valuePlaceholder}
                                            value={attr.value}
                                            onChange={(e) =>
                                              updateExistingVariantAttribute(
                                                variant.id,
                                                attrIdx,
                                                "value",
                                                e.target.value,
                                              )
                                            }
                                          />

                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                              removeExistingVariantAttribute(
                                                variant.id,
                                                attrIdx,
                                              )
                                            }
                                            disabled={
                                              variant.attributes.length <= 1
                                            }
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* New Variants List */}
                    {newVariants.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-wider">
                          Newly Added Variants ({newVariants.length})
                        </Label>

                        {newVariants.map((nv) => (
                          <div
                            key={nv.tempId}
                            className="rounded-lg border border-primary/40 bg-primary/5 p-3"
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <Badge variant="default" className="text-[10px]">
                                New Variant
                              </Badge>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeNewVariantCard(nv.tempId)}
                                className="h-7 gap-1 px-2 text-xs"
                              >
                                <Trash2 className="h-3 w-3" /> Discard
                              </Button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                              <div className="space-y-1">
                                <Label className="text-xs">Variant SKU</Label>
                                <Input
                                  value={nv.sku}
                                  onChange={(e) =>
                                    updateNewVariantField(
                                      nv.tempId,
                                      "sku",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="SKU-001"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Cost Price</Label>
                                <Input
                                  value={nv.costPrice}
                                  onChange={(e) =>
                                    updateNewVariantField(
                                      nv.tempId,
                                      "costPrice",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Regular Price</Label>
                                <Input
                                  value={nv.regularPrice}
                                  onChange={(e) =>
                                    updateNewVariantField(
                                      nv.tempId,
                                      "regularPrice",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Sale Price</Label>
                                <Input
                                  value={nv.salePrice}
                                  onChange={(e) =>
                                    updateNewVariantField(
                                      nv.tempId,
                                      "salePrice",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Initial Stock</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  value={nv.stock}
                                  onChange={(e) =>
                                    updateNewVariantField(
                                      nv.tempId,
                                      "stock",
                                      parseInt(e.target.value || "0", 10),
                                    )
                                  }
                                />
                              </div>
                            </div>

                            {/* Image Picker for New Variant */}
                            <div className="mt-3 flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted/20">
                                {nv.imagePreview ? (
                                  <Image
                                    src={nv.imagePreview}
                                    alt="New variant"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <label
                                htmlFor={`new-variant-img-${nv.tempId}`}
                                className="cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted/30"
                              >
                                Upload Variant Image
                              </label>
                              <input
                                id={`new-variant-img-${nv.tempId}`}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) =>
                                  handleNewVariantImageChange(nv.tempId, e)
                                }
                              />
                            </div>

                            {/* Attributes section for New Variant */}
                            <div className="mt-3 space-y-2 border-t pt-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                  Attributes
                                </Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    addNewVariantAttribute(nv.tempId)
                                  }
                                  className="h-6 gap-1 text-[11px]"
                                >
                                  <Plus className="h-3 w-3" /> Add Attribute
                                </Button>
                              </div>

                              {nv.attributes.map((attr, attrIdx) => {
                                const { namePlaceholder, valuePlaceholder } =
                                  getAttributePlaceholders(attr.type);

                                return (
                                  <div
                                    key={attrIdx}
                                    className="grid items-center gap-2 grid-cols-[110px_1fr_1fr_auto]"
                                  >
                                    <Select
                                      value={attr.type}
                                      onValueChange={(val) => {
                                        if (val) {
                                          updateNewVariantAttribute(
                                            nv.tempId,
                                            attrIdx,
                                            "type",
                                            val as AttributeType,
                                          );
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Type">
                                          {attr.type === AttributeType.COLOR
                                            ? "Color"
                                            : attr.type === AttributeType.SIZE
                                              ? "Size"
                                              : attr.type ===
                                                  AttributeType.WEIGHT
                                                ? "Weight"
                                                : "Type"}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={AttributeType.COLOR}>
                                          Color
                                        </SelectItem>
                                        <SelectItem value={AttributeType.SIZE}>
                                          Size
                                        </SelectItem>
                                        <SelectItem
                                          value={AttributeType.WEIGHT}
                                        >
                                          Weight
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>

                                    <Input
                                      className="h-8 text-xs"
                                      placeholder={namePlaceholder}
                                      value={attr.name}
                                      onChange={(e) =>
                                        updateNewVariantAttribute(
                                          nv.tempId,
                                          attrIdx,
                                          "name",
                                          e.target.value,
                                        )
                                      }
                                    />

                                    <Input
                                      className="h-8 text-xs"
                                      placeholder={valuePlaceholder}
                                      value={attr.value}
                                      onChange={(e) =>
                                        updateNewVariantAttribute(
                                          nv.tempId,
                                          attrIdx,
                                          "value",
                                          e.target.value,
                                        )
                                      }
                                    />

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() =>
                                        removeNewVariantAttribute(
                                          nv.tempId,
                                          attrIdx,
                                        )
                                      }
                                      disabled={nv.attributes.length <= 1}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-product-cost-${product.id}`}>
                        Cost Price
                      </Label>
                      <Input
                        id={`edit-product-cost-${product.id}`}
                        value={costPrice}
                        onChange={(e) => setCostPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-product-regular-${product.id}`}>
                        Regular Price
                      </Label>
                      <Input
                        id={`edit-product-regular-${product.id}`}
                        value={regularPrice}
                        onChange={(e) => setRegularPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edit-product-sale-${product.id}`}>
                        Sale Price
                      </Label>
                      <Input
                        id={`edit-product-sale-${product.id}`}
                        value={salePrice}
                        onChange={(e) => setSalePrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock (Read Only)</Label>
                      <div className="flex h-10 items-center rounded-md border bg-muted/20 px-3 text-sm text-muted-foreground">
                        {product.stock ?? 0}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
