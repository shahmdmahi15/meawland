"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import { generateId } from "@/lib/generate-code";
import { ComboProduct, Product, Variant } from "@/generated/prisma/client";
import {
  createComboProductSchema,
  updateComboProductSchema,
  type CreateComboProductInput,
  type UpdateComboProductInput,
} from "@/schemas/admin/management/inventory/combo-product";

export type ComboSourceVariant = Variant & {
  imageBase64?: string;
  attributes: Array<{
    id: string;
    name: string;
    value: string;
  }>;
};

export type ComboSourceProduct = Product & {
  imageBase64?: string;
  subCategory: {
    id: string;
    name: string;
    category: string;
  };
  variants: ComboSourceVariant[];
};

export type ComboProductRow = ComboProduct & {
  products: Array<{
    id: string;
    name: string;
    code: string;
    sku: string;
    stock: number;
    regularPrice?: string | null;
    salePrice?: string | null;
    image?: string;
    isVariable: boolean;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    productId: string;
    productName: string;
    stock: number;
    image?: string;
    regularPrice: string;
    salePrice: string;
  }>;
  imageBase64?: string;
  bundleStockCapacity: number;
  totalOriginalPrice: number;
  discountAmount: number;
  discountPercent: number;
  isAvailable: boolean;
};

export type ComboCatalogMetrics = {
  totalCombos: number;
  inStockCombos: number;
  depletedCombos: number;
  avgDiscountPercent: number;
  totalCatalogValue: number;
};

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetComboBase64] Failed for key "${key}":`, error);
    return "";
  }
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "combo-product"
  );
}

async function resolveComboSourceSelections(
  productIds: string[],
  variantIds: string[],
) {
  const normalizedProductIds = Array.from(
    new Set((productIds ?? []).filter(Boolean)),
  );
  const normalizedVariantIds = Array.from(
    new Set((variantIds ?? []).filter(Boolean)),
  );

  const [selectedSimpleProducts, selectedVariants] = await Promise.all([
    db.product.findMany({
      where: {
        id: { in: normalizedProductIds },
        isVariable: false,
      },
    }),
    db.variant.findMany({
      where: {
        id: { in: normalizedVariantIds },
      },
      include: {
        product: true,
      },
    }),
  ]);

  if (selectedSimpleProducts.length !== normalizedProductIds.length) {
    return {
      success: false as const,
      message:
        "One or more selected simple products could not be found or are not simple products.",
    };
  }

  if (selectedVariants.length !== normalizedVariantIds.length) {
    return {
      success: false as const,
      message: "One or more selected variants could not be found.",
    };
  }

  return {
    success: true as const,
    selectedSimpleProducts,
    selectedVariants,
  };
}

export async function getComboProductFormDataAction(): Promise<{
  success: boolean;
  message: string;
  products?: ComboSourceProduct[];
}> {
  try {
    const rawProducts = await db.product.findMany({
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        variants: {
          include: {
            attributes: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const products: ComboSourceProduct[] = await Promise.all(
      rawProducts.map(async (product) => {
        const imageBase64 = await safeGetImageBase64(product.image);

        const variants: ComboSourceVariant[] = await Promise.all(
          product.variants.map(async (variant) => ({
            ...variant,
            imageBase64: await safeGetImageBase64(variant.image),
          })),
        );

        return {
          ...product,
          imageBase64,
          variants,
        };
      }),
    );

    return {
      success: true,
      message: "Successfully fetched combo product form data.",
      products,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Inventory.GetComboProductFormData]:",
      error,
    );
    return {
      success: false,
      message: "Failed to load combo product selection data.",
    };
  }
}

export async function getAllComboProductsAdminAction(): Promise<{
  success: boolean;
  message: string;
  combos?: ComboProductRow[];
  metrics?: ComboCatalogMetrics;
}> {
  try {
    const combos = await db.comboProduct.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            sku: true,
            stock: true,
            regularPrice: true,
            salePrice: true,
            image: true,
            isVariable: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            productId: true,
            stock: true,
            image: true,
            regularPrice: true,
            salePrice: true,
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let totalCatalogValue = 0;
    let totalDiscountPercentSum = 0;
    let inStockCombos = 0;

    const rows: ComboProductRow[] = await Promise.all(
      combos.map(async (combo) => {
        const variants = combo.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          productId: variant.productId,
          productName: variant.product.name,
          stock: variant.stock,
          image: variant.image,
          regularPrice: variant.regularPrice,
          salePrice: variant.salePrice,
        }));

        const products = combo.products.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
          sku: p.sku,
          stock: p.stock ?? 0,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice,
          image: p.image,
          isVariable: p.isVariable,
        }));

        const allStocks = [
          ...products.map((p) => p.stock),
          ...variants.map((v) => v.stock),
        ];

        const bundleStockCapacity =
          allStocks.length > 0 ? Math.min(...allStocks) : 0;

        const isAvailable = bundleStockCapacity > 0;
        if (isAvailable) inStockCombos++;

        const totalOriginalPrice =
          products.reduce(
            (sum, p) => sum + Number(p.regularPrice ?? p.salePrice ?? 0),
            0,
          ) +
          variants.reduce(
            (sum, v) => sum + Number(v.regularPrice ?? v.salePrice ?? 0),
            0,
          );

        const comboSalePrice = Number(
          combo.salePrice || combo.regularPrice || 0,
        );
        totalCatalogValue += comboSalePrice;

        const discountAmount = Math.max(0, totalOriginalPrice - comboSalePrice);
        const discountPercent =
          totalOriginalPrice > 0
            ? Math.round((discountAmount / totalOriginalPrice) * 100)
            : 0;

        totalDiscountPercentSum += discountPercent;

        return {
          ...combo,
          products,
          variants,
          imageBase64: await safeGetImageBase64(combo.image),
          bundleStockCapacity,
          totalOriginalPrice,
          discountAmount,
          discountPercent,
          isAvailable,
        };
      }),
    );

    const metrics: ComboCatalogMetrics = {
      totalCombos: rows.length,
      inStockCombos,
      depletedCombos: rows.length - inStockCombos,
      avgDiscountPercent:
        rows.length > 0 ? Math.round(totalDiscountPercentSum / rows.length) : 0,
      totalCatalogValue,
    };

    return {
      success: true,
      message: "Successfully fetched combo products.",
      combos: rows,
      metrics,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Inventory.GetAllComboProducts]:",
      error,
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch combo products due to a server error.",
    };
  }
}

export async function createComboProductAction(
  input: CreateComboProductInput,
): Promise<{
  success: boolean;
  message: string;
  comboId?: string;
}> {
  try {
    const parse = createComboProductSchema.safeParse(input);
    if (!parse.success) {
      return {
        success: false,
        message: parse.error.issues[0]?.message ?? "Invalid combo payload.",
      };
    }

    const {
      productIds,
      variantIds,
      regularPrice,
      salePrice,
      name,
      shortDescription,
      longDescription,
    } = parse.data;

    const normalizedProductIds = Array.from(
      new Set((productIds ?? []).filter(Boolean)),
    );
    const normalizedVariantIds = Array.from(
      new Set((variantIds ?? []).filter(Boolean)),
    );

    if (
      normalizedProductIds.length === 0 &&
      normalizedVariantIds.length === 0
    ) {
      return {
        success: false,
        message:
          "Please select at least one source item (simple product or variant).",
      };
    }

    const sourceResolution = await resolveComboSourceSelections(
      normalizedProductIds,
      normalizedVariantIds,
    );
    if (!sourceResolution.success) {
      return {
        success: false,
        message: sourceResolution.message,
      };
    }

    const { selectedSimpleProducts, selectedVariants } = sourceResolution;

    const productNameParts = selectedSimpleProducts.map(
      (product) => product.name,
    );
    const variantNameParts = selectedVariants.map(
      (variant) => `${variant.product.name} (${variant.sku})`,
    );
    const sourceNameParts = [...productNameParts, ...variantNameParts];

    const fallbackName =
      sourceNameParts.length <= 2
        ? sourceNameParts.join(" + ")
        : `${sourceNameParts.slice(0, 2).join(" + ")} + ${sourceNameParts.length - 2} more`;

    const sourceRegularPrice =
      selectedSimpleProducts.reduce(
        (sum, product) => sum + Number(product.regularPrice ?? 0),
        0,
      ) +
      selectedVariants.reduce(
        (sum, variant) => sum + Number(variant.regularPrice ?? 0),
        0,
      );

    const sourceSalePrice =
      selectedSimpleProducts.reduce(
        (sum, product) =>
          sum + Number(product.salePrice ?? product.regularPrice ?? 0),
        0,
      ) +
      selectedVariants.reduce(
        (sum, variant) =>
          sum + Number(variant.salePrice ?? variant.regularPrice ?? 0),
        0,
      );

    const finalName = (name || `${fallbackName} Combo`).trim();
    const finalShortDescription =
      shortDescription?.trim() ||
      `Bundle with ${selectedSimpleProducts.length} simple product(s) and ${selectedVariants.length} variant(s).`;
    const finalLongDescription =
      longDescription?.trim() ||
      `Combo includes ${selectedSimpleProducts.length} simple product(s) and ${selectedVariants.length} selected variant(s) from variable products.`;

    const finalRegularPrice = Number(regularPrice ?? sourceRegularPrice);
    const finalSalePrice = Number(
      salePrice ?? sourceSalePrice ?? finalRegularPrice,
    );

    const primaryVariantImage = selectedVariants.find((variant) =>
      Boolean(variant.image),
    )?.image;
    const primaryProductImage = selectedSimpleProducts.find((product) =>
      Boolean(product.image),
    )?.image;
    const fallbackProductFromVariant = selectedVariants.find((variant) =>
      Boolean(variant.product.image),
    )?.product.image;

    const primaryImage =
      primaryVariantImage ||
      primaryProductImage ||
      fallbackProductFromVariant ||
      "";

    const mergedGallery = Array.from(
      new Set(
        [
          ...selectedSimpleProducts.flatMap((product) => product.gallery ?? []),
          ...selectedVariants.map((variant) => variant.image).filter(Boolean),
          ...selectedVariants
            .map((variant) => variant.product.image)
            .filter(Boolean),
        ].filter(Boolean),
      ),
    );

    const comboCode = await generateId("COMBO");
    const comboSlug = `${slugify(finalName)}-${comboCode.toLowerCase()}`;
    const comboSkuBase =
      [
        ...selectedSimpleProducts.map((product) => product.sku),
        ...selectedVariants.map((variant) => variant.sku),
      ][0] || "COMBO";
    const comboSku = `${comboSkuBase.toUpperCase()}-CB-${Date.now().toString().slice(-4)}`;

    const combo = await db.comboProduct.create({
      data: {
        name: finalName,
        code: comboCode,
        slug: comboSlug,
        sku: comboSku,
        shortDescription: finalShortDescription,
        longDescription: finalLongDescription,
        image: primaryImage,
        gallery: mergedGallery,
        regularPrice: String(finalRegularPrice),
        salePrice: String(finalSalePrice),
        products: {
          connect: selectedSimpleProducts.map((product) => ({
            id: product.id,
          })),
        },
        variants: {
          connect: selectedVariants.map((variant) => ({ id: variant.id })),
        },
      },
    });

    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/product", "layout");

    return {
      success: true,
      message: "Combo product created successfully.",
      comboId: combo.id,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Inventory.CreateComboProduct]:",
      error,
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create combo product due to an unexpected server error.",
    };
  }
}

export async function deleteComboProductAction(comboId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!comboId) {
      return {
        success: false,
        message: "Missing combo product ID.",
      };
    }

    await db.comboProduct.delete({
      where: { id: comboId },
    });

    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/product", "layout");

    return {
      success: true,
      message: "Combo product deleted successfully.",
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Inventory.DeleteComboProduct]:",
      error,
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete combo product due to a server error.",
    };
  }
}

export async function updateComboProductAction(
  input: UpdateComboProductInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const parse = updateComboProductSchema.safeParse(input);
    if (!parse.success) {
      return {
        success: false,
        message: parse.error.issues[0]?.message ?? "Invalid combo payload.",
      };
    }

    const {
      comboId,
      name,
      shortDescription,
      longDescription,
      productIds,
      variantIds,
      regularPrice,
      salePrice,
    } = parse.data;

    const normalizedProductIds = Array.from(
      new Set((productIds ?? []).filter(Boolean)),
    );
    const normalizedVariantIds = Array.from(
      new Set((variantIds ?? []).filter(Boolean)),
    );

    if (
      normalizedProductIds.length === 0 &&
      normalizedVariantIds.length === 0
    ) {
      return {
        success: false,
        message: "Please keep at least one source item in the combo.",
      };
    }

    const existing = await db.comboProduct.findUnique({
      where: { id: comboId },
    });

    if (!existing) {
      return {
        success: false,
        message: "Combo product not found.",
      };
    }

    const sourceResolution = await resolveComboSourceSelections(
      normalizedProductIds,
      normalizedVariantIds,
    );
    if (!sourceResolution.success) {
      return {
        success: false,
        message: sourceResolution.message,
      };
    }

    const { selectedSimpleProducts, selectedVariants } = sourceResolution;

    const sourceRegularPrice =
      selectedSimpleProducts.reduce(
        (sum, product) => sum + Number(product.regularPrice ?? 0),
        0,
      ) +
      selectedVariants.reduce(
        (sum, variant) => sum + Number(variant.regularPrice ?? 0),
        0,
      );

    const sourceSalePrice =
      selectedSimpleProducts.reduce(
        (sum, product) =>
          sum + Number(product.salePrice ?? product.regularPrice ?? 0),
        0,
      ) +
      selectedVariants.reduce(
        (sum, variant) =>
          sum + Number(variant.salePrice ?? variant.regularPrice ?? 0),
        0,
      );

    const nextName = name?.trim() || existing.name;
    const nextShortDescription =
      shortDescription?.trim() || existing.shortDescription;
    const nextLongDescription =
      longDescription?.trim() || existing.longDescription;
    const nextRegularPrice = String(Number(regularPrice ?? sourceRegularPrice));
    const nextSalePrice = String(
      Number(salePrice ?? sourceSalePrice ?? nextRegularPrice),
    );

    const primaryVariantImage = selectedVariants.find((variant) =>
      Boolean(variant.image),
    )?.image;
    const primaryProductImage = selectedSimpleProducts.find((product) =>
      Boolean(product.image),
    )?.image;
    const fallbackProductFromVariant = selectedVariants.find((variant) =>
      Boolean(variant.product.image),
    )?.product.image;
    const nextImage =
      existing.image ||
      primaryVariantImage ||
      primaryProductImage ||
      fallbackProductFromVariant ||
      "";

    const mergedGallery = Array.from(
      new Set(
        [
          ...selectedSimpleProducts.flatMap((product) => product.gallery ?? []),
          ...selectedVariants.map((variant) => variant.image).filter(Boolean),
          ...selectedVariants
            .map((variant) => variant.product.image)
            .filter(Boolean),
        ].filter(Boolean),
      ),
    );

    await db.comboProduct.update({
      where: { id: comboId },
      data: {
        name: nextName,
        slug: `${slugify(nextName)}-${existing.code.toLowerCase()}`,
        shortDescription: nextShortDescription,
        longDescription: nextLongDescription,
        image: nextImage,
        gallery: mergedGallery,
        regularPrice: nextRegularPrice,
        salePrice: nextSalePrice,
        products: {
          set: selectedSimpleProducts.map((product) => ({ id: product.id })),
        },
        variants: {
          set: selectedVariants.map((variant) => ({ id: variant.id })),
        },
      },
    });

    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/product", "layout");

    return {
      success: true,
      message: "Combo product updated successfully.",
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Inventory.UpdateComboProduct]:",
      error,
    );
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update combo product due to a server error.",
    };
  }
}
