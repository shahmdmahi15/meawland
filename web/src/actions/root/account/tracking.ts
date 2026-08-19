"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64 } from "@/lib/storage";
import { isDhakaDistrict } from "@/constants/cart";
import { OrderStatus } from "@/generated/prisma/enums";
import {
  TrackedOrderDetails,
  TrackingMilestoneStep,
  RecentOrderQuickItem,
  trackOrderInputSchema,
} from "@/schemas/root/account/tracking";
import { CustomerOrderItemSummary } from "@/schemas/root/account/orders";

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
 * Helper to compute realistic estimated delivery window based on destination district.
 */
function getEstimatedDeliveryDateString(
  createdAt: Date,
  district: string,
): string {
  const isDhaka = isDhakaDistrict(district);
  const minDays = isDhaka ? 1 : 3;
  const maxDays = isDhaka ? 2 : 5;

  const minDate = new Date(createdAt);
  minDate.setDate(minDate.getDate() + minDays);

  const maxDate = new Date(createdAt);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const formatOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  return `${minDate.toLocaleDateString("en-US", formatOpts)} – ${maxDate.toLocaleDateString("en-US", formatOpts)}`;
}

/**
 * Builds chronological milestone steps for the tracked order.
 */
function buildMilestones(
  status: OrderStatus,
  createdAt: Date,
  updatedAt: Date,
  district: string,
): TrackingMilestoneStep[] {
  const isCancelled =
    status === OrderStatus.CANCELLED ||
    status === OrderStatus.CANCELLED_APPROVAL_PENDING;
  const isReturned =
    status === OrderStatus.RETURNED || status === OrderStatus.RETURNED_PARTIAL;

  const placedTimeStr = new Date(createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedTimeStr = new Date(updatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isCancelled) {
    return [
      {
        key: "placed",
        title: "Order Placed",
        description: "Your order was registered in our system",
        timestamp: placedTimeStr,
        status: "completed",
        location: "Online Store",
      },
      {
        key: "cancelled",
        title: "Order Cancelled",
        description: "The order was cancelled as requested",
        timestamp: updatedTimeStr,
        status: "cancelled",
        location: "Customer Service",
      },
    ];
  }

  if (isReturned) {
    return [
      {
        key: "placed",
        title: "Order Placed",
        description: "Your order was registered in our system",
        timestamp: placedTimeStr,
        status: "completed",
        location: "Online Store",
      },
      {
        key: "returned",
        title: "Order Returned",
        description: "Package was safely returned to our central hub",
        timestamp: updatedTimeStr,
        status: "cancelled",
        location: "Meawland Hub",
      },
    ];
  }

  const isDelivered =
    status === OrderStatus.DELIVERED ||
    status === OrderStatus.PARTIAL_DELIVERED;

  const isInTransit =
    status === OrderStatus.DELIVERY_APPROVAL_PENDING ||
    status === OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING;

  const isProcessing =
    status === OrderStatus.IN_REVIEW || status === OrderStatus.HOLD;

  return [
    {
      key: "placed",
      title: "Order Placed & Confirmed",
      description: "Order received, inventory reserved and verified",
      timestamp: placedTimeStr,
      status: "completed",
      location: "Meawland Central Order Processing",
    },
    {
      key: "processing",
      title: "Quality Check & Packing",
      description: isProcessing
        ? "Currently inspecting and securely packaging your pet care items"
        : "Package verified and sealed with tamper-proof security",
      timestamp:
        isProcessing || isInTransit || isDelivered ? updatedTimeStr : null,
      status: isProcessing
        ? "in_progress"
        : isInTransit || isDelivered
          ? "completed"
          : "pending",
      location: "Dhaka Central Warehouse",
    },
    {
      key: "in_transit",
      title: "Dispatched to Courier",
      description: isInTransit
        ? `Package in transit with our delivery partner heading to ${district}`
        : isDelivered
          ? `Dispatched and routed to ${district} hub`
          : `Handover scheduled for delivery to ${district}`,
      timestamp: isInTransit || isDelivered ? updatedTimeStr : null,
      status: isInTransit
        ? "in_progress"
        : isDelivered
          ? "completed"
          : "pending",
      location: `Express Hub — ${district}`,
    },
    {
      key: "delivered",
      title: "Delivered to Doorstep",
      description: isDelivered
        ? "Package safely delivered and handed over to customer"
        : "Final delivery handover at recipient address",
      timestamp: isDelivered ? updatedTimeStr : null,
      status: isDelivered ? "completed" : "pending",
      location: `Recipient Address in ${district}`,
    },
  ];
}

/**
 * Tracks an order by code or ID with user session security.
 */
export async function trackOrderAction(query: string): Promise<{
  success: boolean;
  message?: string;
  order?: TrackedOrderDetails;
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return {
        success: false,
        message: "Please sign in to track your order.",
      };
    }

    const parsed = trackOrderInputSchema.safeParse({ query });
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid order code.",
      };
    }

    const cleanQuery = parsed.data.query.replace(/^#/, "").trim();

    // Query order ensuring user ownership
    const order = await db.order.findFirst({
      where: {
        userId: sessionUser.id,
        OR: [
          { code: { equals: cleanQuery, mode: "insensitive" } },
          { id: cleanQuery },
        ],
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
        message: `No order found with code "${cleanQuery}" in your account.`,
      };
    }

    // Resolve line item images
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

    const estimatedDeliveryDate = getEstimatedDeliveryDateString(
      order.createdAt,
      order.district,
    );

    const courierPartner = isDhakaDistrict(order.district)
      ? "Meawland Express Delivery (Same Day / Next Day)"
      : "Steadfast & Pathao Courier Logistics";

    const milestones = buildMilestones(
      order.status,
      order.createdAt,
      order.updatedAt,
      order.district,
    );

    return {
      success: true,
      order: {
        id: order.id,
        code: order.code,
        status: order.status,
        type: order.type,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalQuantity: order.totalQuantity,
        totalPrice: order.totalPrice,
        discountCost: order.discountCost,
        finalCost: order.finalCost,
        name: order.name,
        phone: order.phone,
        email: order.email,
        address: order.address,
        district: order.district,
        note: order.note,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedDeliveryDate,
        courierPartner,
        milestones,
        items,
      },
    };
  } catch (error) {
    console.error("[Action.Customer.Tracking.TrackOrder] Error:", error);
    return {
      success: false,
      message: "Failed to load order tracking details.",
    };
  }
}

/**
 * Retrieves the logged-in customer's recent orders for quick tracking switcher.
 */
export async function getUserRecentTrackableOrdersAction(): Promise<{
  success: boolean;
  orders?: RecentOrderQuickItem[];
}> {
  try {
    const sessionUser = await getMeAction();
    if (!sessionUser) {
      return { success: false, orders: [] };
    }

    const rawOrders = await db.order.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        finalCost: true,
        totalQuantity: true,
      },
    });

    return {
      success: true,
      orders: rawOrders,
    };
  } catch (error) {
    console.error(
      "[Action.Customer.Tracking.GetUserRecentTrackableOrders] Error:",
      error,
    );
    return { success: false, orders: [] };
  }
}
