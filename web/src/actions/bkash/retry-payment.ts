"use server";

import db from "@/lib/db";
import { createBkashPaymentAction } from "@/actions/bkash/create-payment";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export async function retryBkashPaymentAction(orderIdOrCode: string): Promise<{
  success: boolean;
  message?: string;
  bkashURL?: string;
}> {
  try {
    if (!orderIdOrCode) {
      return { success: false, message: "Order identifier is required." };
    }

    const order = await db.order.findFirst({
      where: {
        OR: [{ id: orderIdOrCode }, { code: orderIdOrCode }],
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return {
        success: false,
        message: "This order has already been paid successfully.",
      };
    }

    const amount = parseFloat(order.finalCost || "0").toFixed(2);

    const bkashRes = await createBkashPaymentAction({
      amount,
      merchantInvoiceNumber: order.code,
      payerReference: order.phone,
    });

    if (!bkashRes.success || !bkashRes.data?.bkashURL) {
      return {
        success: false,
        message:
          bkashRes.message ||
          "Failed to initiate bKash payment. Please try again.",
      };
    }

    // Upsert / update payment record
    if (order.payment) {
      await db.payment.update({
        where: { id: order.payment.id },
        data: {
          paymentID: bkashRes.data.paymentID,
          paymentMethod: PaymentMethod.BKASH,
          status: PaymentStatus.PENDING,
          statusCode: bkashRes.data.statusCode,
          statusMessage: bkashRes.data.statusMessage,
          paymentCreateTime: bkashRes.data.paymentCreateTime,
          transactionStatus: bkashRes.data.transactionStatus,
          rawResponse: bkashRes.data as object,
        },
      });
    } else {
      await db.payment.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount,
          currency: "BDT",
          paymentMethod: PaymentMethod.BKASH,
          status: PaymentStatus.PENDING,
          paymentID: bkashRes.data.paymentID,
          statusCode: bkashRes.data.statusCode,
          statusMessage: bkashRes.data.statusMessage,
          paymentCreateTime: bkashRes.data.paymentCreateTime,
          transactionStatus: bkashRes.data.transactionStatus,
          rawResponse: bkashRes.data as object,
        },
      });
    }

    // Ensure order payment method is marked as BKASH
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: PaymentMethod.BKASH,
      },
    });

    revalidatePath(`/checkout/success/${order.id}`);
    revalidatePath("/account/orders");

    return {
      success: true,
      bkashURL: bkashRes.data.bkashURL,
    };
  } catch (error) {
    console.error("[Action.Bkash.RetryPayment] Error:", error);
    return {
      success: false,
      message: "Failed to retry bKash payment. Please try again.",
    };
  }
}
