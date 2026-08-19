"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, OrderStatus } from "@/generated/prisma/enums";
import { getImageBase64 } from "@/lib/storage";
import {
  BANGLADESH_DIVISIONS,
  BANGLADESH_DIVISIONS_MAP,
  BangladeshDivision,
  getDivisionByDistrict,
} from "@/lib/bangladesh-districts";
import {
  ReportTimeframe,
  BestSellingReportData,
  BestSellingProductItem,
  LowStockReportData,
  LowStockProductItem,
  DivisionWiseReportData,
  DivisionOrderStats,
  DistrictOrderStats,
  DistrictWiseReportData,
  TopCustomersReportData,
  TopCustomerItem,
  NewCustomersReportData,
  NewCustomerItem,
} from "@/schemas/admin/reports";

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

function getTimeframeStartDate(timeframe: ReportTimeframe): Date | undefined {
  if (timeframe === "all") return undefined;
  const now = new Date();
  if (timeframe === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (timeframe === "30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (timeframe === "90d") {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  return undefined;
}

/**
 * 1. Best Selling Products Report Action
 */
export async function getAdminBestSellingProductsReportAction(
  timeframe: ReportTimeframe = "30d",
): Promise<{
  success: boolean;
  message?: string;
  data?: BestSellingReportData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const startDate = getTimeframeStartDate(timeframe);

    // Fetch order items with their orders & products
    const orderItems = await db.orderItem.findMany({
      where: startDate
        ? {
            order: {
              createdAt: { gte: startDate },
              status: { notIn: [OrderStatus.CANCELLED] },
            },
          }
        : {
            order: {
              status: { notIn: [OrderStatus.CANCELLED] },
            },
          },
      include: {
        product: {
          include: {
            subCategory: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
      },
    });

    // Aggregate by productId
    const productStatsMap = new Map<
      string,
      {
        product: NonNullable<(typeof orderItems)[0]["product"]>;
        unitsSold: number;
        totalRevenue: number;
      }
    >();

    for (const item of orderItems) {
      if (!item.product) continue;
      const pid = item.productId || item.product.id;
      const existing = productStatsMap.get(pid);
      const qty = item.quanitity || 1;
      const itemRev =
        (parseFloat(
          item.product.salePrice || item.product.regularPrice || "0",
        ) || 0) * qty;

      if (existing) {
        existing.unitsSold += qty;
        existing.totalRevenue += itemRev;
      } else {
        productStatsMap.set(pid, {
          product: item.product,
          unitsSold: qty,
          totalRevenue: itemRev,
        });
      }
    }

    const aggregatedList = Array.from(productStatsMap.values());
    aggregatedList.sort((a, b) => b.unitsSold - a.unitsSold);

    let totalProductsSold = 0;
    let totalRevenue = 0;

    const topSellingItems: BestSellingProductItem[] = await Promise.all(
      aggregatedList.map(
        async ({ product, unitsSold, totalRevenue: itemRev }) => {
          totalProductsSold += unitsSold;
          totalRevenue += itemRev;
          const thumbnail = await safeGetImageBase64(product.image);

          return {
            productId: product.id,
            code: product.code,
            name: product.name,
            sku: product.sku,
            categoryName: product.subCategory.name,
            brandName: product.brand?.name || null,
            thumbnail: thumbnail || null,
            unitsSold,
            totalRevenue: itemRev,
            currentStock: product.stock ?? 0,
            isVariable: product.isVariable,
            averageSellingPrice: unitsSold > 0 ? itemRev / unitsSold : 0,
          };
        },
      ),
    );

    return {
      success: true,
      data: {
        timeframe,
        totalProductsSold,
        totalRevenue,
        topSellingItems,
      },
    };
  } catch (error) {
    console.error("[Action.Reports.BestSelling] Error:", error);
    return {
      success: false,
      message: "Failed to generate best selling products report.",
    };
  }
}

/**
 * 2. Low Stocks Report Action
 */
export async function getAdminLowStocksReportAction(
  threshold: number = 10,
): Promise<{
  success: boolean;
  message?: string;
  data?: LowStockReportData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    // Query simple products with low stock
    const products = await db.product.findMany({
      where: {
        isVariable: false,
        stock: { lte: threshold },
      },
      include: {
        subCategory: { select: { name: true } },
        brand: { select: { name: true } },
      },
      orderBy: { stock: "asc" },
    });

    // Query variants with low stock
    const variants = await db.variant.findMany({
      where: {
        stock: { lte: threshold },
      },
      include: {
        product: {
          include: {
            subCategory: { select: { name: true } },
            brand: { select: { name: true } },
          },
        },
        attributes: true,
      },
      orderBy: { stock: "asc" },
    });

    let outOfStockCount = 0;
    let criticalStockCount = 0;
    let warningStockCount = 0;

    const items: LowStockProductItem[] = [];

    for (const p of products) {
      const stock = p.stock ?? 0;
      let urgency: "OUT_OF_STOCK" | "CRITICAL" | "LOW" = "LOW";
      if (stock === 0) {
        urgency = "OUT_OF_STOCK";
        outOfStockCount++;
      } else if (stock <= 3) {
        urgency = "CRITICAL";
        criticalStockCount++;
      } else {
        urgency = "LOW";
        warningStockCount++;
      }

      const thumb = await safeGetImageBase64(p.image);

      items.push({
        productId: p.id,
        code: p.code,
        name: p.name,
        sku: p.sku,
        thumbnail: thumb || null,
        categoryName: p.subCategory.name,
        brandName: p.brand?.name || null,
        currentStock: stock,
        isVariable: false,
        regularPrice: p.regularPrice || "0",
        salePrice: p.salePrice || null,
        urgency,
      });
    }

    for (const v of variants) {
      const stock = v.stock;
      let urgency: "OUT_OF_STOCK" | "CRITICAL" | "LOW" = "LOW";
      if (stock === 0) {
        urgency = "OUT_OF_STOCK";
        outOfStockCount++;
      } else if (stock <= 3) {
        urgency = "CRITICAL";
        criticalStockCount++;
      } else {
        urgency = "LOW";
        warningStockCount++;
      }

      const variantLabel = v.attributes
        .map((a) => `${a.name}: ${a.value}`)
        .join(", ");
      const thumb = await safeGetImageBase64(v.image || v.product.image);

      items.push({
        productId: v.product.id,
        variantId: v.id,
        code: v.product.code,
        name: v.product.name,
        sku: v.sku,
        thumbnail: thumb || null,
        categoryName: v.product.subCategory.name,
        brandName: v.product.brand?.name || null,
        currentStock: stock,
        isVariable: true,
        variantLabel: variantLabel || "Variant",
        regularPrice: v.regularPrice,
        salePrice: v.salePrice || null,
        urgency,
      });
    }

    items.sort((a, b) => a.currentStock - b.currentStock);

    return {
      success: true,
      data: {
        threshold,
        totalLowStockCount: items.length,
        outOfStockCount,
        criticalStockCount,
        warningStockCount,
        items,
      },
    };
  } catch (error) {
    console.error("[Action.Reports.LowStocks] Error:", error);
    return { success: false, message: "Failed to generate low stocks report." };
  }
}

/**
 * 3. Division Wise Order Report Action
 */
export async function getAdminDivisionWiseOrderReportAction(
  timeframe: ReportTimeframe = "all",
): Promise<{
  success: boolean;
  message?: string;
  data?: DivisionWiseReportData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const startDate = getTimeframeStartDate(timeframe);

    const orders = await db.order.findMany({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
      select: {
        id: true,
        district: true,
        finalCost: true,
        status: true,
        createdAt: true,
      },
    });

    const totalOrdersCount = orders.length;
    let totalRevenue = 0;

    // Initialize map for all 8 divisions and their respective districts
    const divisionStatsMap = new Map<
      BangladeshDivision,
      {
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        cancelledOrders: number;
        districtsMap: Map<
          string,
          {
            districtName: string;
            totalOrders: number;
            totalRevenue: number;
            deliveredOrders: number;
            cancelledOrders: number;
          }
        >;
      }
    >();

    for (const div of BANGLADESH_DIVISIONS) {
      const districtsMap = new Map<
        string,
        {
          districtName: string;
          totalOrders: number;
          totalRevenue: number;
          deliveredOrders: number;
          cancelledOrders: number;
        }
      >();
      const divisionDistricts = BANGLADESH_DIVISIONS_MAP[div];
      for (const d of divisionDistricts) {
        districtsMap.set(d.toLowerCase(), {
          districtName: d,
          totalOrders: 0,
          totalRevenue: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
        });
      }
      divisionStatsMap.set(div, {
        totalOrders: 0,
        totalRevenue: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        districtsMap,
      });
    }

    for (const order of orders) {
      const cost = parseFloat(order.finalCost || "0") || 0;
      totalRevenue += cost;

      const division = getDivisionByDistrict(order.district || "Dhaka");
      const divData = divisionStatsMap.get(division);
      if (!divData) continue;

      divData.totalOrders++;
      divData.totalRevenue += cost;
      if (order.status === OrderStatus.DELIVERED) {
        divData.deliveredOrders++;
      } else if (order.status === OrderStatus.CANCELLED) {
        divData.cancelledOrders++;
      }

      // District sub-aggregate
      const districtKey = (order.district || "Dhaka").trim().toLowerCase();
      let dData = divData.districtsMap.get(districtKey);
      if (!dData) {
        dData = {
          districtName: order.district || "Dhaka",
          totalOrders: 0,
          totalRevenue: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
        };
        divData.districtsMap.set(districtKey, dData);
      }

      dData.totalOrders++;
      dData.totalRevenue += cost;
      if (order.status === OrderStatus.DELIVERED) {
        dData.deliveredOrders++;
      } else if (order.status === OrderStatus.CANCELLED) {
        dData.cancelledOrders++;
      }
    }

    const divisions: DivisionOrderStats[] = BANGLADESH_DIVISIONS.map((div) => {
      const divData = divisionStatsMap.get(div)!;
      const avgOrderValue =
        divData.totalOrders > 0
          ? divData.totalRevenue / divData.totalOrders
          : 0;
      const percentageOfTotalOrders =
        totalOrdersCount > 0
          ? (divData.totalOrders / totalOrdersCount) * 100
          : 0;
      const percentageOfTotalRevenue =
        totalRevenue > 0 ? (divData.totalRevenue / totalRevenue) * 100 : 0;

      const districts: DistrictOrderStats[] = Array.from(
        divData.districtsMap.values(),
      )
        .map((d) => ({
          district: d.districtName,
          division: div,
          totalOrders: d.totalOrders,
          totalRevenue: d.totalRevenue,
          deliveredOrders: d.deliveredOrders,
          cancelledOrders: d.cancelledOrders,
          avgOrderValue: d.totalOrders > 0 ? d.totalRevenue / d.totalOrders : 0,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      return {
        division: div,
        totalOrders: divData.totalOrders,
        totalRevenue: divData.totalRevenue,
        deliveredOrders: divData.deliveredOrders,
        cancelledOrders: divData.cancelledOrders,
        avgOrderValue,
        percentageOfTotalOrders,
        percentageOfTotalRevenue,
        districts,
      };
    });

    divisions.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      success: true,
      data: {
        timeframe,
        totalOrders: totalOrdersCount,
        totalRevenue,
        divisions,
      },
    };
  } catch (error) {
    console.error("[Action.Reports.DivisionWise] Error:", error);
    return {
      success: false,
      message: "Failed to generate division wise report.",
    };
  }
}

/**
 * 4. District Wise Order Report Action
 */
export async function getAdminDistrictWiseOrderReportAction(
  timeframe: ReportTimeframe = "all",
  division: string = "ALL",
): Promise<{
  success: boolean;
  message?: string;
  data?: DistrictWiseReportData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const startDate = getTimeframeStartDate(timeframe);

    const orders = await db.order.findMany({
      where: startDate ? { createdAt: { gte: startDate } } : undefined,
      select: {
        id: true,
        district: true,
        finalCost: true,
        status: true,
      },
    });

    const districtMap = new Map<
      string,
      {
        district: string;
        division: BangladeshDivision;
        totalOrders: number;
        totalRevenue: number;
        deliveredOrders: number;
        cancelledOrders: number;
      }
    >();

    let totalOrders = 0;
    let totalRevenue = 0;

    for (const order of orders) {
      const dName = order.district || "Dhaka";
      const div = getDivisionByDistrict(dName);

      if (division !== "ALL" && div !== division) {
        continue;
      }

      const cost = parseFloat(order.finalCost || "0") || 0;
      totalOrders++;
      totalRevenue += cost;

      const key = dName.trim().toLowerCase();
      const existing = districtMap.get(key);

      if (existing) {
        existing.totalOrders++;
        existing.totalRevenue += cost;
        if (order.status === OrderStatus.DELIVERED) existing.deliveredOrders++;
        if (order.status === OrderStatus.CANCELLED) existing.cancelledOrders++;
      } else {
        districtMap.set(key, {
          district: dName,
          division: div,
          totalOrders: 1,
          totalRevenue: cost,
          deliveredOrders: order.status === OrderStatus.DELIVERED ? 1 : 0,
          cancelledOrders: order.status === OrderStatus.CANCELLED ? 1 : 0,
        });
      }
    }

    const districts: DistrictOrderStats[] = Array.from(districtMap.values())
      .map((d) => ({
        district: d.district,
        division: d.division,
        totalOrders: d.totalOrders,
        totalRevenue: d.totalRevenue,
        deliveredOrders: d.deliveredOrders,
        cancelledOrders: d.cancelledOrders,
        avgOrderValue: d.totalOrders > 0 ? d.totalRevenue / d.totalOrders : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      success: true,
      data: {
        timeframe,
        selectedDivision: division,
        totalOrders,
        totalRevenue,
        districts,
      },
    };
  } catch (error) {
    console.error("[Action.Reports.DistrictWise] Error:", error);
    return {
      success: false,
      message: "Failed to generate district wise report.",
    };
  }
}

/**
 * 5. Top Customers Report Action
 */
export async function getAdminTopCustomersReportAction(
  timeframe: ReportTimeframe = "all",
  limit: number = 50,
): Promise<{
  success: boolean;
  message?: string;
  data?: TopCustomersReportData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const startDate = getTimeframeStartDate(timeframe);

    const users = await db.user.findMany({
      include: {
        orders: {
          where: startDate ? { createdAt: { gte: startDate } } : undefined,
          select: {
            finalCost: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const customerList: TopCustomerItem[] = await Promise.all(
      users.map(async (u) => {
        const totalOrders = u.orders.length;
        let deliveredOrders = 0;
        let totalSpent = 0;
        let lastOrderDate: Date | null = null;

        for (const ord of u.orders) {
          const cost = parseFloat(ord.finalCost || "0") || 0;
          totalSpent += cost;
          if (ord.status === OrderStatus.DELIVERED) deliveredOrders++;
          if (!lastOrderDate || new Date(ord.createdAt) > lastOrderDate) {
            lastOrderDate = new Date(ord.createdAt);
          }
        }

        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
        const avatar = await safeGetImageBase64(u.avatar);
        const division = u.district ? getDivisionByDistrict(u.district) : null;

        let loyaltyTier: "VIP PLATINUM" | "GOLD" | "SILVER" | "BRONZE" =
          "BRONZE";
        if (totalSpent >= 25000 || totalOrders >= 15)
          loyaltyTier = "VIP PLATINUM";
        else if (totalSpent >= 10000 || totalOrders >= 8) loyaltyTier = "GOLD";
        else if (totalSpent >= 4000 || totalOrders >= 3) loyaltyTier = "SILVER";

        return {
          id: u.id,
          code: u.code,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: avatar || null,
          district: u.district,
          division,
          totalOrders,
          deliveredOrders,
          totalSpent,
          avgOrderValue,
          lastOrderDate,
          loyaltyTier,
        };
      }),
    );

    customerList.sort((a, b) => b.totalSpent - a.totalSpent);
    const topCustomers = customerList.slice(0, limit);

    const totalTopRevenue = topCustomers.reduce(
      (sum, c) => sum + c.totalSpent,
      0,
    );

    return {
      success: true,
      data: {
        timeframe,
        totalTopCustomers: topCustomers.length,
        totalTopRevenue,
        customers: topCustomers,
      },
    };
  } catch (error) {
    console.error("[Action.Reports.TopCustomers] Error:", error);
    return {
      success: false,
      message: "Failed to generate top customers report.",
    };
  }
}

/**
 * 6. New Customers Report Action
 */
export async function getAdminNewCustomersReportAction(
  timeframe: ReportTimeframe = "30d",
): Promise<{
  success: boolean;
  message?: string;
  data?: NewCustomersReportData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const startDate =
      getTimeframeStartDate(timeframe) ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const users = await db.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        orders: {
          select: {
            finalCost: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let convertedCount = 0;
    const divisionDistribution: Record<string, number> = {};

    const customers: NewCustomerItem[] = await Promise.all(
      users.map(async (u) => {
        const hasPlacedOrder = u.orders.length > 0;
        if (hasPlacedOrder) convertedCount++;

        const firstOrder = u.orders[0];
        const firstOrderTotal = firstOrder
          ? parseFloat(firstOrder.finalCost || "0") || 0
          : null;
        const firstOrderDate = firstOrder
          ? new Date(firstOrder.createdAt)
          : null;

        const div = u.district ? getDivisionByDistrict(u.district) : "Unknown";
        divisionDistribution[div] = (divisionDistribution[div] || 0) + 1;

        const avatar = await safeGetImageBase64(u.avatar);

        return {
          id: u.id,
          code: u.code,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: avatar || null,
          district: u.district,
          division: u.district ? getDivisionByDistrict(u.district) : null,
          createdAt: u.createdAt,
          hasPlacedOrder,
          firstOrderDate,
          firstOrderTotal,
        };
      }),
    );

    const conversionRate =
      users.length > 0 ? (convertedCount / users.length) * 100 : 0;

    return {
      success: true,
      data: {
        timeframe,
        totalNewCustomers: users.length,
        convertedCount,
        conversionRate,
        customers,
        divisionDistribution,
      },
    };
  } catch (error) {
    console.error("[Action.Reports.NewCustomers] Error:", error);
    return {
      success: false,
      message: "Failed to generate new customers report.",
    };
  }
}
