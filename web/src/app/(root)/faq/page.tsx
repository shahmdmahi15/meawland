import { Metadata } from "next";
import { FAQ } from "@/components/root/faq";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Meawland Pet Store",
  description:
    "Find fast answers to common questions about orders, payments, delivery timelines, product sizing, and 7-day returns at Meawland.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | Meawland Pet Store",
    description:
      "Find fast answers to common questions about orders, payments, delivery timelines, product sizing, and 7-day returns at Meawland.",
    url: "/faq",
  },
};

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white pb-20 pt-16 sm:pt-20 md:pt-24">
      <FAQ />
    </main>
  );
}
