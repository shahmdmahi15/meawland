import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Award,
  Truck,
  Users,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us | Meawland - Dedicated Pet Wellness & Essentials",
  description:
    "Learn about Meawland's journey to bring 100% genuine pet food, soothing grooming care, and handcrafted fashion to pet lovers across Bangladesh.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "100% Genuine & Safe",
    description:
      "We strictly source veterinary-approved, toxin-free formulas, ensuring your pets consume only pure nutrients and safe grooming gels.",
  },
  {
    icon: Heart,
    title: "Pet-First Compassion",
    description:
      "Every single recipe, collar, dress, and toy is tested for comfort, durability, and feline happiness before it reaches our catalog.",
  },
  {
    icon: Truck,
    title: "Lightning Express Delivery",
    description:
      "Fast, dependable nationwide logistics ensuring your cat never runs out of their favorite food or urgent medical supplies.",
  },
  {
    icon: Users,
    title: "Community of Pet Lovers",
    description:
      "We are proud to serve over 10,000 pet parents across Dhaka, Chattogram, Sylhet, and every corner of Bangladesh.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <section className="relative w-full pt-28 sm:pt-32 md:pt-36 pb-12 bg-linear-to-b from-[#ddf0fb] via-[#e8f5fc] to-[#F0F8FF] rounded-b-[2.5rem] md:rounded-b-[4rem] flex items-center justify-center overflow-hidden px-4 text-center">
        {/* Soft Background Blur Blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#B2E2FF]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#56C8D8]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 backdrop-blur-xs text-[#56C8D8] text-xs font-black uppercase tracking-wider shadow-2xs border border-[#B2E2FF]">
            <Sparkles className="w-3.5 h-3.5" />
            Our Story & Mission
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Crafted with Love for{" "}
            <span
              className="text-[#56C8D8] uppercase font-[family-name:var(--font-chewy)] tracking-wider text-4xl sm:text-5xl md:text-7xl inline-block"
              style={{ fontFamily: "var(--font-chewy), cursive" }}
            >
              Every Pet
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
            Meawland was founded with a simple yet passionate mission: to
            provide Bangladeshi pet parents with accessible, 100% genuine
            nutrition, soothing grooming care, and adorable comfort fashion.
          </p>
        </div>
      </section>

      {/* Main Story Content Container */}
      <div className="container max-w-6xl px-4 sm:px-6 md:px-8 mx-auto mt-12 space-y-16">
        {/* Story Grid Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#56C8D8] uppercase tracking-wider">
              <Award className="w-4 h-4" />
              How We Started
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
              From Passionate Pet Parents to Bangladesh&apos;s Leading Store
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              We started Meawland after noticing the frustration fellow pet
              owners faced trying to find reliable, genuine pet food and safe
              fungal-free grooming shampoos.
            </p>

            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Today, Meawland stands as a complete pet ecosystem. From our
              acclaimed DermaPaws anti-fungal shower gels and Milky Sandwich
              treats to royal handmade dresses and break-away collars, every
              product is curated with the health and happiness of your furry
              companion at heart.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs font-bold text-gray-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Authentic Products</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>7-Day Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Story Visual Box */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full aspect-4/3 max-w-md rounded-3xl overflow-hidden shadow-xl border border-[#D4EEFC] bg-[#F0F8FF] p-6 flex items-center justify-center">
              <Image
                src="/best-product-cat.gif"
                alt="Meawland Happy Cat"
                fill
                unoptimized
                sizes="400px"
                className="object-contain p-4"
              />
            </div>
          </div>
        </div>

        {/* Core Values 4-Card Grid */}
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              What Drives Us Every Day
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold">
              The core principles behind every product, formula, and package we
              deliver.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F0F8FF]/80 hover:bg-white border border-[#D4EEFC] rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 space-y-3 flex flex-col justify-between"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D4EEFC] text-[#56C8D8] flex items-center justify-center shadow-2xs">
                    <Icon className="w-6 h-6 stroke-[1.75]" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-black text-gray-900">
                      {val.title}
                    </h4>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-linear-to-r from-[#ddf0fb] via-[#e5f4fd] to-[#F0F8FF] border border-[#D4EEFC] rounded-3xl md:rounded-[3rem] p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left shadow-xs">
          <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
              Ready to Treat Your Pet?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Explore our curated collections of cat food, grooming gels, and
              handcrafted accessories with home delivery.
            </p>
          </div>

          <Link href="/category/pet-food">
            <Button
              size="lg"
              className="bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-full px-8 py-6 shadow-md transition-all hover:scale-105 active:scale-95 border-0 flex items-center gap-2"
            >
              <span>Explore Store</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
