"use client";

import React, { useState, useTransition } from "react";
import { AdminEmailTemplateSummary } from "@/actions/admin/support-marketing/marketing/email/types";
import { EmailTemplateCategory } from "@/generated/prisma/enums";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Trash2,
  Copy,
  Check,
  FileText,
  Eye,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  createEmailTemplateAction,
  deleteEmailTemplateAction,
} from "@/actions/admin/support-marketing/marketing/email/templates";
import { wrapEmailHtml } from "@/lib/email-templates";

interface EmailTemplatesManagerProps {
  templates: AdminEmailTemplateSummary[];
  onSuccess?: () => void;
}

export function EmailTemplatesManager({
  templates: initialTemplates,
  onSuccess,
}: EmailTemplatesManagerProps) {
  const [templates, setTemplates] =
    useState<AdminEmailTemplateSummary[]>(initialTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<AdminEmailTemplateSummary | null>(null);

  // Create Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [category, setCategory] = useState<EmailTemplateCategory>(
    EmailTemplateCategory.PROMOTIONAL,
  );
  const [htmlContent, setHtmlContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const filtered =
    activeCategory === "ALL"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Template HTML copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Please enter a template title.");
      return;
    }
    if (!subject.trim()) {
      toast.error("Please provide an email subject line.");
      return;
    }
    if (!htmlContent.trim()) {
      toast.error("Please write template HTML content.");
      return;
    }

    startTransition(async () => {
      const res = await createEmailTemplateAction({
        title: title.trim(),
        subject: subject.trim(),
        previewText: previewText.trim() || undefined,
        category,
        htmlContent,
      });

      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
        setTitle("");
        setSubject("");
        setPreviewText("");
        setHtmlContent("");
        onSuccess?.();
      } else {
        toast.error(res.message || "Failed to create template.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    startDeleteTransition(async () => {
      const res = await deleteEmailTemplateAction(id);
      if (res.success) {
        toast.success(res.message);
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error(res.message || "Failed to delete template.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs & Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <Button
            size="sm"
            variant={activeCategory === "ALL" ? "default" : "outline"}
            onClick={() => setActiveCategory("ALL")}
            className="h-8 text-xs font-bold rounded-xl cursor-pointer"
          >
            All Templates ({templates.length})
          </Button>
          {Object.values(EmailTemplateCategory).map((cat) => (
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
                    Create Email Message Template
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">
                    Save reusable marketing, transactional, or newsletter email designs.
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="font-bold text-gray-700 block mb-1">
                    Subject Line *
                  </Label>
                  <Input
                    placeholder="e.g. ⚡ Flash Sale: 20% OFF all pet food!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
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
                      setCategory(val as EmailTemplateCategory)
                    }
                  >
                    <SelectTrigger className="h-9 text-xs bg-white">
                      <SelectValue>
                        {category ? category.replace(/_/g, " ") : "Select Category"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white">
                      {Object.values(EmailTemplateCategory).map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-bold text-gray-700 block mb-1">
                  Template HTML Content *
                </Label>
                <Textarea
                  placeholder="<h2>Heading</h2><p>Hi {name}, ...</p>"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={8}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleCreate}
                className="text-xs bg-[#0097a7] hover:bg-[#00838f] text-white font-bold gap-1.5 cursor-pointer shadow-xs"
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-gray-500 bg-white rounded-3xl border border-gray-200">
            <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700">No email templates found</p>
            <p className="text-[11px] text-gray-400">
              Create a custom template using the button above.
            </p>
          </div>
        ) : (
          filtered.map((tpl) => (
            <Card
              key={tpl.id}
              className="rounded-3xl border-gray-200 hover:border-[#56C8D8] transition-all bg-white shadow-xs flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm text-gray-900">
                      {tpl.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                      {tpl.subject}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-[#EDF5FA] text-[#0097a7] border-[#D4EEFC] shrink-0"
                  >
                    {tpl.category.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 line-clamp-4 font-mono">
                  {tpl.htmlContent.replace(/<[^>]+>/g, " ")}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-400">
                    Tags:
                  </span>
                  {tpl.variables.map((v) => (
                    <Badge
                      key={v}
                      variant="outline"
                      className="text-[9px] font-mono bg-white"
                    >
                      &#123;{v}&#125;
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <div className="p-3 bg-gray-50/70 border-t border-gray-100 rounded-b-3xl flex items-center justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPreviewTemplate(tpl)}
                  className="h-7 text-xs font-semibold gap-1 text-[#0097a7] hover:bg-[#EDF5FA] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(tpl.id, tpl.htmlContent)}
                    className="h-7 text-xs font-semibold gap-1 text-gray-600 hover:text-gray-900 cursor-pointer"
                  >
                    {copiedId === tpl.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>

                  {!tpl.isDefault && (
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isDeleting}
                      onClick={() => handleDelete(tpl.id)}
                      className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Visual Live Preview Modal */}
      {previewTemplate && (
        <Dialog
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
        >
          <DialogContent className="sm:max-w-[750px] w-[min(96vw,750px)] max-w-full max-h-[90vh] overflow-y-auto bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> {previewTemplate.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Subject: {previewTemplate.subject}
              </DialogDescription>
            </DialogHeader>

            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-100 h-[380px] p-2">
              <iframe
                title="Template Preview"
                srcDoc={wrapEmailHtml({
                  title: previewTemplate.subject,
                  previewText: previewTemplate.previewText || undefined,
                  bodyContent: previewTemplate.htmlContent
                    .replace(/\{name\}/gi, "Sarah Khan")
                    .replace(/\{storeUrl\}/gi, process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com"),
                  recipientEmail: "sarah@example.com",
                  showUnsubscribe: true,
                })}
                className="w-full h-full border-0 bg-white rounded-xl shadow-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(null)}
                className="text-xs cursor-pointer bg-white"
              >
                Close Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
