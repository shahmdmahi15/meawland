"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64 } from "@/lib/storage";
import { Prisma } from "@/generated/prisma/client";
import {
  Role,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

export type AdminOrderSummaryItem = {
  id: string;
  name: string;
  sku: string | null;
  image: string;
  quantity: number;
  unitPrice: string;
  totalCost: string;
  discountCost: string;
  finalCost: string;
  status: OrderStatus;
  productId: string | null;
  variantId: string | null;
  comboProductId: string | null;
};

export type AdminOrder = {
  id: string;
  code: string;
  totalQuantity: number;
  totalPrice: string;
  totalCost: string;
  discountCost: string;
  finalCost: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  note: string | null;
  status: OrderStatus;
  type: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  userId: string | null;
  userCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: AdminOrderSummaryItem[];
};

export type OrderMetrics = {
  totalOrders: number;
  webOrdersCount: number;
  otherOrdersCount: number;
  pendingCount: number;
  inReviewCount: number;
  deliveredCount: number;
  cancelledCount: number;
  totalRevenue: number;
  totalOwnerCost: number;
  estimatedProfit: number;
  paidOrdersCount: number;
  pendingPaymentCount: number;
};

export type GetOrdersFilterParams = {
  type?: OrderType | "ALL";
  status?: OrderStatus | "ALL";
  paymentStatus?: PaymentStatus | "ALL";
  paymentMethod?: PaymentMethod | "ALL";
  search?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
};

export async function getOrdersAdminAction(
  params: GetOrdersFilterParams = {},
): Promise<{
  success: boolean;
  message?: string;
  orders?: AdminOrder[];
  metrics?: OrderMetrics;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. You do not have permission to view orders.",
      };
    }

    const {
      type = "ALL",
      status = "ALL",
      paymentStatus = "ALL",
      paymentMethod = "ALL",
      search = "",
      district = "",
      startDate,
      endDate,
    } = params;

    // Build Prisma query where clause
    const where: Prisma.OrderWhereInput = {};

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    if (paymentMethod && paymentMethod !== "ALL") {
      where.paymentMethod = paymentMethod;
    }

    if (district && district !== "ALL") {
      where.district = {
        contains: district,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // End of the selected day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
      ];
    }

    // Fetch orders with relations
    const rawOrders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                image: true,
              },
            },
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
            comboProduct: {
              select: {
                id: true,
                name: true,
                sku: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Compute Metrics across all orders in DB matching type scope
    const allMatchingScopeOrders = await db.order.findMany({
      where: type !== "ALL" ? { type } : undefined,
      select: {
        type: true,
        status: true,
        paymentStatus: true,
        finalCost: true,
        totalCost: true,
      },
    });

    let totalRevenue = 0;
    let totalOwnerCost = 0;
    let webOrdersCount = 0;
    let otherOrdersCount = 0;
    let pendingCount = 0;
    let inReviewCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let paidOrdersCount = 0;
    let pendingPaymentCount = 0;

    for (const o of allMatchingScopeOrders) {
      const finalCostNum = parseFloat(o.finalCost || "0") || 0;
      const ownerCostNum = parseFloat(o.totalCost || "0") || 0;

      if (
        o.status !== OrderStatus.CANCELLED &&
        o.status !== OrderStatus.RETURNED
      ) {
        totalRevenue += finalCostNum;
        totalOwnerCost += ownerCostNum;
      }

      if (o.type === OrderType.WEB) webOrdersCount++;
      if (o.type === OrderType.OTHER) otherOrdersCount++;

      if (o.status === OrderStatus.PENDING) pendingCount++;
      if (o.status === OrderStatus.IN_REVIEW) inReviewCount++;
      if (o.status === OrderStatus.DELIVERED) deliveredCount++;
      if (o.status === OrderStatus.CANCELLED) cancelledCount++;

      if (o.paymentStatus === PaymentStatus.PAID) paidOrdersCount++;
      if (o.paymentStatus === PaymentStatus.PENDING) pendingPaymentCount++;
    }

    const estimatedProfit = Math.max(0, totalRevenue - totalOwnerCost);

    const metrics: OrderMetrics = {
      totalOrders: allMatchingScopeOrders.length,
      webOrdersCount,
      otherOrdersCount,
      pendingCount,
      inReviewCount,
      deliveredCount,
      cancelledCount,
      totalRevenue,
      totalOwnerCost,
      estimatedProfit,
      paidOrdersCount,
      pendingPaymentCount,
    };

    // Format formatted orders list
    const orders: AdminOrder[] = await Promise.all(
      rawOrders.map(async (o) => {
        const items: AdminOrderSummaryItem[] = await Promise.all(
          o.orderItems.map(async (oi) => {
            let name = "Order Item";
            let sku: string | null = null;
            let imageKey: string | null = null;

            if (oi.variant) {
              name = `${oi.variant.product.name} (${oi.variant.sku})`;
              sku = oi.variant.sku;
              imageKey = oi.variant.image || oi.variant.product.image;
            } else if (oi.product) {
              name = oi.product.name;
              sku = oi.product.sku;
              imageKey = oi.product.image;
            } else if (oi.comboProduct) {
              name = oi.comboProduct.name;
              sku = oi.comboProduct.sku;
              imageKey = oi.comboProduct.image;
            }

            const image = await safeGetImageBase64(imageKey);

            return {
              id: oi.id,
              name,
              sku,
              image,
              quantity: oi.quanitity,
              unitPrice: oi.unitPrice,
              totalCost: oi.totalCost,
              discountCost: oi.discountCost,
              finalCost: oi.finalCost,
              status: oi.status,
              productId: oi.productId,
              variantId: oi.variantId,
              comboProductId: oi.comboProductId,
            };
          }),
        );

        return {
          id: o.id,
          code: o.code,
          totalQuantity: o.totalQuantity,
          totalPrice: o.totalPrice,
          totalCost: o.totalCost,
          discountCost: o.discountCost,
          finalCost: o.finalCost,
          name: o.name,
          email: o.email,
          phone: o.phone,
          address: o.address,
          district: o.district,
          note: o.note,
          status: o.status,
          type: o.type,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          userId: o.userId,
          userCode: o.user?.code || null,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          items,
        };
      }),
    );

    return {
      success: true,
      orders,
      metrics,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Orders.GetOrders] Error:", error);
    return {
      success: false,
      message: "Failed to retrieve orders list.",
    };
  }
}
