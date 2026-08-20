import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAccountDashboardDataAction } from "@/actions/root/account/dashboard";
import { CustomerDashboardView } from "@/components/root/account/dashboard-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Account & Orders | Meawland",
  description:
    "View your pet orders, live package delivery tracking, pet care rewards, and profile settings.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountDashboardPage() {
  const result = await getAccountDashboardDataAction();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  return <CustomerDashboardView data={result.data} />;
}
