"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getPublicUrl } from "@/lib/storage";
import { Role } from "@/generated/prisma/enums";
import type { AdminOrder } from "./get-orders";

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

export async function getOrderDetailsAdminAction(
  orderIdOrCode: string,
): Promise<{
  success: boolean;
  message?: string;
  order?: AdminOrder & {
    user?: {
      id: string;
      code: string;
      name: string;
      email: string;
      phone: string | null;
      district: string | null;
      address: string | null;
    } | null;
  };
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message:
          "Unauthorized. You do not have permission to view order details.",
      };
    }

    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderIdOrCode }, { code: orderIdOrCode }],
      },
      include: {
        payment: true,
        shipment: true,
        user: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            district: true,
            address: true,
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

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    const items = order.orderItems.map((oi) => {
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
      success: true,
      order: {
        id: order.id,
        code: order.code,
        totalQuantity: order.totalQuantity,
        totalPrice: order.totalPrice,
        totalCost: order.totalCost,
        discountCost: order.discountCost,
        finalCost: order.finalCost,
        name: order.name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        district: order.district,
        note: order.note,
        status: order.status,
        type: order.type,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        userId: order.userId,
        userCode: order.user?.code || null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        payment: order.payment
          ? {
              id: order.payment.id,
              amount: order.payment.amount,
              currency: order.payment.currency,
              paymentMethod: order.payment.paymentMethod,
              status: order.payment.status,
              paymentID: order.payment.paymentID,
              trxID: order.payment.trxID,
              customerMsisdn: order.payment.customerMsisdn,
              payerReference: order.payment.payerReference,
              paymentCreateTime: order.payment.paymentCreateTime,
              paymentExecuteTime: order.payment.paymentExecuteTime,
              refundTrxId: order.payment.refundTrxId,
              refundTransactionStatus: order.payment.refundTransactionStatus,
              refundAmount: order.payment.refundAmount,
              refundTime: order.payment.refundTime,
              refundReason: order.payment.refundReason,
              statusMessage: order.payment.statusMessage,
              statusCode: order.payment.statusCode,
            }
          : null,
        shipment: order.shipment
          ? {
              id: order.shipment.id,
              provider: order.shipment.provider,
              consignmentId: order.shipment.consignmentId,
              trackingCode: order.shipment.trackingCode,
              invoice: order.shipment.invoice,
              recipientName: order.shipment.recipientName,
              recipientPhone: order.shipment.recipientPhone,
              recipientAddress: order.shipment.recipientAddress,
              codAmount: order.shipment.codAmount,
              deliveryType: order.shipment.deliveryType,
              note: order.shipment.note,
              status: order.shipment.status,
              rawStatus: order.shipment.rawStatus,
              lastCheckedAt: order.shipment.lastCheckedAt,
              createdAt: order.shipment.createdAt,
              updatedAt: order.shipment.updatedAt,
            }
          : null,
        items,
        user: order.user || null,
      },
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.GetOrderDetails] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to retrieve order details.",
    };
  }
}
