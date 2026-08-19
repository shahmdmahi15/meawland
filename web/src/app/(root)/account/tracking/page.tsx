import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import {
  trackOrderAction,
  getUserRecentTrackableOrdersAction,
} from "@/actions/root/account/tracking";
import { OrderTrackingView } from "@/components/root/account/tracking/order-tracking-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Tracking & Shipment Status | Meawland",
  description:
    "Track live shipping and delivery progress for your Meawland pet care orders.",
  robots: {
    index: false,
    follow: false,
  },
};

interface CustomerTrackingPageProps {
  searchParams: Promise<{
    orderCode?: string;
  }>;
}

export default async function CustomerTrackingPage({
  searchParams,
}: CustomerTrackingPageProps) {
  const sessionUser = await getMeAction();
  if (!sessionUser) {
    redirect("/login?callbackUrl=/account/tracking");
  }

  const { orderCode } = await searchParams;

  const recentOrdersRes = await getUserRecentTrackableOrdersAction();
  const recentOrders = recentOrdersRes.orders || [];

  // Determine query to track: either explicitly provided, or latest recent order by default
  const queryToTrack = orderCode?.trim() || recentOrders[0]?.code || "";

  let initialOrder = null;
  if (queryToTrack) {
    const trackRes = await trackOrderAction(queryToTrack);
    if (trackRes.success && trackRes.order) {
      initialOrder = trackRes.order;
    }
  }

  return (
    <OrderTrackingView
      initialOrder={initialOrder}
      recentOrders={recentOrders}
      searchedQuery={queryToTrack}
    />
  );
}
