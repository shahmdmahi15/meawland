import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { PaymentStatus } from "@/generated/prisma/enums";
import { PaymentStatusView } from "@/components/root/store/payment-status-view";

export const metadata: Metadata = {
  title: "bKash Payment Status | Meawland",
  description: "Check your bKash payment transaction status",
};

interface PaymentStatusPageProps {
  searchParams: Promise<{
    status?: string;
    orderId?: string;
    orderCode?: string;
    paymentID?: string;
    reason?: string;
  }>;
}

export default async function PaymentStatusPage({
  searchParams,
}: PaymentStatusPageProps) {
  const resolvedParams = await searchParams;

  // If orderId or orderCode is present, verify whether the order is already marked as PAID
  if (resolvedParams.orderId || resolvedParams.orderCode) {
    const order = await db.order.findFirst({
      where: {
        OR: [
          ...(resolvedParams.orderId ? [{ id: resolvedParams.orderId }] : []),
          ...(resolvedParams.orderCode
            ? [{ code: resolvedParams.orderCode }]
            : []),
        ],
      },
      select: {
        id: true,
        paymentStatus: true,
      },
    });

    if (order && order.paymentStatus === PaymentStatus.PAID) {
      redirect(`/checkout/success/${order.id}?payment=bkash_success`);
    }
  }

  return (
    <PaymentStatusView
      status={resolvedParams.status || "failed"}
      orderId={resolvedParams.orderId}
      orderCode={resolvedParams.orderCode}
      paymentID={resolvedParams.paymentID}
      reason={resolvedParams.reason}
    />
  );
}
