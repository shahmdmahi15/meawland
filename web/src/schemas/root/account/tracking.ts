import { z } from "zod";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import {
  CustomerOrderItemSummary,
  CustomerPaymentSummary,
  CustomerShipmentSummary,
} from "@/schemas/root/account/orders";

export const trackOrderInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Please enter an order code to track")
    .max(50, "Order code is too long"),
});

export type TrackOrderInput = z.infer<typeof trackOrderInputSchema>;

export interface TrackingMilestoneStep {
  key: string;
  title: string;
  description: string;
  timestamp: string | null;
  status: "completed" | "in_progress" | "pending" | "cancelled";
  location?: string;
}

export interface TrackedOrderDetails {
  id: string;
  code: string;
  status: OrderStatus;
  type: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalQuantity: number;
  totalPrice: string;
  discountCost: string;
  finalCost: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  estimatedDeliveryDate: string;
  courierPartner: string;
  milestones: TrackingMilestoneStep[];
  payment?: CustomerPaymentSummary | null;
  shipment?: CustomerShipmentSummary | null;
  items: CustomerOrderItemSummary[];
}

export interface RecentOrderQuickItem {
  id: string;
  code: string;
  status: OrderStatus;
  createdAt: Date;
  finalCost: string;
  totalQuantity: number;
}
