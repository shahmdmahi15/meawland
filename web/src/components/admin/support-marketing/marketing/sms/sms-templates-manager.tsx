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
import { SmsTemplateCategory } from "@/generated/prisma/enums";
import type { AdminSmsTemplateSummary } from "@/actions/admin/support-marketing/marketing/sms/types";
import {
  createSmsTemplateAction,
  deleteSmsTemplateAction,
} from "@/actions/admin/support-marketing/marketing/sms/templates";
import { TestSmsModal } from "./test-sms-modal";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  Tag,
  Sparkles,
  Loader2,
} from "lucide-react";

interface SmsTemplatesManagerProps {
  initialTemplates: AdminSmsTemplateSummary[];
  onSelectTemplate?: (tmpl: AdminSmsTemplateSummary) => void;
}

const CATEGORY_COLORS: Record<SmsTemplateCategory, string> = {
  [SmsTemplateCategory.ORDER_UPDATE]: "bg-blue-50 text-blue-700 border-blue-200",
  [SmsTemplateCategory.PROMOTIONAL]: "bg-emerald-50 text-emerald-700 border-emerald-200",
  [SmsTemplateCategory.CART_RECOVERY]: "bg-amber-50 text-amber-700 border-amber-200",
  [SmsTemplateCategory.SEASONAL]: "bg-purple-50 text-purple-700 border-purple-200",
  [SmsTemplateCategory.OTP]: "bg-indigo-50 text-indigo-700 border-indigo-200",
  [SmsTemplateCategory.WELCOME]: "bg-teal-50 text-teal-700 border-teal-200",
  [SmsTemplateCategory.CUSTOM]: "bg-gray-100 text-gray-700 border-gray-300",
};

export function SmsTemplatesManager({
  initialTemplates,
  onSelectTemplate,
}: SmsTemplatesManagerProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Template Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SmsTemplateCategory>(
    SmsTemplateCategory.PROMOTIONAL,
  );
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredTemplates = templates.filter((t) => {
    if (activeCategory !== "ALL" && t.category !== activeCategory) return false;
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Template text copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message content are required.");
      return;
    }

    startTransition(async () => {
      const res = await createSmsTemplateAction({
        title: title.trim(),
        category,
        body: body.trim(),
        variables: [],
      });

      if (res.success && res.template) {
        toast.success("New template saved!");
        setTemplates((prev) => [res.template!, ...prev]);
        setIsOpen(false);
        setTitle("");
        setBody("");
      } else {
        toast.error(res.message || "Failed to create template.");
      }
    });
  };

  const handleDelete = (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    startTransition(async () => {
      const res = await deleteSmsTemplateAction(templateId);
      if (res.success) {
        toast.success("Template deleted.");
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        toast.error(res.message || "Failed to delete template.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Category Pills & Add Template Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            size="sm"
            variant={activeCategory === "ALL" ? "default" : "outline"}
            onClick={() => setActiveCategory("ALL")}
            className="h-8 text-xs font-bold rounded-xl cursor-pointer"
          >
            All Templates ({templates.length})
          </Button>
          {Object.values(SmsTemplateCategory).map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className="h-8 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer"
            >
              {cat.replace(/_/g, " ")}
            </Button>
          ))}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger
            render={
              <Button
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 bg-[#0097a7] hover:bg-[#00838f] text-white rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Template</span>
              </Button>
            }
          />

          <DialogContent className="sm:max-w-[700px] w-[min(96vw,700px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl z-50 p-6 sm:p-8 space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-gray-900">
                    Create Message Template
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Save reusable marketing or transactional notification templates.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 text-xs">
              <div>
                <Label className="font-bold text-gray-700 block mb-1">
                  Template Title *
                </Label>
                <Input
                  placeholder="e.g. Weekend Flash Sale 20% OFF"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="font-bold text-gray-700 block mb-1">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) =>
                    setCategory(val as SmsTemplateCategory)
                  }
                >
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue>
                      {category ? category.replace(/_/g, " ") : "Select Category"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white">
                    {Object.values(SmsTemplateCategory).map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {c.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-bold text-gray-700 block mb-1">
                  Template Content *
                </Label>
                <Textarea
                  rows={4}
                  placeholder="Hey {name}! Don't miss our weekend discounts at {storeUrl}!"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="text-xs leading-relaxed bg-white"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  Supported tags: {"{name}"}, {"{orderCode}"}, {"{couponCode}"}, {"{amount}"}, {"{storeUrl}"}, {"{trackingUrl}"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleCreate}
                className="h-8 text-xs font-bold bg-[#0097a7] hover:bg-[#00838f] text-white cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Template</span>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl border border-gray-200/80 bg-white hover:border-[#56C8D8]/50 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-xs text-gray-900 line-clamp-1">
                  {t.title}
                </h4>
                <Badge
                  variant="outline"
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.5 shrink-0 ${
                    CATEGORY_COLORS[t.category]
                  }`}
                >
                  {t.category.replace(/_/g, " ")}
                </Badge>
              </div>

              <p className="font-mono text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                {t.body}
              </p>

              {t.variables && t.variables.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {t.variables.map((v) => (
                    <span
                      key={v}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EDF5FA] text-[#0097a7] font-bold"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(t.id, t.body)}
                  className="h-7 text-xs px-2 gap-1 text-gray-600 hover:text-primary cursor-pointer"
                >
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === t.id ? "Copied" : "Copy"}</span>
                </Button>

                <TestSmsModal
                  messageContent={t.body}
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2 text-primary hover:bg-[#EDF5FA] cursor-pointer"
                    >
                      Test
                    </Button>
                  }
                />
              </div>

              {!t.isDefault && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(t.id)}
                  className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                  title="Delete Template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
