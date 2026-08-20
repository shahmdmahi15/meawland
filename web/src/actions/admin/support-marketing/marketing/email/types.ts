import {
  EmailCampaignType,
  EmailCampaignStatus,
  EmailDeliveryStatus,
  EmailTemplateCategory,
} from "@/generated/prisma/enums";

export interface EmailAudienceFilter {
  targetType:
    | "ALL_CUSTOMERS"
    | "VIP_SPENDERS"
    | "REPEAT_BUYERS"
    | "INACTIVE_CUSTOMERS"
    | "DISTRICT_TARGET"
    | "PRODUCT_CATEGORY_BUYERS"
    | "BRAND_BUYERS"
    | "CART_ABANDONERS"
    | "NEWSLETTER_SUBSCRIBERS"
    | "CUSTOM_EMAILS";
  minSpend?: number;
  minOrders?: number;
  inactiveDays?: number;
  district?: string;
  category?: string;
  brandId?: string;
  customEmails?: string;
}

export interface AdminEmailCampaignSummary {
  id: string;
  title: string;
  subject: string;
  previewText?: string | null;
  type: EmailCampaignType;
  status: EmailCampaignStatus;
  targetSegment: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface AdminEmailTemplateSummary {
  id: string;
  title: string;
  subject: string;
  previewText?: string | null;
  category: EmailTemplateCategory;
  htmlContent: string;
  textContent?: string | null;
  variables: string[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEmailLogSummary {
  id: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  status: EmailDeliveryStatus;
  messageId?: string | null;
  errorMessage?: string | null;
  campaignId?: string | null;
  campaignTitle?: string | null;
  orderId?: string | null;
  orderCode?: string | null;
  createdAt: string;
}
