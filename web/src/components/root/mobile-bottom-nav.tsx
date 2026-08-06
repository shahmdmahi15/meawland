"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ShoppingCart, User, Menu } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const categories = [
  { name: "Pet Accesorice", href: "/category/pet-accesorice" },
  { name: "Pet Care", href: "/category/pet-care" },
  { name: "Pet Food", href: "/category/pet-food" },
  { name: "Pet Medicine", href: "/category/pet-medicine" },
  { name: "Pet Dress", href: "/category/pet-dress" },
  { name: "Pet Toy", href: "/category/pet-toy" },
  { name: "Pet Litter", href: "/category/pet-litter" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/search", icon: Search },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
    { label: "Cart", href: "/cart", icon: ShoppingCart },
    { label: "Login", href: "/login", icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm px-2 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <nav className="rounded-full px-2 py-2 flex justify-around items-center h-18 bg-white/20 backdrop-blur-xl shadow-xl ring-1 ring-white/30 transition-all duration-500 hover:bg-white/25">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group ${
                isActive
                  ? "text-[#F97316]"
                  : "text-gray-600 hover:text-[#F97316]"
              }`}
            >
              <div
                className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? "bg-[#F97316]/15 scale-110 shadow-inner"
                    : "group-hover:bg-[#F97316]/10 group-hover:scale-105 active:scale-90"
                }`}
              >
                <Icon className="w-5 h-5 transition-all" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.15em] transition-all duration-300 hidden opacity-100 scale-105">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#F97316] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              )}
            </Link>
          );
        })}

        {/* Menu Sheet Trigger */}
        <Sheet open={openMenu} onOpenChange={setOpenMenu}>
          <SheetTrigger
            render={
              <button
                className="flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group text-gray-600 hover:text-[#F97316]"
                aria-label="Categories menu"
              >
                <div className="p-2.5 rounded-full transition-all duration-300 flex items-center justify-center group-hover:bg-[#F97316]/10 group-hover:scale-105 active:scale-90">
                  <Menu className="w-5 h-5" />
                </div>
              </button>
            }
          />
          <SheetContent side="bottom" className="rounded-t-3xl p-6 bg-white">
            <SheetHeader>
              <SheetTitle className="text-left text-lg font-black text-gray-900">
                Categories
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 mt-4 pb-6">
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setOpenMenu(false)}
                  className="flex items-center p-3 rounded-2xl bg-gray-50 hover:bg-[#B2E2FF]/20 text-gray-800 font-bold text-sm transition-all"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
