"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Send,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { subscribeNewsletterAction } from "@/actions/root/newsletter";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    startTransition(async () => {
      const res = await subscribeNewsletterAction(email, "FOOTER");
      if (res.success) {
        setIsSubscribed(true);
        toast.success(res.message);
        setEmail("");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <footer className="bg-white pt-8 text-gray-800">
      <div className="mx-auto">
        {/* Large Rounded Light-Blue Box */}
        <div className="bg-linear-to-b from-[#F0F8FF] to-[#E5F4FD] border-t border-x border-[#D4EEFC] rounded-tl-[2.5rem] rounded-tr-[2.5rem] sm:rounded-tl-[3.5rem] sm:rounded-tr-[3.5rem] p-6 sm:p-10 lg:p-14 shadow-xs space-y-12">
          {/* Top Brand Banner Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#D4EEFC] pb-10">
            {/* Left Animated Sleeping Cat GIF */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative w-56 sm:w-68 md:w-76 lg:w-84 h-56 sm:h-68 md:h-76 lg:h-84">
                <Image
                  src="/footer-cat.gif"
                  alt="Footer cat animation"
                  fill
                  unoptimized
                  loading="eager"
                  sizes="340px"
                  className="object-contain drop-shadow-md"
                />
              </div>
            </div>

            {/* Right Brand Info */}
            <div className="lg:col-span-8 space-y-3 text-center lg:text-left">
              <Link href="/" className="inline-block mb-1">
                <Image
                  src="/logo.png"
                  alt="Meawland Logo"
                  width={180}
                  height={60}
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </Link>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed max-w-2xl">
                Meawland is Bangladesh&apos;s premier destination for genuine
                pet nutrition, anti-fungal grooming care, handcrafted fashion,
                and playful accessories. Committed to 100% pet wellness,
                transparent pricing, and ultra-fast nationwide doorstep
                delivery.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs font-bold text-gray-700">
                <span className="inline-flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-[#D4EEFC] shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-[#56C8D8]" />
                  100% Genuine Pet Essentials
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-full border border-[#D4EEFC] shadow-2xs">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Fast Nationwide Express Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Middle Links & Newsletter Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Newsletter Subscribe */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Stay in the Loop 🐾
                </h3>
                <p className="text-xs text-gray-600 font-medium max-w-sm leading-relaxed">
                  Join our VIP pet parent club for exclusive discounts, new
                  product drops, and vet-backed grooming tips.
                </p>
              </div>

              {isSubscribed ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 flex items-center gap-2 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You&apos;re subscribed to Meawland updates!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address..."
                      required
                      className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#56C8D8]/50 shadow-xs"
                    />
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-black text-xs px-5 py-2.5 rounded-full shadow-md cursor-pointer border-0 shrink-0 gap-1.5"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <>
                          <span>Subscribe</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    By subscribing you agree to our{" "}
                    <Link
                      href="/privacy"
                      className="text-[#56C8D8] hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    . Unsubscribe anytime.
                  </p>
                </form>
              )}

              {/* Contact Mini Strip */}
              <div className="pt-2 space-y-1.5 text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#56C8D8]" />
                  <span>+880 1886-070809 (Helpline & WhatsApp)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#56C8D8]" />
                  <span>support@meawland.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#56C8D8]" />
                  <span>Dhaka, Bangladesh</span>
                </div>
              </div>
            </div>

            {/* Right Links Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs font-bold">
              {/* Column 1: SHOP */}
              <div className="space-y-3">
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  SHOP
                </h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>
                    <Link
                      href="/category/pet-accessories"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Accessories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-care"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Care & Grooming
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-food"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Food & Treats
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-medicine"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Medicine & Health
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-dress"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Dresses & Costumes
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-toy"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Toys & Play
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-litter"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Pet Litter & Hygiene
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: USEFUL LINKS */}
              <div className="space-y-3">
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  QUICK LINKS
                </h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>
                    <Link
                      href="/products"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Home Shop
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/account"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cart"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Shopping Cart
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/wishlist"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Saved Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/track"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Track My Order
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/support"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Support Ticket
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: CUSTOMER SERVICE */}
              <div className="space-y-3">
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  CUSTOMER SERVICE
                </h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/faq"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/returns"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Returns & Refund
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="hover:text-[#56C8D8] transition-colors"
                    >
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: SOCIAL LINKS & PAYMENTS */}
              <div className="space-y-3">
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  CONNECT WITH US
                </h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#56C8D8] transition-colors flex items-center gap-1.5"
                    >
                      <span>Facebook Community</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#56C8D8] transition-colors flex items-center gap-1.5"
                    >
                      <span>Instagram</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://tiktok.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#56C8D8] transition-colors flex items-center gap-1.5"
                    >
                      <span>TikTok</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://wa.me/8801886070809"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                    >
                      <span>WhatsApp Support</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Login Link */}
          <div className="pt-6 border-t border-[#D4EEFC] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-bold">
            <p>
              © {new Date().getFullYear()} Meawland Pet Store. All rights
              reserved. A product of RoyalMotionIT.
            </p>
            <div className="flex items-center gap-1">
              <span>Looking for admin portal?</span>
              <Link
                href="/login"
                className="text-gray-900 font-black hover:text-[#56C8D8] transition-colors"
              >
                Log in here →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
