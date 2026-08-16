"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import {
  ChevronDown,
  Search,
  HelpCircle,
  MessageCircleQuestion,
  PhoneCall,
  Sparkles,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FAQItem {
  id: string;
  category: "ORDERS" | "PRODUCTS" | "RETURNS" | "PAYMENT";
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: "faq-1",
    category: "ORDERS",
    question: "How do I place an order on Meawland?",
    answer:
      "You can place an order by browsing our categories or products, adding items to your cart, and proceeding to checkout. Fill in your delivery address and contact number to complete your order within 2 minutes.",
  },
  {
    id: "faq-2",
    category: "ORDERS",
    question: "What are your delivery charges and delivery times?",
    answer:
      "We deliver inside Dhaka within 24-48 hours (৳70 delivery fee) and nationwide across Bangladesh within 2-4 business days (৳130 delivery fee). Free delivery is automatically applied on orders over ৳1500.",
  },
  {
    id: "faq-3",
    category: "PAYMENT",
    question: "What payment methods do you accept?",
    answer:
      "We accept Cash on Delivery (COD), bKash, Nagad, Rocket, and all major Bangladeshi Visa / Mastercard debit & credit cards through our secure payment gateway.",
  },
  {
    id: "faq-4",
    category: "PRODUCTS",
    question: "How do I pick the right size for dresses & collars?",
    answer:
      "Every clothing and collar item includes an easy sizing guide. Simply measure your cat's neck circumference, chest girth, and back length. If between sizes, we recommend choosing the larger size for maximum comfort.",
  },
  {
    id: "faq-5",
    category: "RETURNS",
    question: "What is your return & replacement policy?",
    answer:
      "We provide a 7-day hassle-free return and replacement policy. If any item arrives damaged, expired, or incorrect, reach out to our team with a photo/video and we will arrange a replacement or refund immediately.",
  },
  {
    id: "faq-6",
    category: "PRODUCTS",
    question: "Are your shampoo & grooming products safe for kittens?",
    answer:
      "Yes! Our Meawland signature grooming care products, including DermaPaws and Flea Free Shower Gel, are pH-balanced, non-toxic, and safe for cats and kittens older than 8 weeks.",
  },
  {
    id: "faq-7",
    category: "ORDERS",
    question: "How can I track my live order shipment?",
    answer:
      "Once your order is processed and dispatched with our courier partner, you will receive an instant SMS and email with a live tracking link to follow your parcel's progress in real-time.",
  },
];

type FilterCategory = "ALL" | "ORDERS" | "PRODUCTS" | "RETURNS" | "PAYMENT";

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>("faq-1");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>("ALL");

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_LIST.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesQ = item.question.toLowerCase().includes(q);
        const matchesA = item.answer.toLowerCase().includes(q);
        return matchesQ || matchesA;
      }
      return true;
    });
  }, [search, selectedCategory]);

  return (
    <section className="py-16 md:py-24 bg-linear-to-b from-white via-[#F0F8FF]/50 to-white relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-1/3 -right-32 w-80 h-80 bg-[#ddf0fb]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="container max-w-7xl px-4 sm:px-6 md:px-8 mx-auto space-y-10 sm:space-y-14 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#56C8D8]/10 text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs">
            <HelpCircle className="h-3.5 w-3.5" />
            Got Questions? We&apos;ve Got Answers
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Frequently Asked{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-6xl lg:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Questions
            </span>
          </h2>

          <p className="text-gray-500 font-semibold text-xs sm:text-sm md:text-base">
            Find quick solutions about placing orders, shipping timelines,
            product care, and our 7-day return guarantee.
          </p>
        </div>

        {/* Search & Category Filter Tools */}
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Quick Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="h-10 pl-9 pr-8 text-xs sm:text-sm bg-[#F0F8FF]/80 border-[#D4EEFC] rounded-2xl focus-visible:ring-[#56C8D8]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "ORDERS", label: "Delivery & Orders" },
                { id: "PAYMENT", label: "Payment" },
                { id: "PRODUCTS", label: "Care & Sizing" },
                { id: "RETURNS", label: "Returns" },
              ] as const
            ).map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer",
                    isActive
                      ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-xs"
                      : "bg-[#F0F8FF]/60 text-gray-600 border-[#D4EEFC] hover:bg-white",
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Outer Container */}
        <div className="max-w-6xl mx-auto bg-[#F0F8FF] border border-[#D4EEFC] rounded-3xl md:rounded-[3rem] p-6 sm:p-10 lg:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Animated FAQ Cat GIF */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 shrink-0 flex items-center justify-center">
                <Image
                  src="/faq-cat.gif"
                  alt="FAQ Cat Animation"
                  fill
                  unoptimized
                  sizes="384px"
                  className="object-contain drop-shadow-md"
                />
              </div>

              <div className="bg-white/80 backdrop-blur-xs border border-[#D4EEFC] rounded-2xl p-4 w-full max-w-xs shadow-2xs space-y-1">
                <p className="text-xs font-black text-gray-900">
                  Still have questions?
                </p>
                <p className="text-[11px] text-gray-500 font-semibold">
                  Our pet-care team is available on WhatsApp 24/7.
                </p>
              </div>
            </div>

            {/* Right Accordion Questions List */}
            <div className="lg:col-span-7 space-y-3">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-white/70 rounded-2xl p-6 border border-dashed border-[#D4EEFC]">
                  <MessageCircleQuestion className="w-8 h-8 text-[#56C8D8] mx-auto" />
                  <p className="text-sm font-bold text-gray-700">
                    No questions found matching &quot;{search}&quot;
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory("ALL");
                    }}
                    className="text-xs rounded-full border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white"
                  >
                    Reset Search
                  </Button>
                </div>
              ) : (
                filteredFAQs.map((faq) => {
                  const isOpen = openId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={cn(
                        "rounded-2xl transition-all duration-300 border bg-white p-4 sm:p-5 shadow-2xs",
                        isOpen
                          ? "border-[#56C8D8] ring-2 ring-[#56C8D8]/15"
                          : "border-gray-100 hover:border-[#D4EEFC]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFAQ(faq.id)}
                        className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                      >
                        <span className="text-xs sm:text-sm md:text-base font-black text-gray-900 group-hover:text-[#56C8D8] transition-colors leading-snug">
                          {faq.question}
                        </span>
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                            isOpen
                              ? "bg-[#56C8D8] text-white rotate-180"
                              : "bg-[#F0F8FF] text-gray-500 group-hover:bg-[#56C8D8]/10 group-hover:text-[#56C8D8]",
                          )}
                        >
                          <ChevronDown className="w-4 h-4 transition-transform" />
                        </div>
                      </button>

                      {isOpen && (
                        <p className="mt-3 pt-3 border-t border-gray-100 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed animate-in fade-in duration-200">
                          {faq.answer}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
