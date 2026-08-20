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
import { Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendQuickDirectEmailAction } from "@/actions/admin/support-marketing/marketing/email/quick-send";

interface TestEmailModalProps {
  trigger?: React.ReactNode;
  defaultSubject?: string;
  defaultMessage?: string;
}

export function TestEmailModal({
  trigger,
  defaultSubject = "Meawland Test Preview 🐾",
  defaultMessage = "This is a live test preview from Meawland Email Marketing Hub.",
}: TestEmailModalProps) {
  const [open, setOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!testEmail.trim() || !testEmail.includes("@")) {
      toast.error("Please enter a valid test email address.");
      return;
    }

    startTransition(async () => {
      const res = await sendQuickDirectEmailAction({
        recipients: testEmail.trim(),
        subject: subject.trim() || defaultSubject,
        message: defaultMessage,
      });

      if (res.success) {
        toast.success(`Test preview sent to ${testEmail}! Check your inbox.`);
        setOpen(false);
      } else {
        toast.error(res.message || "Failed to send test email.");
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
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>Send Test Preview</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[600px] w-[min(96vw,600px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-7 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-black text-gray-900">
                Send Live Email Test Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Dispatch a test email to your inbox to inspect rendering, subject line, and responsiveness.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs">
          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Recipient Test Email Address *
            </Label>
            <Input
              type="email"
              placeholder="e.g. yourname@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Subject Line Preview
            </Label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-600 space-y-1">
            <p className="font-bold text-gray-800">Email Gateway: AWS SES v2</p>
            <p className="text-[11px]">
              Sender: <code className="text-primary font-bold">no-reply@meawland.com</code>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={handleSend}
            className="text-xs bg-[#0097a7] hover:bg-[#00838f] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Email</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
