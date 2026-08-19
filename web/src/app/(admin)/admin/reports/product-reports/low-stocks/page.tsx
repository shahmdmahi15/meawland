import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminLowStocksReportAction } from "@/actions/admin/reports";
import { LowStockReportView } from "@/components/admin/reports/low-stock-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Low Stocks & Inventory Report | Meawland Admin",
  description:
    "Monitor low inventory thresholds, out of stock products, and restocking triggers.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LowStocksReportPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminLowStocksReportAction(10);

  const initialData = res.data || {
    threshold: 10,
    totalLowStockCount: 0,
    outOfStockCount: 0,
    criticalStockCount: 0,
    warningStockCount: 0,
    items: [],
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <LowStockReportView initialData={initialData} />
    </div>
  );
}
