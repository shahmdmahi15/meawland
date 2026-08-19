import { z } from "zod";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
  OrderStatus,
} from "@/generated/prisma/enums";
import { SUPPORT_CATEGORIES } from "@/schemas/root/account/support";

export const adminUpdateTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  status: z.enum(SupportTicketStatus),
});

export const adminUpdateTicketPrioritySchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  priority: z.enum(SupportTicketPriority),
});

export const adminCreateTicketSchema = z.object({
  userId: z.string().min(1, "Please select a customer"),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject cannot exceed 150 characters"),
  category: z.enum(SUPPORT_CATEGORIES, {
    error: "Please select a category",
  }),
  orderId: z.string().optional().nullable(),
  priority: z.enum(SupportTicketPriority).default(SupportTicketPriority.MEDIUM),
  channel: z.enum(SupportChannel).default(SupportChannel.WEB_TICKET),
  message: z
    .string()
    .trim()
    .min(5, "Please provide message details")
    .max(2500, "Message cannot exceed 2500 characters"),
});

export type AdminCreateTicketInput = z.infer<typeof adminCreateTicketSchema>;

export interface AdminSupportTicket {
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
  user: {
    id: string;
    code: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    district: string | null;
  };
  order: {
    id: string;
    code: string;
    status: OrderStatus;
    finalCost: string;
    totalQuantity: number;
    createdAt: Date;
  } | null;
}

export interface AdminTicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
}
