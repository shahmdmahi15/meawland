"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import {
  SearchEntityType,
  AdminGlobalSearchResults,
} from "@/schemas/admin/search";
import { adminGlobalSearchAction } from "@/actions/admin/search";
import { ProductSearchResults } from "./product-search-results";
import { OrderSearchResults } from "./order-search-results";
import { CustomerSearchResults } from "./customer-search-results";
import { TicketSearchResults } from "./ticket-search-results";
import { OfferSearchResults } from "./offer-search-results";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Loader2,
  Package,
  ShoppingCart,
  Users,
  LifeBuoy,
  Tag,
  Clock,
  Sparkles,
  Command,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSearchViewProps {
  initialResults?: AdminGlobalSearchResults;
  initialQuery?: string;
  initialType?: SearchEntityType;
}

const PRESET_QUERIES = [
  {
    label: "Urgent Support Tickets",
    query: "urgent",
    type: "TICKETS" as const,
  },
  { label: "Pending Orders", query: "pending", type: "ORDERS" as const },
  { label: "Dhaka Customers", query: "dhaka", type: "CUSTOMERS" as const },
  { label: "Cat Food", query: "food", type: "PRODUCTS" as const },
  { label: "Active Coupons", query: "coupon", type: "OFFERS" as const },
];

export function AdminSearchView({
  initialResults,
  initialQuery = "",
  initialType = "ALL",
}: AdminSearchViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<SearchEntityType>(initialType);
  const [results, setResults] = useState<AdminGlobalSearchResults | undefined>(
    initialResults,
  );
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // Sync URL query parameters smoothly
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeType !== "ALL") params.set("type", activeType);
    const newUrl = params.toString()
      ? `/admin/search?${params.toString()}`
      : "/admin/search";
    window.history.replaceState(null, "", newUrl);
  }, [query, activeType]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("meawland_admin_recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(
      0,
      5,
    );
    setRecentSearches(updated);
    try {
      localStorage.setItem(
        "meawland_admin_recent_searches",
        JSON.stringify(updated),
      );
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("meawland_admin_recent_searches");
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut listener for Ctrl+K / Cmd+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Perform search
  const performSearch = (searchTerm: string, searchType: SearchEntityType) => {
    startTransition(async () => {
      const res = await adminGlobalSearchAction(searchTerm, searchType, 30);
      if (res.success && res.results) {
        setResults(res.results);
        if (searchTerm.trim()) {
          saveRecentSearch(searchTerm);
        }
      }
    });
  };

  // Debounced search on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, activeType);
    }, 280);

    return () => clearTimeout(timer);
  }, [query, activeType]);

  const handleTypeChange = (newType: SearchEntityType) => {
    setActiveType(newType);
  };

  const handlePresetClick = (
    presetQuery: string,
    presetType: SearchEntityType,
  ) => {
    setQuery(presetQuery);
    setActiveType(presetType);
    inputRef.current?.focus();
  };

  const totalMatches = results?.totalMatches || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <Search className="w-6 h-6 text-[#56C8D8]" />
          <span>Admin Omnisearch</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Universal multi-entity search across products, orders, customers,
          support tickets, and store offers.
        </p>
      </div>

      {/* Main Omnisearch Bar Card */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type anything to search (Product SKU, Order #, Customer phone, Ticket code, Coupon)..."
            className="pl-12 pr-24 h-13 rounded-2xl bg-gray-50/80 border-gray-200 text-sm font-medium focus-visible:bg-white shadow-2xs"
            autoFocus
          />

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isPending && (
              <Loader2 className="w-4 h-4 animate-spin text-[#56C8D8]" />
            )}

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 cursor-pointer"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-500">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Quick Filter Presets & History */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-gray-100 text-xs">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Quick:
            </span>
            {PRESET_QUERIES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handlePresetClick(p.query, p.type)}
                className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-[#EDF5FA] hover:text-[#0097a7] text-gray-600 font-semibold text-[11px] transition-colors cursor-pointer border border-transparent hover:border-[#D4EEFC]"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Recent:</span>
              </span>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-2 py-0.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] border border-gray-200 font-mono"
                >
                  {term}
                </button>
              ))}
              <button
                type="button"
                onClick={clearRecentSearches}
                className="text-[10px] text-gray-400 hover:text-gray-600 underline ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Entity Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => handleTypeChange("ALL")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
            activeType === "ALL"
              ? "bg-[#56C8D8] text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Entities</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-bold",
              activeType === "ALL"
                ? "bg-white/20 text-white border-transparent"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {totalMatches}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("PRODUCTS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
            activeType === "PRODUCTS"
              ? "bg-[#56C8D8] text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-bold",
              activeType === "PRODUCTS"
                ? "bg-white/20 text-white border-transparent"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {results?.counts.products ?? 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("ORDERS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
            activeType === "ORDERS"
              ? "bg-[#56C8D8] text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Orders</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-bold",
              activeType === "ORDERS"
                ? "bg-white/20 text-white border-transparent"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {results?.counts.orders ?? 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("CUSTOMERS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
            activeType === "CUSTOMERS"
              ? "bg-[#56C8D8] text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customers</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-bold",
              activeType === "CUSTOMERS"
                ? "bg-white/20 text-white border-transparent"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {results?.counts.customers ?? 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("TICKETS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
            activeType === "TICKETS"
              ? "bg-[#56C8D8] text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Tickets</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-bold",
              activeType === "TICKETS"
                ? "bg-white/20 text-white border-transparent"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {results?.counts.tickets ?? 0}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("OFFERS")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
            activeType === "OFFERS"
              ? "bg-[#56C8D8] text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100",
          )}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Offers &amp; Store</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 rounded-full font-bold",
              activeType === "OFFERS"
                ? "bg-white/20 text-white border-transparent"
                : "bg-gray-100 text-gray-700",
            )}
          >
            {results?.counts.offers ?? 0}
          </Badge>
        </button>
      </div>

      {/* Results Content Area */}
      {isPending ? (
        <div className="py-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#56C8D8]" />
          <span>Searching database across multiple entities...</span>
        </div>
      ) : activeType === "ALL" ? (
        /* Categorized Combined View */
        <div className="space-y-8">
          {/* Products Section */}
          {results && results.products.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#56C8D8]" />
                  <span>Matching Products ({results.products.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveType("PRODUCTS")}
                  className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                >
                  <span>View all products</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <ProductSearchResults products={results.products.slice(0, 5)} />
            </div>
          )}

          {/* Orders Section */}
          {results && results.orders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#56C8D8]" />
                  <span>Matching Orders ({results.orders.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveType("ORDERS")}
                  className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                >
                  <span>View all orders</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <OrderSearchResults orders={results.orders.slice(0, 5)} />
            </div>
          )}

          {/* Customers Section */}
          {results && results.customers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#56C8D8]" />
                  <span>Matching Customers ({results.customers.length})</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveType("CUSTOMERS")}
                  className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                >
                  <span>View all customers</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <CustomerSearchResults
                customers={results.customers.slice(0, 5)}
              />
            </div>
          )}

          {/* Support Tickets Section */}
          {results && results.tickets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <LifeBuoy className="w-4 h-4 text-[#56C8D8]" />
                  <span>
                    Matching Support Tickets ({results.tickets.length})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveType("TICKETS")}
                  className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                >
                  <span>View all tickets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <TicketSearchResults tickets={results.tickets.slice(0, 5)} />
            </div>
          )}

          {/* Offers & Store Section */}
          {results && results.offers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#56C8D8]" />
                  <span>
                    Coupons, Campaigns &amp; Store ({results.offers.length})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveType("OFFERS")}
                  className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                >
                  <span>View all offers</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <OfferSearchResults offers={results.offers.slice(0, 5)} />
            </div>
          )}

          {totalMatches === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center space-y-2">
              <Search className="w-8 h-8 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-800">
                No matching results found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try searching for a different keyword, SKU, order code
                `#MEAWORD...`, customer phone number, or select another tab.
              </p>
            </div>
          )}
        </div>
      ) : activeType === "PRODUCTS" ? (
        <ProductSearchResults products={results?.products || []} />
      ) : activeType === "ORDERS" ? (
        <OrderSearchResults orders={results?.orders || []} />
      ) : activeType === "CUSTOMERS" ? (
        <CustomerSearchResults customers={results?.customers || []} />
      ) : activeType === "TICKETS" ? (
        <TicketSearchResults tickets={results?.tickets || []} />
      ) : (
        <OfferSearchResults offers={results?.offers || []} />
      )}
    </div>
  );
}
