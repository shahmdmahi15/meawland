"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getPublicUrl } from "@/lib/storage";
import { Prisma } from "@/generated/prisma/client";
import {
  Role,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  CourierProvider,
  CourierStatus,
} from "@/generated/prisma/enums";

function resolveImageUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }
  return getPublicUrl(key);
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

export type AdminPaymentSummary = {
  id: string;
  amount: string;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentID: string | null;
  trxID: string | null;
  customerMsisdn: string | null;
  payerReference: string | null;
  paymentCreateTime: string | null;
  paymentExecuteTime: string | null;
  refundTrxId: string | null;
  refundTransactionStatus: string | null;
  refundAmount: string | null;
  refundTime: string | null;
  refundReason: string | null;
  statusMessage: string | null;
  statusCode: string | null;
};

export type AdminShipmentSummary = {
  id: string;
  provider: CourierProvider;
  consignmentId: number | null;
  trackingCode: string | null;
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  codAmount: string;
  deliveryType: number | null;
  note: string | null;
  status: CourierStatus;
  rawStatus: string | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  payment?: AdminPaymentSummary | null;
  shipment?: AdminShipmentSummary | null;
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
      take: 500,
      orderBy: { createdAt: "desc" },
      include: {
        payment: true,
        shipment: true,
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

    // Compute Metrics using efficient SQL-level aggregation
    const metricsTypeWhere = type !== "ALL" ? { type: type as OrderType } : {};

    // Run all metric queries in parallel for speed
    const [
      totalOrders,
      statusCounts,
      typeCounts,
      paymentStatusCounts,
      revenueAgg,
    ] = await Promise.all([
      db.order.count({ where: metricsTypeWhere }),
      db.order.groupBy({
        by: ["status"],
        where: metricsTypeWhere,
        _count: true,
      }),
      db.order.groupBy({
        by: ["type"],
        where: metricsTypeWhere,
        _count: true,
      }),
      db.order.groupBy({
        by: ["paymentStatus"],
        where: metricsTypeWhere,
        _count: true,
      }),
      // For revenue, we still need to compute sums; use a raw query via findMany with select
      // since Prisma doesn't support SUM on string fields directly.
      // But we can limit this to only non-cancelled/non-returned orders
      db.order.findMany({
        where: {
          ...metricsTypeWhere,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
        },
        select: { finalCost: true, totalCost: true },
      }),
    ]);

    const statusMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s._count]),
    );
    const typeMap = Object.fromEntries(
      typeCounts.map((t) => [t.type, t._count]),
    );
    const paymentStatusMap = Object.fromEntries(
      paymentStatusCounts.map((p) => [p.paymentStatus, p._count]),
    );

    let totalRevenue = 0;
    let totalOwnerCost = 0;
    for (const o of revenueAgg) {
      totalRevenue += parseFloat(o.finalCost || "0") || 0;
      totalOwnerCost += parseFloat(o.totalCost || "0") || 0;
    }

    const estimatedProfit = Math.max(0, totalRevenue - totalOwnerCost);

    const metrics: OrderMetrics = {
      totalOrders,
      webOrdersCount: typeMap[OrderType.WEB] || 0,
      otherOrdersCount: typeMap[OrderType.OTHER] || 0,
      pendingCount: statusMap[OrderStatus.PENDING] || 0,
      inReviewCount: statusMap[OrderStatus.IN_REVIEW] || 0,
      deliveredCount: statusMap[OrderStatus.DELIVERED] || 0,
      cancelledCount: statusMap[OrderStatus.CANCELLED] || 0,
      totalRevenue,
      totalOwnerCost,
      estimatedProfit,
      paidOrdersCount: paymentStatusMap[PaymentStatus.PAID] || 0,
      pendingPaymentCount: paymentStatusMap[PaymentStatus.PENDING] || 0,
    };

    // Format formatted orders list
    const orders: AdminOrder[] = rawOrders.map((o) => {
      const items: AdminOrderSummaryItem[] = o.orderItems.map((oi) => {
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

        const image = resolveImageUrl(imageKey);

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
      });

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
        payment: o.payment
          ? {
              id: o.payment.id,
              amount: o.payment.amount,
              currency: o.payment.currency,
              paymentMethod: o.payment.paymentMethod,
              status: o.payment.status,
              paymentID: o.payment.paymentID,
              trxID: o.payment.trxID,
              customerMsisdn: o.payment.customerMsisdn,
              payerReference: o.payment.payerReference,
              paymentCreateTime: o.payment.paymentCreateTime,
              paymentExecuteTime: o.payment.paymentExecuteTime,
              refundTrxId: o.payment.refundTrxId,
              refundTransactionStatus: o.payment.refundTransactionStatus,
              refundAmount: o.payment.refundAmount,
              refundTime: o.payment.refundTime,
              refundReason: o.payment.refundReason,
              statusMessage: o.payment.statusMessage,
              statusCode: o.payment.statusCode,
            }
          : null,
        shipment: o.shipment
          ? {
              id: o.shipment.id,
              provider: o.shipment.provider,
              consignmentId: o.shipment.consignmentId,
              trackingCode: o.shipment.trackingCode,
              invoice: o.shipment.invoice,
              recipientName: o.shipment.recipientName,
              recipientPhone: o.shipment.recipientPhone,
              recipientAddress: o.shipment.recipientAddress,
              codAmount: o.shipment.codAmount,
              deliveryType: o.shipment.deliveryType,
              note: o.shipment.note,
              status: o.shipment.status,
              rawStatus: o.shipment.rawStatus,
              lastCheckedAt: o.shipment.lastCheckedAt,
              createdAt: o.shipment.createdAt,
              updatedAt: o.shipment.updatedAt,
            }
          : null,
        items,
      };
    });

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
