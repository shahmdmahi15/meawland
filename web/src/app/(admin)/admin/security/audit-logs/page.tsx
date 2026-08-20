import React from "react";
import type { Metadata } from "next";
import { getAuditLogsPageDataAction } from "@/actions/admin/security/audit-logs/data";
import { AuditLogsDashboard } from "@/components/admin/security/audit-logs/audit-logs-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Audit Logs & Security Trail | Meawland Admin",
  description:
    "Review immutable historical records of system operations, order updates, stock adjustments, and administrative role modifications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AuditLogsPage() {
  const { data } = await getAuditLogsPageDataAction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <AuditLogsDashboard
        initialLogs={data.logs}
        totalLogs={data.total}
        stats={data.stats}
        adminUsers={data.adminUsers}
      />
    </div>
  );
}
