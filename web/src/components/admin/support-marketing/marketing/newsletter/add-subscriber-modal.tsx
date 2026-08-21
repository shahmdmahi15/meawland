"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AdminAddSubscriberInput,
  adminAddSubscriberSchema,
} from "@/schemas/admin/support-marketing/marketing/newsletter";
import { adminAddSubscriberAction } from "@/actions/admin/support-marketing/marketing/newsletter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewsletterStatus } from "@/generated/prisma/enums";
import { toast } from "sonner";
import { UserPlus, Loader2, Send } from "lucide-react";

interface AddSubscriberModalProps {
  trigger?: React.ReactNode;
}

export function AddSubscriberModal({ trigger }: AddSubscriberModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NewsletterStatus>(
    NewsletterStatus.SUBSCRIBED,
  );
  const [source, setSource] = useState("MANUAL");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inputData: AdminAddSubscriberInput = {
      email,
      status,
      source,
    };

    const parsed = adminAddSubscriberSchema.safeParse(inputData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid email.");
      return;
    }

    startTransition(async () => {
      const res = await adminAddSubscriberAction(inputData);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setEmail("");
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
              <UserPlus className="w-4 h-4" />
              <span>Add Subscriber</span>
            </Button>
          )
        }
      />

      <DialogContent className="max-w-[min(94vw,500px)] rounded-3xl p-0 overflow-hidden border border-gray-200">
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-6">
          <DialogTitle className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#56C8D8]" />
            <span>Manually Add Subscriber</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Enroll a customer email into the VIP Newsletter list.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Email Address <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="subscriber@example.com"
              required
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Status</Label>
              <Select
                value={status}
                onValueChange={(val) =>
                  val && setStatus(val as NewsletterStatus)
                }
              >
                <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                  <SelectValue>
                    {status === NewsletterStatus.SUBSCRIBED
                      ? "Subscribed"
                      : "Unsubscribed"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={NewsletterStatus.SUBSCRIBED}
                    className="text-xs text-emerald-600 font-bold"
                  >
                    SUBSCRIBED
                  </SelectItem>
                  <SelectItem
                    value={NewsletterStatus.UNSUBSCRIBED}
                    className="text-xs text-gray-600"
                  >
                    UNSUBSCRIBED
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Source</Label>
              <Input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. MANUAL, EVENT, STORE"
                className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs uppercase font-mono"
              />
            </div>
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
              <span>Save Subscriber</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
