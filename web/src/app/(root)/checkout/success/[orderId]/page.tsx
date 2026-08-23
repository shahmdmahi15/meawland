import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderConfirmationAction } from "@/actions/store/checkout";
import { OrderSuccessView } from "@/components/root/store/order-success-view";

interface OrderSuccessPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Placed Successfully | Meawland Pet Store",
  description: "Your pet essentials order has been placed successfully.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

export default async function OrderSuccessPage({
  params,
}: OrderSuccessPageProps) {
  const { orderId } = await params;
  const result = await getOrderConfirmationAction(orderId);

  if (!result.success || !result.order) {
    notFound();
  }

  return <OrderSuccessView order={result.order} />;
}
