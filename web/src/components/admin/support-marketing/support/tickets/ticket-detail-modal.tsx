"use client";

import React, { useState, useTransition, ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import { AdminSupportTicket } from "@/schemas/admin/support-marketing/support/tickets";
import {
  adminUpdateTicketStatusAction,
  adminUpdateTicketPriorityAction,
} from "@/actions/admin/support-marketing/support/tickets";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";
import { toast } from "sonner";
import {
  User,
  Mail,
  MessageSquare,
  Package,
  Clock,
  ExternalLink,
  Eye,
} from "lucide-react";
import { cn, formatSupportPriority, formatSupportStatus } from "@/lib/utils";

interface TicketDetailModalProps {
  ticket: AdminSupportTicket;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketDetailModal({
  ticket,
  trigger,
  isOpen,
  onOpenChange,
}: TicketDetailModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const [status, setStatus] = useState<SupportTicketStatus>(ticket.status);
  const [priority, setPriority] = useState<SupportTicketPriority>(
    ticket.priority,
  );
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: SupportTicketStatus) => {
    setStatus(newStatus);
    startTransition(async () => {
      const res = await adminUpdateTicketStatusAction(ticket.id, newStatus);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        setStatus(ticket.status);
      }
    });
  };

  const handlePriorityChange = (newPriority: SupportTicketPriority) => {
    setPriority(newPriority);
    startTransition(async () => {
      const res = await adminUpdateTicketPriorityAction(ticket.id, newPriority);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        setPriority(ticket.priority);
      }
    });
  };

  // WhatsApp click-to-chat URL
  const rawPhone = ticket.user.phone
    ? ticket.user.phone.replace(/\D/g, "")
    : "";
  const bdPhone = rawPhone.startsWith("88") ? rawPhone : `88${rawPhone}`;
  const waMessage = encodeURIComponent(
    `Hello ${ticket.user.name}! 👋\n\nThis is Meawland Support regarding your Support Ticket #${ticket.code}${
      ticket.order ? ` for Order #${ticket.order.code}` : ""
    }.\n\n`,
  );
  const whatsappUrl = rawPhone
    ? `https://wa.me/${bdPhone}?text=${waMessage}`
    : "";

  const createdDate = new Date(ticket.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <span>Details</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[1100px] w-[min(96vw,1100px)] max-w-full max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl border border-gray-200">
        {/* Modal Header */}
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-black text-gray-900 bg-white px-2.5 py-0.5 rounded-lg border border-[#D4EEFC]">
                #{ticket.code}
              </span>
              <Badge
                variant="outline"
                className="border-[#56C8D8] text-[#0097a7] bg-white font-bold text-xs"
              >
                {ticket.category}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "font-bold text-xs",
                  ticket.channel === SupportChannel.WHATSAPP
                    ? "border-emerald-500/30 text-emerald-600 bg-emerald-50"
                    : ticket.channel === SupportChannel.MESSENGER
                      ? "border-blue-500/30 text-blue-600 bg-blue-50"
                      : "border-gray-300 text-gray-600 bg-white",
                )}
              >
                {ticket.channel}
              </Badge>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 mt-2">
              {ticket.subject}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Submitted on {createdDate}</span>
            </DialogDescription>
          </div>

          {/* Quick Status and Priority Mutator Selectors */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Status
              </span>
              <Select
                value={status}
                onValueChange={(val) =>
                  val && handleStatusChange(val as SupportTicketStatus)
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-9 rounded-xl bg-white border-[#D4EEFC] text-xs font-bold w-36">
                  <SelectValue>{formatSupportStatus(status)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={SupportTicketStatus.OPEN}
                    className="text-xs text-amber-600 font-bold"
                  >
                    Open
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketStatus.IN_PROGRESS}
                    className="text-xs text-blue-600 font-bold"
                  >
                    In Progress
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketStatus.RESOLVED}
                    className="text-xs text-emerald-600 font-bold"
                  >
                    Resolved
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketStatus.CLOSED}
                    className="text-xs text-gray-600 font-bold"
                  >
                    Closed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Priority
              </span>
              <Select
                value={priority}
                onValueChange={(val) =>
                  val && handlePriorityChange(val as SupportTicketPriority)
                }
                disabled={isPending}
              >
                <SelectTrigger className="h-9 rounded-xl bg-white border-[#D4EEFC] text-xs font-bold w-32">
                  <SelectValue>{formatSupportPriority(priority)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={SupportTicketPriority.LOW}
                    className="text-xs"
                  >
                    Low
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.MEDIUM}
                    className="text-xs"
                  >
                    Medium
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.HIGH}
                    className="text-xs text-orange-600 font-bold"
                  >
                    High
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.URGENT}
                    className="text-xs text-rose-600 font-bold"
                  >
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Modal Body Grid */}
        <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Column: Message and Attached Order (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Message Card */}
            <div className="rounded-2xl border border-gray-200 p-5 space-y-3 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#56C8D8]" />
                <span>Customer Inquiry Description</span>
              </h3>

              <div className="rounded-xl bg-[#EDF5FA]/50 border border-[#D4EEFC] p-4 text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                {ticket.message}
              </div>
            </div>

            {/* Attached Order Summary if present */}
            {ticket.order ? (
              <div className="rounded-2xl border border-gray-200 p-5 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-[#56C8D8]" />
                    <span>Attached Order Information</span>
                  </h3>

                  <Link
                    href={`/admin/management/orders/all-orders?orderId=${ticket.order.id}`}
                    target="_blank"
                    className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                  >
                    <span>Inspect in Orders</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Order Code:</span>
                    <span className="font-mono font-bold text-gray-900">
                      #{ticket.order.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Order Status:</span>
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {ticket.order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold text-gray-900">
                      {ticket.order.totalQuantity} items
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                    <span className="text-gray-600 font-bold">
                      Order Value:
                    </span>
                    <span className="text-sm font-black text-[#56C8D8]">
                      ৳{parseFloat(ticket.order.finalCost).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
                No specific order was attached to this ticket.
              </div>
            )}
          </div>

          {/* Right Column: Customer Details and Direct Contact (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-gray-200 p-5 space-y-4 bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#56C8D8]" />
                <span>Customer Profile</span>
              </h3>

              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[#EDF5FA] border border-[#D4EEFC] flex items-center justify-center shrink-0">
                  {ticket.user.avatar ? (
                    <Image
                      src={ticket.user.avatar}
                      alt={ticket.user.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized={ticket.user.avatar.startsWith("data:")}
                    />
                  ) : (
                    <span className="text-sm font-black text-[#56C8D8]">
                      {ticket.user.name
                        ? ticket.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "CU"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {ticket.user.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-mono">
                    #{ticket.user.code}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold text-gray-900 truncate max-w-[200px]">
                    {ticket.user.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {ticket.user.phone || "Not provided"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">District:</span>
                  <span className="font-semibold text-gray-900">
                    {ticket.user.district || "Not specified"}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Direct Instant Action Contact Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Direct Response:
                </span>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </a>
                )}

                <a
                  href={`mailto:${ticket.user.email}?subject=${encodeURIComponent(
                    `Re: Meawland Support Ticket #${ticket.code} - ${ticket.subject}`,
                  )}`}
                  className="block"
                >
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <span>Send Email Reply</span>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
