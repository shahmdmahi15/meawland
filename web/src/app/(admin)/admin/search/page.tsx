import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import { SearchEntityType } from "@/schemas/admin/search";
import { adminGlobalSearchAction } from "@/actions/admin/search";
import { AdminSearchView } from "@/components/admin/search/admin-search-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Omnisearch | Meawland Admin",
  description:
    "Global search across products, orders, customers, support tickets, and offers.",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminSearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
}

export default async function AdminSearchPage({
  searchParams,
}: AdminSearchPageProps) {
  const session = await getMeAction();
  if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
    redirect("/admin");
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const type = (resolvedParams.type as SearchEntityType) || "ALL";

  const searchRes = await adminGlobalSearchAction(query, type, 30);
  const initialResults = searchRes.results;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <AdminSearchView
        initialResults={initialResults}
        initialQuery={query}
        initialType={type}
      />
    </div>
  );
}
