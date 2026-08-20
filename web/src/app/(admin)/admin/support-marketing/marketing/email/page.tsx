import React from "react";
import type { Metadata } from "next";
import { getEmailMarketingPageDataAction } from "@/actions/admin/support-marketing/marketing/email/data";
import { EmailDashboardView } from "@/components/admin/support-marketing/marketing/email/email-dashboard-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email Marketing & Automation Hub | Meawland Admin",
  description:
    "Design high-converting email broadcasts, segment pet parents, and manage automated order receipts and notifications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EmailMarketingPage() {
  const { data } = await getEmailMarketingPageDataAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <EmailDashboardView
        campaigns={data.campaigns}
        templates={data.templates}
        logs={data.logs}
        totalLogs={data.totalLogs}
        totalSubscribers={data.totalSubscribers}
        totalDelivered={data.totalDelivered}
        deliveryRatePct={data.deliveryRatePct}
        automationSettings={data.automationSettings}
        categories={data.categories}
        brands={data.brands}
        districts={data.districts}
      />
    </div>
  );
}
