"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64 } from "@/lib/storage";
import { Role } from "@/generated/prisma/enums";
import type { AdminOrder } from "./get-orders";

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

    const items = await Promise.all(
      order.orderItems.map(async (oi) => {
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
