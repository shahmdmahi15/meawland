"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqList: FAQItem[] = [
  {
    id: "faq-1",
    question: "How do I place an order on Meawland?",
    answer:
      "You can place an order by browsing our products, adding items to your cart, and proceeding to checkout. You'll need to provide shipping information and payment details to complete your purchase.",
  },
  {
    id: "faq-2",
    question: "What are your shipping rates?",
    answer:
      "We offer flat-rate shipping across the country with free delivery on orders over ৳1500.",
  },
  {
    id: "faq-3",
    question: "Do you ship internationally?",
    answer:
      "Currently we deliver nationwide across Bangladesh with fast and reliable shipping partners.",
  },
  {
    id: "faq-4",
    question: "How can I track my order?",
    answer:
      "Once your order ships, you will receive an SMS and email notification with your live tracking code.",
  },
  {
    id: "faq-5",
    question: "How do I initiate a return?",
    answer:
      "Contact our customer support team within 7 days of receiving your package for hassle-free returns.",
  },
  {
    id: "faq-6",
    question: "How do I choose the right size pet clothing?",
    answer:
      "Please refer to the size chart on each product page measuring your cat's neck, chest, and back length.",
  },
  {
    id: "faq-7",
    question: "What payment methods do you accept?",
    answer:
      "We accept bKash, Nagad, Rocket, Credit/Debit Cards, and Cash on Delivery.",
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>("faq-1");

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container max-w-6xl px-4 mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-[#56C8D8] font-bold text-xs sm:text-sm max-w-md mx-auto">
            Find quick answers to common questions about orders, shipping,
            returns, and more.
          </p>
        </div>

        {/* FAQ Outer Container */}
        <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2.5rem] p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Animated FAQ Cat GIF */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="relative w-full max-w-xs h-64 sm:h-80">
                <Image
                  src="/faq-cat.gif"
                  alt="FAQ Cat Animation"
                  fill
                  unoptimized
                  sizes="320px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Right Accordion Questions List */}
            <div className="lg:col-span-7 space-y-3">
              {faqList.map((faq) => {
                const isOpen = openId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border-b border-gray-200/80 pb-3 pt-1 transition-all"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#56C8D8] transition-colors">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform duration-300 shrink-0 ${
                          isOpen ? "rotate-180 text-[#56C8D8]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed animate-in fade-in duration-300 pr-4">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
