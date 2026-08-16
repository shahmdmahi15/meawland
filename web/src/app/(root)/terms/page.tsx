import { Metadata } from "next";
import Link from "next/link";
import { Scale, ShoppingBag, Truck, ShieldAlert, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions | Meawland",
  description:
    "Read Meawland's Terms and Conditions regarding store purchases, nationwide deliveries, returns, warranties, and account policies.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms & Conditions | Meawland",
    description:
      "Read Meawland's Terms and Conditions regarding store purchases, nationwide deliveries, returns, warranties, and account policies.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Hero Header */}
      <section className="relative w-full pt-28 sm:pt-32 md:pt-36 pb-10 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[4rem] flex items-center justify-center overflow-hidden px-4 text-center">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <Scale className="w-3.5 h-3.5" />
            Terms of Service
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Terms &{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Conditions
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-lg mx-auto">
            Last Updated: February 2026. Please read these terms carefully
            before using or purchasing from the Meawland platform.
          </p>
        </div>
      </section>

      {/* Content Container */}
      <div className="container max-w-4xl px-4 sm:px-6 md:px-8 mx-auto mt-12 space-y-8 text-gray-700 leading-relaxed text-xs sm:text-sm">
        {/* Section 1 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#56C8D8]" />
            1. Orders & Pricing
          </h2>
          <p className="text-gray-600 font-medium">
            All prices displayed on Meawland are listed in Bangladeshi Taka
            (BDT) and include applicable VAT unless stated otherwise.
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-gray-600 font-medium">
            <li>
              We reserve the right to modify prices, discounts, and product
              availability without prior notice.
            </li>
            <li>
              An order confirmation does not signify our final acceptance of an
              order; we reserve the right to cancel orders in case of pricing
              errors or stock unavailability, in which case full refunds will be
              issued immediately.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#56C8D8]" />
            2. Shipping & Delivery Terms
          </h2>
          <p className="text-gray-600 font-medium">
            We partner with reliable courier services to ensure safe nationwide
            delivery:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-gray-600 font-medium">
            <li>
              Delivery inside Dhaka is typically fulfilled within 24–48 hours.
            </li>
            <li>
              Nationwide delivery outside Dhaka is typically fulfilled within
              2–4 business days.
            </li>
            <li>
              Customers are requested to inspect the exterior package upon
              delivery before signing.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#56C8D8]" />
            3. Product Usage & Veterinary Advice
          </h2>
          <p className="text-gray-600 font-medium">
            Information provided on Meawland regarding food, treats, shampoo,
            and wellness products is intended for general guidance only and is
            not a substitute for professional veterinary diagnosis or treatment.
          </p>
          <p className="text-gray-600 font-medium">
            If your pet has specific chronic allergies, illnesses, or dietary
            restrictions, always consult your veterinarian before introducing
            new medications or diets.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#56C8D8]" />
            4. Intellectual Property & Brand Rights
          </h2>
          <p className="text-gray-600 font-medium">
            All text, logos, imagery, graphics, UI animations, and product
            descriptions on Meawland are the exclusive intellectual property of
            Meawland and its licensors. Unauthorized reproduction, scraping, or
            commercial re-use is strictly prohibited.
          </p>
        </div>

        {/* Contact Footer */}
        <div className="p-6 bg-white border border-gray-200 rounded-3xl space-y-2 text-center">
          <p className="font-bold text-gray-900">
            Questions regarding our Terms & Conditions?
          </p>
          <p className="text-xs text-gray-500">
            Contact us at{" "}
            <Link
              href="/contact"
              className="text-[#56C8D8] font-bold hover:underline"
            >
              our support center
            </Link>{" "}
            or email support@meawland.com.
          </p>
        </div>
      </div>
    </main>
  );
}
