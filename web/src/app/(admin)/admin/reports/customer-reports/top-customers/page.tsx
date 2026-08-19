import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminTopCustomersReportAction } from "@/actions/admin/reports";
import { TopCustomersReportView } from "@/components/admin/reports/top-customers-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Customers Report | Meawland Admin",
  description:
    "Customer lifetime value, order frequency, loyalty tiers and top spending buyers.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TopCustomersReportPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminTopCustomersReportAction("all");

  const initialData = res.data || {
    timeframe: "all" as const,
    totalTopCustomers: 0,
    totalTopRevenue: 0,
    customers: [],
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <TopCustomersReportView initialData={initialData} />
    </div>
  );
}
