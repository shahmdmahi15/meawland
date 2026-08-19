"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminCreateTicketInput,
  adminCreateTicketSchema,
} from "@/schemas/admin/support-marketing/support/tickets";
import { SUPPORT_CATEGORIES } from "@/schemas/root/account/support";
import { adminCreateSupportTicketAction } from "@/actions/admin/support-marketing/support/tickets";
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
import { Plus, Send, Loader2, LifeBuoy } from "lucide-react";

interface CreateTicketModalProps {
  customers: { id: string; name: string; email: string; code: string }[];
  trigger?: React.ReactNode;
}

export function CreateTicketModal({
  customers,
  trigger,
}: CreateTicketModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [userId, setUserId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>("Order & Delivery");
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

    const inputData: AdminCreateTicketInput = {
      userId,
      subject,
      category: category as (typeof SUPPORT_CATEGORIES)[number],
      priority,
      channel,
      message,
    };

    const parsed = adminCreateTicketSchema.safeParse(inputData);
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
      const res = await adminCreateSupportTicketAction(inputData);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setSubject("");
        setMessage("");
        setUserId("");
        router.refresh();
      } else {
        toast.error(res.message);
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
              <span>Create Ticket</span>
            </Button>
          )
        }
      />

      <DialogContent className="max-w-[min(94vw,600px)] rounded-3xl p-0 overflow-hidden border border-gray-200">
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-6">
          <DialogTitle className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-[#56C8D8]" />
            <span>Open Support Ticket on Behalf of Customer</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Log an internal inquiry, WhatsApp handover, or customer grievance.
          </DialogDescription>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Select Customer */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Customer <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={userId}
              onValueChange={(val) => val && setUserId(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                <SelectValue placeholder="Select a Customer..." />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name} ({c.email}) — #{c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.userId}
              </p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Subject <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Issue title..."
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
              required
            />
            {errors.subject && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(val) => val && setCategory(val)}
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                  <SelectValue placeholder="Category" />
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
              <Label className="text-xs font-bold text-gray-700">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(val) =>
                  val && setPriority(val as SupportTicketPriority)
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={SupportTicketPriority.LOW}
                    className="text-xs"
                  >
                    LOW
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.MEDIUM}
                    className="text-xs"
                  >
                    MEDIUM
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.HIGH}
                    className="text-xs"
                  >
                    HIGH
                  </SelectItem>
                  <SelectItem
                    value={SupportTicketPriority.URGENT}
                    className="text-xs"
                  >
                    URGENT
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Channel */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Source Channel
            </Label>
            <Select
              value={channel}
              onValueChange={(val) => val && setChannel(val as SupportChannel)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value={SupportChannel.WEB_TICKET}
                  className="text-xs"
                >
                  Web Ticket
                </SelectItem>
                <SelectItem value={SupportChannel.WHATSAPP} className="text-xs">
                  WhatsApp
                </SelectItem>
                <SelectItem
                  value={SupportChannel.MESSENGER}
                  className="text-xs"
                >
                  Messenger
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Detailed Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Message Details <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Inquiry notes..."
              rows={4}
              className="rounded-xl bg-gray-50/80 border-gray-200 text-xs resize-none"
              required
            />
            {errors.message && (
              <p className="text-[11px] text-rose-500 font-medium">
                {errors.message}
              </p>
            )}
          </div>

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
              className="h-10 px-6 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Create Ticket</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
