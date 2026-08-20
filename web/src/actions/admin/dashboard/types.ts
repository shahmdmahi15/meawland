export type DashboardTimeRange = "today" | "week" | "month" | "year" | "all";

export interface DashboardFinancialMetrics {
  totalRevenue: number;
  netProfit: number;
  totalCostOfGoods: number;
  profitMarginPct: number;
  totalOrdersCount: number;
  averageOrderValue: number;
  codRevenue: number;
  onlineRevenue: number;
  pendingPaymentRevenue: number;
  todayRevenue: number;
  todayOrdersCount: number;
  revenueGrowthPct: number;
}

export interface DashboardSalesChartPoint {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface DashboardOrdersBreakdown {
  total: number;
  inReview: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  deliverySuccessRatePct: number;
  recentOrders: Array<{
    id: string;
    code: string;
    customerName: string;
    customerPhone: string;
    finalCost: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    courierTrackingCode?: string | null;
    createdAt: string;
  }>;
}

export interface DashboardInventoryMetrics {
  totalProducts: number;
  singleProductsCount: number;
  variableProductsCount: number;
  totalVariantsCount: number;
  comboProductsCount: number;
  totalUnitsInStock: number;
  totalInventoryValuation: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    image?: string | null;
    category: string;
    unitsSold: number;
    revenue: number;
    stockRemaining: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    totalUnits: number;
    valuation: number;
  }>;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    sku: string;
    currentStock: number;
    isVariant: boolean;
    parentName?: string;
  }>;
}

export interface DashboardCustomerMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  activeBuyers: number;
  repeatBuyers: number;
  repeatRatePct: number;
  newsletterSubscribers: number;
  openSupportTickets: number;
  resolvedSupportTickets: number;
}

export interface DashboardIntegrationsStatus {
  steadfast: {
    connected: boolean;
    currentBalance: number;
    totalConsignments: number;
    inTransitConsignments: number;
    deliveredConsignments: number;
  };
  bulkSms: {
    connected: boolean;
    remainingBalance: number;
    totalCampaigns: number;
    totalSent: number;
  };
  emailSes: {
    connected: boolean;
    totalSubscribers: number;
    totalCampaigns: number;
    totalDelivered: number;
    deliverySuccessRatePct: number;
    activeAutomationsCount: number;
  };
  bkash: {
    connected: boolean;
    totalOnlineTransactions: number;
    totalOnlineCollected: number;
  };
}

export interface DashboardSystemHealth {
  serverUptimeSeconds: number;
  serverUptimeFormatted: string;
  nodeVersion: string;
  nextVersion: string;
  environment: string;
  platform: string;
  cpuCores: number;
  memoryUsageMb: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    systemTotal: number;
    systemFree: number;
    systemUsagePct: number;
  };
  dbLatencyMs: number;
  dbStatus: "healthy" | "degraded" | "disconnected";
  storageProvider: string;
  storageHealthy: boolean;
}

export interface AdminOverviewDashboardData {
  timeRange: DashboardTimeRange;
  financials: DashboardFinancialMetrics;
  salesChart: DashboardSalesChartPoint[];
  orders: DashboardOrdersBreakdown;
  inventory: DashboardInventoryMetrics;
  customers: DashboardCustomerMetrics;
  integrations: DashboardIntegrationsStatus;
  system: DashboardSystemHealth;
}
