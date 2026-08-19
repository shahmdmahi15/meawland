"use client";

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  AdminCustomerSummary,
  AdminCustomerStats,
} from "@/schemas/admin/support-marketing/support/customers";
import { adminDeleteCustomerAction } from "@/actions/admin/support-marketing/support/customers";
import { CustomerDetailModal } from "./customer-detail-modal";
import { EditCustomerModal } from "./edit-customer-modal";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Search,
  X,
  ShoppingBag,
  LifeBuoy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomersTableProps {
  customers: AdminCustomerSummary[];
  stats: AdminCustomerStats;
}

export function CustomersTable({ customers, stats }: CustomersTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlCustomerId =
    searchParams.get("customerId") || searchParams.get("userId");
  const urlCustomerCode =
    searchParams.get("customerCode") || searchParams.get("userCode");
  const urlSearch = searchParams.get("search");

  const [activeModalCustomerId, setActiveModalCustomerId] = useState<
    string | null
  >(null);

  const urlMatchedCustomerId = useMemo(() => {
    if (urlCustomerId) {
      return customers.find((c) => c.id === urlCustomerId)?.id ?? null;
    }
    if (urlCustomerCode) {
      return (
        customers.find(
          (c) => c.code.toLowerCase() === urlCustomerCode.toLowerCase(),
        )?.id ?? null
      );
    }
    return null;
  }, [urlCustomerId, urlCustomerCode, customers]);

  const effectiveActiveCustomerId =
    activeModalCustomerId ?? urlMatchedCustomerId;

  const [search, setSearch] = useState(() => urlSearch || "");
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("spent_high");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete customer account "${name}"? This action cannot be undone.`,
      )
    ) {
      startTransition(async () => {
        const res = await adminDeleteCustomerAction(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      });
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (districtFilter !== "ALL" && c.district !== districtFilter)
          return false;

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          const matchesCode = c.code.toLowerCase().includes(q);
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesEmail = c.email.toLowerCase().includes(q);
          const matchesPhone = c.phone?.toLowerCase().includes(q) || false;
          const matchesDistrict =
            c.district?.toLowerCase().includes(q) || false;

          if (
            !matchesCode &&
            !matchesName &&
            !matchesEmail &&
            !matchesPhone &&
            !matchesDistrict
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "spent_high") return b.lifetimeSpent - a.lifetimeSpent;
        if (sortBy === "spent_low") return a.lifetimeSpent - b.lifetimeSpent;
        if (sortBy === "orders_high")
          return b.totalOrdersCount - a.totalOrdersCount;
        if (sortBy === "tickets_high")
          return b.supportTicketsCount - a.supportTicketsCount;
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        if (sortBy === "name_asc") return a.name.localeCompare(b.name);
        return 0;
      });
  }, [customers, search, districtFilter, sortBy]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-[#56C8D8]" />
          <span>Customer Management</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Explore registered customers, lifetime spending records, order
          frequency, and support history.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Customers
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {stats.totalCustomers}
            </span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Active Buyers
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {stats.activeBuyers}
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4EEFC] bg-[#EDF5FA]/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider block">
            Total Revenue
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-[#56C8D8]">
              ৳{stats.totalRevenue.toLocaleString()}
            </span>
            <TrendingUp className="w-4 h-4 text-[#56C8D8]" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Support Inquiries
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-800">
              {stats.totalInquiries}
            </span>
            <LifeBuoy className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, email, phone, code..."
              className="pl-9.5 pr-8 h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* District Filter */}
          <div className="sm:col-span-3">
            <Select
              value={districtFilter}
              onValueChange={(val) => val && setDistrictFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="District" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="ALL" className="text-xs">
                  All Districts
                </SelectItem>
                {BANGLADESH_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <Select
              value={sortBy}
              onValueChange={(val) => val && setSortBy(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs font-semibold">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spent_high" className="text-xs">
                  Spend: High to Low
                </SelectItem>
                <SelectItem value="spent_low" className="text-xs">
                  Spend: Low to High
                </SelectItem>
                <SelectItem value="orders_high" className="text-xs">
                  Most Orders Placed
                </SelectItem>
                <SelectItem value="tickets_high" className="text-xs">
                  Most Support Tickets
                </SelectItem>
                <SelectItem value="newest" className="text-xs">
                  Newest Registered
                </SelectItem>
                <SelectItem value="name_asc" className="text-xs">
                  Alphabetical (A–Z)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700">
                Customer ID
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Customer Details
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Contact &amp; District
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Orders
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Lifetime Spend
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Inquiries
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Joined
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((cust) => {
                const joinedDateStr = new Date(
                  cust.createdAt,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const isHighlighted =
                  cust.id === urlCustomerId ||
                  cust.code.toLowerCase() === urlCustomerCode?.toLowerCase() ||
                  effectiveActiveCustomerId === cust.id;

                return (
                  <TableRow
                    key={cust.id}
                    className={cn(
                      "transition-colors",
                      isHighlighted
                        ? "bg-[#EDF5FA] hover:bg-[#E3EFF7] border-l-4 border-l-[#56C8D8]"
                        : "hover:bg-gray-50/70",
                    )}
                  >
                    {/* Customer Code */}
                    <TableCell className="font-mono text-xs font-bold text-gray-900">
                      #{cust.code}
                    </TableCell>

                    {/* Customer Name, Email, Avatar */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden bg-[#EDF5FA] border border-[#D4EEFC] flex items-center justify-center shrink-0">
                          {cust.avatar ? (
                            <Image
                              src={cust.avatar}
                              alt={cust.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized={cust.avatar.startsWith("data:")}
                            />
                          ) : (
                            <span className="text-xs font-black text-[#56C8D8]">
                              {cust.name ? cust.name[0] : "C"}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                              {cust.name}
                            </p>
                            {cust.role !== "USER" && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1 py-0 border-blue-300 text-blue-600 bg-blue-50 font-bold"
                              >
                                {cust.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate max-w-[180px]">
                            {cust.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact & District */}
                    <TableCell>
                      <p className="text-xs font-mono font-medium text-gray-900">
                        {cust.phone || "—"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {cust.district || "Not specified"}
                      </p>
                    </TableCell>

                    {/* Orders Count */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-xs font-bold border-gray-200 bg-gray-50 px-2 py-0.5"
                      >
                        {cust.totalOrdersCount}
                      </Badge>
                    </TableCell>

                    {/* Lifetime Spend */}
                    <TableCell>
                      <span className="text-xs font-black text-[#56C8D8]">
                        ৳{cust.lifetimeSpent.toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Support Inquiries Count */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-bold px-2 py-0.5",
                          cust.supportTicketsCount > 0
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "border-gray-200 text-gray-400 bg-gray-50",
                        )}
                      >
                        {cust.supportTicketsCount}
                      </Badge>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-gray-500">
                      {joinedDateStr}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <CustomerDetailModal
                          customerSummary={cust}
                          isOpen={effectiveActiveCustomerId === cust.id}
                          onOpenChange={(isOpen) => {
                            if (
                              !isOpen &&
                              effectiveActiveCustomerId === cust.id
                            ) {
                              setActiveModalCustomerId(null);
                              if (urlCustomerId || urlCustomerCode) {
                                router.replace(pathname, { scroll: false });
                              }
                            }
                          }}
                        />
                        <EditCustomerModal customer={cust} />

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(cust.id, cust.name)}
                          disabled={isPending}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  No customers found matching your filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredCustomers.length,
              )}
              –{Math.min(currentPage * pageSize, filteredCustomers.length)} of{" "}
              {filteredCustomers.length} customers
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-xl border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-bold text-gray-900">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-xl border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
