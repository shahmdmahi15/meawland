"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getImageBase64 } from "@/lib/storage";
import { StockEventType, AuditAction, AuditEntity, AuditSeverity } from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import {
  modifyStockSchema,
  type ModifyStockInput,
} from "@/schemas/admin/management/inventory/modify-stock";

export type StockItemSearchRow = {
  id: string; // unique item key e.g. "prod_<id>" or "var_<id>"
  targetType: "PRODUCT" | "VARIANT";
  productId: string;
  variantId?: string | null;
  name: string;
  productName: string;
  sku: string;
  code: string;
  slug: string;
  categoryName: string;
  category: string;
  brandName?: string | null;
  currentStock: number;
  isVariable: boolean;
  costPrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  imageBase64?: string;
  variantAttributes?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
};

export type StockEventAuditRow = {
  id: string;
  type: StockEventType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  note: string | null;
  createdAt: string;
  productName: string;
  productCode: string;
  productSku: string;
  targetType: "PRODUCT" | "VARIANT";
  variantSku?: string | null;
  variantAttributes?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  imageBase64?: string;
};

export type ModifyStockMetrics = {
  totalProducts: number;
  totalVariants: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
};

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

/**
 * Searches across products & variants by SKU, Name, Code, Slug
 */
export async function searchStockInventoryAction(params: {
  query?: string;
  category?: string;
  stockFilter?: "all" | "in_stock" | "low_stock" | "out_of_stock";
  limit?: number;
}): Promise<{
  success: boolean;
  message: string;
  items: StockItemSearchRow[];
}> {
  try {
    const rawQuery = (params.query || "").trim();
    const limit = Math.min(params.limit || 30, 60);

    const whereClause: Record<string, unknown> = {};

    if (params.category && params.category !== "ALL") {
      whereClause.subCategory = {
        category: params.category,
      };
    }

    if (rawQuery) {
      whereClause.OR = [
        { name: { contains: rawQuery, mode: "insensitive" } },
        { sku: { contains: rawQuery, mode: "insensitive" } },
        { code: { contains: rawQuery, mode: "insensitive" } },
        { slug: { contains: rawQuery, mode: "insensitive" } },
        {
          variants: {
            some: {
              sku: { contains: rawQuery, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        subCategory: {
          select: {
            name: true,
            category: true,
          },
        },
        brand: {
          select: {
            name: true,
          },
        },
        variants: {
          include: {
            attributes: true,
          },
        },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    const rows: StockItemSearchRow[] = [];

    for (const prod of products) {
      if (!prod.isVariable) {
        const currentStock = prod.stock ?? 0;

        // Apply stock filter
        if (params.stockFilter === "out_of_stock" && currentStock > 0) continue;
        if (
          params.stockFilter === "low_stock" &&
          (currentStock === 0 || currentStock > 5)
        )
          continue;
        if (params.stockFilter === "in_stock" && currentStock <= 5) continue;

        const imageBase64 = prod.image
          ? await safeGetImageBase64(prod.image)
          : "";

        rows.push({
          id: `prod_${prod.id}`,
          targetType: "PRODUCT",
          productId: prod.id,
          variantId: null,
          name: prod.name,
          productName: prod.name,
          sku: prod.sku,
          code: prod.code,
          slug: prod.slug,
          categoryName: prod.subCategory.name,
          category: prod.subCategory.category,
          brandName: prod.brand?.name || null,
          currentStock,
          isVariable: false,
          costPrice: prod.costPrice,
          regularPrice: prod.regularPrice,
          salePrice: prod.salePrice,
          imageBase64,
        });
      } else {
        // Variable product variants
        for (const variant of prod.variants) {
          // If query was typed, match either product name/code or variant sku
          if (rawQuery) {
            const queryLower = rawQuery.toLowerCase();
            const matchesProd =
              prod.name.toLowerCase().includes(queryLower) ||
              prod.code.toLowerCase().includes(queryLower) ||
              prod.slug.toLowerCase().includes(queryLower);
            const matchesVar = variant.sku.toLowerCase().includes(queryLower);
            if (!matchesProd && !matchesVar) continue;
          }

          const currentStock = variant.stock ?? 0;
          if (params.stockFilter === "out_of_stock" && currentStock > 0)
            continue;
          if (
            params.stockFilter === "low_stock" &&
            (currentStock === 0 || currentStock > 5)
          )
            continue;
          if (params.stockFilter === "in_stock" && currentStock <= 5) continue;

          const imageBase64 = variant.image
            ? await safeGetImageBase64(variant.image)
            : prod.image
              ? await safeGetImageBase64(prod.image)
              : "";

          rows.push({
            id: `var_${variant.id}`,
            targetType: "VARIANT",
            productId: prod.id,
            variantId: variant.id,
            name: `${prod.name} (${variant.sku})`,
            productName: prod.name,
            sku: variant.sku,
            code: prod.code,
            slug: prod.slug,
            categoryName: prod.subCategory.name,
            category: prod.subCategory.category,
            brandName: prod.brand?.name || null,
            currentStock,
            isVariable: true,
            costPrice: variant.costPrice,
            regularPrice: variant.regularPrice,
            salePrice: variant.salePrice,
            imageBase64,
            variantAttributes: variant.attributes.map((a) => ({
              type: a.type,
              name: a.name,
              value: a.value,
            })),
          });
        }
      }
    }

    return {
      success: true,
      message: "Search completed",
      items: rows,
    };
  } catch (error) {
    console.error("[searchStockInventoryAction]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to search inventory stock items.",
      items: [],
    };
  }
}

/**
 * Modifies stock for a product or variant and records a StockEvent
 */
export async function modifyStockAction(data: ModifyStockInput): Promise<{
  success: boolean;
  message: string;
  eventId?: string;
  previousStock?: number;
  newStock?: number;
}> {
  try {
    const parsed = modifyStockSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input data.",
      };
    }

    const {
      targetType,
      productId,
      variantId,
      type,
      adjustmentMode,
      quantity,
      reason,
      note,
    } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      let previousStock = 0;
      let newStock = 0;
      let appliedQty = quantity;

      if (targetType === "PRODUCT") {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { id: true, name: true, stock: true, isVariable: true },
        });

        if (!product) {
          throw new Error("Product not found.");
        }

        if (product.isVariable) {
          throw new Error(
            "This is a variable product. Please select a specific variant to modify stock.",
          );
        }

        previousStock = product.stock ?? 0;

        if (adjustmentMode === "SET_TOTAL") {
          newStock = quantity;
          appliedQty = Math.abs(newStock - previousStock);
        } else {
          // DELTA mode
          const inwardTypes: StockEventType[] = [
            StockEventType.PURCHASE,
            StockEventType.RETURN,
            StockEventType.RESTOCK,
            StockEventType.INCREASE,
            StockEventType.INITIAL,
          ];

          const outwardTypes: StockEventType[] = [
            StockEventType.DAMAGE,
            StockEventType.EXPIRED,
            StockEventType.LOSS,
            StockEventType.DECREASE,
          ];

          const isInward = inwardTypes.includes(type);
          const isOutward = outwardTypes.includes(type);

          if (isInward) {
            newStock = previousStock + quantity;
          } else if (isOutward) {
            newStock = previousStock - quantity;
          } else {
            // ADJUSTMENT delta: positive additions or negative reductions based on reason/context
            newStock = previousStock + quantity;
          }
        }

        if (newStock < 0) {
          throw new Error(
            `Stock reduction exceeds current inventory. Current stock: ${previousStock}, Requested reduction: ${appliedQty}`,
          );
        }

        await tx.product.update({
          where: { id: productId },
          data: { stock: newStock },
        });

        const event = await tx.stockEvent.create({
          data: {
            type,
            quantity: appliedQty,
            previousStock,
            newStock,
            reason: reason.trim(),
            note: note ? note.trim() : null,
            productId: product.id,
          },
        });

        return { eventId: event.id, previousStock, newStock };
      } else {
        // VARIANT
        if (!variantId) {
          throw new Error(
            "Variant ID is required for variant stock modification.",
          );
        }

        const variant = await tx.variant.findUnique({
          where: { id: variantId },
          select: { id: true, sku: true, stock: true, productId: true },
        });

        if (!variant) {
          throw new Error("Variant not found.");
        }

        previousStock = variant.stock ?? 0;

        if (adjustmentMode === "SET_TOTAL") {
          newStock = quantity;
          appliedQty = Math.abs(newStock - previousStock);
        } else {
          const inwardTypes: StockEventType[] = [
            StockEventType.PURCHASE,
            StockEventType.RETURN,
            StockEventType.RESTOCK,
            StockEventType.INCREASE,
            StockEventType.INITIAL,
          ];

          const outwardTypes: StockEventType[] = [
            StockEventType.DAMAGE,
            StockEventType.EXPIRED,
            StockEventType.LOSS,
            StockEventType.DECREASE,
          ];

          const isInward = inwardTypes.includes(type);
          const isOutward = outwardTypes.includes(type);

          if (isInward) {
            newStock = previousStock + quantity;
          } else if (isOutward) {
            newStock = previousStock - quantity;
          } else {
            newStock = previousStock + quantity;
          }
        }

        if (newStock < 0) {
          throw new Error(
            `Stock reduction exceeds current variant inventory. Current stock: ${previousStock}, Requested reduction: ${appliedQty}`,
          );
        }

        await tx.variant.update({
          where: { id: variantId },
          data: { stock: newStock },
        });

        const event = await tx.stockEvent.create({
          data: {
            type,
            quantity: appliedQty,
            previousStock,
            newStock,
            reason: reason.trim(),
            note: note ? note.trim() : null,
            productId: variant.productId,
            variantId: variant.id,
          },
        });

        return { eventId: event.id, previousStock, newStock };
      }
    });

    await recordAuditLog({
      action: AuditAction.STOCK_CHANGE,
      entity: AuditEntity.STOCK,
      entityId: targetType === "PRODUCT" ? productId : variantId,
      entityName: reason,
      summary: `Inventory Stock adjusted (${type}): ${result.previousStock} → ${result.newStock} units (Mode: ${adjustmentMode}). Reason: ${reason}`,
      severity: result.newStock === 0 ? AuditSeverity.WARNING : AuditSeverity.INFO,
      previousState: { stock: result.previousStock },
      newState: { stock: result.newStock, adjustmentMode, quantity },
      metadata: { targetType, productId, variantId, reason, note, eventId: result.eventId },
      path: "/admin/management/inventory/modify-stock",
    });

    revalidatePath("/admin/management/inventory/modify-stock");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/category", "layout");
    revalidatePath("/product", "layout");

    return {
      success: true,
      message: `Stock updated successfully. Previous: ${result.previousStock}, New: ${result.newStock}`,
      eventId: result.eventId,
      previousStock: result.previousStock,
      newStock: result.newStock,
    };
  } catch (error) {
    console.error("[modifyStockAction]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update stock inventory.",
    };
  }
}

