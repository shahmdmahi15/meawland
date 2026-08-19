import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { getCustomerOrdersAction } from "@/actions/root/account/orders";
import { CustomerOrdersView } from "@/components/root/account/orders/customer-orders-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders & Purchases | Meawland Pet Store",
  description:
    "View and track your previous and active pet care orders at Meawland.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CustomerOrdersPage() {
  const sessionUser = await getMeAction();
  if (!sessionUser) {
    redirect("/login?callbackUrl=/account/orders");
  }

  const result = await getCustomerOrdersAction();

  const orders = result.orders || [];
  const stats = result.stats || {
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalSpent: 0,
  };

  return <CustomerOrdersView initialOrders={orders} stats={stats} />;
}
