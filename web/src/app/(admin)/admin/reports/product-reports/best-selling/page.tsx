import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminBestSellingProductsReportAction } from "@/actions/admin/reports";
import { BestSellingReportView } from "@/components/admin/reports/best-selling-report-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Selling Products Report | Meawland Admin",
  description:
    "Analyze best selling pet supplies, velocity, revenue and inventory levels.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function BestSellingReportPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminBestSellingProductsReportAction("30d");

  const initialData = res.data || {
    timeframe: "30d" as const,
    totalProductsSold: 0,
    totalRevenue: 0,
    topSellingItems: [],
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <BestSellingReportView initialData={initialData} />
    </div>
  );
}
