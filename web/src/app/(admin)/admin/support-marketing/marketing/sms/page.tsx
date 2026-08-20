import React from "react";
import { getSmsMarketingPageDataAction } from "@/actions/admin/support-marketing/marketing/sms/data";
import { SmsDashboardView } from "@/components/admin/support-marketing/marketing/sms/sms-dashboard-view";

export const dynamic = "force-dynamic";

export default async function SmsMarketingPage() {
  const { data } = await getSmsMarketingPageDataAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <SmsDashboardView
        initialBalance={data.balance}
        campaigns={data.campaigns}
        templates={data.templates}
        logs={data.logs}
        totalLogs={data.totalLogs}
        automationSettings={data.automationSettings}
        categories={data.categories}
        brands={data.brands}
        districts={data.districts}
      />
    </div>
  );
}
