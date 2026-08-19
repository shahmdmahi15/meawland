import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeView } from "@/components/root/newsletter/unsubscribe-view";

export const metadata: Metadata = {
  title: "Unsubscribe from Newsletter | Meawland",
  description:
    "Manage your newsletter subscription preferences for Meawland pet club.",
  robots: {
    index: false,
    follow: false,
  },
};

interface UnsubscribePageProps {
  searchParams: Promise<{
    email?: string;
  }>;
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const resolved = await searchParams;
  const email = resolved.email || "";

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <UnsubscribeView initialEmail={email} />
    </div>
  );
}
