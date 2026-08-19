"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64 } from "@/lib/storage";
import { Prisma } from "@/generated/prisma/client";
import { OrderStatus } from "@/generated/prisma/enums";
import {
  CustomerOrderSummary,
  CustomerOrderItemSummary,
  CustomerOrderStats,
  CustomerOrdersFilterInput,
  customerOrdersFilterSchema,
} from "@/schemas/root/account/orders";

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

/**
 * Retrieves the logged-in customer's orders list with statistics.
 */
export async function getCustomerOrdersAction(
  rawParams: CustomerOrdersFilterInput = {},
): Promise<{
  success: boolean;
  message?: string;
  orders?: CustomerOrderSummary[];
  stats?: CustomerOrderStats;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return {
        success: false,
        message: "Unauthorized. Please sign in to view your orders.",
      };
    }

    const parsed = customerOrdersFilterSchema.safeParse(rawParams);
    const { search, status } = parsed.success ? parsed.data : rawParams;

    // Base query scoped to the current user
    const where: Prisma.OrderWhereInput = {
      userId: sessionUser.id,
    };

    // Filter by status tab
    if (status === "ACTIVE") {
      where.status = {
        in: [
          OrderStatus.PENDING,
          OrderStatus.IN_REVIEW,
          OrderStatus.DELIVERY_APPROVAL_PENDING,
          OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING,
          OrderStatus.HOLD,
        ],
      };
    } else if (status === "DELIVERED") {
      where.status = {
        in: [OrderStatus.DELIVERED, OrderStatus.PARTIAL_DELIVERED],
      };
    } else if (status === "CANCELLED") {
      where.status = {
        in: [
          OrderStatus.CANCELLED,
          OrderStatus.CANCELLED_APPROVAL_PENDING,
          OrderStatus.RETURNED,
          OrderStatus.RETURNED_PARTIAL,
        ],
      };
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        {
          orderItems: {
            some: {
              OR: [
                {
                  product: {
                    name: { contains: q, mode: "insensitive" },
                  },
                },
                {
                  variant: {
                    product: {
                      name: { contains: q, mode: "insensitive" },
                    },
                  },
                },
                {
                  comboProduct: {
                    name: { contains: q, mode: "insensitive" },
                  },
                },
              ],
            },
          },
        },
      ];
    }

    // Fetch user's orders with line item relations
    const [rawOrders, allUserOrders] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  image: true,
                  slug: true,
                },
              },
              variant: {
                include: {
                  product: {
                    select: {
                      name: true,
                      image: true,
                      slug: true,
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
                  slug: true,
                },
              },
            },
          },
        },
      }),
      // Fetch all customer orders to calculate lifetime statistics
      db.order.findMany({
        where: { userId: sessionUser.id },
        select: {
          status: true,
          finalCost: true,
        },
      }),
    ]);

    // Calculate customer statistics
    let activeOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let totalSpent = 0;

    for (const o of allUserOrders) {
      if (
        o.status === OrderStatus.PENDING ||
        o.status === OrderStatus.IN_REVIEW ||
        o.status === OrderStatus.DELIVERY_APPROVAL_PENDING ||
        o.status === OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING ||
        o.status === OrderStatus.HOLD
      ) {
        activeOrders++;
      } else if (
        o.status === OrderStatus.DELIVERED ||
        o.status === OrderStatus.PARTIAL_DELIVERED
      ) {
        deliveredOrders++;
        totalSpent += parseFloat(o.finalCost || "0") || 0;
      } else if (
        o.status === OrderStatus.CANCELLED ||
        o.status === OrderStatus.CANCELLED_APPROVAL_PENDING ||
        o.status === OrderStatus.RETURNED ||
        o.status === OrderStatus.RETURNED_PARTIAL
      ) {
        cancelledOrders++;
      }
    }

    const stats: CustomerOrderStats = {
      totalOrders: allUserOrders.length,
      activeOrders,
      deliveredOrders,
      cancelledOrders,
      totalSpent,
    };

    // Format formatted orders list with safely resolved base64 images
    const orders: CustomerOrderSummary[] = await Promise.all(
      rawOrders.map(async (o) => {
        const items: CustomerOrderItemSummary[] = await Promise.all(
          o.orderItems.map(async (oi) => {
            let name = "Order Item";
            let sku: string | null = null;
            let imageKey: string | null = null;
            let slug: string | null = null;

            if (oi.variant) {
              name = `${oi.variant.product.name} (${oi.variant.sku})`;
              sku = oi.variant.sku;
              imageKey = oi.variant.image || oi.variant.product.image;
              slug = oi.variant.product.slug;
            } else if (oi.product) {
              name = oi.product.name;
              sku = oi.product.sku;
              imageKey = oi.product.image;
              slug = oi.product.slug;
            } else if (oi.comboProduct) {
              name = oi.comboProduct.name;
              sku = oi.comboProduct.sku;
              imageKey = oi.comboProduct.image;
              slug = oi.comboProduct.slug;
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
              slug,
            };
          }),
        );

        return {
          id: o.id,
          code: o.code,
          totalQuantity: o.totalQuantity,
          totalPrice: o.totalPrice,
          discountCost: o.discountCost,
          finalCost: o.finalCost,
          status: o.status,
          type: o.type,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          address: o.address,
          district: o.district,
          note: o.note,
          name: o.name,
          phone: o.phone,
          email: o.email,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          items,
        };
      }),
    );

    return {
      success: true,
      orders,
      stats,
    };
  } catch (error) {
    console.error("[Action.Customer.Orders.GetCustomerOrders] Error:", error);
    return {
      success: false,
      message: "Failed to retrieve your orders. Please try again.",
    };
  }
}

/**
 * Retrieves a single order for modal detail or invoice print, ensuring user ownership.
 */
export async function getCustomerOrderDetailsAction(
  orderIdOrCode: string,
): Promise<{
  success: boolean;
  message?: string;
  order?: CustomerOrderSummary;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return {
        success: false,
        message: "Unauthorized. Please sign in.",
      };
    }

    const order = await db.order.findFirst({
      where: {
        userId: sessionUser.id,
        OR: [{ id: orderIdOrCode }, { code: orderIdOrCode }],
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                image: true,
                slug: true,
              },
            },
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                    slug: true,
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
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found.",
      };
    }

    const items: CustomerOrderItemSummary[] = await Promise.all(
      order.orderItems.map(async (oi) => {
        let name = "Order Item";
        let sku: string | null = null;
        let imageKey: string | null = null;
        let slug: string | null = null;

        if (oi.variant) {
          name = `${oi.variant.product.name} (${oi.variant.sku})`;
          sku = oi.variant.sku;
          imageKey = oi.variant.image || oi.variant.product.image;
          slug = oi.variant.product.slug;
        } else if (oi.product) {
          name = oi.product.name;
          sku = oi.product.sku;
          imageKey = oi.product.image;
          slug = oi.product.slug;
        } else if (oi.comboProduct) {
          name = oi.comboProduct.name;
          sku = oi.comboProduct.sku;
          imageKey = oi.comboProduct.image;
          slug = oi.comboProduct.slug;
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
          slug,
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
        discountCost: order.discountCost,
        finalCost: order.finalCost,
        status: order.status,
        type: order.type,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        address: order.address,
        district: order.district,
        note: order.note,
        name: order.name,
        phone: order.phone,
        email: order.email,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items,
      },
    };
  } catch (error) {
    console.error(
      "[Action.Customer.Orders.GetCustomerOrderDetails] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to retrieve order details.",
    };
  }
}
