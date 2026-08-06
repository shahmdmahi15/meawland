"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Search, Heart, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavbarAccount } from "@/actions/auth/get-navbar-account";

const navItems = [
  { label: "Pet Accessorice", href: "/category/pet-accessorice" },
  { label: "Pet Care", href: "/category/pet-care" },
  { label: "Pet Food", href: "/category/pet-food" },
  { label: "Pet Medicine", href: "/category/pet-medicine" },
  { label: "Pet Dress", href: "/category/pet-dress" },
  { label: "Pet Toy", href: "/category/pet-toy" },
  { label: "Pet Litter", href: "/category/pet-litter" },
];

export function Header({ user }: { user: NavbarAccount | null }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4">
      <div className="flex items-center w-full max-w-360 gap-3 lg:gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0 group">
          <Image
            src="/logo.png"
            alt="Meawland"
            width={160}
            height={160}
            className="h-14 sm:h-16 md:h-18 w-auto object-contain hover:opacity-80 transition-opacity"
            priority
          />
        </Link>

        {/* Center Desktop Navigation Pill — grows to fill available space */}
        <nav className="hidden lg:flex flex-1 items-center bg-white/30 backdrop-blur-xl rounded-full px-5 xl:px-8 py-3 justify-center gap-4 xl:gap-7 shadow-lg ring-1 ring-white/40 min-w-0 overflow-hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-bold text-gray-800 hover:text-[#56C8D8] whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto lg:ml-0 shrink-0">
          {/* Search bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="flex h-11 md:h-12 w-44 xl:w-56 pl-10 pr-4 py-2 bg-white/30 backdrop-blur-md rounded-full text-sm font-medium text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#56C8D8]/50 focus:w-64 transition-all duration-400 shadow-md border border-white/30"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Wishlist Button */}
          <Link href="/wishlist" className="hidden sm:flex">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/30 backdrop-blur-md h-11 w-11 md:h-12 md:w-12 border border-white/30 shadow-md hover:bg-white/50 transition-all text-gray-700 cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </Link>

          {/* Cart Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full bg-white/30 backdrop-blur-md h-11 w-11 md:h-12 md:w-12 border border-white/30 shadow-md hover:bg-white/50 transition-all text-gray-700 cursor-pointer"
            aria-label="Open cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-[#F97316] text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              0
            </span>
          </Button>
          {user ? (
            <Link href="/account" className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/30 backdrop-blur-md h-11 w-11 md:h-12 md:w-12 border border-white/30 shadow-md hover:bg-white/50 transition-all text-gray-700 cursor-pointer"
                aria-label="Account"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || "User Avatar"}
                    fill
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </Button>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center rounded-full bg-white/30 backdrop-blur-md border border-white/30 shadow-md hover:bg-white/50 transition-all text-gray-700 cursor-pointer font-black text-sm h-11 px-5 md:h-12 md:px-7 hover:scale-105 active:scale-95 whitespace-nowrap"
              title="Login"
            >
              <User className="w-5 h-5 md:hidden" />
              <span className="hidden md:inline">Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
