"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendQuickDirectSmsAction } from "@/actions/admin/support-marketing/marketing/sms/quick-send";
import { TestSmsModal } from "./test-sms-modal";
import { toast } from "sonner";
import { Send, Zap, Loader2, Sparkles } from "lucide-react";

interface QuickBroadcastModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function QuickBroadcastModal({
  trigger,
  onSuccess,
}: QuickBroadcastModalProps) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [senderId, setSenderId] = useState("");
  const [isSending, startTransition] = useTransition();

  const isUnicode = /[^\u0000-\u007f]/.test(message);
  const charLimit = isUnicode ? 70 : 160;
  const currentChars = message.length;
  const partsCount = Math.max(1, Math.ceil(currentChars / charLimit));

  const handleSend = () => {
    if (!recipients.trim()) {
      toast.error("Please enter recipient mobile number(s).");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter message content.");
      return;
    }

    startTransition(async () => {
      const res = await sendQuickDirectSmsAction({
        recipients: recipients.trim(),
        message: message.trim(),
        senderId: senderId.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "SMS dispatched successfully!");
        setOpen(false);
        setRecipients("");
        setMessage("");
        onSuccess?.();
      } else {
        toast.error(res.message || "Failed to dispatch SMS.");
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
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold gap-1.5 bg-white shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Direct SMS</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[750px] w-[min(96vw,750px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-8 space-y-5">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-gray-900">
                Quick Direct SMS Dispatch
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Send an immediate single SMS or custom list broadcast without
                saving a full campaign.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="font-bold text-gray-700">
                Recipient Numbers *
              </Label>
              <span className="text-[10px] text-gray-400">
                Single or comma/newline separated
              </span>
            </div>
            <Textarea
              rows={2}
              placeholder="017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="text-xs font-mono bg-white"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="font-bold text-gray-700">
                Message Content *
              </Label>
              <span
                className={`font-mono font-bold text-[10px] ${
                  currentChars > charLimit ? "text-amber-600" : "text-gray-500"
                }`}
              >
                {currentChars} chars ({partsCount} SMS{" "}
                {isUnicode ? "Unicode" : "GSM"})
              </span>
            </div>
            <Textarea
              rows={4}
              placeholder="Write custom SMS message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs leading-relaxed bg-white"
            />
          </div>

          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Sender ID (Optional)
            </Label>
            <Input
              placeholder="8809648910523"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <TestSmsModal messageContent={message} />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSending || !recipients.trim() || !message.trim()}
              onClick={handleSend}
              className="h-8 text-xs font-bold gap-1.5 bg-[#0097a7] hover:bg-[#00838f] text-white cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Immediate SMS</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
