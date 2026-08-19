import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminNewCustomersReportAction } from "@/actions/admin/reports";
import { NewCustomersReportView } from "@/components/admin/reports/new-customers-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Customers Cohorts | Meawland Admin",
  description:
    "User registration trends, first-order conversion rates and acquisition by division.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function NewCustomersReportPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminNewCustomersReportAction("30d");

  const initialData = res.data || {
    timeframe: "30d" as const,
    totalNewCustomers: 0,
    convertedCount: 0,
    conversionRate: 0,
    customers: [],
    divisionDistribution: {},
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <NewCustomersReportView initialData={initialData} />
    </div>
  );
}
