import * as z from "zod";
import {
  SmsCampaignType,
  SmsCampaignStatus,
  SmsDeliveryStatus,
  SmsTemplateCategory,
} from "@/generated/prisma/enums";

// ────────────────────────────────────────────────────────────────────────────────
// Audience Segmentation Filter Schema
// ────────────────────────────────────────────────────────────────────────────────

export const AudienceFilterSchema = z.object({
  targetType: z.enum([
    "ALL_CUSTOMERS",
    "VIP_SPENDERS",
    "REPEAT_BUYERS",
    "FIRST_TIME_BUYERS",
    "NEVER_ORDERED",
    "INACTIVE_USERS",
    "ABANDONED_CART",
    "DISTRICT_TARGET",
    "PRODUCT_CATEGORY_BUYERS",
    "BRAND_BUYERS",
    "SPECIFIC_PRODUCT_BUYERS",
    "CUSTOM_NUMBERS",
  ]),
  minSpend: z.number().optional(),
  minOrders: z.number().optional(),
  maxOrders: z.number().optional(),
  inactiveDays: z.number().optional(),
  district: z.string().optional(),
  category: z.string().optional(),
  brandId: z.string().optional(),
  productId: z.string().optional(),
  customNumbers: z.string().optional(), // Comma or newline separated
});

export type AudienceFilterInput = z.infer<typeof AudienceFilterSchema>;

// ────────────────────────────────────────────────────────────────────────────────
// Campaign Schemas
// ────────────────────────────────────────────────────────────────────────────────

export const CreateSmsCampaignSchema = z.object({
  title: z.string().min(2, "Campaign title must be at least 2 characters."),
  type: z.nativeEnum(SmsCampaignType).default(SmsCampaignType.TARGETED_SEGMENT),
  message: z.string().min(5, "Message must be at least 5 characters."),
  senderId: z.string().optional(),
  filters: AudienceFilterSchema,
  scheduleAt: z.string().optional().nullable(),
});

export type CreateSmsCampaignInput = z.infer<typeof CreateSmsCampaignSchema>;

export type AdminSmsCampaignSummary = {
  id: string;
  title: string;
  type: SmsCampaignType;
  status: SmsCampaignStatus;
  message: string;
  senderId: string | null;
  targetSegment: string | null;
  segmentFilters: AudienceFilterInput | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  estimatedCost: string | null;
  actualCost: string | null;
  scheduledAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ────────────────────────────────────────────────────────────────────────────────
// Template Schemas
// ────────────────────────────────────────────────────────────────────────────────

export const CreateSmsTemplateSchema = z.object({
  title: z.string().min(2, "Template title is required."),
  category: z
    .nativeEnum(SmsTemplateCategory)
    .default(SmsTemplateCategory.PROMOTIONAL),
  body: z.string().min(5, "Template content is required."),
  variables: z.array(z.string()).default([]),
});

export type CreateSmsTemplateInput = z.infer<typeof CreateSmsTemplateSchema>;

export type AdminSmsTemplateSummary = {
  id: string;
  title: string;
  category: SmsTemplateCategory;
  body: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// ────────────────────────────────────────────────────────────────────────────────
// Log Types
// ────────────────────────────────────────────────────────────────────────────────

export type AdminSmsLogSummary = {
  id: string;
  recipientPhone: string;
  recipientName: string | null;
  message: string;
  status: SmsDeliveryStatus;
  responseCode: number | null;
  statusMessage: string | null;
  campaignId: string | null;
  campaignTitle?: string | null;
  orderId: string | null;
  orderCode?: string | null;
  userId: string | null;
  userName?: string | null;
  createdAt: Date;
};

// ────────────────────────────────────────────────────────────────────────────────
// Automation Settings Schema
// ────────────────────────────────────────────────────────────────────────────────

export const UpdateSmsAutomationSettingsSchema = z.object({
  orderPlacedSms: z.boolean(),
  orderDispatchedSms: z.boolean(),
  orderDeliveredSms: z.boolean(),
  bkashPaymentPaidSms: z.boolean(),
  orderPlacedTemplate: z.string().optional().nullable(),
  orderDispatchedTemplate: z.string().optional().nullable(),
  orderDeliveredTemplate: z.string().optional().nullable(),
  bkashPaidTemplate: z.string().optional().nullable(),
});

export type UpdateSmsAutomationSettingsInput = z.infer<
  typeof UpdateSmsAutomationSettingsSchema
>;
