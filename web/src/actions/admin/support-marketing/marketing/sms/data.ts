"use server";

import db from "@/lib/db";
import { getSmsBalanceAction } from "@/actions/sms/get-balance";
import { getSmsCampaignsAction } from "./campaigns";
import { getSmsTemplatesAction } from "./templates";
import { getSmsLogsAction } from "./logs";
import { getSmsAutomationSettingsAction } from "./automations";
import { Category } from "@/generated/prisma/enums";
import type {
  AdminSmsCampaignSummary,
  AdminSmsTemplateSummary,
  AdminSmsLogSummary,
} from "./types";
import type { SmsAutomationSettingsSummary } from "./automations";

export type SmsMarketingPageData = {
  balance: number;
  campaigns: AdminSmsCampaignSummary[];
  templates: AdminSmsTemplateSummary[];
  logs: AdminSmsLogSummary[];
  totalLogs: number;
  automationSettings: SmsAutomationSettingsSummary;
  categories: Array<{ label: string; value: string }>;
  brands: Array<{ id: string; name: string }>;
  districts: string[];
};

/**
 * Server action that gathers all initial data required for the SMS Marketing Hub
 */
export async function getSmsMarketingPageDataAction(): Promise<{
  success: boolean;
  data: SmsMarketingPageData;
}> {
  try {
    const [
      balanceRes,
      campaignsRes,
      templatesRes,
      logsRes,
      automationsRes,
      brands,
      districtsRaw,
    ] = await Promise.all([
      getSmsBalanceAction(),
      getSmsCampaignsAction({ page: 1, pageSize: 20 }),
      getSmsTemplatesAction(),
      getSmsLogsAction({ page: 1, pageSize: 30 }),
      getSmsAutomationSettingsAction(),
      db.brand.findMany({ select: { id: true, name: true } }),
      db.order.findMany({
        where: { district: { not: "" } },
        select: { district: true },
        distinct: ["district"],
      }),
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

    const defaultAutomationSettings: SmsAutomationSettingsSummary = {
      id: "default",
      orderPlacedSms: true,
      orderDispatchedSms: true,
      orderDeliveredSms: true,
      bkashPaymentPaidSms: true,
      orderPlacedTemplate:
        "Dear {name}, your Meawland order #{orderCode} (BDT {amount}) is confirmed! Track live: {trackingUrl}",
      orderDispatchedTemplate:
        "Your Meawland order #{orderCode} is on the way via Steadfast Courier! Tracking: {trackingCode}. Track: {trackingUrl}",
      orderDeliveredTemplate:
        "Dear {name}, your Meawland order #{orderCode} has been delivered! Thank you for choosing Meawland.",
      bkashPaidTemplate:
        "bKash Payment Verified! 🐾 Order #{orderCode} of BDT {amount} (TrxID: {trxID}) has been received successfully. Thank you!",
    };

    return {
      success: true,
      data: {
        balance: balanceRes.balance ?? 198.95,
        campaigns: campaignsRes.campaigns || [],
        templates: templatesRes.templates || [],
        logs: logsRes.logs || [],
        totalLogs: logsRes.total || 0,
        automationSettings: automationsRes.settings || defaultAutomationSettings,
        categories,
        brands,
        districts,
      },
    };
  } catch (error) {
    console.error("[Action.SMS.GetPageData] Error:", error);
    return {
      success: false,
      data: {
        balance: 198.95,
        campaigns: [],
        templates: [],
        logs: [],
        totalLogs: 0,
        automationSettings: {
          id: "default",
          orderPlacedSms: true,
          orderDispatchedSms: true,
          orderDeliveredSms: true,
          bkashPaymentPaidSms: true,
          orderPlacedTemplate: null,
          orderDispatchedTemplate: null,
          orderDeliveredTemplate: null,
          bkashPaidTemplate: null,
        },
        categories: [],
        brands: [],
        districts: ["Dhaka", "Chattogram", "Rajshahi", "Khulna"],
      },
    };
  }
}
