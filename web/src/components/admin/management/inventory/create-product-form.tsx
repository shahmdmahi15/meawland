"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createProductAction } from "@/actions/admin/management/inventory/create-product";
import {
  createProductSchema,
  type CreateProductInput,
} from "@/schemas/admin/management/inventory/create-product";
import { AttributeType, Category } from "@/generated/prisma/enums";
import { formatCategory } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Loader2,
  PackageCheck,
  Layers,
  Tag,
  FolderTree,
  Image as ImageIcon,
  Package,
  Layers3,
  Copy,
  Percent,
  Sparkles,
} from "lucide-react";

interface SubCategoryItem {
  id: string;
  name: string;
  category: string;
  slug: string;
}

interface BrandItem {
  id: string;
  name: string;
  slug: string;
}

interface CreateProductFormProps {
  subCategories: SubCategoryItem[];
  brands: BrandItem[];
}

export function CreateProductForm({
  subCategories,
  brands,
}: CreateProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Main Image state & preview
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);

  // Gallery state & previews
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as Resolver<CreateProductInput>,
    defaultValues: {
      name: "",
      sku: "",
      slug: "",
      shortDescription: "",
      longDescription: "",
      subCategoryId: subCategories.length > 0 ? subCategories[0].id : "",
      brandId: "",
      image: undefined as unknown as File,
      gallery: [],
      isVariable: false,
      costPrice: "",
      regularPrice: "",
      salePrice: "",
      stock: 0,
      // Empty variants by default — populated when user selects Variable Product
      variants: [],
    },
  });

  const isVariable = useWatch({
    control,
    name: "isVariable",
  });

  // Dynamic variants array for Variable Products
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  // Auto-generate slug and default SKU from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
    setValue("slug", slug, { shouldValidate: true });

    const generatedSku = `SKU-${name
      .toUpperCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "")}`;
    setValue("sku", generatedSku, { shouldValidate: true });
  };

  // Handle main image change
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Image must be PNG, JPG, or WebP format");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Main image size must be less than 5MB");
      return;
    }

    setValue("image", file, { shouldValidate: true });

    const reader = new FileReader();
    reader.onload = () => {
      setMainImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle gallery image addition
  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];

    files.forEach((file) => {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        toast.error(`File ${file.name} is not a supported format`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit`);
        return;
      }

      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setGalleryPreviews((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    const updatedGallery = [...galleryFiles, ...validFiles];
    setGalleryFiles(updatedGallery);
    setValue("gallery", updatedGallery, { shouldValidate: true });
  };

  // Remove gallery image by index
  const handleGalleryRemove = (index: number) => {
    const updatedFiles = galleryFiles.filter((_, i) => i !== index);
    const updatedPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryFiles(updatedFiles);
    setGalleryPreviews(updatedPreviews);
    setValue("gallery", updatedFiles, { shouldValidate: true });
  };

  // Handle product type switch
  const handleProductTypeChange = (value: string) => {
    const becomeVariable = value === "variable";
    setValue("isVariable", becomeVariable, { shouldValidate: false });

    if (becomeVariable && variantFields.length === 0) {
      // Seed first variant when switching to variable
      appendVariant({
        sku: "",
        image: undefined as unknown as File,
        costPrice: "",
        regularPrice: "",
        salePrice: "",
        stock: 0,
        attributes: [
          {
            type: AttributeType.COLOR,
            name: "White",
            value: "#ffffff",
          },
        ],
      });
    }
  };

  // Handle Form Submit
  const onSubmit = async (data: CreateProductInput) => {
    setIsSubmitting(true);
    try {
      // Strip irrelevant fields based on product type before sending to server
      const cleanedData: CreateProductInput = data.isVariable
        ? {
            ...data,
            costPrice: undefined,
            regularPrice: undefined,
            salePrice: undefined,
            stock: undefined,
          }
        : {
            ...data,
            variants: [],
          };

      const result = await createProductAction(cleanedData);

      if (result.success) {
        toast.success(result.message || "Product created successfully!");
        router.push("/admin/management/inventory/all-products");
        router.refresh();
      } else {
        if (result.errors) {
          Object.entries(result.errors.fieldErrors).forEach(
            ([field, messages]) => {
              if (messages && messages.length > 0) {
                toast.error(`${field}: ${messages[0]}`);
              }
            },
          );
        } else {
          toast.error(result.message || "Failed to create product");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateVariant = (vIndex: number) => {
    const values = control._formValues?.variants?.[vIndex];
    if (!values) return;

    appendVariant({
      sku: values.sku ? `${values.sku}-COPY` : "",
      image: undefined as unknown as File,
      costPrice: values.costPrice || "",
      regularPrice: values.regularPrice || "",
      salePrice: values.salePrice || "",
      stock:
        typeof values.stock === "number"
          ? values.stock
          : Number(values.stock) || 0,
      attributes: (values.attributes || []).map(
        (a: { type: AttributeType; name: string; value: string }) => ({
          type: a.type,
          name: a.name,
          value: a.value,
        }),
      ),
    });
    toast.success(`Duplicated Variant #${vIndex + 1}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="#">
            <Button
              variant="outline"
              size="icon"
              type="button"
              className="h-9 w-9"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Create New Product
            </h1>
            <p className="text-sm text-muted-foreground">
              Add a new simple or variable product to your store inventory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="#">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <PackageCheck className="mr-2 h-4 w-4" />
                Publish Product
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                Basic Details
              </CardTitle>
              <CardDescription>
                Title, SKU, slug, category, and descriptions of the product.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Name */}
              <Field>
                <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                <FieldContent>
                  <Input
                    id="name"
                    placeholder="e.g. Royal Canin Adult Cat Food"
                    {...register("name")}
                    onChange={(e) => {
                      register("name").onChange(e);
                      handleNameChange(e);
                    }}
                  />
                  <FieldError errors={[errors.name]} />
                </FieldContent>
              </Field>

              {/* SKU & Slug Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="sku">Product SKU *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="sku"
                      placeholder="e.g. SKU-ROYAL-CANIN-01"
                      {...register("sku")}
                    />
                    <FieldError errors={[errors.sku]} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="slug">Slug *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="slug"
                      placeholder="royal-canin-adult-cat-food"
                      {...register("slug")}
                    />
                    <FieldError errors={[errors.slug]} />
                  </FieldContent>
                </Field>
              </div>

              {/* Category & Brand Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="subCategoryId">
                    Sub-Category *
                  </FieldLabel>
                  <FieldContent>
                    <select
                      id="subCategoryId"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      {...register("subCategoryId")}
                    >
                      {subCategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({formatCategory(sub.category as Category)}
                          )
                        </option>
                      ))}
                    </select>
                    <FieldError errors={[errors.subCategoryId]} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="brandId">Brand (Optional)</FieldLabel>
                  <FieldContent>
                    <select
                      id="brandId"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      {...register("brandId")}
                    >
                      <option value="">-- No Brand / Unbranded --</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <FieldError errors={[errors.brandId]} />
                  </FieldContent>
                </Field>
              </div>

              {/* Short Description */}
              <Field>
                <FieldLabel htmlFor="shortDescription">
                  Short Description *
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id="shortDescription"
                    placeholder="Brief highlight snippet for product listing card..."
                    rows={2}
                    {...register("shortDescription")}
                  />
                  <FieldError errors={[errors.shortDescription]} />
                </FieldContent>
              </Field>

              {/* Long Description */}
              <Field>
                <FieldLabel htmlFor="longDescription">
                  Full Detailed Description *
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id="longDescription"
                    placeholder="Comprehensive description, features, feeding guide, ingredients..."
                    rows={5}
                    {...register("longDescription")}
                  />
                  <FieldError errors={[errors.longDescription]} />
                </FieldContent>
              </Field>
            </CardContent>
          </Card>

          {/* ── Product Type Selector Card ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Product Type
              </CardTitle>
              <CardDescription>
                Choose whether this product has a single price/stock (Simple) or
                multiple variants with their own pricing and stock (Variable).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={isVariable ? "variable" : "simple"}
                onValueChange={handleProductTypeChange}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {/* Simple Product Option */}
                <label
                  htmlFor="type-simple"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all",
                    !isVariable
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  <RadioGroupItem
                    id="type-simple"
                    value="simple"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        Simple Product
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A single product with one price, one SKU, and one stock
                      count. Best for products with no variations.
                    </p>
                  </div>
                </label>

                {/* Variable Product Option */}
                <label
                  htmlFor="type-variable"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all",
                    isVariable
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  <RadioGroupItem
                    id="type-variable"
                    value="variable"
                    className="mt-0.5 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Layers3 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">
                        Variable Product
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A product with multiple variants (Color, Size, Weight),
                      each with its own SKU, image, price, and stock.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* ── Simple Product: Pricing & Stock ── */}
          {!isVariable && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Pricing & Stock
                </CardTitle>
                <CardDescription>
                  Set the cost price, selling prices, and initial stock quantity
                  for this simple product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="costPrice">
                      Cost Price (৳) *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 850"
                        {...register("costPrice")}
                      />
                      <FieldError errors={[errors.costPrice]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="regularPrice">
                      Regular Price (৳) *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="regularPrice"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1200"
                        {...register("regularPrice")}
                      />
                      <FieldError errors={[errors.regularPrice]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="salePrice">
                      Sale Price (৳) *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1050"
                        {...register("salePrice")}
                      />
                      <FieldError errors={[errors.salePrice]} />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="stock">
                      Initial Stock Quantity *
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="stock"
                        type="number"
                        placeholder="e.g. 50"
                        {...register("stock")}
                      />
                      <FieldError errors={[errors.stock]} />
                    </FieldContent>
                  </Field>
                </div>

                {/* Live Profit Analytics for Simple Product */}
                <SimpleProfitAnalytics control={control} />
              </CardContent>
            </Card>
          )}

          {/* ── Variable Product: Variants Builder ── */}
          {isVariable && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-primary" />
                    Product Variants ({variantFields.length})
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Each variant can have its own attributes (Color, Size,
                    Weight), SKU, image, price, and stock.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() =>
                    appendVariant({
                      sku: "",
                      image: undefined as unknown as File,
                      costPrice: "",
                      regularPrice: "",
                      salePrice: "",
                      stock: 0,
                      attributes: [
                        {
                          type: AttributeType.SIZE,
                          name: "Small",
                          value: "S",
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Variant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Top-level variants error */}
                {errors.variants?.root?.message && (
                  <p className="text-sm text-destructive rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                    {errors.variants.root.message}
                  </p>
                )}

                {variantFields.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted p-8 text-center">
                    <Layers3 className="h-8 w-8 stroke-1 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No variants added yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click &quot;Add Variant&quot; to create the first variant.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {variantFields.map((vField, vIndex) => (
                    <VariantItemCard
                      key={vField.id}
                      vIndex={vIndex}
                      control={control}
                      register={register}
                      setValue={setValue}
                      errors={errors}
                      onRemove={() => removeVariant(vIndex)}
                      onDuplicate={() => handleDuplicateVariant(vIndex)}
                      canRemove={variantFields.length > 1}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Column (1 span) - Media */}
        <div className="space-y-6">
          {/* Main Product Image Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Main Product Image
              </CardTitle>
              <CardDescription>
                Primary thumbnail for catalog displays (Max 5MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldContent>
                  <label
                    htmlFor="main-image-input"
                    className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center cursor-pointer hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition-colors"
                  >
                    {mainImagePreview ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-md border">
                        <Image
                          src={mainImagePreview}
                          alt="Main Product Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Click to upload main image
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            PNG, JPG, or WebP up to 5MB
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                  <input
                    id="main-image-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleMainImageChange}
                  />
                  <FieldError errors={[errors.image]} />
                </FieldContent>
              </Field>
            </CardContent>
          </Card>

          {/* Product Gallery Images Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Product Gallery ({galleryPreviews.length})
              </CardTitle>
              <CardDescription>
                Additional product images for detailed slider views.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label
                htmlFor="gallery-image-input"
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 py-4 px-4 text-center cursor-pointer hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4 text-primary" />
                Add Gallery Images
              </label>
              <input
                id="gallery-image-input"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleGalleryAdd}
              />

              {galleryPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {galleryPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="group relative h-20 w-full overflow-hidden rounded-md border"
                    >
                      <Image
                        src={preview}
                        alt={`Gallery ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleGalleryRemove(idx)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-90 transition-opacity hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Summary Card */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Product Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Type</span>
                <Badge variant={isVariable ? "default" : "secondary"}>
                  {isVariable ? "Variable" : "Simple"}
                </Badge>
              </div>
              {isVariable && (
                <div className="flex items-center justify-between">
                  <span>Variants</span>
                  <Badge variant="outline">{variantFields.length}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Gallery Images</span>
                <Badge variant="outline">{galleryPreviews.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

function SimpleProfitAnalytics({
  control,
}: {
  control: Control<CreateProductInput>;
}) {
  const costPrice = useWatch({ control, name: "costPrice" });
  const regularPrice = useWatch({ control, name: "regularPrice" });
  const salePrice = useWatch({ control, name: "salePrice" });

  const numCost = Number(costPrice) || 0;
  const numSelling = Number(salePrice || regularPrice) || 0;

  if (numCost <= 0 || numSelling <= 0) return null;

  const profit = numSelling - numCost;
  const marginPercent = Math.round((profit / numSelling) * 100);
  const markupPercent = Math.round((profit / numCost) * 100);

  return (
    <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 p-2.5 flex items-center justify-between text-xs sm:col-span-2">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Percent className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        Estimated Margin:
      </span>
      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
        Profit: ৳{profit.toFixed(2)} (Margin: {marginPercent}% | Markup:{" "}
        {markupPercent}%)
      </span>
    </div>
  );
}

function VariantProfitAnalytics({
  vIndex,
  control,
}: {
  vIndex: number;
  control: Control<CreateProductInput>;
}) {
  const costPrice = useWatch({
    control,
    name: `variants.${vIndex}.costPrice` as `variants.${number}.costPrice`,
  });
  const regularPrice = useWatch({
    control,
    name: `variants.${vIndex}.regularPrice` as `variants.${number}.regularPrice`,
  });
  const salePrice = useWatch({
    control,
    name: `variants.${vIndex}.salePrice` as `variants.${number}.salePrice`,
  });

  const numCost = Number(costPrice) || 0;
  const numSelling = Number(salePrice || regularPrice) || 0;

  if (numCost <= 0 || numSelling <= 0) return null;

  const profit = numSelling - numCost;
  const marginPercent = Math.round((profit / numSelling) * 100);
  const markupPercent = Math.round((profit / numCost) * 100);

  return (
    <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 px-2.5 py-1.5 flex items-center justify-between text-[11px]">
      <span className="text-muted-foreground flex items-center gap-1">
        <Percent className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        Variant Margin:
      </span>
      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
        Profit: ৳{profit.toFixed(2)} (Margin: {marginPercent}% | Markup:{" "}
        {markupPercent}%)
      </span>
    </div>
  );
}

interface VariantItemCardProps {
  vIndex: number;
  control: Control<CreateProductInput>;
  register: UseFormRegister<CreateProductInput>;
  setValue: UseFormSetValue<CreateProductInput>;
  errors: FieldErrors<CreateProductInput>;
  onRemove: () => void;
  onDuplicate?: () => void;
  canRemove: boolean;
}

// Sub-component for individual Variant Card with its own nested attributes array
function VariantItemCard({
  vIndex,
  control,
  register,
  setValue,
  errors,
  onRemove,
  onDuplicate,
  canRemove,
}: VariantItemCardProps) {
  const [variantImagePreview, setVariantImagePreview] = useState<string | null>(
    null,
  );

  const {
    fields: attrFields,
    append: appendAttr,
    remove: removeAttr,
  } = useFieldArray({
    control,
    name: `variants.${vIndex}.attributes`,
  });

  const variantErrors = errors.variants?.[vIndex];

  const handleVariantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Variant image must be PNG, JPG, or WebP format");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Variant image size must be less than 5MB");
      return;
    }

    setValue(`variants.${vIndex}.image`, file, { shouldValidate: true });

    const reader = new FileReader();
    reader.onload = () => {
      setVariantImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 relative shadow-xs">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-primary/5 text-primary border-primary/20 font-semibold"
          >
            Variant #{vIndex + 1}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          {onDuplicate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onDuplicate}
              title="Duplicate this variant row"
            >
              <Copy className="h-3 w-3" />
              Duplicate
            </Button>
          )}
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 text-xs"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Variant SKU & Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
        <Field>
          <FieldLabel className="text-xs">Variant SKU *</FieldLabel>
          <FieldContent>
            <Input
              placeholder="e.g. SKU-CAT-FOOD-WHITE-S"
              className="h-8 text-xs"
              {...register(`variants.${vIndex}.sku`)}
            />
            {variantErrors?.sku && (
              <p className="text-[11px] text-destructive">
                {variantErrors.sku.message}
              </p>
            )}
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel className="text-xs">Variant Image *</FieldLabel>
          <FieldContent>
            <label className="flex items-center gap-2 cursor-pointer border rounded-md px-3 py-1.5 bg-background hover:bg-muted/60 text-xs h-8 transition-colors">
              {variantImagePreview ? (
                <div className="relative h-5 w-5 rounded overflow-hidden border shrink-0">
                  <Image
                    src={variantImagePreview}
                    alt="Variant"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <Upload className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="truncate">
                {variantImagePreview
                  ? "Change Variant Image"
                  : "Upload Variant Image"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleVariantImageChange}
              />
            </label>
            {variantErrors?.image && (
              <p className="text-[11px] text-destructive">
                {variantErrors.image.message}
              </p>
            )}
          </FieldContent>
        </Field>
      </div>

      {/* Attributes Section */}
      <div className="space-y-3 bg-muted/20 p-3 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground/70">
            Attributes
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() =>
              appendAttr({
                type: AttributeType.SIZE,
                name: "Small",
                value: "S",
              })
            }
          >
            <Plus className="h-3 w-3" />
            Add Attribute
          </Button>
        </div>

        {attrFields.map((aField, aIndex) => (
          <AttributeRow
            key={aField.id}
            vIndex={vIndex}
            aIndex={aIndex}
            control={control}
            register={register}
            setValue={setValue}
            canRemove={attrFields.length > 1}
            onRemove={() => removeAttr(aIndex)}
          />
        ))}
      </div>

      {/* Variant Pricing & Stock Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field>
            <FieldLabel className="text-xs">Cost Price (৳) *</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 500"
                className="h-8 text-xs"
                {...register(`variants.${vIndex}.costPrice`)}
              />
              {variantErrors?.costPrice && (
                <p className="text-[11px] text-destructive">
                  {variantErrors.costPrice.message}
                </p>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel className="text-xs">Regular Price (৳) *</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 750"
                className="h-8 text-xs"
                {...register(`variants.${vIndex}.regularPrice`)}
              />
              {variantErrors?.regularPrice && (
                <p className="text-[11px] text-destructive">
                  {variantErrors.regularPrice.message}
                </p>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel className="text-xs">Sale Price (৳) *</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 680"
                className="h-8 text-xs"
                {...register(`variants.${vIndex}.salePrice`)}
              />
              {variantErrors?.salePrice && (
                <p className="text-[11px] text-destructive">
                  {variantErrors.salePrice.message}
                </p>
              )}
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel className="text-xs">Stock Qty *</FieldLabel>
            <FieldContent>
              <Input
                type="number"
                placeholder="e.g. 25"
                className="h-8 text-xs"
                {...register(`variants.${vIndex}.stock`)}
              />
              {variantErrors?.stock && (
                <p className="text-[11px] text-destructive">
                  {variantErrors.stock.message}
                </p>
              )}
            </FieldContent>
          </Field>
        </div>

        {/* Live Variant Profit Analytics */}
        <VariantProfitAnalytics vIndex={vIndex} control={control} />
      </div>
    </div>
  );
}

// Separate component for attribute row
function AttributeRow({
  vIndex,
  aIndex,
  control,
  register,
  setValue,
  canRemove,
  onRemove,
}: {
  vIndex: number;
  aIndex: number;
  control: Control<CreateProductInput>;
  register: UseFormRegister<CreateProductInput>;
  setValue: UseFormSetValue<CreateProductInput>;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const currentType = useWatch({
    control,
    name: `variants.${vIndex}.attributes.${aIndex}.type` as `variants.${number}.attributes.${number}.type`,
  }) as AttributeType;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as AttributeType;
    register(`variants.${vIndex}.attributes.${aIndex}.type`).onChange(e);

    if (newType === AttributeType.COLOR) {
      setValue(`variants.${vIndex}.attributes.${aIndex}.name`, "White");
      setValue(`variants.${vIndex}.attributes.${aIndex}.value`, "#ffffff");
    } else if (newType === AttributeType.SIZE) {
      setValue(`variants.${vIndex}.attributes.${aIndex}.name`, "Small");
      setValue(`variants.${vIndex}.attributes.${aIndex}.value`, "S");
    } else if (newType === AttributeType.WEIGHT) {
      setValue(`variants.${vIndex}.attributes.${aIndex}.name`, "Half kg");
      setValue(`variants.${vIndex}.attributes.${aIndex}.value`, "500g");
    }
  };

  const namePlaceholder =
    currentType === AttributeType.COLOR
      ? "e.g. White"
      : currentType === AttributeType.SIZE
        ? "e.g. Small"
        : "e.g. Net Weight";

  const valuePlaceholder =
    currentType === AttributeType.COLOR
      ? "e.g. #ffffff"
      : currentType === AttributeType.SIZE
        ? "e.g. S, M, L, XL"
        : "e.g. 500g, 1kg";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
      {/* Attribute Type */}
      <div className="sm:col-span-3">
        <select
          className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          {...register(`variants.${vIndex}.attributes.${aIndex}.type`)}
          onChange={handleTypeChange}
        >
          <option value={AttributeType.COLOR}>COLOR</option>
          <option value={AttributeType.SIZE}>SIZE</option>
          <option value={AttributeType.WEIGHT}>WEIGHT</option>
        </select>
      </div>

      {/* Name */}
      <div className="sm:col-span-4">
        <Input
          placeholder={namePlaceholder}
          className="h-8 text-xs"
          {...register(`variants.${vIndex}.attributes.${aIndex}.name`)}
        />
      </div>

      {/* Value */}
      <div className="sm:col-span-4">
        <Input
          placeholder={valuePlaceholder}
          className="h-8 text-xs"
          {...register(`variants.${vIndex}.attributes.${aIndex}.value`)}
        />
      </div>

      {/* Remove Button */}
      <div className="sm:col-span-1 flex justify-end">
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
