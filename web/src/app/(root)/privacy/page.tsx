import { Metadata } from "next";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Meawland",
  description:
    "Learn how Meawland collects, protects, and handles your personal information with full transparency and top security standards.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Meawland",
    description:
      "Learn how Meawland collects, protects, and handles your personal information with full transparency and top security standards.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Hero Header */}
      <section className="relative w-full pt-28 sm:pt-32 md:pt-36 pb-10 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[4rem] flex items-center justify-center overflow-hidden px-4 text-center">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Trust
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Privacy{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Policy
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-lg mx-auto">
            Last Updated: February 2026. Your privacy and the security of your
            personal data is of paramount importance to us.
          </p>
        </div>
      </section>

      {/* Content Container */}
      <div className="container max-w-4xl px-4 sm:px-6 md:px-8 mx-auto mt-12 space-y-8 text-gray-700 leading-relaxed text-xs sm:text-sm">
        {/* Section 1 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#56C8D8]" />
            1. Information We Collect
          </h2>
          <p className="text-gray-600 font-medium">
            When you visit or purchase from Meawland, we collect the following
            information to deliver our services effectively:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-gray-600 font-medium">
            <li>
              <strong>Account & Contact Info:</strong> Name, email address,
              phone number, shipping/billing addresses.
            </li>
            <li>
              <strong>Order Details:</strong> Items purchased, transaction
              amounts, order notes, and pet details if provided.
            </li>
            <li>
              <strong>Payment Information:</strong> Processed securely via
              encrypted gateways (bKash, Nagad, SSLCommerz). We never store
              complete credit/debit card numbers or PINs on our servers.
            </li>
            <li>
              <strong>Device & Usage Data:</strong> IP address, browser type,
              and browsing behavior to optimize website performance.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#56C8D8]" />
            2. How We Use Your Information
          </h2>
          <p className="text-gray-600 font-medium">
            We use your data strictly for legitimate business and customer
            service purposes:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-gray-600 font-medium">
            <li>Processing, packing, and dispatching your orders.</li>
            <li>
              Sending SMS and email notifications with live courier tracking
              links.
            </li>
            <li>
              Providing responsive customer support and resolving
              return/exchange inquiries.
            </li>
            <li>
              Sending promotional offers or newsletters (only if you opt-in; you
              may unsubscribe anytime).
            </li>
            <li>
              Preventing fraudulent transactions and ensuring web platform
              security.
            </li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#56C8D8]" />
            3. Data Protection & Security
          </h2>
          <p className="text-gray-600 font-medium">
            We apply industry-standard SSL (Secure Sockets Layer) 256-bit
            encryption for all data transmissions. Your personal data is stored
            on secure servers with restricted access.
          </p>
          <p className="text-gray-600 font-medium">
            We never sell, rent, or lease your personal information to
            third-party marketers or advertisers under any circumstances.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#56C8D8]" />
            4. Your Rights & Choices
          </h2>
          <p className="text-gray-600 font-medium">
            You have full control over your personal data:
          </p>
          <ul className="space-y-1.5 pl-4 list-disc text-gray-600 font-medium">
            <li>
              You may review, update, or edit your account information anytime.
            </li>
            <li>
              You can request permanent deletion of your account and data.
            </li>
            <li>
              You can opt-out of marketing communications by clicking
              unsubscribe or messaging support.
            </li>
          </ul>
        </div>

        {/* Section 5 */}
        <div className="p-6 bg-white border border-gray-200 rounded-3xl space-y-2 text-center">
          <p className="font-bold text-gray-900">
            Have questions about our Privacy Policy?
          </p>
          <p className="text-xs text-gray-500">
            Email us at{" "}
            <a
              href="mailto:support@meawland.com"
              className="text-[#56C8D8] font-bold hover:underline"
            >
              support@meawland.com
            </a>{" "}
            or call +880 1886-070809.
          </p>
        </div>
      </div>
    </main>
  );
}
