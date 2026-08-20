"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { refundBkashTransactionAction } from "@/actions/bkash/refund-transaction";
import { PaymentStatus, Role } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

export type AdminBkashRefundInput = {
  orderId: string;
  refundAmount: string;
  reason: string;
  sku?: string;
};

export async function processAdminBkashRefundAction(
  input: AdminBkashRefundInput,
): Promise<{
  success: boolean;
  message?: string;
  refundTrxId?: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required to process refunds.",
      };
    }

    if (!input.orderId || !input.refundAmount || !input.reason.trim()) {
      return {
        success: false,
        message: "Order ID, refund amount, and reason are required.",
      };
    }

    const order = await db.order.findUnique({
      where: { id: input.orderId },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    if (!order.payment || !order.payment.paymentID || !order.payment.trxID) {
      return {
        success: false,
        message:
          "This order does not have a verified bKash payment with transaction ID.",
      };
    }

    const refundAmountNum = parseFloat(input.refundAmount);
    const orderAmountNum = parseFloat(order.finalCost);

    if (isNaN(refundAmountNum) || refundAmountNum <= 0) {
      return {
        success: false,
        message: "Refund amount must be a positive number.",
      };
    }

    if (refundAmountNum > orderAmountNum) {
      return {
        success: false,
        message: `Refund amount cannot exceed total order cost of ৳${orderAmountNum.toLocaleString()}.`,
      };
    }

    // Call bKash Refund API
    const refundRes = await refundBkashTransactionAction({
      paymentId: order.payment.paymentID,
      trxId: order.payment.trxID,
      refundAmount: refundAmountNum.toFixed(2),
      sku: input.sku || order.code,
      reason: input.reason.trim(),
    });

    if (!refundRes.success || !refundRes.data) {
      return {
        success: false,
        message:
          refundRes.message || "Failed to process refund via bKash gateway.",
      };
    }

    const refundData = refundRes.data;

    // Update Payment and Order records
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          refundTrxId: refundData.refundTrxId,
          refundTransactionStatus: refundData.refundTransactionStatus,
          refundAmount: refundData.refundAmount,
          refundTime: refundData.completedTime,
          refundReason: input.reason.trim(),
          status:
            refundAmountNum >= orderAmountNum
              ? PaymentStatus.REFUNDED
              : order.paymentStatus,
        },
      });

      if (refundAmountNum >= orderAmountNum) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });
      }
    });

    revalidatePath("/admin/management/orders");
    revalidatePath(`/admin/management/orders/${order.code}`);

    return {
      success: true,
      message: `bKash refund of ৳${refundData.refundAmount} processed successfully. (Refund TrxID: ${refundData.refundTrxId})`,
      refundTrxId: refundData.refundTrxId,
    };
  } catch (error) {
    console.error("[Action.Admin.Bkash.Refund] Error:", error);
    return {
      success: false,
      message: "Failed to process bKash refund. Please try again.",
    };
  }
}
