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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendSingleSmsAction } from "@/actions/sms/send-sms";
import { toast } from "sonner";
import { Smartphone, Send, Loader2 } from "lucide-react";

interface TestSmsModalProps {
  messageContent: string;
  trigger?: React.ReactNode;
}

export function TestSmsModal({ messageContent, trigger }: TestSmsModalProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [isSending, startTransition] = useTransition();

  const handleSendTest = () => {
    if (!phone.trim()) {
      toast.error("Please enter a test mobile number.");
      return;
    }
    if (!messageContent.trim()) {
      toast.error("Message content is empty.");
      return;
    }

    startTransition(async () => {
      // Replace variables with sample preview data
      let sampleMessage = messageContent;
      sampleMessage = sampleMessage.replace(/\{name\}/gi, "Mahi");
      sampleMessage = sampleMessage.replace(/\{phone\}/gi, phone);
      sampleMessage = sampleMessage.replace(/\{district\}/gi, "Dhaka");
      sampleMessage = sampleMessage.replace(/\{orderCode\}/gi, "MEAWORD00012");
      sampleMessage = sampleMessage.replace(/\{couponCode\}/gi, "MEAW10");
      sampleMessage = sampleMessage.replace(/\{amount\}/gi, "1,500");
      sampleMessage = sampleMessage.replace(
        /\{trackingUrl\}/gi,
        "https://meawland.com/account/tracking",
      );

      const res = await sendSingleSmsAction({
        recipient: phone.trim(),
        message: sampleMessage,
      });

      if (res.success) {
        toast.success(res.message || `Test SMS sent to ${phone}! 📱`);
        setOpen(false);
      } else {
        toast.error(res.message || "Failed to send test SMS.");
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
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 cursor-pointer bg-white"
            >
              <Smartphone className="w-3.5 h-3.5 text-primary" />
              <span>Send Test SMS</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[600px] w-[min(96vw,600px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-7 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-gray-900">
                Send Live Test Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Dispatch a test SMS to your mobile phone to inspect formatting, character length, and delivery speed.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-xs">
          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Test Mobile Number
            </Label>
            <Input
              type="text"
              placeholder="e.g. 017XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="font-bold text-gray-700 block">Preview Content:</span>
            <p className="text-[11px] text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">
              {messageContent || "No message content entered yet."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSending || !messageContent.trim()}
            onClick={handleSendTest}
            className="text-xs h-8 gap-1.5 bg-[#0097a7] hover:bg-[#00838f] text-white font-bold cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Test...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Test SMS</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
