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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Zap, Send, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { sendQuickDirectEmailAction } from "@/actions/admin/support-marketing/marketing/email/quick-send";
import { TestEmailModal } from "./test-email-modal";

interface QuickEmailModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function QuickEmailModal({ trigger, onSuccess }: QuickEmailModalProps) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = () => {
    if (!recipients.trim()) {
      toast.error("Please enter at least one recipient email address.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please provide an email subject.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter email message content.");
      return;
    }

    startTransition(async () => {
      const res = await sendQuickDirectEmailAction({
        recipients: recipients.trim(),
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        message: message.trim(),
      });

      if (res.success) {
        toast.success(res.message || "Emails dispatched successfully!");
        setOpen(false);
        setRecipients("");
        setSubject("");
        setPreviewText("");
        setMessage("");
        onSuccess?.();
      } else {
        toast.error(res.message || "Failed to dispatch emails.");
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
              <span>Quick Direct Email</span>
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
                Quick Direct Email Dispatch
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Send an immediate single email or custom email list broadcast
                with branded Meawland formatting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="font-bold text-gray-700">
                Recipient Email Addresses *
              </Label>
              <span className="text-[11px] text-gray-400">
                Single or comma/newline separated
              </span>
            </div>
            <Textarea
              placeholder="customer1@example.com, customer2@example.com&#10;vip@domain.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-bold text-gray-700 block mb-1">
                Email Subject Line *
              </Label>
              <Input
                placeholder="e.g. Special Weekend Reward for your furry friend! 🐾"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="font-bold text-gray-700 block mb-1">
                Preview Subtitle (Preheader)
              </Label>
              <Input
                placeholder="e.g. Enjoy 15% OFF all cat supplies this weekend"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="font-bold text-gray-700 block mb-1">
              Message Content (Paragraphs will be auto-formatted) *
            </Label>
            <Textarea
              placeholder="Write your email body here...&#10;&#10;Use blank lines between paragraphs for clean spacing."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div>
            <TestEmailModal
              defaultSubject={subject || "Meawland Test Preview"}
              defaultMessage={
                message || "Previewing email message formatting..."
              }
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1.5 cursor-pointer bg-white"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>Send Test Preview</span>
                </Button>
              }
            />
          </div>

          <div className="flex items-center gap-2">
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
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Immediate Email</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