/**
 * Fetches recent stock event audit history across all products and variants
 */
export async function getRecentStockEventsAction(params?: {
  limit?: number;
  productId?: string;
  variantId?: string;
}): Promise<{
  success: boolean;
  message: string;
  events: StockEventAuditRow[];
}> {
  try {
    const limit = Math.min(params?.limit || 25, 100);

    const whereClause: Record<string, unknown> = {};
    if (params?.productId) whereClause.productId = params.productId;
    if (params?.variantId) whereClause.variantId = params.variantId;

    const events = await db.stockEvent.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            name: true,
            code: true,
            sku: true,
            image: true,
          },
        },
        variant: {
          select: {
            sku: true,
            image: true,
            attributes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const rows: StockEventAuditRow[] = await Promise.all(
      events.map(async (event) => {
        const imageKey = event.variant?.image || event.product?.image;
        const imageBase64 = imageKey ? await safeGetImageBase64(imageKey) : "";

        return {
          id: event.id,
          type: event.type,
          quantity: event.quantity,
          previousStock: event.previousStock ?? 0,
          newStock: event.newStock ?? 0,
          reason: event.reason,
          note: event.note,
          createdAt: event.createdAt.toISOString(),
          productName: event.product?.name || "Deleted Product",
          productCode: event.product?.code || "N/A",
          productSku: event.product?.sku || "N/A",
          targetType: event.variantId ? "VARIANT" : "PRODUCT",
          variantSku: event.variant?.sku || null,
          variantAttributes: event.variant?.attributes.map((a) => ({
            type: a.type,
            name: a.name,
            value: a.value,
          })),
          imageBase64,
        };
      }),
    );

    return {
      success: true,
      message: "Events loaded",
      events: rows,
    };
  } catch (error) {
    console.error("[getRecentStockEventsAction]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load recent stock events.",
      events: [],
    };
  }
}

