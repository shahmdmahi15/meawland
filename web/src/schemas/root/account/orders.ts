import { z } from "zod";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

export const customerOrdersFilterSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z
    .enum(["ALL", "ACTIVE", "DELIVERED", "CANCELLED"])
    .default("ALL")
    .optional(),
  sortBy: z
    .enum(["newest", "oldest", "price_high", "price_low"])
    .default("newest")
    .optional(),
  page: z.number().int().min(1).default(1).optional(),
  pageSize: z.number().int().min(1).max(50).default(10).optional(),
});

export type CustomerOrdersFilterInput = z.infer<
  typeof customerOrdersFilterSchema
>;

export interface CustomerOrderItemSummary {
  id: string;
  name: string;
  sku: string | null;
  image: string;
  quantity: number;
  unitPrice: string;
  totalCost: string;
  discountCost: string;
  finalCost: string;
  status: OrderStatus;
  productId: string | null;
  variantId: string | null;
  comboProductId: string | null;
  slug?: string | null;
}

export interface CustomerOrderSummary {
  id: string;
  code: string;
  totalQuantity: number;
  totalPrice: string;
  discountCost: string;
  finalCost: string;
  status: OrderStatus;
  type: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  address: string;
  district: string;
  note: string | null;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  items: CustomerOrderItemSummary[];
}

export interface CustomerOrderStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSpent: number;
}
