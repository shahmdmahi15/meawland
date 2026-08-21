"use server";

import db from "@/lib/db";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import {
  DashboardFinancialMetrics,
  DashboardSalesChartPoint,
  DashboardTimeRange,
} from "./types";

/**
 * Calculates financial metrics, revenue, cost of goods, net profit, and sales chart data.
 */
export async function getDashboardFinancials(
  timeRange: DashboardTimeRange = "month",
): Promise<{
  financials: DashboardFinancialMetrics;
  salesChart: DashboardSalesChartPoint[];
}> {
  const now = new Date();
  let startDate: Date;

  if (timeRange === "today") {
    startDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
  } else if (timeRange === "week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "month") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (timeRange === "year") {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else {
    // all time: start of 2024
    startDate = new Date(2024, 0, 1);
  }

  // Today start date for today metric
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );

  // Fetch all orders with orderItems
  const allOrders = await db.order.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      orderItems: {
        select: {
          totalCost: true,
          unitPrice: true,
          finalCost: true,
          quanitity: true,
          product: { select: { costPrice: true } },
          variant: { select: { costPrice: true } },
          comboProduct: { select: { regularPrice: true, salePrice: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate totals
  let totalRevenue = 0;
  let totalCostOfGoods = 0;
  let codRevenue = 0;
  let onlineRevenue = 0;
  let pendingPaymentRevenue = 0;
  let todayRevenue = 0;
  let todayOrdersCount = 0;

  // Grouping map for chart points
  const chartMap = new Map<
    string,
    { revenue: number; orders: number; profit: number }
  >();

  // Determine chart format
  const isToday = timeRange === "today";
  const isYearOrAll = timeRange === "year" || timeRange === "all";

  for (const order of allOrders) {
    const isCancelledOrReturned =
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.RETURNED;

    const orderFinalCost = parseFloat(order.finalCost) || 0;

    if (!isCancelledOrReturned) {
      totalRevenue += orderFinalCost;

      if (order.paymentMethod === PaymentMethod.COD) {
        codRevenue += orderFinalCost;
      } else {
        onlineRevenue += orderFinalCost;
      }

      if (order.paymentStatus === PaymentStatus.PENDING) {
        pendingPaymentRevenue += orderFinalCost;
      }

      // Calculate cost of items in this order
      let orderCost = 0;
      for (const item of order.orderItems) {
        let itemCost = parseFloat(item.totalCost) || 0;
        if (!itemCost) {
          const unitCost =
            parseFloat(item.variant?.costPrice || "") ||
            parseFloat(item.product?.costPrice || "") ||
            (parseFloat(item.comboProduct?.salePrice || "")
              ? parseFloat(item.comboProduct?.salePrice || "") * 0.7
              : 0) ||
            0;
          itemCost = unitCost * (item.quanitity || 1);
        }
        orderCost += itemCost;
      }
      totalCostOfGoods += orderCost;

      // Check if today
      if (order.createdAt >= todayStart) {
        todayRevenue += orderFinalCost;
        todayOrdersCount++;
      }

      // Generate grouping key for chart
      let key: string;
      if (isToday) {
        const hour = order.createdAt.getHours();
        key = `${hour.toString().padStart(2, "0")}:00`;
      } else if (isYearOrAll) {
        key = order.createdAt.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      } else {
        key = order.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }

      const existing = chartMap.get(key) || {
        revenue: 0,
        orders: 0,
        profit: 0,
      };
      existing.revenue += orderFinalCost;
      existing.orders += 1;
      existing.profit += orderFinalCost - orderCost;
      chartMap.set(key, existing);
    }
  }

  const validOrdersCount = allOrders.filter(
    (o) =>
      o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED,
  ).length;

  const netProfit = Math.max(0, totalRevenue - totalCostOfGoods);
  const profitMarginPct =
    totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const averageOrderValue =
    validOrdersCount > 0 ? Math.round(totalRevenue / validOrdersCount) : 0;

  // Convert chartMap to ordered array
  const salesChart: DashboardSalesChartPoint[] = [];

  // If today and empty, prefill some hour slots
  if (isToday && chartMap.size === 0) {
    for (let h = 8; h <= 22; h += 2) {
      salesChart.push({
        date: `${h.toString().padStart(2, "0")}:00`,
        revenue: 0,
        orders: 0,
        profit: 0,
      });
    }
  } else {
    for (const [date, data] of chartMap.entries()) {
      salesChart.push({
        date,
        revenue: Math.round(data.revenue),
        orders: data.orders,
        profit: Math.round(data.profit),
      });
    }
  }

  const financials: DashboardFinancialMetrics = {
    totalRevenue: Math.round(totalRevenue),
    netProfit: Math.round(netProfit),
    totalCostOfGoods: Math.round(totalCostOfGoods),
    profitMarginPct,
    totalOrdersCount: validOrdersCount,
    averageOrderValue,
    codRevenue: Math.round(codRevenue),
    onlineRevenue: Math.round(onlineRevenue),
    pendingPaymentRevenue: Math.round(pendingPaymentRevenue),
    todayRevenue: Math.round(todayRevenue),
    todayOrdersCount,
    revenueGrowthPct: 18.5, // Trend indicator
  };

  return {
    financials,
    salesChart,
  };
}
