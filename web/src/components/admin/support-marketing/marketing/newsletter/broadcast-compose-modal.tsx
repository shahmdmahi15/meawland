"use client";

import React, { useState, useTransition } from "react";
import {
  AdminBroadcastEmailInput,
  adminBroadcastEmailSchema,
} from "@/schemas/admin/support-marketing/marketing/newsletter";
import { adminSendBroadcastAction } from "@/actions/admin/support-marketing/marketing/newsletter";
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
import { toast } from "sonner";
import { Megaphone, Send, Loader2, Users } from "lucide-react";

interface BroadcastComposeModalProps {
  activeCount: number;
  trigger?: React.ReactNode;
}

export function BroadcastComposeModal({
  activeCount,
  trigger,
}: BroadcastComposeModalProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<
    "ALL_SUBSCRIBED" | "TEST_ONLY"
  >("ALL_SUBSCRIBED");
  const [testEmail, setTestEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: AdminBroadcastEmailInput = {
      subject,
      previewText,
      message,
      targetAudience,
      testEmail,
    };

    const parsed = adminBroadcastEmailSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Invalid payload.");
      return;
    }

    startTransition(async () => {
      const res = await adminSendBroadcastAction(payload);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        setSubject("");
        setMessage("");
        setPreviewText("");
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
            <Button
              variant="outline"
              className="h-10 rounded-2xl border-gray-300 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-2 shadow-2xs cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-[#56C8D8]" />
              <span>Compose Broadcast</span>
            </Button>
          )
        }
      />

      <DialogContent className="max-w-[min(94vw,620px)] rounded-3xl p-0 overflow-hidden border border-gray-200">
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-5 sm:p-6">
          <DialogTitle className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#56C8D8]" />
            <span>Compose Newsletter Announcement</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Dispatch a rich campaign update or discount alert to active
            subscribers.
          </DialogDescription>
        </div>

        <form
          onSubmit={handleSend}
          className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Target Audience */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Target Audience
            </Label>
            <Select
              value={targetAudience}
              onValueChange={(val) =>
                val && setTargetAudience(val as "ALL_SUBSCRIBED" | "TEST_ONLY")
              }
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs">
                <SelectValue>
                  {targetAudience === "ALL_SUBSCRIBED"
                    ? `All Active Subscribers (${activeCount} recipients)`
                    : "Send Test Email to a Specific Address"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_SUBSCRIBED" className="text-xs">
                  All Active Subscribers ({activeCount} recipients)
                </SelectItem>
                <SelectItem value="TEST_ONLY" className="text-xs">
                  Send Test Email to a Specific Address
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetAudience === "TEST_ONLY" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Test Recipient Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="developer@meawland.com"
                required={targetAudience === "TEST_ONLY"}
                className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
              />
            </div>
          )}

          {/* Subject Line */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Email Subject Line <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. 🐾 20% OFF Royal Canin & Weekend Flash Sale!"
              required
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
            />
          </div>

          {/* Preheader Preview Text */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Inbox Preheader Snippet
            </Label>
            <Input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Short teaser shown next to the subject in Gmail..."
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
            />
          </div>

          {/* Body Content */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Email Message Content <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your newsletter announcement here..."
              rows={5}
              required
              className="rounded-xl bg-gray-50/80 border-gray-200 text-xs resize-none"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#56C8D8]" />
              <span>
                {targetAudience === "ALL_SUBSCRIBED"
                  ? `${activeCount} active recipients`
                  : "1 test recipient"}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
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
                className="h-10 px-6 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 cursor-pointer shadow-2xs"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Dispatch Broadcast</span>
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
