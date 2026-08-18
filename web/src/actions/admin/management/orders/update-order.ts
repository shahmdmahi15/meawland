"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  OrderStatus,
  PaymentStatus,
  StockEventType,
} from "@/generated/prisma/enums";
import {
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  updateOrderItemStatusSchema,
  updateOrderCustomerSchema,
  type UpdateOrderStatusInput,
  type UpdatePaymentStatusInput,
  type UpdateOrderItemStatusInput,
  type UpdateOrderCustomerInput,
} from "@/schemas/admin/management/orders/order";

/**
 * Updates the overall status of an order and optionally syncs all order items.
 * If status changes to CANCELLED or RETURNED from an active state, stock can be restored.
 */
export async function updateOrderStatusAction(
  rawInput: UpdateOrderStatusInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
      };
    }

    const parsed = updateOrderStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid status data.",
      };
    }

    const { orderId, status, note, syncItemsStatus = true } = parsed.data;

    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            variant: true,
            product: true,
            comboProduct: {
              include: { products: true, variants: true },
            },
          },
        },
      },
    });

    if (!existingOrder) {
      return { success: false, message: "Order not found." };
    }

    await db.$transaction(async (tx) => {
      // 1. Update Order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          note: note
            ? existingOrder.note
              ? `${existingOrder.note} | ${note}`
              : note
            : undefined,
        },
      });

      // 2. Sync order items status if requested
      if (syncItemsStatus) {
        await tx.orderItem.updateMany({
          where: { orderId },
          data: { status },
        });
      }
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/admin/management/orders/web-orders");
    revalidatePath("/admin/management/orders/other-orders");
    revalidatePath(`/admin/management/orders/${existingOrder.code}`);

    return {
      success: true,
      message: `Order #${existingOrder.code} status updated to ${status}.`,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.UpdateStatus] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to update order status.",
    };
  }
}

/**
 * Updates the payment status of an order (PENDING vs PAID).
 */
export async function updatePaymentStatusAction(
  rawInput: UpdatePaymentStatusInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
      };
    }

    const parsed = updatePaymentStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid payment status.",
      };
    }

    const { orderId, paymentStatus } = parsed.data;

    const order = await db.order.update({
      where: { id: orderId },
      data: { paymentStatus },
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/admin/management/orders/web-orders");
    revalidatePath("/admin/management/orders/other-orders");
    revalidatePath(`/admin/management/orders/${order.code}`);

    return {
      success: true,
      message: `Order #${order.code} payment marked as ${paymentStatus}.`,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.UpdatePaymentStatus] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to update payment status.",
    };
  }
}

/**
 * Updates the status of an individual order item (e.g. partial delivery / return).
 */
export async function updateOrderItemStatusAction(
  rawInput: UpdateOrderItemStatusInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
      };
    }

    const parsed = updateOrderItemStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid item status data.",
      };
    }

    const { orderItemId, status } = parsed.data;

    const updatedItem = await db.orderItem.update({
      where: { id: orderItemId },
      data: { status },
      include: { order: true },
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/admin/management/orders/web-orders");
    revalidatePath("/admin/management/orders/other-orders");
    revalidatePath(`/admin/management/orders/${updatedItem.order.code}`);

    return {
      success: true,
      message: "Order item status updated.",
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.UpdateItemStatus] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to update item status.",
    };
  }
}

/**
 * Updates customer details and delivery note for an existing order.
 */
export async function updateOrderCustomerAction(
  rawInput: UpdateOrderCustomerInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
      };
    }

    const parsed = updateOrderCustomerSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid customer info.",
      };
    }

    const { orderId, name, email, phone, district, address, note } =
      parsed.data;

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        name,
        email,
        phone,
        district,
        address,
        note: note || null,
      },
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/admin/management/orders/web-orders");
    revalidatePath("/admin/management/orders/other-orders");
    revalidatePath(`/admin/management/orders/${updatedOrder.code}`);

    return {
      success: true,
      message: `Customer details for order #${updatedOrder.code} updated.`,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.UpdateCustomer] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to update customer details.",
    };
  }
}
