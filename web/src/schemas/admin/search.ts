import { z } from "zod";
import {
  OrderStatus,
  Role,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";

export const SearchEntityTypeEnum = z.enum([
  "ALL",
  "PRODUCTS",
  "ORDERS",
  "CUSTOMERS",
  "TICKETS",
  "OFFERS",
]);

export type SearchEntityType = z.infer<typeof SearchEntityTypeEnum>;

export const adminSearchQuerySchema = z.object({
  query: z.string().default(""),
  type: SearchEntityTypeEnum.default("ALL"),
  limit: z.number().int().min(1).max(50).default(20),
});

export type AdminSearchQueryInput = z.infer<typeof adminSearchQuerySchema>;

export interface AdminProductSearchVariant {
  id: string;
  sku: string;
  price: string;
  stock: number;
  label: string;
  attributes: Array<{ name: string; value: string }>;
  image?: string | null;
}

export interface AdminProductSearchResult {
  id: string;
  code: string;
  name: string;
  sku: string;
  sellingPrice: string;
  minPrice?: string;
  maxPrice?: string;
  stock: number;
  isVariable: boolean;
  categoryName: string;
  brandName: string | null;
  thumbnail: string | null;
  variants?: AdminProductSearchVariant[];
}

export interface AdminOrderSearchResult {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  finalCost: string;
  totalQuantity: number;
  status: OrderStatus;
  paymentStatus: string;
  createdAt: Date;
}

export interface AdminCustomerSearchResult {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  district: string | null;
  role: Role;
  totalOrdersCount: number;
  lifetimeSpent: number;
  createdAt: Date;
}

export interface AdminTicketSearchResult {
  id: string;
  code: string;
  subject: string;
  category: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  channel: SupportChannel;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  orderCode: string | null;
  createdAt: Date;
}

export interface AdminOfferSearchResult {
  id: string;
  code: string;
  name: string;
  type: "COUPON" | "CAMPAIGN" | "BRAND";
  details: string;
  status?: string;
  link: string;
}

export interface AdminGlobalSearchResults {
  query: string;
  totalMatches: number;
  products: AdminProductSearchResult[];
  orders: AdminOrderSearchResult[];
  customers: AdminCustomerSearchResult[];
  tickets: AdminTicketSearchResult[];
  offers: AdminOfferSearchResult[];
  counts: {
    products: number;
    orders: number;
    customers: number;
    tickets: number;
    offers: number;
  };
}
