import { z } from "zod";
import { Role } from "@/generated/prisma/enums";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";

export const adminUpdateCustomerSchema = z.object({
  id: z.string().min(1, "Customer ID is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+88)?01[3-9]\d{8}$/, "Valid Bangladesh phone number is required")
    .or(z.literal("")),
  district: z
    .enum(BANGLADESH_DISTRICTS as unknown as [string, ...string[]])
    .or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  role: z.enum(Role),
});

export type AdminUpdateCustomerInput = z.infer<
  typeof adminUpdateCustomerSchema
>;

export interface AdminCustomerSummary {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  district: string | null;
  address: string | null;
  role: Role;
  hasGoogleLinked: boolean;
  createdAt: Date;
  totalOrdersCount: number;
  lifetimeSpent: number;
  supportTicketsCount: number;
  lastOrderDate: Date | null;
}

export interface AdminCustomerStats {
  totalCustomers: number;
  activeBuyers: number;
  totalRevenue: number;
  totalInquiries: number;
}

export interface AdminCustomerDetails extends AdminCustomerSummary {
  recentOrders: {
    id: string;
    code: string;
    finalCost: string;
    totalQuantity: number;
    status: string;
    paymentStatus: string;
    createdAt: Date;
  }[];
  supportTickets: {
    id: string;
    code: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    channel: string;
    createdAt: Date;
  }[];
}
