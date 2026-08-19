import { z } from "zod";
import { BangladeshDivision } from "@/lib/bangladesh-districts";

export const ReportTimeframeEnum = z.enum(["7d", "30d", "90d", "all"]);
export type ReportTimeframe = z.infer<typeof ReportTimeframeEnum>;

// 1. Best Selling Product Interface
export interface BestSellingProductItem {
  productId: string;
  code: string;
  name: string;
  sku: string;
  categoryName: string;
  brandName: string | null;
  thumbnail: string | null;
  unitsSold: number;
  totalRevenue: number;
  currentStock: number;
  isVariable: boolean;
  averageSellingPrice: number;
}

export interface BestSellingReportData {
  timeframe: ReportTimeframe;
  totalProductsSold: number;
  totalRevenue: number;
  topSellingItems: BestSellingProductItem[];
}

// 2. Low Stock Interface
export interface LowStockProductItem {
  productId: string;
  variantId?: string;
  code: string;
  name: string;
  sku: string;
  thumbnail: string | null;
  categoryName: string;
  brandName: string | null;
  currentStock: number;
  isVariable: boolean;
  variantLabel?: string;
  regularPrice: string;
  salePrice: string | null;
  urgency: "OUT_OF_STOCK" | "CRITICAL" | "LOW";
}

export interface LowStockReportData {
  threshold: number;
  totalLowStockCount: number;
  outOfStockCount: number;
  criticalStockCount: number; // 1-3
  warningStockCount: number; // 4-threshold
  items: LowStockProductItem[];
}

// 3. Division Wise Interface
export interface DistrictOrderStats {
  district: string;
  division: BangladeshDivision;
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
}

export interface DivisionOrderStats {
  division: BangladeshDivision;
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
  percentageOfTotalOrders: number;
  percentageOfTotalRevenue: number;
  districts: DistrictOrderStats[];
}

export interface DivisionWiseReportData {
  timeframe: ReportTimeframe;
  totalOrders: number;
  totalRevenue: number;
  divisions: DivisionOrderStats[];
}

// 4. District Wise Interface
export interface DistrictWiseReportData {
  timeframe: ReportTimeframe;
  selectedDivision: string;
  totalOrders: number;
  totalRevenue: number;
  districts: DistrictOrderStats[];
}

// 5. Top Customer Interface
export interface TopCustomerItem {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  district: string | null;
  division: BangladeshDivision | null;
  totalOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: Date | null;
  loyaltyTier: "VIP PLATINUM" | "GOLD" | "SILVER" | "BRONZE";
}

export interface TopCustomersReportData {
  timeframe: ReportTimeframe;
  totalTopCustomers: number;
  totalTopRevenue: number;
  customers: TopCustomerItem[];
}

// 6. New Customers Interface
export interface NewCustomerItem {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  district: string | null;
  division: BangladeshDivision | null;
  createdAt: Date;
  hasPlacedOrder: boolean;
  firstOrderDate: Date | null;
  firstOrderTotal: number | null;
}

export interface NewCustomersReportData {
  timeframe: ReportTimeframe;
  totalNewCustomers: number;
  convertedCount: number; // Placed at least 1 order
  conversionRate: number; // Percentage
  customers: NewCustomerItem[];
  divisionDistribution: Record<string, number>;
}
