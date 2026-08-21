"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserOrderOption,
  CreateSupportTicketInput,
  createSupportTicketSchema,
  SUPPORT_CATEGORIES,
} from "@/schemas/root/account/support";
import { createSupportTicketAction } from "@/actions/root/account/support";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";
import { toast } from "sonner";
import { Plus, Send, Loader2, LifeBuoy, Package } from "lucide-react";

interface CreateTicketDialogProps {
  orders: UserOrderOption[];
  preselectedOrderCode?: string;
  trigger?: React.ReactNode;
}

export function CreateTicketDialog({
  orders,
  preselectedOrderCode,
  trigger,
}: CreateTicketDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Find preselected order ID from code
  const initialMatchedOrder = orders.find(
    (o) => o.code.toLowerCase() === preselectedOrderCode?.toLowerCase(),
  );

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(
    initialMatchedOrder ? "Order & Delivery" : "Order & Delivery",
  );
  const [orderId, setOrderId] = useState<string>(
    initialMatchedOrder ? initialMatchedOrder.id : "none",
  );
  const [priority, setPriority] = useState<SupportTicketPriority>(
    SupportTicketPriority.MEDIUM,
  );
  const [channel, setChannel] = useState<SupportChannel>(
    SupportChannel.WEB_TICKET,
  );
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const inputData: CreateSupportTicketInput = {
      subject,
      category: category as (typeof SUPPORT_CATEGORIES)[number],
      orderId: orderId === "none" ? null : orderId,
      priority,
      channel,
      message,
    };

    const parsed = createSupportTicketSchema.safeParse(inputData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string;
        if (field) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      const first = parsed.error.issues[0]?.message;
      if (first) toast.error(first);
      return;
    }

    startTransition(async () => {
      const res = await createSupportTicketAction(inputData);
      if (res.success) {
        toast.success(
          res.message ||
            `Support ticket #${res.ticketCode} created successfully!`,
        );
        setOpen(false);
        setSubject("");
        setMessage("");
        setOrderId("none");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to submit support ticket.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button className="h-10 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 shadow-xs cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Create Support Ticket</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[850px] w-[min(96vw,850px)] max-w-full rounded-3xl p-0 overflow-hidden border border-gray-200 shadow-2xl">
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-6">
          <DialogTitle className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-[#56C8D8]" />
            <span>Submit a Support Ticket</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Our customer service specialists will investigate and reply via
            email &amp; dashboard.
          </DialogDescription>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Subject */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ticket-subject"
              className="text-xs font-bold text-gray-700"
            >
              Subject / Issue Summary <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Delayed package delivery, damaged cat food pouch..."
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs focus-visible:ring-[#56C8D8]"
              required
            />
            {errors.subject && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Category & Attached Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Inquiry Category <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={category}
                onValueChange={(val) => val && setCategory(val)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-medium">
                  <SelectValue placeholder="Select Category">
                    {category || "Select Category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#56C8D8]" />
                <span>Attach Order (Optional)</span>
              </Label>
              <Select
                value={orderId}
                onValueChange={(val) => val && setOrderId(val)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-mono">
                  <SelectValue placeholder="Select an order...">
                    {orderId === "none" || !orderId
                      ? "None (General Inquiry)"
                      : orders.find((o) => o.id === orderId)
                        ? `#${orders.find((o) => o.id === orderId)!.code} — ৳${parseFloat(orders.find((o) => o.id === orderId)!.finalCost).toLocaleString()}`
                        : "Select an order..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none" className="text-xs font-sans">
                    None (General Inquiry)
                  </SelectItem>
                  {orders.map((ord) => (
                    <SelectItem
                      key={ord.id}
                      value={ord.id}
                      className="text-xs font-mono"
                    >
                      #{ord.code} — ৳
                      {parseFloat(ord.finalCost).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Priority Level
              </Label>
              <Select
                value={priority}
                onValueChange={(val) =>
                  val && setPriority(val as SupportTicketPriority)
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                  <SelectValue placeholder="Priority">
                    {priority === SupportTicketPriority.LOW
                      ? "Low (General Inquiry)"
                      : priority === SupportTicketPriority.MEDIUM
                        ? "Medium (Standard Support)"
                        : priority === SupportTicketPriority.HIGH
                          ? "High (Urgent Order Issue)"
                          : priority === SupportTicketPriority.URGENT
                            ? "Urgent (Payment / Return Issue)"
                            : priority}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={SupportTicketPriority.LOW}
                    className="text-xs"
                  >
                    Low (General Inquiry)
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.MEDIUM}
                    className="text-xs"
                  >
                    Medium (Standard Support)
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.HIGH}
                    className="text-xs"
                  >
                    High (Urgent Order Issue)
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.URGENT}
                    className="text-xs"
                  >
                    Urgent (Payment / Return Issue)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Preferred Channel
              </Label>
              <Select
                value={channel}
                onValueChange={(val) =>
                  val && setChannel(val as SupportChannel)
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                  <SelectValue placeholder="Channel">
                    {channel === SupportChannel.WEB_TICKET
                      ? "Web Helpdesk Ticket"
                      : channel === SupportChannel.WHATSAPP
                        ? "WhatsApp Followup"
                        : channel === SupportChannel.MESSENGER
                          ? "Messenger Followup"
                          : channel}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={SupportChannel.WEB_TICKET}
                    className="text-xs"
                  >
                    Web Helpdesk Ticket
                  </SelectItem>
                  <SelectItem
                    value={SupportChannel.WHATSAPP}
                    className="text-xs"
                  >
                    WhatsApp Followup
                  </SelectItem>
                  <SelectItem
                    value={SupportChannel.MESSENGER}
                    className="text-xs"
                  >
                    Messenger Followup
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Detailed Message */}
          <div className="space-y-1.5">
            <Label
              htmlFor="ticket-message"
              className="text-xs font-bold text-gray-700"
            >
              Detailed Description <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide specifics: package condition, unboxing details, delivery address specifics, or any queries..."
              rows={4}
              className="rounded-xl bg-gray-50/80 border-gray-200 text-xs focus-visible:ring-[#56C8D8] resize-none"
              required
            />
            {errors.message && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.message}
              </p>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 rounded-xl border-gray-200 text-xs font-bold text-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-10 px-6 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 cursor-pointer shadow-xs"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Ticket</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
