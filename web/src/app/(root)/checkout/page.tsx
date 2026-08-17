import { Metadata } from "next";
import { getCheckoutInitialDataAction } from "@/actions/store/checkout";
import { CheckoutPageView } from "@/components/root/store/checkout-page-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Secure Checkout | Meawland Pet Store",
  description:
    "Complete your order with cash on delivery or bKash payment across Bangladesh.",
};

export default async function CheckoutPage() {
  const result = await getCheckoutInitialDataAction();

  if (!result.success || !result.data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-bold text-rose-600">
          Failed to load checkout information. Please try again.
        </p>
      </div>
    );
  }

  return <CheckoutPageView initialData={result.data} />;
}
