import { Metadata } from "next";
import { FAQ } from "@/components/root/faq";
import { FaqJsonLd } from "@/components/seo/structured-data";

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

const FAQ_SNIPPETS = [
  {
    question: "How do I place an order on Meawland?",
    answer:
      "You can place an order by browsing our categories or products, adding items to your cart, and proceeding to checkout. Fill in your delivery address and contact number to complete your order within 2 minutes.",
  },
  {
    question: "What are your delivery charges and delivery times?",
    answer:
      "We deliver inside Dhaka within 24-48 hours (৳70 delivery fee) and nationwide across Bangladesh within 2-4 business days (৳130 delivery fee). Free delivery is automatically applied on orders over ৳1500.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and all major Bangladeshi Visa / Mastercard debit & credit cards through our secure payment gateway.",
  },
  {
    question: "What is your return & replacement policy?",
    answer:
      "We provide a 7-day hassle-free return and replacement policy. If any item arrives damaged, expired, or incorrect, reach out to our team with a photo/video and we will arrange a replacement or refund immediately.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-white pb-20 pt-16 sm:pt-20 md:pt-24">
      <FaqJsonLd faqs={FAQ_SNIPPETS} />
      <FAQ />
    </main>
  );
}
