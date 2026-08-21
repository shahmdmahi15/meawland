"use server";

import db from "@/lib/db";
import { Category } from "@/generated/prisma/enums";
import { DashboardInventoryMetrics } from "./types";

/**
 * Gathers complete product inventory analysis, properly resolving single products,
 * variable products with multiple variants, and combo bundles.
 */
export async function getDashboardInventory(): Promise<DashboardInventoryMetrics> {
  const [products, comboProducts, topSoldItems] = await Promise.all([
    db.product.findMany({
      include: {
        variants: {
          select: {
            id: true,
            sku: true,
            stock: true,
            costPrice: true,
            salePrice: true,
          },
        },
        subCategory: {
          select: {
            category: true,
          },
        },
      },
    }),
    db.comboProduct.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        regularPrice: true,
        salePrice: true,
      },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: {
        productId: { not: null },
      },
      _sum: {
        quanitity: true,
      },
      orderBy: {
        _sum: {
          quanitity: "desc",
        },
      },
      take: 6,
    }),
  ]);

  let singleProductsCount = 0;
  let variableProductsCount = 0;
  let totalVariantsCount = 0;
  let totalUnitsInStock = 0;
  let totalInventoryValuation = 0;
  let lowStockItemsCount = 0;
  let outOfStockItemsCount = 0;

  const lowStockAlerts: DashboardInventoryMetrics["lowStockAlerts"] = [];
  const categoryStats = new Map<
    string,
    { count: number; totalUnits: number; valuation: number }
  >();

  // Process standard & variable products
  for (const prod of products) {
    const cat = prod.subCategory?.category || "PET_FOOD";
    const existingCat = categoryStats.get(cat) || {
      count: 0,
      totalUnits: 0,
      valuation: 0,
    };
    existingCat.count += 1;

    if (prod.isVariable) {
      variableProductsCount++;
      totalVariantsCount += prod.variants.length;

      let prodTotalStock = 0;
      let prodValuation = 0;

      for (const variant of prod.variants) {
        const vStock = variant.stock || 0;
        const vCost =
          parseFloat(variant.costPrice) || parseFloat(variant.salePrice) || 0;
        prodTotalStock += vStock;
        prodValuation += vStock * vCost;

        if (vStock <= 0) {
          outOfStockItemsCount++;
          if (lowStockAlerts.length < 8) {
            lowStockAlerts.push({
              id: variant.id,
              name: `${prod.name} (${variant.sku})`,
              sku: variant.sku,
              currentStock: vStock,
              isVariant: true,
              parentName: prod.name,
            });
          }
        } else if (vStock <= 5) {
          lowStockItemsCount++;
          if (lowStockAlerts.length < 8) {
            lowStockAlerts.push({
              id: variant.id,
              name: `${prod.name} (${variant.sku})`,
              sku: variant.sku,
              currentStock: vStock,
              isVariant: true,
              parentName: prod.name,
            });
          }
        }
      }

      totalUnitsInStock += prodTotalStock;
      totalInventoryValuation += prodValuation;
      existingCat.totalUnits += prodTotalStock;
      existingCat.valuation += prodValuation;
    } else {
      singleProductsCount++;
      const pStock = prod.stock || 0;
      const pCost =
        parseFloat(prod.costPrice || "0") ||
        parseFloat(prod.salePrice || "0") ||
        0;

      totalUnitsInStock += pStock;
      const pVal = pStock * pCost;
      totalInventoryValuation += pVal;
      existingCat.totalUnits += pStock;
      existingCat.valuation += pVal;

      if (pStock <= 0) {
        outOfStockItemsCount++;
        if (lowStockAlerts.length < 8) {
          lowStockAlerts.push({
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            currentStock: pStock,
            isVariant: false,
          });
        }
      } else if (pStock <= 5) {
        lowStockItemsCount++;
        if (lowStockAlerts.length < 8) {
          lowStockAlerts.push({
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            currentStock: pStock,
            isVariant: false,
          });
        }
      }
    }

    categoryStats.set(cat, existingCat);
  }

  // Process combo products
  for (const combo of comboProducts) {
    const cVal =
      parseFloat(combo.salePrice || "0") ||
      parseFloat(combo.regularPrice || "0") ||
      0;
    totalInventoryValuation += cVal;
  }

  // Build top selling products array
  const topProductIds = topSoldItems
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));

  const topProductRecords = await db.product.findMany({
    where: { id: { in: topProductIds } },
    include: {
      subCategory: true,
      variants: { select: { stock: true } },
    },
  });

  const topSellingProducts: DashboardInventoryMetrics["topSellingProducts"] =
    [];

  for (const item of topSoldItems) {
    if (!item.productId) continue;
    const p = topProductRecords.find((rec) => rec.id === item.productId);
    if (!p) continue;

    const unitsSold = item._sum.quanitity || 0;
    const salePriceNum = parseFloat(p.salePrice || "0") || 0;
    const revenue = unitsSold * salePriceNum;
    const stockRemaining = p.isVariable
      ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : p.stock || 0;

    topSellingProducts.push({
      id: p.id,
      name: p.name,
      image: p.image,
      category: p.subCategory?.category || "PET_FOOD",
      unitsSold,
      revenue,
      stockRemaining,
    });
  }

  // Format category breakdown
  const categoryBreakdown: DashboardInventoryMetrics["categoryBreakdown"] =
    Object.values(Category).map((c) => {
      const st = categoryStats.get(c) || {
        count: 0,
        totalUnits: 0,
        valuation: 0,
      };
      return {
        category: c.replace(/_/g, " "),
        count: st.count,
        totalUnits: st.totalUnits,
        valuation: Math.round(st.valuation),
      };
    });

  return {
    totalProducts: products.length,
    singleProductsCount,
    variableProductsCount,
    totalVariantsCount,
    comboProductsCount: comboProducts.length,
    totalUnitsInStock,
    totalInventoryValuation: Math.round(totalInventoryValuation),
    lowStockItemsCount,
    outOfStockItemsCount,
    topSellingProducts,
    categoryBreakdown,
    lowStockAlerts,
  };
}
