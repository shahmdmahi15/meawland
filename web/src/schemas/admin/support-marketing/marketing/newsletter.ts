import { z } from "zod";
import { NewsletterStatus } from "@/generated/prisma/enums";

export const adminAddSubscriberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
  status: z.enum(NewsletterStatus).default(NewsletterStatus.SUBSCRIBED),
  source: z.string().trim().default("MANUAL"),
});

export type AdminAddSubscriberInput = z.infer<typeof adminAddSubscriberSchema>;

export const adminBroadcastEmailSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(150, "Subject cannot exceed 150 characters"),
  previewText: z
    .string()
    .trim()
    .max(120, "Preview text cannot exceed 120 characters")
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, "Email body must be at least 10 characters")
    .max(5000, "Email body cannot exceed 5000 characters"),
  targetAudience: z
    .enum(["ALL_SUBSCRIBED", "TEST_ONLY"])
    .default("ALL_SUBSCRIBED"),
  testEmail: z.string().email().optional().or(z.literal("")),
});

export type AdminBroadcastEmailInput = z.infer<
  typeof adminBroadcastEmailSchema
>;

export interface AdminNewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminNewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedCount: number;
  newThisMonthCount: number;
}
