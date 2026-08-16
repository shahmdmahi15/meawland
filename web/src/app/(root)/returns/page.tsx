import { Metadata } from "next";
import Link from "next/link";
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Truck,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Returns & Refund Policy | Meawland",
  description:
    "Review Meawland's 7-Day hassle-free return, replacement, and refund policy for all pet food, grooming care, clothing, and accessories.",
};

const STEPS = [
  {
    step: "01",
    title: "Initiate Request",
    description:
      "Contact our WhatsApp helpline (+880 1886-070809) or email support@meawland.com within 7 days of receiving your order with your Order ID and photo/video.",
  },
  {
    step: "02",
    title: "Verification & Pickup",
    description:
      "Our support team verifies your request within 24 hours and arranges a reverse pickup from your doorstep or provides return dispatch instructions.",
  },
  {
    step: "03",
    title: "Quality Inspection",
    description:
      "Once received at our fulfillment center, we inspect the returned item to ensure original tags/packaging are intact.",
  },
  {
    step: "04",
    title: "Instant Replacement or Refund",
    description:
      "We immediately dispatch your replacement item or process a refund via bKash/Nagad/Card within 3–5 business days.",
  },
];

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Hero Header */}
      <section className="relative w-full pt-28 sm:pt-32 md:pt-36 pb-10 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[4rem] flex items-center justify-center overflow-hidden px-4 text-center">
        <div className="relative z-10 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <RotateCcw className="w-3.5 h-3.5" />
            100% Satisfaction Guarantee
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Returns &{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Refunds
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-lg mx-auto">
            We want you and your furry friend to be 100% delighted. If anything
            isn&apos;t right, our 7-day hassle-free policy is here to help.
          </p>
        </div>
      </section>

      {/* Policy Details Container */}
      <div className="container max-w-5xl px-4 sm:px-6 md:px-8 mx-auto mt-12 space-y-12">
        {/* 4-Step Process Grid */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              How the Return Process Works
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold">
              4 simple steps to replace an item or claim a refund.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="bg-[#F0F8FF]/80 border border-[#D4EEFC] rounded-3xl p-6 shadow-2xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-[#56C8D8]">
                    {s.step}
                  </span>
                  <Sparkles className="w-4 h-4 text-[#56C8D8]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-gray-900">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Eligible Conditions */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-lg font-black">
                Eligible for Return / Exchange
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Product arrived damaged, defective, or expired.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>Incorrect item, color, or size delivered.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>
                  Clothing/collar size mismatch (unworn with original tags).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>
                  Unopened pet accessories and sealed grooming bottles.
                </span>
              </li>
            </ul>
          </div>

          {/* Non-Eligible Conditions */}
          <div className="bg-rose-50/50 border border-rose-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-lg font-black">Non-Eligible Items</h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  Opened or partially consumed pet food packets / treats.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  Prescription medications once package seal is broken.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>Items returned after the 7-day window.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-600 font-bold">•</span>
                <span>
                  Damage caused by pet bites, chewing, or mishandling.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Refund Details */}
        <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-gray-900">
            Refund Methods & Timelines
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
            Refunds are issued to the original payment method used during
            checkout:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs font-bold text-gray-800">
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-1">
              <span className="text-[#56C8D8] block">bKash / Nagad</span>
              <span className="text-sm font-black text-gray-900">
                24–48 Hours
              </span>
              <p className="text-[11px] text-gray-500 font-normal">
                Direct mobile wallet transfer
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-1">
              <span className="text-[#56C8D8] block">Credit / Debit Card</span>
              <span className="text-sm font-black text-gray-900">
                3–5 Business Days
              </span>
              <p className="text-[11px] text-gray-500 font-normal">
                Depending on issuing bank
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-gray-200/80 space-y-1">
              <span className="text-[#56C8D8] block">Store Credit</span>
              <span className="text-sm font-black text-gray-900">Instant</span>
              <p className="text-[11px] text-gray-500 font-normal">
                Use on any future purchase
              </p>
            </div>
          </div>
        </div>

        {/* Fast Track Assistance Banner */}
        <div className="bg-linear-to-r from-emerald-500 to-[#56C8D8] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black">
              Need Help with a Return?
            </h3>
            <p className="text-xs sm:text-sm text-white/90">
              Message our WhatsApp helpline with your Order ID for instant
              return processing.
            </p>
          </div>

          <a
            href="https://wa.me/8801886070809"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 font-black text-xs uppercase tracking-wider rounded-full px-6 shadow-md border-0 cursor-pointer flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Us</span>
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
}
