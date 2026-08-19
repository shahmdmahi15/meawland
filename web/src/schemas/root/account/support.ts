import { z } from "zod";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";

export const SUPPORT_CATEGORIES = [
  "Order & Delivery",
  "Payment & Refund",
  "Product Quality & Warranty",
  "Returns & Exchange",
  "Account & Login",
  "Pet Care Advice & General Inquiry",
] as const;

export const createSupportTicketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject cannot exceed 150 characters"),
  category: z.enum(SUPPORT_CATEGORIES, {
    error: "Please select a support category",
  }),
  orderId: z.string().optional().nullable(),
  message: z
    .string()
    .trim()
    .min(10, "Please provide at least 10 characters describing your issue")
    .max(2000, "Message cannot exceed 2000 characters"),
  priority: z.enum(SupportTicketPriority).default(SupportTicketPriority.MEDIUM),
  channel: z.enum(SupportChannel).default(SupportChannel.WEB_TICKET),
});

export type CreateSupportTicketInput = z.infer<
  typeof createSupportTicketSchema
>;

export interface SupportTicketSummary {
  id: string;
  code: string;
  subject: string;
  message: string;
  category: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  channel: SupportChannel;
  createdAt: Date;
  updatedAt: Date;
  order: {
    id: string;
    code: string;
    finalCost: string;
    status: string;
  } | null;
}

export interface UserOrderOption {
  id: string;
  code: string;
  createdAt: Date;
  finalCost: string;
  status: string;
}
