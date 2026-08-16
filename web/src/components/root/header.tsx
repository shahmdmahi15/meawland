"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Heart,
  ShoppingCart,
  User,
  X,
  Sparkles,
  ArrowRight,
  Package,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavbarAccount } from "@/actions/auth/get-me";
import {
  quickSearchAction,
  type QuickSearchResult,
} from "@/actions/store/products/quick-search";

const navItems = [
  { label: "Pet Accessories", href: "/category/pet-accessories" },
  { label: "Pet Care", href: "/category/pet-care" },
  { label: "Pet Food", href: "/category/pet-food" },
  { label: "Pet Medicine", href: "/category/pet-medicine" },
  { label: "Pet Dress", href: "/category/pet-dress" },
  { label: "Pet Toy", href: "/category/pet-toy" },
  { label: "Pet Litter", href: "/category/pet-litter" },
];

export function Header({ user }: { user: NavbarAccount | null }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<QuickSearchResult | null>(
    null,
  );
  const [isSearching, startSearchTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Debounced search trigger
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResult(null);
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const res = await quickSearchAction(trimmed);
        setSearchResult(res);
        setIsOpen(true);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Search Submission -> redirects to /products with search query
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    setIsOpen(false);
    setIsMobileSearchOpen(false);

    if (query) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/products");
    }
  };

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
          {/* Desktop Search bar with live autocomplete dropdown */}
          <div ref={containerRef} className="relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchResult && searchQuery.trim().length >= 2) {
                    setIsOpen(true);
                  }
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex h-11 md:h-12 w-48 xl:w-60 pl-10 pr-9 py-2 bg-white/30 backdrop-blur-md rounded-full text-sm font-medium text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#56C8D8]/50 focus:w-72 transition-all duration-400 shadow-md border border-white/30"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />

              {isSearching ? (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#56C8D8] animate-spin" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResult(null);
                    setIsOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </form>

            {/* Desktop Autocomplete Live Dropdown */}
            {isOpen && searchResult && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Category Suggestions */}
                {searchResult.suggestions.length > 0 && (
                  <div className="p-2 border-b border-gray-100 mb-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                      Suggested Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {searchResult.suggestions.map((sug) => (
                        <Link
                          key={sug.slug}
                          href={sug.slug}
                          onClick={() => setIsOpen(false)}
                          className="px-2.5 py-1 rounded-lg bg-[#F0F8FF] hover:bg-[#56C8D8] text-[#56C8D8] hover:text-white text-xs font-bold transition-colors"
                        >
                          {sug.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Matches */}
                <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block px-2 py-1">
                    Matching Products ({searchResult.totalMatches})
                  </span>

                  {searchResult.products.length === 0 ? (
                    <div className="py-6 text-center space-y-1">
                      <Package className="w-6 h-6 text-gray-300 mx-auto" />
                      <p className="text-xs font-bold text-gray-500">
                        No direct product matches
                      </p>
                    </div>
                  ) : (
                    searchResult.products.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products?q=${encodeURIComponent(item.name)}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#F0F8FF] overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-1">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-[#56C8D8] transition-colors">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-extrabold text-[#56C8D8]">
                              {item.price}
                            </span>
                            {item.originalPrice && (
                              <span className="text-gray-400 line-through text-[10px]">
                                {item.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                {/* View All in /products CTA */}
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleSearchSubmit()}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#56C8D8] hover:bg-[#38bdf8] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>View all results for &quot;{searchQuery}&quot;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Search Icon Trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsMobileSearchOpen(!isMobileSearchOpen);
              setTimeout(() => mobileInputRef.current?.focus(), 100);
            }}
            className="md:hidden rounded-full bg-white/30 backdrop-blur-md h-11 w-11 border border-white/30 shadow-md hover:bg-white/50 transition-all text-gray-700 cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Button>

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

          {/* User Account / Login */}
          {user ? (
            <Link href="/account" className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/30 backdrop-blur-md h-11 w-11 md:h-12 md:w-12 border border-white/30 shadow-md hover:bg-white/50 transition-all text-gray-700 cursor-pointer overflow-hidden p-0"
                aria-label="Account"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || "User Avatar"}
                    height={64}
                    width={64}
                    className="w-full h-full rounded-full object-cover"
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

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 px-4 pt-2 pb-4 bg-white/90 backdrop-blur-2xl shadow-xl border-b border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200">
          <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, code..."
                className="w-full h-11 pl-10 pr-9 bg-gray-100 rounded-full text-xs font-medium text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#56C8D8]"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              className="rounded-full bg-[#56C8D8] text-white px-4 h-11 font-bold text-xs"
            >
              Search
            </Button>
          </form>

          {/* Mobile Quick Suggestions */}
          {searchResult && searchResult.products.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                Top Matches
              </span>
              {searchResult.products.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/products?q=${encodeURIComponent(p.name)}`}
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 text-xs font-bold text-gray-800 justify-between"
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[#56C8D8] shrink-0 font-extrabold">
                    {p.price}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
