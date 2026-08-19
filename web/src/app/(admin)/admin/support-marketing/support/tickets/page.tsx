import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import db from "@/lib/db";
import { getAdminSupportTicketsAction } from "@/actions/admin/support-marketing/support/tickets";
import { TicketsTable } from "@/components/admin/support-marketing/support/tickets/tickets-table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support Tickets | Meawland Admin",
  description:
    "Manage and resolve customer support tickets and live inquiries.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSupportTicketsPage() {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const [ticketsRes, rawCustomers] = await Promise.all([
    getAdminSupportTicketsAction(),
    db.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
      },
    }),
  ]);

  const tickets = ticketsRes.tickets || [];
  const stats = ticketsRes.stats || {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading tickets...
          </div>
        }
      >
        <TicketsTable
          tickets={tickets}
          stats={stats}
          customers={rawCustomers}
        />
      </Suspense>
    </div>
  );
}
