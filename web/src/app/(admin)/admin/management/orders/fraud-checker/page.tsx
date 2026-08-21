import { Metadata } from "next";
import { FraudCheckerSearchView } from "@/components/admin/fraud-checker/fraud-checker-search-view";

export const metadata: Metadata = {
  title: "Fraud Checker & Delivery Risk Intelligence | Admin | Meawland",
  description:
    "Query real-time delivery success ratios, return percentages, and community fraud complaints across all integrated couriers with FraudSpy.",
};

export const dynamic = "force-dynamic";

export default function AdminFraudCheckerPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      <FraudCheckerSearchView />
    </div>
  );
}
