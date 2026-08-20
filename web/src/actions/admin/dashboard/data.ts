"use server";

import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getDashboardFinancials } from "./financials";
import { getDashboardInventory } from "./inventory";
import { getDashboardSystemAndIntegrations } from "./system";
import { AdminOverviewDashboardData, DashboardTimeRange } from "./types";

/**
 * Master server action that powers the executive /admin command center.
 * Gathers complete site analytics, financials, live balances, server health,
 * orders, and inventory breakdown.
 */
export async function getAdminOverviewDashboardDataAction(
  timeRange: DashboardTimeRange = "month",
): Promise<{
  success: boolean;
  message?: string;
  data: AdminOverviewDashboardData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return {
        success: false,
        message: "Unauthorized access.",
        data: getFallbackDashboardData(timeRange),
      };
    }

    const [financialsRes, inventoryRes, systemAndIntegrationsRes] =
      await Promise.all([
        getDashboardFinancials(timeRange),
        getDashboardInventory(),
        getDashboardSystemAndIntegrations(),
      ]);

    const dashboardData: AdminOverviewDashboardData = {
      timeRange,
      financials: financialsRes.financials,
      salesChart: financialsRes.salesChart,
      inventory: inventoryRes,
      orders: systemAndIntegrationsRes.orders,
      customers: systemAndIntegrationsRes.customers,
      integrations: systemAndIntegrationsRes.integrations,
      system: systemAndIntegrationsRes.system,
    };

    return {
      success: true,
      data: dashboardData,
    };
  } catch (error) {
    console.error("[Action.Admin.Dashboard.GetOverview] Error:", error);
    return {
      success: false,
      message: "Failed to load admin overview dashboard.",
      data: getFallbackDashboardData(timeRange),
    };
  }
}

function getFallbackDashboardData(timeRange: DashboardTimeRange): AdminOverviewDashboardData {
  return {
    timeRange,
    financials: {
      totalRevenue: 0,
      netProfit: 0,
      totalCostOfGoods: 0,
      profitMarginPct: 0,
      totalOrdersCount: 0,
      averageOrderValue: 0,
      codRevenue: 0,
      onlineRevenue: 0,
      pendingPaymentRevenue: 0,
      todayRevenue: 0,
      todayOrdersCount: 0,
      revenueGrowthPct: 0,
    },
    salesChart: [],
    orders: {
      total: 0,
      inReview: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
      deliverySuccessRatePct: 100,
      recentOrders: [],
    },
    inventory: {
      totalProducts: 0,
      singleProductsCount: 0,
      variableProductsCount: 0,
      totalVariantsCount: 0,
      comboProductsCount: 0,
      totalUnitsInStock: 0,
      totalInventoryValuation: 0,
      lowStockItemsCount: 0,
      outOfStockItemsCount: 0,
      topSellingProducts: [],
      categoryBreakdown: [],
      lowStockAlerts: [],
    },
    customers: {
      totalCustomers: 0,
      newCustomersThisMonth: 0,
      activeBuyers: 0,
      repeatBuyers: 0,
      repeatRatePct: 0,
      newsletterSubscribers: 0,
      openSupportTickets: 0,
      resolvedSupportTickets: 0,
    },
    integrations: {
      steadfast: {
        connected: false,
        currentBalance: 0,
        totalConsignments: 0,
        inTransitConsignments: 0,
        deliveredConsignments: 0,
      },
      bulkSms: {
        connected: false,
        remainingBalance: 0,
        totalCampaigns: 0,
        totalSent: 0,
      },
      emailSes: {
        connected: false,
        totalSubscribers: 0,
        totalCampaigns: 0,
        totalDelivered: 0,
        deliverySuccessRatePct: 100,
        activeAutomationsCount: 0,
      },
      bkash: {
        connected: false,
        totalOnlineTransactions: 0,
        totalOnlineCollected: 0,
      },
    },
    system: {
      serverUptimeSeconds: 0,
      serverUptimeFormatted: "0m",
      nodeVersion: "v20.x",
      nextVersion: "16.3.0",
      environment: "production",
      platform: "Windows",
      cpuCores: 8,
      memoryUsageMb: {
        heapUsed: 120,
        heapTotal: 256,
        rss: 300,
        systemTotal: 16384,
        systemFree: 8192,
        systemUsagePct: 50,
      },
      dbLatencyMs: 25,
      dbStatus: "healthy",
      storageProvider: "AWS S3",
      storageHealthy: true,
    },
  };
}
