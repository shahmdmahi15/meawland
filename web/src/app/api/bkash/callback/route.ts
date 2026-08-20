import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { env } from "@/env";
import { executeBkashPaymentAction } from "@/actions/bkash/execute-payment";
import { queryBkashPaymentAction } from "@/actions/bkash/query-payment";
import { PaymentStatus } from "@/generated/prisma/enums";
import { triggerBkashPaidSms } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { triggerBkashPaidEmail } from "@/actions/admin/support-marketing/marketing/email/automations";
import { trackMetaPurchaseAction } from "@/actions/meta";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentID = searchParams.get("paymentID");
    const status = searchParams.get("status");

    if (!paymentID) {
      console.error("[API.Bkash.Callback] Missing paymentID query parameter.");
      return NextResponse.redirect(
        new URL("/checkout?error=missing_payment_id", env.NEXT_PUBLIC_APP_URL),
      );
    }

    // 1. Find the associated payment and order in database
    const payment = await db.payment.findUnique({
      where: { paymentID },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: { select: { name: true } },
                variant: {
                  include: { product: { select: { name: true } } },
                },
                comboProduct: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!payment || !payment.order) {
      console.error(
        `[API.Bkash.Callback] Payment or Order not found for paymentID "${paymentID}".`,
      );
      return NextResponse.redirect(
        new URL("/checkout?error=order_not_found", env.NEXT_PUBLIC_APP_URL),
      );
    }

    const order = payment.order;

    // 1.1 Idempotency Check: If already marked as PAID, redirect directly to success page
    if (
      payment.status === PaymentStatus.PAID ||
      order.paymentStatus === PaymentStatus.PAID
    ) {
      return NextResponse.redirect(
        new URL(
          `/checkout/success/${order.id}?payment=bkash_success`,
          env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // 2. Handle Cancelled Status from bKash UI
    if (status === "cancel") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CANCELLED,
          transactionStatus: "Cancelled",
          statusMessage: "Payment cancelled by customer on bKash page.",
        },
      });

      return NextResponse.redirect(
        new URL(
          `/checkout/payment-status?status=cancelled&orderId=${order.id}&orderCode=${order.code}&paymentID=${paymentID}`,
          env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // 3. Handle Failure Status from bKash UI
    if (status === "failure") {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          transactionStatus: "Failed",
          statusMessage: "Payment failed on bKash page.",
        },
      });

      return NextResponse.redirect(
        new URL(
          `/checkout/payment-status?status=failed&orderId=${order.id}&orderCode=${order.code}&paymentID=${paymentID}`,
          env.NEXT_PUBLIC_APP_URL,
        ),
      );
    }

    // 4. Handle Success Status -> Execute bKash Payment
    if (status === "success") {
      const executeRes = await executeBkashPaymentAction(paymentID);

      if (
        executeRes.success &&
        executeRes.data &&
        executeRes.data.transactionStatus === "Completed" &&
        executeRes.data.statusCode === "0000"
      ) {
        const executeData = executeRes.data;

        // Update Payment and Order records atomically
        await db.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.PAID,
              trxID: executeData.trxID,
              customerMsisdn: executeData.customerMsisdn,
              payerReference: executeData.payerReference,
              paymentExecuteTime: executeData.paymentExecuteTime,
              transactionStatus: executeData.transactionStatus,
              statusCode: executeData.statusCode,
              statusMessage: executeData.statusMessage,
              rawResponse: executeData as object,
            },
          });

          await tx.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: PaymentStatus.PAID,
            },
          });
        });

        // Send confirmation email with verified bKash transaction ID
        if (order.email) {
          triggerBkashPaidEmail({
            id: order.id,
            code: order.code,
            email: order.email,
            name: order.name,
            amount: parseFloat(order.finalCost).toLocaleString(),
            trxID: executeData.trxID,
            userId: order.userId,
          }).catch((err) => {
            console.error(
              "[API.Bkash.Callback] Failed to send payment confirmation email:",
              err,
            );
          });
        }

        // Send automated bKash verified SMS
        if (order.phone) {
          triggerBkashPaidSms({
            id: order.id,
            code: order.code,
            phone: order.phone,
            name: order.name,
            finalCost: order.finalCost,
            trxID: executeData.trxID,
            userId: order.userId,
          }).catch((err) => {
            console.error("[API.Bkash.Callback] SMS failed:", err);
          });
        }

        // Meta Conversions API (Server CAPI) Purchase Event
        trackMetaPurchaseAction({
          orderCode: order.code,
          totalValue: parseFloat(order.finalCost) || 0,
          currency: "BDT",
          numItems: order.totalQuantity,
          deliveryFee: parseFloat(order.deliveryFee) || 0,
          discount: parseFloat(order.discountCost) || 0,
          items: order.orderItems.map((oi) => ({
            id: oi.variantId || oi.productId || oi.comboProductId || oi.id,
            name: oi.variant?.product?.name || oi.product?.name || oi.comboProduct?.name || "Pet Item",
            price: parseFloat(oi.finalCost) || 0,
            quantity: oi.quanitity,
          })),
          customer: {
            email: order.email,
            phone: order.phone,
            name: order.name,
            district: order.district,
            userId: order.userId,
          },
          eventId: `purch_${order.code}`,
        }).catch((err) => {
          console.error("[API.Bkash.Callback] Meta CAPI Purchase error:", err);
        });

        // Redirect to order success page with bKash flag
        return NextResponse.redirect(
          new URL(
            `/checkout/success/${order.id}?payment=bkash_success`,
            env.NEXT_PUBLIC_APP_URL,
          ),
        );
      } else {
        // Check if bKash already completed this payment (error 2062: "The payment has already been completed")
        const isAlreadyCompleted =
          executeRes.message?.includes("already been completed") ||
          executeRes.data?.statusCode === "2062";

        if (isAlreadyCompleted) {
          const queryRes = await queryBkashPaymentAction(paymentID);
          if (
            queryRes.success &&
            queryRes.data &&
            (queryRes.data.transactionStatus === "Completed" ||
              queryRes.data.trxID)
          ) {
            const queryData = queryRes.data;
            await db.$transaction(async (tx) => {
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: PaymentStatus.PAID,
                  trxID: queryData.trxID || payment.trxID,
                  customerMsisdn:
                    queryData.payerReference || payment.customerMsisdn,
                  paymentExecuteTime:
                    queryData.paymentExecuteTime || new Date().toISOString(),
                  transactionStatus: "Completed",
                  statusCode: "0000",
                  statusMessage: "Payment completed successfully.",
                  rawResponse: queryData as object,
                },
              });

              await tx.order.update({
                where: { id: order.id },
                data: {
                  paymentStatus: PaymentStatus.PAID,
                },
              });
            });

            return NextResponse.redirect(
              new URL(
                `/checkout/success/${order.id}?payment=bkash_success`,
                env.NEXT_PUBLIC_APP_URL,
              ),
            );
          }
        }

        // Execute failed or status was not Completed
        console.error(
          "[API.Bkash.Callback] bKash payment execution failed:",
          executeRes,
        );

        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            statusCode: executeRes.data?.statusCode || "ERROR",
            statusMessage:
              executeRes.message || "bKash execute payment failed.",
            rawResponse: executeRes.data as object,
          },
        });

        return NextResponse.redirect(
          new URL(
            `/checkout/payment-status?status=failed&orderId=${order.id}&orderCode=${order.code}&paymentID=${paymentID}&reason=${encodeURIComponent(executeRes.message || "Payment execution failed")}`,
            env.NEXT_PUBLIC_APP_URL,
          ),
        );
      }
    }

    // 5. Any other unexpected status
    return NextResponse.redirect(
      new URL(
        `/checkout/payment-status?status=unknown&orderId=${order.id}&orderCode=${order.code}&paymentID=${paymentID}`,
        env.NEXT_PUBLIC_APP_URL,
      ),
    );
  } catch (error) {
    console.error("[API.Bkash.Callback] Unexpected error:", error);
    return NextResponse.redirect(
      new URL(
        "/checkout?error=callback_internal_error",
        env.NEXT_PUBLIC_APP_URL,
      ),
    );
  }
}
