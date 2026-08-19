import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { getAdminNewsletterSubscribersAction } from "@/actions/admin/support-marketing/marketing/newsletter";
import { NewsletterTable } from "@/components/admin/support-marketing/marketing/newsletter/newsletter-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Newsletter Management | Meawland Admin",
  description:
    "View and manage email newsletter subscribers, export subscriber lists, and dispatch broadcasts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminNewsletterPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const res = await getAdminNewsletterSubscribersAction();

  const subscribers = res.subscribers || [];
  const stats = res.stats || {
    totalSubscribers: 0,
    activeSubscribers: 0,
    unsubscribedCount: 0,
    newThisMonthCount: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <NewsletterTable subscribers={subscribers} stats={stats} />
    </div>
  );
}
