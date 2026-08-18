import { z } from "zod";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

// Item payload schema for creating manual/admin order
export const adminOrderItemSchema = z.object({
  itemType: z.enum(["PRODUCT", "VARIANT", "COMBO"]),
  productId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  comboProductId: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  sku: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  quantity: z
    .number({
      error: "Quantity must be a number",
    })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  unitPrice: z
    .number({
      error: "Unit price is required",
    })
    .min(0, "Unit price cannot be negative"),
  discountCost: z
    .number({
      error: "Discount must be a number",
    })
    .min(0, "Discount cannot be negative"),
  totalCost: z
    .number({
      error: "Total owner cost must be a number",
    })
    .min(0, "Owner cost cannot be negative"),
});

export type AdminOrderItemInput = z.infer<typeof adminOrderItemSchema>;

// Create manual/admin order schema
export const createAdminOrderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(11, "Phone number must be at least 11 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\s-]+$/, "Please enter a valid phone number"),
  district: z.string().trim().min(1, "Please select a district"),
  address: z
    .string()
    .trim()
    .min(5, "Delivery address must be at least 5 characters"),
  note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters")
    .optional()
    .nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    message: "Please select a valid payment method",
  }),
  paymentStatus: z.nativeEnum(PaymentStatus, {
    message: "Please select payment status",
  }),
  orderStatus: z.nativeEnum(OrderStatus, {
    message: "Please select order status",
  }),
  customDeliveryFee: z
    .number()
    .min(0, "Delivery fee cannot be negative")
    .optional()
    .nullable(),
  couponCode: z.string().trim().max(50).optional().nullable(),
  customDiscount: z
    .number()
    .min(0, "Custom discount cannot be negative")
    .optional()
    .nullable(),
  userId: z.string().optional().nullable(),
  items: z
    .array(adminOrderItemSchema)
    .min(1, "Order must contain at least one item"),
});

export type CreateAdminOrderInput = z.infer<typeof createAdminOrderSchema>;

// Update order status schema
export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  status: z.nativeEnum(OrderStatus, {
    message: "Please select a valid order status",
  }),
  note: z.string().trim().max(500).optional().nullable(),
  syncItemsStatus: z.boolean().default(true),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Update payment status schema
export const updatePaymentStatusSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentStatus: z.nativeEnum(PaymentStatus, {
    message: "Please select a valid payment status",
  }),
});

export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;

// Update order item status schema
export const updateOrderItemStatusSchema = z.object({
  orderItemId: z.string().min(1, "Order Item ID is required"),
  status: z.nativeEnum(OrderStatus, {
    message: "Please select a valid status",
  }),
});

export type UpdateOrderItemStatusInput = z.infer<
  typeof updateOrderItemStatusSchema
>;

// Update order customer & shipping details
export const updateOrderCustomerSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  name: z.string().trim().min(2, "Customer name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(11, "Phone number must be at least 11 digits"),
  district: z.string().trim().min(1, "Please select a district"),
  address: z
    .string()
    .trim()
    .min(5, "Delivery address must be at least 5 characters"),
  note: z.string().trim().max(500).optional().nullable(),
});

export type UpdateOrderCustomerInput = z.infer<
  typeof updateOrderCustomerSchema
>;

// Delete order schema
export const deleteOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  restoreStock: z.boolean().default(true),
});

export type DeleteOrderInput = z.infer<typeof deleteOrderSchema>;
