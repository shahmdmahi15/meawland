import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { AdminScanView } from "@/components/admin/scan/admin-scan-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Barcode Scanner & POS Hub | Meawland Admin",
  description:
    "Unified omni-scanner hub for barcode inventory management, stock modification, returns processing, and in-store POS checkout.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminScanPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <AdminScanView />
    </div>
  );
}
