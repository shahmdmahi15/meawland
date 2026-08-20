"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export interface CustomerDashboardData {
  user: {
    id: string;
    code: string;
    name: string;
    email: string;
    phone: string | null;
    district: string | null;
    address: string | null;
    avatar: string | null;
    createdAt: string;
  };
  stats: {
    totalOrders: number;
    inProgressOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    wishlistCount: number;
    openTicketsCount: number;
  };
  activeOrder: {
    id: string;
    code: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    finalCost: number;
    totalQuantity: number;
    trackingCode?: string | null;
    courierName?: string | null;
    district: string;
    address: string;
    createdAt: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  } | null;
  recentOrders: Array<{
    id: string;
    code: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: string;
    finalCost: number;
    totalQuantity: number;
    createdAt: string;
    itemPreviewNames: string[];
  }>;
  supportTickets: Array<{
    id: string;
    code: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
}

export async function getAccountDashboardDataAction(): Promise<{
  success: boolean;
  message?: string;
  data?: CustomerDashboardData;
}> {
  try {
    const session = await getMeAction();
    if (!session) {
      return { success: false, message: "Unauthorized. Please sign in." };
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            shipment: {
              select: {
                trackingCode: true,
                provider: true,
                status: true,
              },
            },
            orderItems: {
              select: {
                finalCost: true,
                quanitity: true,
                product: { select: { name: true } },
                variant: {
                  select: {
                    sku: true,
                    product: { select: { name: true } },
                  },
                },
                comboProduct: { select: { name: true } },
              },
            },
          },
        },
        wishlist: {
          select: {
            products: {
              select: { id: true },
            },
          },
        },
        supportTickets: {
          orderBy: { createdAt: "desc" },
          take: 3,
        },
      },
    });

    if (!user) {
      return { success: false, message: "User profile not found." };
    }

    let totalSpent = 0;
    let inProgressOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    for (const ord of user.orders) {
      const isDelivered = ord.status === OrderStatus.DELIVERED;
      const isCancelled =
        ord.status === OrderStatus.CANCELLED || ord.status === OrderStatus.RETURNED;

      if (!isCancelled) {
        totalSpent += parseFloat(ord.finalCost) || 0;
      }

      if (isDelivered) {
        deliveredOrders++;
      } else if (isCancelled) {
        cancelledOrders++;
      } else {
        inProgressOrders++;
      }
    }

    // Identify active order in progress
    const activeOrderRaw = user.orders.find(
      (o) =>
        o.status !== OrderStatus.DELIVERED &&
        o.status !== OrderStatus.CANCELLED &&
        o.status !== OrderStatus.RETURNED,
    );

    let activeOrder: CustomerDashboardData["activeOrder"] = null;
    if (activeOrderRaw) {
      activeOrder = {
        id: activeOrderRaw.id,
        code: activeOrderRaw.code,
        status: activeOrderRaw.status,
        paymentStatus: activeOrderRaw.paymentStatus,
        paymentMethod: activeOrderRaw.paymentMethod,
        finalCost: parseFloat(activeOrderRaw.finalCost) || 0,
        totalQuantity: activeOrderRaw.totalQuantity,
        trackingCode: activeOrderRaw.shipment?.trackingCode || null,
        courierName: activeOrderRaw.shipment?.provider || "Steadfast Courier",
        district: activeOrderRaw.district,
        address: activeOrderRaw.address,
        createdAt: activeOrderRaw.createdAt.toISOString(),
        items: activeOrderRaw.orderItems.map((oi) => {
          let name = "Pet Supply";
          if (oi.variant) {
            name = `${oi.variant.product.name} (${oi.variant.sku})`;
          } else if (oi.product) {
            name = oi.product.name;
          } else if (oi.comboProduct) {
            name = oi.comboProduct.name;
          }
          return {
            name,
            quantity: oi.quanitity,
            price: parseFloat(oi.finalCost) || 0,
          };
        }),
      };
    }

    // Recent orders (up to 4)
    const recentOrders: CustomerDashboardData["recentOrders"] = user.orders
      .slice(0, 4)
      .map((ord) => {
        const itemPreviewNames = ord.orderItems.map((oi) => {
          if (oi.variant) return oi.variant.product.name;
          if (oi.product) return oi.product.name;
          if (oi.comboProduct) return oi.comboProduct.name;
          return "Pet Item";
        });

        return {
          id: ord.id,
          code: ord.code,
          status: ord.status,
          paymentStatus: ord.paymentStatus,
          paymentMethod: ord.paymentMethod,
          finalCost: parseFloat(ord.finalCost) || 0,
          totalQuantity: ord.totalQuantity,
          createdAt: ord.createdAt.toISOString(),
          itemPreviewNames,
        };
      });

    const openTicketsCount = user.supportTickets.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
    ).length;

    const data: CustomerDashboardData = {
      user: {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        phone: user.phone,
        district: user.district,
        address: user.address,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
      },
      stats: {
        totalOrders: user.orders.length,
        inProgressOrders,
        deliveredOrders,
        cancelledOrders,
        totalSpent: Math.round(totalSpent),
        wishlistCount: user.wishlist?.products?.length || 0,
        openTicketsCount,
      },
      activeOrder,
      recentOrders,
      supportTickets: user.supportTickets.map((t) => ({
        id: t.id,
        code: t.code,
        subject: t.subject,
        category: t.category,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
      })),
    };

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("[Action.Root.Account.GetDashboard] Error:", error);
    return { success: false, message: "Failed to load account dashboard." };
  }
}
