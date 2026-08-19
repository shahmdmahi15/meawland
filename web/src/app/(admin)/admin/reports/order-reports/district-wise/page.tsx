import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminDistrictWiseOrderReportAction } from "@/actions/admin/reports";
import { DistrictWiseReportView } from "@/components/admin/reports/district-wise-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "District-Wise Order Reports | Meawland Admin",
  description:
    "Granular district performance, order volume, revenue and delivery metrics for 64 districts of Bangladesh.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DistrictWiseReportPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminDistrictWiseOrderReportAction("all", "ALL");

  const initialData = res.data || {
    timeframe: "all" as const,
    selectedDivision: "ALL",
    totalOrders: 0,
    totalRevenue: 0,
    districts: [],
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <DistrictWiseReportView initialData={initialData} />
    </div>
  );
}
