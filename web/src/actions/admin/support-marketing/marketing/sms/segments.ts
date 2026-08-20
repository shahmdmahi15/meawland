"use server";

import db from "@/lib/db";
import {
  AudienceFilterSchema,
  type AudienceFilterInput,
} from "./types";
import { sanitizeBangladeshiPhoneNumber } from "@/actions/sms/client";
import { Category, OrderStatus } from "@/generated/prisma/enums";

export type ResolvedRecipient = {
  phone: string;
  name: string;
  userId?: string | null;
  orderId?: string | null;
  district?: string | null;
  totalOrders?: number;
  totalSpent?: number;
};

/**
 * Resolves recipients based on targeting criteria
 */
export async function resolveAudienceRecipients(
  filters: AudienceFilterInput,
): Promise<ResolvedRecipient[]> {
  const parsed = AudienceFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return [];
  }

  const f = parsed.data;
  const recipientMap = new Map<string, ResolvedRecipient>();

  const addRecipient = (item: ResolvedRecipient) => {
    const sanitized = sanitizeBangladeshiPhoneNumber(item.phone);
    if (!sanitized) return;

    if (!recipientMap.has(sanitized)) {
      recipientMap.set(sanitized, {
        ...item,
        phone: sanitized,
      });
    }
  };

  switch (f.targetType) {
    case "CUSTOM_NUMBERS": {
      if (f.customNumbers) {
        const rawList = f.customNumbers
          .split(/[\n,;]+/)
          .map((n) => n.trim())
          .filter(Boolean);

        for (const num of rawList) {
          const s = sanitizeBangladeshiPhoneNumber(num);
          if (s) {
            addRecipient({
              phone: s,
              name: "Customer",
            });
          }
        }
      }
      break;
    }

    case "ALL_CUSTOMERS": {
      // 1. From User table
      const users = await db.user.findMany({
        where: { phone: { not: null } },
        select: { id: true, name: true, phone: true, district: true },
      });
      for (const u of users) {
        if (u.phone) {
          addRecipient({
            phone: u.phone,
            name: u.name || "Customer",
            userId: u.id,
            district: u.district,
          });
        }
      }

      // 2. From Order table (guest orders with phone)
      const orders = await db.order.findMany({
        select: {
          id: true,
          name: true,
          phone: true,
          district: true,
          userId: true,
        },
      });
      for (const o of orders) {
        if (o.phone) {
          addRecipient({
            phone: o.phone,
            name: o.name || "Customer",
            userId: o.userId,
            orderId: o.id,
            district: o.district,
          });
        }
      }
      break;
    }

    case "VIP_SPENDERS": {
      const minSpend = f.minSpend || 5000;
      const orders = await db.order.findMany({
        where: {
          status: { notIn: [OrderStatus.CANCELLED] },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          district: true,
          finalCost: true,
          userId: true,
        },
      });

      const userTotals = new Map<
        string,
        { name: string; district: string | null; total: number; userId?: string | null; orderId?: string }
      >();

      for (const o of orders) {
        if (!o.phone) continue;
        const sanitized = sanitizeBangladeshiPhoneNumber(o.phone);
        if (!sanitized) continue;

        const current = userTotals.get(sanitized) || {
          name: o.name,
          district: o.district,
          total: 0,
          userId: o.userId,
          orderId: o.id,
        };
        current.total += parseFloat(o.finalCost || "0");
        userTotals.set(sanitized, current);
      }

      for (const [phone, data] of userTotals.entries()) {
        if (data.total >= minSpend) {
          addRecipient({
            phone,
            name: data.name || "VIP Customer",
            district: data.district,
            userId: data.userId,
            orderId: data.orderId,
            totalSpent: data.total,
          });
        }
      }
      break;
    }

    case "REPEAT_BUYERS": {
      const minOrders = f.minOrders || 2;
      const orders = await db.order.findMany({
        where: {
          status: { notIn: [OrderStatus.CANCELLED] },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          district: true,
          userId: true,
        },
      });

      const counts = new Map<
        string,
        { count: number; name: string; district: string | null; userId?: string | null; orderId?: string }
      >();

      for (const o of orders) {
        if (!o.phone) continue;
        const sanitized = sanitizeBangladeshiPhoneNumber(o.phone);
        if (!sanitized) continue;

        const cur = counts.get(sanitized) || {
          count: 0,
          name: o.name,
          district: o.district,
          userId: o.userId,
          orderId: o.id,
        };
        cur.count++;
        counts.set(sanitized, cur);
      }

      for (const [phone, data] of counts.entries()) {
        if (data.count >= minOrders) {
          addRecipient({
            phone,
            name: data.name || "Valued Customer",
            district: data.district,
            userId: data.userId,
            orderId: data.orderId,
            totalOrders: data.count,
          });
        }
      }
      break;
    }

    case "FIRST_TIME_BUYERS": {
      const orders = await db.order.findMany({
        where: {
          status: { notIn: [OrderStatus.CANCELLED] },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          district: true,
          userId: true,
        },
      });

      const counts = new Map<
        string,
        { count: number; name: string; district: string | null; userId?: string | null; orderId?: string }
      >();

      for (const o of orders) {
        if (!o.phone) continue;
        const sanitized = sanitizeBangladeshiPhoneNumber(o.phone);
        if (!sanitized) continue;

        const cur = counts.get(sanitized) || {
          count: 0,
          name: o.name,
          district: o.district,
          userId: o.userId,
          orderId: o.id,
        };
        cur.count++;
        counts.set(sanitized, cur);
      }

      for (const [phone, data] of counts.entries()) {
        if (data.count === 1) {
          addRecipient({
            phone,
            name: data.name || "Customer",
            district: data.district,
            userId: data.userId,
            orderId: data.orderId,
            totalOrders: 1,
          });
        }
      }
      break;
    }

    case "NEVER_ORDERED": {
      const users = await db.user.findMany({
        where: {
          phone: { not: null },
          orders: { none: {} },
        },
        select: { id: true, name: true, phone: true, district: true },
      });

      for (const u of users) {
        if (u.phone) {
          addRecipient({
            phone: u.phone,
            name: u.name || "Member",
            userId: u.id,
            district: u.district,
            totalOrders: 0,
          });
        }
      }
      break;
    }

    case "INACTIVE_USERS": {
      const days = f.inactiveDays || 60;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Find users with orders before cutoff, but no orders after cutoff
      const users = await db.user.findMany({
        where: {
          phone: { not: null },
          orders: {
            some: { createdAt: { lt: cutoffDate } },
            none: { createdAt: { gte: cutoffDate } },
          },
        },
        select: { id: true, name: true, phone: true, district: true },
      });

      for (const u of users) {
        if (u.phone) {
          addRecipient({
            phone: u.phone,
            name: u.name || "Customer",
            userId: u.id,
            district: u.district,
          });
        }
      }
      break;
    }

    case "ABANDONED_CART": {
      const carts = await db.cart.findMany({
        where: {
          userId: { not: null },
          cartItems: { some: {} },
          user: { phone: { not: null } },
        },
        include: {
          user: {
            select: { id: true, name: true, phone: true, district: true },
          },
        },
      });

      for (const c of carts) {
        if (c.user?.phone) {
          addRecipient({
            phone: c.user.phone,
            name: c.user.name || "Customer",
            userId: c.user.id,
            district: c.user.district,
          });
        }
      }
      break;
    }

    case "DISTRICT_TARGET": {
      if (f.district) {
        const d = f.district.trim().toLowerCase();
        // 1. From Users
        const users = await db.user.findMany({
          where: {
            phone: { not: null },
            district: { contains: d, mode: "insensitive" },
          },
          select: { id: true, name: true, phone: true, district: true },
        });
        for (const u of users) {
          if (u.phone) {
            addRecipient({
              phone: u.phone,
              name: u.name || "Customer",
              userId: u.id,
              district: u.district,
            });
          }
        }

        // 2. From Orders
        const orders = await db.order.findMany({
          where: {
            district: { contains: d, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            district: true,
            userId: true,
          },
        });
        for (const o of orders) {
          if (o.phone) {
            addRecipient({
              phone: o.phone,
              name: o.name || "Customer",
              userId: o.userId,
              orderId: o.id,
              district: o.district,
            });
          }
        }
      }
      break;
    }

    case "PRODUCT_CATEGORY_BUYERS": {
      if (f.category) {
        const cat = f.category as Category;
        const orders = await db.order.findMany({
          where: {
            orderItems: {
              some: {
                product: { category: cat },
              },
            },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            district: true,
            userId: true,
          },
        });

        for (const o of orders) {
          if (o.phone) {
            addRecipient({
              phone: o.phone,
              name: o.name || "Customer",
              userId: o.userId,
              orderId: o.id,
              district: o.district,
            });
          }
        }
      }
      break;
    }

    case "BRAND_BUYERS": {
      if (f.brandId) {
        const orders = await db.order.findMany({
          where: {
            orderItems: {
              some: {
                product: { brandId: f.brandId },
              },
            },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            district: true,
            userId: true,
          },
        });

        for (const o of orders) {
          if (o.phone) {
            addRecipient({
              phone: o.phone,
              name: o.name || "Customer",
              userId: o.userId,
              orderId: o.id,
              district: o.district,
            });
          }
        }
      }
      break;
    }

    case "SPECIFIC_PRODUCT_BUYERS": {
      if (f.productId) {
        const orders = await db.order.findMany({
          where: {
            orderItems: {
              some: {
                productId: f.productId,
              },
            },
          },
          select: {
            id: true,
            name: true,
            phone: true,
            district: true,
            userId: true,
          },
        });

        for (const o of orders) {
          if (o.phone) {
            addRecipient({
              phone: o.phone,
              name: o.name || "Customer",
              userId: o.userId,
              orderId: o.id,
              district: o.district,
            });
          }
        }
      }
      break;
    }
  }

  return Array.from(recipientMap.values());
}

/**
 * Server action to calculate audience count and preview items in real time
 */
export async function calculateAudienceCountAction(
  filters: AudienceFilterInput,
): Promise<{
  success: boolean;
  count: number;
  sampleRecipients?: Array<{
    maskedPhone: string;
    name: string;
    district?: string | null;
  }>;
}> {
  try {
    const recipients = await resolveAudienceRecipients(filters);

    const sampleRecipients = recipients.slice(0, 5).map((r) => ({
      maskedPhone: `${r.phone.slice(0, 5)}****${r.phone.slice(-3)}`,
      name: r.name,
      district: r.district,
    }));

    return {
      success: true,
      count: recipients.length,
      sampleRecipients,
    };
  } catch (error) {
    console.error("[Action.SMS.CalculateAudienceCount] Error:", error);
    return {
      success: false,
      count: 0,
    };
  }
}