/**
 * Loads page metrics and initial data for /admin/management/inventory/modify-stock
 */
export async function getModifyStockPageDataAction(): Promise<{
  success: boolean;
  message: string;
  metrics: ModifyStockMetrics;
  recentEvents: StockEventAuditRow[];
  categories: string[];
}> {
  try {
    const [
      totalProducts,
      variants,
      simpleProducts,
      recentEventsResult,
      subCategories,
    ] = await Promise.all([
      db.product.count(),
      db.variant.findMany({ select: { stock: true } }),
      db.product.findMany({
        where: { isVariable: false },
        select: { stock: true },
      }),
      getRecentStockEventsAction({ limit: 20 }),
      db.subCategory.findMany({
        distinct: ["category"],
        select: { category: true },
      }),
    ]);

    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of simpleProducts) {
      const s = p.stock ?? 0;
      totalStockUnits += s;
      if (s === 0) outOfStockCount++;
      else if (s <= 5) lowStockCount++;
    }

    for (const v of variants) {
      const s = v.stock ?? 0;
      totalStockUnits += s;
      if (s === 0) outOfStockCount++;
      else if (s <= 5) lowStockCount++;
    }

    const categories = subCategories.map((sc) => sc.category);

    return {
      success: true,
      message: "Data loaded",
      metrics: {
        totalProducts,
        totalVariants: variants.length,
        totalStockUnits,
        lowStockCount,
        outOfStockCount,
        categoriesCount: categories.length,
      },
      recentEvents: recentEventsResult.events,
      categories,
    };
  } catch (error) {
    console.error("[getModifyStockPageDataAction]", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load modify stock page data.",
      metrics: {
        totalProducts: 0,
        totalVariants: 0,
        totalStockUnits: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        categoriesCount: 0,
      },
      recentEvents: [],
      categories: [],
    };
  }
}
