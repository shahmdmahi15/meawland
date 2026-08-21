import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import {
  getUserSupportTicketsAction,
  getUserOrdersForSupportAction,
} from "@/actions/root/account/support";
import { SupportView } from "@/components/root/account/support/support-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help Desk & Customer Support | Meawland",
  description:
    "Get instant help with your Meawland account, orders, payments, and product warranties.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SupportPageProps {
  searchParams: Promise<{
    orderCode?: string;
  }>;
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const sessionUser = await getMeAction();
  if (!sessionUser) {
    redirect("/login?callbackUrl=/account/support");
  }

  const { orderCode } = await searchParams;

  const [ticketsRes, ordersRes] = await Promise.all([
    getUserSupportTicketsAction(),
    getUserOrdersForSupportAction(),
  ]);

  const tickets = ticketsRes.tickets || [];
  const orders = ordersRes.orders || [];

  return (
    <SupportView
      userName={sessionUser.name || "Customer"}
      userEmail={sessionUser.email || ""}
      userCode={sessionUser.code || ""}
      userPhone={sessionUser.phone || ""}
      tickets={tickets}
      orders={orders}
      preselectedOrderCode={orderCode}
    />
  );
}
