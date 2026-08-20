"use server";

import db from "@/lib/db";
import { SmsTemplateCategory } from "@/generated/prisma/enums";
import {
  CreateSmsTemplateSchema,
  type CreateSmsTemplateInput,
  type AdminSmsTemplateSummary,
} from "./types";
import { revalidatePath } from "next/cache";

const DEFAULT_ECOMMERCE_TEMPLATES = [
  {
    title: "Order Confirmation Notification",
    category: SmsTemplateCategory.ORDER_UPDATE,
    body: "Dear {name}, your Meawland order #{orderCode} of BDT {amount} is confirmed! We are packing your pet essentials. Track live: {trackingUrl}",
    variables: ["{name}", "{orderCode}", "{amount}", "{trackingUrl}"],
    isDefault: true,
  },
  {
    title: "Steadfast Courier Dispatch",
    category: SmsTemplateCategory.ORDER_UPDATE,
    body: "Great news {name}! Your Meawland order #{orderCode} has been handed over to Steadfast Courier! Tracking: {trackingCode}. Track: {trackingUrl}",
    variables: ["{name}", "{orderCode}", "{trackingCode}", "{trackingUrl}"],
    isDefault: true,
  },
  {
    title: "Order Delivered Celebration",
    category: SmsTemplateCategory.ORDER_UPDATE,
    body: "Dear {name}, your Meawland order #{orderCode} has arrived! Thank you for trusting us with your furry family. Contact us if you need any help!",
    variables: ["{name}", "{orderCode}"],
    isDefault: true,
  },
  {
    title: "Flash Sale & Special Discount",
    category: SmsTemplateCategory.PROMOTIONAL,
    body: "Hey {name}! 🐾 Flash Sale Alert at Meawland! Use code {couponCode} for special discount on all pet foods & accessories. Shop now: {storeUrl}",
    variables: ["{name}", "{couponCode}", "{storeUrl}"],
    isDefault: true,
  },
  {
    title: "Abandoned Cart Reminder",
    category: SmsTemplateCategory.CART_RECOVERY,
    body: "Hi {name}, you left some goodies in your Meawland cart! Complete your order today & treat your pet: {storeUrl}/checkout",
    variables: ["{name}", "{storeUrl}"],
    isDefault: true,
  },
  {
    title: "VIP Customer Appreciation",
    category: SmsTemplateCategory.PROMOTIONAL,
    body: "Dear {name}, as one of our most valued VIP pet parents, enjoy exclusive 15% OFF your next order with code VIPMEAW! Shop: {storeUrl}",
    variables: ["{name}", "{storeUrl}"],
    isDefault: true,
  },
  {
    title: "We Miss You / Inactive Winback",
    category: SmsTemplateCategory.SEASONAL,
    body: "Hey {name}, your pet misses their favorite treats! Restock top cat & dog foods today at Meawland with fast delivery across {district}: {storeUrl}",
    variables: ["{name}", "{district}", "{storeUrl}"],
    isDefault: true,
  },
];

/**
 * Retrieves all SMS message templates
 */
export async function getSmsTemplatesAction(): Promise<{
  success: boolean;
  templates: AdminSmsTemplateSummary[];
}> {
  try {
    let rawTemplates = await db.smsTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    // Auto seed default templates if empty
    if (rawTemplates.length === 0) {
      await db.smsTemplate.createMany({
        data: DEFAULT_ECOMMERCE_TEMPLATES,
      });

      rawTemplates = await db.smsTemplate.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
    }

    const templates: AdminSmsTemplateSummary[] = rawTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      body: t.body,
      variables: t.variables,
      isDefault: t.isDefault,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return {
      success: true,
      templates,
    };
  } catch (error) {
    console.error("[Action.SMS.GetTemplates] Error:", error);
    return {
      success: false,
      templates: [],
    };
  }
}

/**
 * Creates a new SMS message template
 */
export async function createSmsTemplateAction(
  input: CreateSmsTemplateInput,
): Promise<{
  success: boolean;
  message?: string;
  template?: AdminSmsTemplateSummary;
}> {
  try {
    const validated = CreateSmsTemplateSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        message: validated.error.issues[0]?.message || "Invalid template data.",
      };
    }

    const data = validated.data;

    // Detect variables automatically from body
    const variableMatches = data.body.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    const detectedVariables = Array.from(new Set(variableMatches));

    const template = await db.smsTemplate.create({
      data: {
        title: data.title.trim(),
        category: data.category,
        body: data.body.trim(),
        variables: detectedVariables,
      },
    });

    revalidatePath("/admin/support-marketing/marketing/sms");

    return {
      success: true,
      message: "Template created successfully.",
      template: {
        id: template.id,
        title: template.title,
        category: template.category,
        body: template.body,
        variables: template.variables,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    };
  } catch (error) {
    console.error("[Action.SMS.CreateTemplate] Error:", error);
    return {
      success: false,
      message: "Failed to create SMS template.",
    };
  }
}

/**
 * Deletes an SMS message template
 */
export async function deleteSmsTemplateAction(templateId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    await db.smsTemplate.delete({
      where: { id: templateId },
    });

    revalidatePath("/admin/support-marketing/marketing/sms");

    return {
      success: true,
      message: "Template deleted successfully.",
    };
  } catch (error) {
    console.error("[Action.SMS.DeleteTemplate] Error:", error);
    return {
      success: false,
      message: "Failed to delete template.",
    };
  }
}
