"use client";

import React, { useState, useTransition, ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AdminCustomerSummary,
  AdminCustomerDetails,
} from "@/schemas/admin/support-marketing/support/customers";
import { getAdminCustomerDetailsAction } from "@/actions/admin/support-marketing/support/customers";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  LifeBuoy,
  MessageSquare,
  Mail,
  Calendar,
  ExternalLink,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerDetailModalProps {
  customerSummary: AdminCustomerSummary;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomerDetailModal({
  customerSummary,
  trigger,
  isOpen,
  onOpenChange,
}: CustomerDetailModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : internalOpen;

  const [activeTab, setActiveTab] = useState<"ORDERS" | "TICKETS">("ORDERS");
  const [details, setDetails] = useState<AdminCustomerDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);

    if (nextOpen && !details) {
      startTransition(async () => {
        const res = await getAdminCustomerDetailsAction(customerSummary.id);
        if (res.success && res.customer) {
          setDetails(res.customer);
        }
      });
    }
  };

  React.useEffect(() => {
    if (open && !details) {
      startTransition(async () => {
        const res = await getAdminCustomerDetailsAction(customerSummary.id);
        if (res.success && res.customer) {
          setDetails(res.customer);
        }
      });
    }
  }, [open, details, customerSummary.id]);

  // WhatsApp click-to-chat URL
  const rawPhone = customerSummary.phone
    ? customerSummary.phone.replace(/\D/g, "")
    : "";
  const bdPhone = rawPhone.startsWith("88") ? rawPhone : `88${rawPhone}`;
  const whatsappUrl = rawPhone
    ? `https://wa.me/${bdPhone}?text=${encodeURIComponent(
        `Hello ${customerSummary.name}! 👋\n\nThis is Meawland Customer Support. How may we assist you today?`,
      )}`
    : "";

  const joinedDate = new Date(customerSummary.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as ReactElement)
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-gray-200 text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>360 Profile</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[1100px] w-[min(96vw,1100px)] max-w-full max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl border border-gray-200">
        {/* Header Profile Section */}
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-white border-2 border-[#56C8D8] shadow-xs flex items-center justify-center shrink-0">
              {customerSummary.avatar ? (
                <Image
                  src={customerSummary.avatar}
                  alt={customerSummary.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized={customerSummary.avatar.startsWith("data:")}
                />
              ) : (
                <span className="text-xl font-black text-[#56C8D8]">
                  {customerSummary.name
                    ? customerSummary.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CU"}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-lg sm:text-xl font-black text-gray-900">
                  {customerSummary.name}
                </DialogTitle>
                <span className="font-mono text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-[#D4EEFC]">
                  #{customerSummary.code}
                </span>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-600 bg-emerald-50 font-bold text-[10px]"
                >
                  {customerSummary.role}
                </Badge>
              </div>

              <DialogDescription className="text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{customerSummary.email}</span>
                <span>•</span>
                <span>{customerSummary.phone || "No phone"}</span>
                <span>•</span>
                <span>{customerSummary.district || "No district"}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Direct Contact Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </Button>
              </a>
            )}

            <a href={`mailto:${customerSummary.email}`} className="block">
              <Button
                variant="outline"
                className="h-9 rounded-xl border-gray-300 text-gray-700 hover:bg-white font-bold text-xs gap-1.5 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </Button>
            </a>
          </div>
        </div>

        {/* 360 Lifetime Metrics Summary */}
        <div className="p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900">
                {customerSummary.totalOrdersCount}
              </span>
            </div>

            <div className="rounded-2xl border border-[#D4EEFC] bg-[#EDF5FA]/40 p-4 space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider block">
                Lifetime Spend
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#56C8D8]">
                ৳{customerSummary.lifetimeSpent.toLocaleString()}
              </span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Support Tickets
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-800">
                {customerSummary.supportTicketsCount}
              </span>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Member Since
              </span>
              <span className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-1.5 mt-1">
                <Calendar className="w-4 h-4 text-[#56C8D8]" />
                {joinedDate}
              </span>
            </div>
          </div>

          {/* Tabs: Orders History & Support Tickets History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("ORDERS")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === "ORDERS"
                    ? "bg-[#56C8D8] text-white shadow-2xs"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order History ({customerSummary.totalOrdersCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("TICKETS")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  activeTab === "TICKETS"
                    ? "bg-[#56C8D8] text-white shadow-2xs"
                    : "text-gray-600 hover:bg-gray-100",
                )}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>
                  Support Tickets ({customerSummary.supportTicketsCount})
                </span>
              </button>
            </div>

            {/* Tab Contents */}
            {isPending ? (
              <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#56C8D8]" />
                <span>Loading customer 360 data...</span>
              </div>
            ) : activeTab === "ORDERS" ? (
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Order Code
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Items
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Total Value
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Payment
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700 text-right">
                        Inspect
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details?.recentOrders &&
                    details.recentOrders.length > 0 ? (
                      details.recentOrders.map((ord) => (
                        <TableRow key={ord.id} className="hover:bg-gray-50/60">
                          <TableCell className="font-mono text-xs font-bold text-gray-900">
                            #{ord.code}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(ord.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-gray-700">
                            {ord.totalQuantity} items
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-gray-900">
                            ৳{parseFloat(ord.finalCost).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold"
                            >
                              {ord.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold"
                            >
                              {ord.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/admin/management/orders/all-orders?orderId=${ord.id}`}
                              target="_blank"
                              className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                            >
                              <span>View</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-xs text-gray-500"
                        >
                          No order history found for this customer.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* TICKETS TAB */
              <div className="rounded-2xl border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/80">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Ticket #
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Subject
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Category
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Priority
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Channel
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-bold text-gray-700">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details?.supportTickets &&
                    details.supportTickets.length > 0 ? (
                      details.supportTickets.map((t) => (
                        <TableRow key={t.id} className="hover:bg-gray-50/60">
                          <TableCell className="font-mono text-xs font-bold text-gray-900">
                            #{t.code}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-900 max-w-[200px] truncate">
                            {t.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {t.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold"
                            >
                              {t.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {t.channel}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold"
                            >
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(t.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-xs text-gray-500"
                        >
                          No support tickets found for this customer.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
