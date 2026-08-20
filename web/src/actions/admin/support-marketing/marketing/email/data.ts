"use server";

import db from "@/lib/db";
import { getEmailCampaignsAction } from "./campaigns";
import { getEmailTemplatesAction } from "./templates";
import { getEmailLogsAction } from "./logs";
import { getEmailAutomationSettingsAction } from "./automations";
import { Category, NewsletterStatus, EmailDeliveryStatus } from "@/generated/prisma/enums";
import type {
  AdminEmailCampaignSummary,
  AdminEmailTemplateSummary,
  AdminEmailLogSummary,
} from "./types";
import type { EmailAutomationSettingsSummary } from "./automations";

export type EmailMarketingPageData = {
  campaigns: AdminEmailCampaignSummary[];
  templates: AdminEmailTemplateSummary[];
  logs: AdminEmailLogSummary[];
  totalLogs: number;
  totalSubscribers: number;
  totalDelivered: number;
  deliveryRatePct: number;
  automationSettings: EmailAutomationSettingsSummary;
  categories: Array<{ label: string; value: string }>;
  brands: Array<{ id: string; name: string }>;
  districts: string[];
};

/**
 * Server action that gathers all initial data required for the Email Marketing & Automation Hub
 */
export async function getEmailMarketingPageDataAction(): Promise<{
  success: boolean;
  data: EmailMarketingPageData;
}> {
  try {
    const [
      campaignsRes,
      templatesRes,
      logsRes,
      automationsRes,
      brands,
      districtsRaw,
      totalSubscribers,
      totalDelivered,
      totalLogsCount,
    ] = await Promise.all([
      getEmailCampaignsAction({ page: 1, pageSize: 20 }),
      getEmailTemplatesAction(),
      getEmailLogsAction({ page: 1, pageSize: 30 }),
      getEmailAutomationSettingsAction(),
      db.brand.findMany({ select: { id: true, name: true } }),
      db.order.findMany({
        where: { district: { not: "" } },
        select: { district: true },
        distinct: ["district"],
      }),
      db.newsletterSubscriber.count({
        where: { status: NewsletterStatus.SUBSCRIBED },
      }),
      db.emailLog.count({
        where: { status: EmailDeliveryStatus.SENT },
      }),
      db.emailLog.count(),
    ]);

    const categories = Object.values(Category).map((c) => ({
      label: c.replace(/_/g, " "),
      value: c,
    }));

    const districts = Array.from(
      new Set([
        "Dhaka",
        "Chattogram",
        "Rajshahi",
        "Khulna",
        "Barishal",
        "Sylhet",
        "Rangpur",
        "Mymensingh",
        "Narail",
        "Gazipur",
        "Narayanganj",
        "Cumilla",
        "Bogura",
        "Jessore",
        ...districtsRaw.map((d) => d.district).filter(Boolean),
      ]),
    );

    const defaultAutomationSettings: EmailAutomationSettingsSummary = {
      id: "default",
      orderPlacedEmail: true,
      orderDispatchedEmail: true,
      orderDeliveredEmail: true,
      bkashPaymentPaidEmail: true,
      welcomeNewUserEmail: true,
      abandonedCartEmail: false,
      orderPlacedSubject: "Order Confirmed #{orderCode} | Meawland 🐾",
      orderDispatchedSubject: "Your Order #{orderCode} is on the way! 🚚 | Meawland",
      orderDeliveredSubject: "Delivered! Order #{orderCode} | Meawland 🐾",
      bkashPaidSubject: "bKash Payment Verified for Order #{orderCode} 💳 | Meawland",
      welcomeUserSubject: "Welcome to Meawland! 🐾 Enjoy 10% OFF Your First Pet Order",
    };

    const deliveryRatePct =
      totalLogsCount > 0
        ? Math.round((totalDelivered / totalLogsCount) * 100)
        : 100;

    return {
      success: true,
      data: {
        campaigns: campaignsRes.campaigns || [],
        templates: templatesRes.templates || [],
        logs: logsRes.logs || [],
        totalLogs: logsRes.total || 0,
        totalSubscribers,
        totalDelivered,
        deliveryRatePct,
        automationSettings: automationsRes.settings || defaultAutomationSettings,
        categories,
        brands,
        districts,
      },
    };
  } catch (error) {
    console.error("[Action.Email.GetPageData] Error:", error);
    return {
      success: false,
      data: {
        campaigns: [],
        templates: [],
        logs: [],
        totalLogs: 0,
        totalSubscribers: 0,
        totalDelivered: 0,
        deliveryRatePct: 100,
        automationSettings: {
          id: "default",
          orderPlacedEmail: true,
          orderDispatchedEmail: true,
          orderDeliveredEmail: true,
          bkashPaymentPaidEmail: true,
          welcomeNewUserEmail: true,
          abandonedCartEmail: false,
          orderPlacedSubject: null,
          orderDispatchedSubject: null,
          orderDeliveredSubject: null,
          bkashPaidSubject: null,
          welcomeUserSubject: null,
        },
        categories: [],
        brands: [],
        districts: ["Dhaka", "Chattogram", "Rajshahi", "Khulna"],
      },
    };
  }
}
