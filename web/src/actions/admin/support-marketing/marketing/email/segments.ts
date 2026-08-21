"use server";

import db from "@/lib/db";
import { EmailAudienceFilter } from "./types";
import {
  OrderStatus,
  Category,
  NewsletterStatus,
} from "@/generated/prisma/enums";

export interface EmailRecipientInfo {
  email: string;
  name: string;
  userId?: string | null;
  district?: string | null;
}

/**
 * Resolves a dynamic audience filter into a deduplicated list of email recipients.
 */
export async function resolveEmailAudienceRecipients(
  filters: EmailAudienceFilter,
): Promise<EmailRecipientInfo[]> {
  const recipientMap = new Map<string, EmailRecipientInfo>();

  const addRecipient = (info: EmailRecipientInfo) => {
    const cleanEmail = info.email.toLowerCase().trim();
    if (
      cleanEmail &&
      cleanEmail.includes("@") &&
      !recipientMap.has(cleanEmail)
    ) {
      recipientMap.set(cleanEmail, {
        ...info,
        email: cleanEmail,
      });
    }
  };

  switch (filters.targetType) {
    case "CUSTOM_EMAILS": {
      if (filters.customEmails) {
        const rawList = filters.customEmails
          .split(/[\n,;]+/)
          .map((e) => e.trim())
          .filter(Boolean);

        for (const email of rawList) {
          if (email.includes("@")) {
            addRecipient({
              email,
              name: "Customer",
            });
          }
        }
      }
      break;
    }

    case "NEWSLETTER_SUBSCRIBERS": {
      const subscribers = await db.newsletterSubscriber.findMany({
        where: { status: NewsletterStatus.SUBSCRIBED },
        select: { email: true },
      });
      for (const sub of subscribers) {
        addRecipient({
          email: sub.email,
          name: "VIP Member",
        });
      }
      break;
    }

    case "ALL_CUSTOMERS": {
      // 1. From User table
      const users = await db.user.findMany({
        select: { id: true, name: true, email: true, district: true },
      });
      for (const u of users) {
        addRecipient({
          email: u.email,
          name: u.name || "Customer",
          userId: u.id,
          district: u.district,
        });
      }

      // 2. From Order table (guest checkouts)
      const orders = await db.order.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          district: true,
          userId: true,
        },
      });
      for (const o of orders) {
        addRecipient({
          email: o.email,
          name: o.name || "Customer",
          userId: o.userId,
          district: o.district,
        });
      }

      // 3. From Newsletter table
      const subs = await db.newsletterSubscriber.findMany({
        where: { status: NewsletterStatus.SUBSCRIBED },
        select: { email: true },
      });
      for (const s of subs) {
        addRecipient({
          email: s.email,
          name: "VIP Member",
        });
      }
      break;
    }

    case "VIP_SPENDERS": {
      const threshold = filters.minSpend || 5000;
      const orders = await db.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        select: {
          email: true,
          name: true,
          finalCost: true,
          userId: true,
          district: true,
        },
      });

      const spendMap = new Map<
        string,
        {
          totalSpend: number;
          name: string;
          userId?: string | null;
          district?: string | null;
        }
      >();
      for (const o of orders) {
        const cost = parseFloat(o.finalCost) || 0;
        const key = o.email.toLowerCase().trim();
        const current = spendMap.get(key) || {
          totalSpend: 0,
          name: o.name,
          userId: o.userId,
          district: o.district,
        };
        current.totalSpend += cost;
        spendMap.set(key, current);
      }

      for (const [email, data] of spendMap.entries()) {
        if (data.totalSpend >= threshold) {
          addRecipient({
            email,
            name: data.name,
            userId: data.userId,
            district: data.district,
          });
        }
      }
      break;
    }

    case "REPEAT_BUYERS": {
      const minOrders = filters.minOrders || 2;
      const orders = await db.order.findMany({
        where: { status: { not: OrderStatus.CANCELLED } },
        select: { email: true, name: true, userId: true, district: true },
      });

      const countMap = new Map<
        string,
        {
          count: number;
          name: string;
          userId?: string | null;
          district?: string | null;
        }
      >();
      for (const o of orders) {
        const key = o.email.toLowerCase().trim();
        const current = countMap.get(key) || {
          count: 0,
          name: o.name,
          userId: o.userId,
          district: o.district,
        };
        current.count += 1;
        countMap.set(key, current);
      }

      for (const [email, data] of countMap.entries()) {
        if (data.count >= minOrders) {
          addRecipient({
            email,
            name: data.name,
            userId: data.userId,
            district: data.district,
          });
        }
      }
      break;
    }

    case "INACTIVE_CUSTOMERS": {
      const days = filters.inactiveDays || 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const allUsers = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          district: true,
          orders: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      });

      for (const u of allUsers) {
        const lastOrder = u.orders[0];
        if (!lastOrder || new Date(lastOrder.createdAt) < cutoffDate) {
          addRecipient({
            email: u.email,
            name: u.name,
            userId: u.id,
            district: u.district,
          });
        }
      }
      break;
    }

    case "DISTRICT_TARGET": {
      const targetDistrict = filters.district || "Dhaka";
      const orders = await db.order.findMany({
        where: {
          district: {
            contains: targetDistrict,
            mode: "insensitive",
          },
        },
        select: { email: true, name: true, userId: true, district: true },
      });

      for (const o of orders) {
        addRecipient({
          email: o.email,
          name: o.name,
          userId: o.userId,
          district: o.district,
        });
      }

      const users = await db.user.findMany({
        where: {
          district: {
            contains: targetDistrict,
            mode: "insensitive",
          },
        },
        select: { id: true, name: true, email: true, district: true },
      });

      for (const u of users) {
        addRecipient({
          email: u.email,
          name: u.name,
          userId: u.id,
          district: u.district,
        });
      }
      break;
    }

    case "PRODUCT_CATEGORY_BUYERS": {
      if (filters.category) {
        const cat = filters.category as Category;
        const items = await db.orderItem.findMany({
          where: {
            product: { category: cat },
            order: { status: { not: OrderStatus.CANCELLED } },
          },
          include: {
            order: {
              select: { email: true, name: true, userId: true, district: true },
            },
          },
        });

        for (const itm of items) {
          if (itm.order?.email) {
            addRecipient({
              email: itm.order.email,
              name: itm.order.name,
              userId: itm.order.userId,
              district: itm.order.district,
            });
          }
        }
      }
      break;
    }

    case "BRAND_BUYERS": {
      if (filters.brandId) {
        const items = await db.orderItem.findMany({
          where: {
            product: { brandId: filters.brandId },
            order: { status: { not: OrderStatus.CANCELLED } },
          },
          include: {
            order: {
              select: { email: true, name: true, userId: true, district: true },
            },
          },
        });

        for (const itm of items) {
          if (itm.order?.email) {
            addRecipient({
              email: itm.order.email,
              name: itm.order.name,
              userId: itm.order.userId,
              district: itm.order.district,
            });
          }
        }
      }
      break;
    }

    case "CART_ABANDONERS": {
      const activeCarts = await db.cart.findMany({
        where: {
          items: { some: {} },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, district: true },
          },
        },
      });

      for (const c of activeCarts) {
        if (c.user?.email) {
          addRecipient({
            email: c.user.email,
            name: c.user.name,
            userId: c.user.id,
            district: c.user.district,
          });
        }
      }
      break;
    }
  }

  return Array.from(recipientMap.values());
}

/**
 * Server action to calculate audience reach in real-time
 */
export async function calculateEmailAudienceCountAction(
  filters: EmailAudienceFilter,
): Promise<{
  success: boolean;
  count: number;
  sampleRecipients?: Array<{
    maskedEmail: string;
    name: string;
    district?: string | null;
  }>;
}> {
  try {
    const recipients = await resolveEmailAudienceRecipients(filters);
    const sample = recipients.slice(0, 5).map((r) => {
      const parts = r.email.split("@");
      const maskedName =
        parts[0].length > 3
          ? `${parts[0].slice(0, 2)}***${parts[0].slice(-1)}`
          : `${parts[0].slice(0, 1)}***`;
      return {
        maskedEmail: `${maskedName}@${parts[1]}`,
        name: r.name,
        district: r.district,
      };
    });

    return {
      success: true,
      count: recipients.length,
      sampleRecipients: sample,
    };
  } catch (error) {
    console.error("[Action.Email.CalculateAudience] Error:", error);
    return {
      success: false,
      count: 0,
      sampleRecipients: [],
    };
  }
}
