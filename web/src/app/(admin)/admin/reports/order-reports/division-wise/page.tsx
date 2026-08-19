import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminDivisionWiseOrderReportAction } from "@/actions/admin/reports";
import { DivisionWiseReportView } from "@/components/admin/reports/division-wise-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Division-Wise Order Reports | Meawland Admin",
  description:
    "View regional order volume, revenue share, and district breakdowns across 8 divisions of Bangladesh.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DivisionWiseReportPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminDivisionWiseOrderReportAction("all");

  const initialData = res.data || {
    timeframe: "all" as const,
    totalOrders: 0,
    totalRevenue: 0,
    divisions: [],
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <DivisionWiseReportView initialData={initialData} />
    </div>
  );
}
