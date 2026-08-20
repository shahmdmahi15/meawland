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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Plus,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  Loader2,
  CheckCircle2,
  Eye,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import { EmailCampaignType } from "@/generated/prisma/enums";
import {
  EmailAudienceFilter,
  AdminEmailTemplateSummary,
} from "@/actions/admin/support-marketing/marketing/email/types";
import { AudienceSegmentBuilder } from "./audience-segment-builder";
import { createEmailCampaignAction } from "@/actions/admin/support-marketing/marketing/email/campaigns";
import { TestEmailModal } from "./test-email-modal";
import { wrapEmailHtml } from "@/lib/email-templates";

interface CreateEmailCampaignModalProps {
  trigger?: React.ReactNode;
  templates: AdminEmailTemplateSummary[];
  categories?: Array<{ label: string; value: string }>;
  brands?: Array<{ id: string; name: string }>;
  districts?: string[];
  onSuccess?: () => void;
}

export function CreateEmailCampaignModal({
  trigger,
  templates,
  categories,
  brands,
  districts,
  onSuccess,
}: CreateEmailCampaignModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [campaignType, setCampaignType] = useState<EmailCampaignType>(
    EmailCampaignType.PROMOTIONAL_FLASH,
  );
  const [filters, setFilters] = useState<EmailAudienceFilter>({
    targetType: "ALL_CUSTOMERS",
  });
  const [contentHtml, setContentHtml] = useState(
    `<h2>Special Pet Care Offer 🐾</h2><p>Hi <strong>{name}</strong>,</p><p>We are delighted to bring you exclusive savings across our entire catalog at Meawland!</p>`,
  );
  const [contentText, setContentText] = useState("");
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [previewMode, setPreviewMode] = useState<"visual" | "html">("visual");

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setSubject("");
    setPreviewText("");
    setCampaignType(EmailCampaignType.PROMOTIONAL_FLASH);
    setFilters({ targetType: "ALL_CUSTOMERS" });
    setContentHtml(
      `<h2>Special Pet Care Offer 🐾</h2><p>Hi <strong>{name}</strong>,</p><p>We are delighted to bring you exclusive savings across our entire catalog at Meawland!</p>`,
    );
    setContentText("");
    setScheduleAt("");
    setIsScheduled(false);
  };

  const handleApplyTemplate = (tpl: AdminEmailTemplateSummary) => {
    setSubject(tpl.subject);
    setPreviewText(tpl.previewText || "");
    setContentHtml(tpl.htmlContent);
    setContentText(tpl.textContent || "");
    toast.success(`Loaded template: "${tpl.title}"`);
  };

  const insertVariable = (varName: string) => {
    setContentHtml((prev) => `${prev} {${varName}}`);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Please provide a campaign title.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please provide an email subject line.");
      return;
    }
    if (!contentHtml.trim()) {
      toast.error("Please write your email message content.");
      return;
    }

    startTransition(async () => {
      const res = await createEmailCampaignAction({
        title: title.trim(),
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        contentHtml,
        contentText: contentText || undefined,
        type: campaignType,
        filters,
        scheduleAt: isScheduled && scheduleAt ? scheduleAt : null,
      });

      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        resetForm();
        onSuccess?.();
      } else {
        toast.error(res.message || "Failed to create email campaign.");
      }
    });
  };

  const renderedPreviewHtml = wrapEmailHtml({
    title: subject || "Campaign Preview",
    previewText: previewText || undefined,
    bodyContent: contentHtml
      .replace(/\{name\}/gi, "Sarah Khan")
      .replace(/\{email\}/gi, "customer@example.com")
      .replace(/\{storeUrl\}/gi, process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com"),
    recipientEmail: "customer@example.com",
    showUnsubscribe: true,
  });

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
              <span>Create Email Campaign</span>
            </Button>
          )
        }
      />

      <DialogContent className="sm:max-w-[1100px] w-[min(96vw,1100px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-8 space-y-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-gray-900">
                Create Email Marketing Campaign
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Segment your audience, design rich branded email newsletters, and broadcast across Bangladesh.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 pb-2 border-b-2 text-left transition-colors cursor-pointer ${
                step === 1
                  ? "border-[#0097a7] text-[#0097a7]"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px]">
                1
              </span>
              <span>1. Info &amp; Audience</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 pb-2 border-b-2 text-left transition-colors cursor-pointer ${
                step === 2
                  ? "border-[#0097a7] text-[#0097a7]"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current text-white text-[10px]">
                2
              </span>
              <span>2. Email Composer</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 pb-2 border-b-2 text-left transition-colors cursor-pointer ${
                step === 3
                  ? "border-[#0097a7] text-[#0097a7]"
                  : "border-transparent text-gray-400 hover:text-gray-700"
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
                  placeholder="e.g. Weekend Flash Sale 20% OFF Pet Food"
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
                    setCampaignType(val as EmailCampaignType)
                  }
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue>
                      {campaignType === EmailCampaignType.PROMOTIONAL_FLASH
                        ? "Flash Sale & Promotional Offer"
                        : campaignType === EmailCampaignType.TARGETED_SEGMENT
                        ? "Targeted Audience Segment"
                        : campaignType === EmailCampaignType.NEWSLETTER_DIGEST
                        ? "Newsletter Club Digest"
                        : campaignType === EmailCampaignType.CART_RECOVERY
                        ? "Abandoned Cart Recovery"
                        : "Manual List Broadcast"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white">
                    <SelectItem value={EmailCampaignType.PROMOTIONAL_FLASH} className="text-xs">
                      Flash Sale &amp; Promotional Offer
                    </SelectItem>
                    <SelectItem value={EmailCampaignType.TARGETED_SEGMENT} className="text-xs">
                      Targeted Audience Segment
                    </SelectItem>
                    <SelectItem value={EmailCampaignType.NEWSLETTER_DIGEST} className="text-xs">
                      Newsletter Club Digest
                    </SelectItem>
                    <SelectItem value={EmailCampaignType.CART_RECOVERY} className="text-xs">
                      Abandoned Cart Recovery
                    </SelectItem>
                    <SelectItem value={EmailCampaignType.MANUAL_BROADCAST} className="text-xs">
                      Manual List Broadcast
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AudienceSegmentBuilder
              value={filters}
              onChange={setFilters}
              categories={categories}
              brands={brands}
              districts={districts}
            />

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    toast.error("Please enter a campaign title to continue.");
                    return;
                  }
                  setStep(2);
                }}
                className="text-xs bg-[#0097a7] hover:bg-[#00838f] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Next: Compose Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Subject Line, Templates & Email Content Composer */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Quick Template Selector Carousel/Badges */}
            {templates.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <Sparkles className="w-3.5 h-3.5 text-[#0097a7]" />
                  <span>Quick Insert Template:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-[#56C8D8] hover:bg-[#EDF5FA] text-xs font-semibold text-gray-800 transition-all shrink-0 cursor-pointer text-left"
                    >
                      {tpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Email Subject Line *
                </Label>
                <Input
                  placeholder="e.g. ⚡ 48-Hour Flash Sale: 20% OFF Cat & Dog Food!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Preview Subtitle (Preheader Text)
                </Label>
                <Input
                  placeholder="e.g. Stock up on imported treats and save big this weekend."
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Variable Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-bold text-gray-500 mr-1">Insert Dynamic Tag:</span>
              {["name", "email", "storeUrl"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  onClick={() => insertVariable(tag)}
                  className="text-[11px] font-mono cursor-pointer hover:bg-gray-100"
                >
                  &#123;{tag}&#125;
                </Badge>
              ))}
            </div>

            {/* Email Composer & Live Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Code/HTML Editor */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-700">
                    Email HTML / Rich Body
                  </Label>
                  <span className="text-[11px] text-gray-400">
                    HTML tags or clean text
                  </span>
                </div>
                <Textarea
                  placeholder="<h2>Heading</h2><p>Write your email HTML content here...</p>"
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  rows={12}
                  className="text-xs font-mono resize-none bg-gray-50"
                />
              </div>

              {/* Right: Live Frame Preview */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-primary" /> Live Render Preview
                  </Label>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Responsive
                  </span>
                </div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-100 h-[280px] overflow-y-auto p-2">
                  <iframe
                    title="Email Preview"
                    srcDoc={renderedPreviewHtml}
                    className="w-full h-full border-0 bg-white rounded-xl shadow-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="text-xs gap-1.5 cursor-pointer bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back: Audience</span>
              </Button>

              <div className="flex items-center gap-2">
                <TestEmailModal
                  defaultSubject={subject || "Meawland Test Preview"}
                  defaultMessage={contentHtml}
                />

                <Button
                  type="button"
                  onClick={() => {
                    if (!subject.trim()) {
                      toast.error("Please enter a subject line.");
                      return;
                    }
                    if (!contentHtml.trim()) {
                      toast.error("Please write your email content.");
                      return;
                    }
                    setStep(3);
                  }}
                  className="text-xs bg-[#0097a7] hover:bg-[#00838f] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Next: Review &amp; Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Final Review & Schedule Date */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 space-y-3.5 text-xs">
              <h3 className="font-bold text-sm text-gray-900">
                Campaign Summary Inspection
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                <div>
                  <span className="text-gray-500 block">Campaign Title:</span>
                  <strong className="text-gray-900">{title}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Category:</span>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {campaignType}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500 block">Subject Line:</span>
                  <strong className="text-gray-900">{subject}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Target Audience:</span>
                  <strong className="text-gray-900">{filters.targetType}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-1">
                <span className="font-bold text-gray-700 block">Email Gateway:</span>
                <p className="text-[11px] text-gray-500">
                  Broadcast will be delivered via <strong>AWS SES v2</strong> from <code className="text-primary font-bold">no-reply@meawland.com</code> with automatic SPF, DKIM, and DMARC verification.
                </p>
              </div>
            </div>

            {/* Schedule Option Toggle */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    Schedule for Future Dispatch
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Broadcast immediately upon submission or schedule for a specific date and time.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 accent-[#0097a7] cursor-pointer"
                />
              </div>

              {isScheduled && (
                <div className="pt-2 border-t border-gray-100">
                  <Label className="text-xs font-bold text-gray-700 block mb-1">
                    Select Broadcast Date &amp; Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="h-9 text-xs max-w-xs"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                className="text-xs gap-1.5 cursor-pointer bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back: Composer</span>
              </Button>

              <Button
                type="button"
                disabled={isPending}
                onClick={handleCreate}
                className="text-xs bg-[#0097a7] hover:bg-[#00838f] text-white font-bold gap-2 cursor-pointer shadow-md px-5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isScheduled ? "Schedule Campaign" : "Confirm & Launch Campaign"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
