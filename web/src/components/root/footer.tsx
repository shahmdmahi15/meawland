"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-white pt-8 text-gray-800">
      <div className="mx-auto">
        {/* Large Rounded Light-Blue Box */}
        <div className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-tl-3xl rounded-tr-3xl p-6 sm:p-10 lg:p-14 shadow-xs space-y-12">
          {/* Top Brand Banner Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-gray-200/60 pb-10">
            {/* Left Animated Sleeping Cat GIF */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <div className="relative w-48 sm:w-56 h-48 sm:h-56">
                <Image
                  src="/footer-cat.gif"
                  alt="Footer cat animation"
                  fill
                  unoptimized
                  sizes="224px"
                  className="object-contain"
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
                Meawland is your trusted destination for high-quality pet
                products. From nutritious food to premium accessories, we cater
                to all your furry friend&apos;s needs. Our mission is to provide
                the best for your pets, ensuring their happiness and health
                every day.
              </p>
            </div>
          </div>

          {/* Middle Links & Newsletter Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Newsletter Subscribe */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-2xl font-black text-gray-900">
                Stay in the Loop
              </h3>
              <p className="text-xs text-gray-600 font-medium max-w-sm leading-relaxed">
                Be the first to know about new arrivals, exclusive offers, and
                behind-the-scenes stories.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-center gap-2 max-w-md pt-1"
              >
                <input
                  type="email"
                  placeholder="Enter your mail"
                  className="flex-1 bg-white border border-gray-200 rounded-full px-5 py-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#56C8D8]/50 shadow-xs"
                />
                <Button
                  type="submit"
                  className="bg-[#56C8D8] hover:bg-[#38bdf8] text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-md cursor-pointer border-0 shrink-0"
                >
                  Subscribe
                </Button>
              </form>
              <p className="text-[10px] text-gray-400 font-medium">
                By subscribing, you agree to our Privacy Policy. Unsubscribe
                anytime.
              </p>
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
                      href="/category/pet-accesorice"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Accessories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-care"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Care
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-food"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Food
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-medicine"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Medicine
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-dress"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Dresses
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-toy"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Toy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/category/pet-litter"
                      className="hover:text-[#56C8D8]"
                    >
                      Pet Litter
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: USEFUL LINKS */}
              <div className="space-y-3">
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  USEFUL LINKS
                </h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>
                    <Link href="/" className="hover:text-[#56C8D8]">
                      Shop
                    </Link>
                  </li>
                  <li>
                    <Link href="/account" className="hover:text-[#56C8D8]">
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/cart" className="hover:text-[#56C8D8]">
                      Cart
                    </Link>
                  </li>
                  <li>
                    <Link href="/wishlist" className="hover:text-[#56C8D8]">
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link href="/track" className="hover:text-[#56C8D8]">
                      Track Order
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-[#56C8D8]">
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
                    <Link href="/about" className="hover:text-[#56C8D8]">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[#56C8D8]">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-[#56C8D8]">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className="hover:text-[#56C8D8]">
                      Returns & Refund
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-[#56C8D8]">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-[#56C8D8]">
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4: SOCIAL LINKS */}
              <div className="space-y-3">
                <h4 className="text-gray-400 uppercase tracking-widest text-[10px] font-black">
                  SOCIAL LINKS
                </h4>
                <ul className="space-y-2 text-gray-700 font-medium">
                  <li>
                    <a href="#" className="hover:text-[#56C8D8]">
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#56C8D8]">
                      Facebook
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#56C8D8]">
                      Tiktok
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-[#56C8D8]">
                      Whatsapp
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Copyright & Login Link */}
          <div className="pt-6 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 font-bold">
            <p>
              © 2026 Meawland. All rights reserved. A product of RoyalMotionIT.
            </p>
            <div className="flex items-center gap-1">
              <span>Already a member?</span>
              <Link
                href="/login"
                className="text-gray-900 font-black hover:text-[#56C8D8]"
              >
                Log in to your account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
