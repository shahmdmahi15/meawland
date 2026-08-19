import { z } from "zod";
import {
  OrderStatus,
  StockEventType,
  PaymentMethod,
  PaymentStatus,
  OrderType,
  Role,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";

export const ScannerModeEnum = z.enum([
  "AUTO_DETECT",
  "STOCK_MODIFIER",
  "ORDER_RETURNS",
  "POS_TERMINAL",
]);

export type ScannerMode = z.infer<typeof ScannerModeEnum>;

// Component of a Combo Product
export interface ScannedComboComponentItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  isVariant: boolean;
  variantLabel?: string;
  thumbnail?: string | null;
}

export interface ScannedVariantOption {
  id: string;
  sku: string;
  regularPrice: string;
  salePrice: string | null;
  stock: number;
  attributes: Array<{ name: string; value: string }>;
  label: string;
  thumbnail: string | null;
}

// Entity result types
export interface ScannedProductItem {
  id: string;
  code: string;
  name: string;
  sku: string;
  regularPrice: string;
  salePrice: string | null;
  stock: number;
  isVariable: boolean;
  categoryName: string;
  brandName: string | null;
  thumbnail: string | null;
  variantId?: string;
  variantLabel?: string;
  isCombo?: boolean;
  comboItems?: ScannedComboComponentItem[];
  availableVariants?: ScannedVariantOption[];
}

export interface ScannedOrderItemProduct {
  id: string;
  productId: string;
  variantId: string | null;
  comboProductId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  finalCost: string;
  thumbnail: string | null;
  variantLabel?: string;
  isCombo?: boolean;
}

export interface ScannedOrderResult {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  district: string;
  finalCost: string;
  totalQuantity: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  type: OrderType;
  createdAt: Date;
  items: ScannedOrderItemProduct[];
}

export interface ScannedCustomerResult {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  district: string | null;
  role: Role;
  totalOrders: number;
  lifetimeSpent: number;
  createdAt: Date;
}

export interface ScannedTicketResult {
  id: string;
  code: string;
  subject: string;
  message: string;
  category: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  channel: SupportChannel;
  userName: string;
  userPhone: string | null;
  orderCode: string | null;
  createdAt: Date;
}

export type ScannedBarcodeType =
  "PRODUCT" | "ORDER" | "CUSTOMER" | "TICKET" | "NOT_FOUND";

export interface BarcodeLookupResult {
  barcode: string;
  entityType: ScannedBarcodeType;
  product?: ScannedProductItem;
  order?: ScannedOrderResult;
  customer?: ScannedCustomerResult;
  ticket?: ScannedTicketResult;
}

// 1. Stock Modification Schema
export const stockModifySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional(),
  changeType: z.enum(StockEventType).default(StockEventType.RESTOCK),
  quantityDelta: z.number().int(), // positive for add, negative for remove
  note: z.string().trim().optional(),
  reason: z.string().trim().optional(),
});

export type StockModifyInput = z.infer<typeof stockModifySchema>;

// 2. Order Return Item Schema
export const returnItemSchema = z.object({
  orderItemId: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  comboProductId: z.string().optional(),
  quantityToReturn: z.number().int().min(1),
  restockInventory: z.boolean().default(true),
  condition: z
    .enum(["GOOD", "DAMAGED", "EXPIRED", "DEFECTIVE"])
    .default("GOOD"),
  reason: z.string().trim().default("Customer Return"),
});

export const orderReturnSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  items: z.array(returnItemSchema).min(1, "At least one item must be returned"),
  newOrderStatus: z.enum(OrderStatus).default(OrderStatus.RETURNED),
  note: z.string().trim().optional(),
});

export type OrderReturnInput = z.infer<typeof orderReturnSchema>;

export const posCartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  comboProductId: z.string().optional(),
  isCombo: z.boolean().optional(),
  productName: z.string(),
  sku: z.string(),
  unitPrice: z.number().min(0),
  quantity: z.number().int().min(1),
  thumbnail: z.string().nullable().optional(),
  variantLabel: z.string().optional(),
  availableVariants: z.array(z.any()).optional(),
});

export type POSCartItem = z.infer<typeof posCartItemSchema> & {
  availableVariants?: ScannedVariantOption[];
};

export const posCheckoutSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required"),
  customerPhone: z.string().trim().min(1, "Customer phone number is required"),
  customerEmail: z.string().trim().email().optional().or(z.literal("")),
  district: z.string().trim().default("Dhaka"),
  address: z.string().trim().default("In-Store POS Outlet"),
  items: z.array(posCartItemSchema).min(1, "Cart cannot be empty"),
  discountAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.COD),
  paymentStatus: z.enum(PaymentStatus).default(PaymentStatus.PAID),
  note: z.string().trim().optional(),
});

export type POSCheckoutInput = z.infer<typeof posCheckoutSchema>;

// POS Receipt Data
export interface POSReceiptData {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  items: POSCartItem[];
  subtotal: number;
  discount: number;
  finalCost: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}
