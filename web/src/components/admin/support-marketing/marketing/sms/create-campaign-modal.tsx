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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SmsCampaignType } from "@/generated/prisma/enums";
import {
  type AudienceFilterInput,
  type AdminSmsTemplateSummary,
} from "@/actions/admin/support-marketing/marketing/sms/types";
import { createSmsCampaignAction } from "@/actions/admin/support-marketing/marketing/sms/campaigns";
import { AudienceSegmentBuilder } from "./audience-segment-builder";
import { TestSmsModal } from "./test-sms-modal";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  Send,
  Calendar,
  Sparkles,
  Loader2,
  FileText,
} from "lucide-react";

interface CreateCampaignModalProps {
  templates: AdminSmsTemplateSummary[];
  categories?: { label: string; value: string }[];
  brands?: { id: string; name: string }[];
  districts?: string[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const AVAILABLE_VARIABLES = [
  { tag: "{name}", label: "Customer Name" },
  { tag: "{district}", label: "City / District" },
  { tag: "{couponCode}", label: "Coupon Code" },
  { tag: "{orderCode}", label: "Order Code" },
  { tag: "{storeUrl}", label: "Store Website Link" },
];

export function CreateCampaignModal({
  templates,
  categories,
  brands,
  districts,
  onSuccess,
  trigger,
}: CreateCampaignModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  // Campaign Form State
  const [title, setTitle] = useState("");
  const [campaignType, setCampaignType] = useState<SmsCampaignType>(
    SmsCampaignType.TARGETED_SEGMENT,
  );
  const [senderId, setSenderId] = useState("");
  const [message, setMessage] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

  const [audienceFilter, setAudienceFilter] = useState<AudienceFilterInput>({
    targetType: "ALL_CUSTOMERS",
  });

  const isUnicode = /[^\u0000-\u007f]/.test(message);
  const charLimitPerSms = isUnicode ? 70 : 160;
  const currentChars = message.length;
  const smsPartsCount = Math.max(1, Math.ceil(currentChars / charLimitPerSms));

  const insertVariable = (tag: string) => {
    setMessage((prev) => prev + " " + tag);
  };

  const handleTemplateSelect = (tmpl: AdminSmsTemplateSummary) => {
    setMessage(tmpl.body);
    toast.info(`Loaded template: "${tmpl.title}"`);
  };

  const handleCreateCampaign = () => {
    if (!title.trim()) {
      toast.error("Please enter a campaign title.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write SMS message content.");
      return;
    }

    startTransition(async () => {
      const res = await createSmsCampaignAction({
        title: title.trim(),
        type: campaignType,
        message: message.trim(),
        senderId: senderId.trim() || undefined,
        filters: audienceFilter,
        scheduleAt: isScheduled && scheduleDate ? scheduleDate : null,
      });

      if (res.success) {
        toast.success(res.message || "Campaign launched successfully! 🚀");
        setOpen(false);
        // Reset form
        setTitle("");
        setMessage("");
        setStep(1);
        onSuccess?.();
      } else {
        toast.error(res.message || "Failed to create campaign.");
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
              className="h-8 text-xs font-bold gap-1.5 bg-[#0097a7] hover:bg-[#00838f] text-white shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create SMS Campaign</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[1100px] w-[min(96vw,1100px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-8 space-y-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900">
                Create SMS Marketing Campaign
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Segment your audience, compose rich promotional messages, and
                broadcast across Bangladesh.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-b border-gray-100 pb-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 1 ? "text-[#0097a7]" : "text-gray-400"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px]">
                1
              </span>
              <span>1. Campaign Info &amp; Audience</span>
            </button>
            <span>→</span>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 2 ? "text-[#0097a7]" : "text-gray-400"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px]">
                2
              </span>
              <span>2. Message Composer</span>
            </button>
            <span>→</span>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 cursor-pointer ${
                step === 3 ? "text-[#0097a7]" : "text-gray-400"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px]">
                3
              </span>
              <span>3. Review &amp; Schedule</span>
            </button>
          </div>
        </DialogHeader>

        {/* STEP 1: Campaign Info & Audience Segmentation */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Campaign Title *
                </Label>
                <Input
                  placeholder="e.g. Ramadan Special 15% OFF Pet Food"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Campaign Category
                </Label>
                <Select
                  value={campaignType}
                  onValueChange={(val) =>
                    setCampaignType(val as SmsCampaignType)
                  }
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue>
                      {campaignType === SmsCampaignType.TARGETED_SEGMENT
                        ? "Targeted Audience Segment"
                        : campaignType === SmsCampaignType.PROMOTIONAL_FLASH
                          ? "Flash Sale & Promotional Offer"
                          : campaignType === SmsCampaignType.CART_RECOVERY
                            ? "Abandoned Cart Recovery"
                            : campaignType === SmsCampaignType.MANUAL_BROADCAST
                              ? "Manual List Broadcast"
                              : "Campaign Category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white">
                    <SelectItem
                      value={SmsCampaignType.TARGETED_SEGMENT}
                      className="text-xs"
                    >
                      Targeted Audience Segment
                    </SelectItem>
                    <SelectItem
                      value={SmsCampaignType.PROMOTIONAL_FLASH}
                      className="text-xs"
                    >
                      Flash Sale &amp; Promotional Offer
                    </SelectItem>
                    <SelectItem
                      value={SmsCampaignType.CART_RECOVERY}
                      className="text-xs"
                    >
                      Abandoned Cart Recovery
                    </SelectItem>
                    <SelectItem
                      value={SmsCampaignType.MANUAL_BROADCAST}
                      className="text-xs"
                    >
                      Manual List Broadcast
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Audience Segment Selector Component */}
            <AudienceSegmentBuilder
              value={audienceFilter}
              onChange={setAudienceFilter}
              categories={categories}
              brands={brands}
              districts={districts}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!title.trim()) {
                    toast.error("Please enter a campaign title.");
                    return;
                  }
                  setStep(2);
                }}
                className="h-8 text-xs font-bold bg-[#0097a7] hover:bg-[#00838f] text-white cursor-pointer"
              >
                <span>Continue to Message Composer</span>
                <span>→</span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Message Composer */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Quick Templates Selector */}
            {templates.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Choose from Saved Templates (Optional)</span>
                </Label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                  {templates.slice(0, 6).map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleTemplateSelect(tmpl)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#EDF5FA] hover:text-[#0097a7] text-[11px] font-bold text-gray-700 whitespace-nowrap border border-gray-200 cursor-pointer transition-colors"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variable Tag Injectors */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Insert Dynamic Customer Tags</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => insertVariable(v.tag)}
                    className="px-2.5 py-1 rounded-md bg-[#EDF5FA] hover:bg-[#D4EEFC] text-[#0097a7] text-[11px] font-mono font-bold border border-[#D4EEFC] cursor-pointer transition-colors"
                    title={`Click to insert ${v.tag}`}
                  >
                    + {v.tag} ({v.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-gray-700">
                  SMS Message Body *
                </Label>
                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`font-mono font-bold ${
                      currentChars > charLimitPerSms
                        ? "text-amber-600"
                        : "text-gray-500"
                    }`}
                  >
                    {currentChars} chars ({smsPartsCount} SMS{" "}
                    {isUnicode ? "Unicode" : "GSM"})
                  </span>
                </div>
              </div>
              <Textarea
                rows={5}
                placeholder="Write your SMS marketing content here... e.g. Hey {name}! Enjoy special discount on all pet foods with code {couponCode} at {storeUrl}!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-xs leading-relaxed font-sans bg-white"
              />
            </div>

            {/* Live Message Preview Card */}
            <div className="p-4 rounded-2xl bg-gray-900 text-white space-y-1.5 text-xs shadow-inner">
              <div className="flex justify-between items-center text-gray-400 text-[10px]">
                <span className="flex items-center gap-1">
                  <Megaphone className="w-3 h-3 text-[#56C8D8]" /> Live SMS
                  Preview
                </span>
                <span>From: 8809648910523</span>
              </div>
              <p className="font-mono text-xs whitespace-pre-wrap text-emerald-300">
                {message || "Type message to see real-time preview..."}
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="h-8 text-xs cursor-pointer"
              >
                ← Back
              </Button>
              <div className="flex items-center gap-2">
                <TestSmsModal messageContent={message} />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (!message.trim()) {
                      toast.error("Please write SMS message content.");
                      return;
                    }
                    setStep(3);
                  }}
                  className="h-8 text-xs font-bold bg-[#0097a7] hover:bg-[#00838f] text-white cursor-pointer"
                >
                  <span>Review &amp; Schedule</span>
                  <span>→</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="font-bold text-gray-700">Campaign Title:</span>
                <span className="font-black text-gray-900">{title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Segment:</span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {audienceFilter.targetType.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">SMS Parts per Recipient:</span>
                <span className="font-bold text-gray-900">
                  {smsPartsCount} SMS
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Encoding Format:</span>
                <span className="font-bold text-gray-900">
                  {isUnicode
                    ? "Unicode (Bangla / Special)"
                    : "GSM Standard (English)"}
                </span>
              </div>
            </div>

            {/* Scheduling Option */}
            <div className="p-4 rounded-2xl border border-gray-200 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Schedule Campaign for Later
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Send at a specific time or dispatch right away.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="scheduleToggle"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
              </div>

              {isScheduled && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
                  <Label className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Choose
                    Schedule Date &amp; Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-9 text-xs max-w-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                className="h-8 text-xs cursor-pointer"
              >
                ← Back to Composer
              </Button>
              <div className="flex items-center gap-2">
                <TestSmsModal messageContent={message} />
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={handleCreateCampaign}
                  className="h-9 px-4 text-xs font-black bg-[#0097a7] hover:bg-[#00838f] text-white shadow-md gap-2 cursor-pointer transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Launching Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {isScheduled
                          ? "Schedule Campaign"
                          : "Broadcast Campaign Now"}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
