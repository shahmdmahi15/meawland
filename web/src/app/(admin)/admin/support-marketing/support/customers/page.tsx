import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminCustomersAction } from "@/actions/admin/support-marketing/support/customers";
import { CustomersTable } from "@/components/admin/support-marketing/support/customers/customers-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer Management | Meawland Admin",
  description:
    "View and manage registered customers, order volume, and lifetime records.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCustomersPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminCustomersAction();

  const customers = res.customers || [];
  const stats = res.stats || {
    totalCustomers: 0,
    activeBuyers: 0,
    totalRevenue: 0,
    totalInquiries: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading customers...
          </div>
        }
      >
        <CustomersTable customers={customers} stats={stats} />
      </Suspense>
    </div>
  );
}
