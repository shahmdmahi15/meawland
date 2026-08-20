import React from "react";
import type { Metadata } from "next";
import { getAdminOverviewDashboardDataAction } from "@/actions/admin/dashboard";
import { AdminOverviewDashboard } from "@/components/admin/dashboard/admin-overview-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Executive Dashboard | Meawland Command Center",
  description:
    "Real-time overview of revenue, profits, Steadfast courier balance, SMS credits, inventory valuation, and server telemetry.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOverviewPage() {
  const { data } = await getAdminOverviewDashboardDataAction("month");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AdminOverviewDashboard initialData={data} />
    </div>
  );
}
