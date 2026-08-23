"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Code,
  Eye,
  Edit3,
  Sparkles,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RichDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight?: string;
  label?: string;
  placeholder?: string;
}

type EditorMode = "visual" | "html" | "preview";

const QUICK_TEMPLATES = [
  {
    id: "benefits",
    title: "Key Highlights",
    icon: "🌟",
    content: `<h3>🌟 Key Highlights & Benefits</h3>
<ul>
  <li><strong>100% Pet-Safe Materials:</strong> Non-toxic, hypoallergenic formula crafted for pet wellness.</li>
  <li><strong>Enhanced Comfort & Durability:</strong> Ergonomic design built to withstand active daily use.</li>
  <li><strong>Easy Maintenance:</strong> Quick-cleaning surface that keeps freshness longer.</li>
  <li><strong>Veterinarian Recommended:</strong> Trusted quality tested for optimal pet safety.</li>
</ul>`,
  },
  {
    id: "usage",
    title: "Usage & Care Steps",
    icon: "🐾",
    content: `<h3>🐾 Usage & Pet Care Steps</h3>
<ol>
  <li><strong>Step 1:</strong> Moisten pet's coat or prepare the recommended serving based on your pet's weight.</li>
  <li><strong>Step 2:</strong> Apply evenly or serve gently in a clean bowl.</li>
  <li><strong>Step 3:</strong> Allow 3-5 minutes of gentle massage or supervision during first usage.</li>
  <li><strong>Step 4:</strong> Rinse thoroughly or store leftovers in an airtight container.</li>
</ol>`,
  },
  {
    id: "ingredients",
    title: "Ingredients / Composition",
    icon: "🌿",
    content: `<h3>🌿 Ingredients & Nutritional Values</h3>
<p><strong>Primary Ingredients:</strong> Premium Fresh Protein Meal, Whole Brown Rice, Omega-3 & 6 Salmon Oil, Prebiotics & Essential Vitamins.</p>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px;">
  <thead>
    <tr style="background-color: #f0f9ff; border-bottom: 2px solid #56C8D8;">
      <th style="padding: 8px; text-align: left;">Nutrient</th>
      <th style="padding: 8px; text-align: left;">Guaranteed Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px;">Crude Protein (Min)</td>
      <td style="padding: 8px;">32.0%</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px;">Crude Fat (Min)</td>
      <td style="padding: 8px;">16.0%</td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px;">Moisture (Max)</td>
      <td style="padding: 8px;">10.0%</td>
    </tr>
  </tbody>
</table>`,
  },
  {
    id: "advisory",
    title: "Safety Box",
    icon: "⚠️",
    content: `<div style="padding: 12px 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; margin: 12px 0;">
  <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Pet Parent Advisory</p>
  <p style="margin: 4px 0 0 0; color: #b45309; font-size: 13px;">Always keep clean, fresh drinking water available at all times. Store in a cool, dry place away from direct sunlight.</p>
</div>`,
  },
];

export function RichDescriptionEditor({
  value,
  onChange,
  disabled = false,
  minHeight = "220px",
  placeholder = "Write detailed description, features, and pet care instructions...",
}: RichDescriptionEditorProps) {
  const [mode, setMode] = useState<EditorMode>("visual");
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Sync value from props to contentEditable without resetting cursor if user is currently typing
  useEffect(() => {
    if (mode === "visual" && visualRef.current) {
      if (
        !isUpdatingRef.current &&
        visualRef.current.innerHTML !== (value || "")
      ) {
        visualRef.current.innerHTML = value || "";
      }
    }
  }, [value, mode]);

  const handleVisualInput = useCallback(() => {
    if (visualRef.current) {
      isUpdatingRef.current = true;
      const html = visualRef.current.innerHTML;
      onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [onChange]);

  const exec = (command: string, val: string | undefined = undefined) => {
    if (disabled || mode !== "visual") return;
    document.execCommand(command, false, val);
    if (visualRef.current) {
      visualRef.current.focus();
    }
    handleVisualInput();
  };

  const handleInsertHeading = (tag: "h2" | "h3" | "h4" | "p") => {
    exec("formatBlock", `<${tag}>`);
  };

  const handleInsertLink = () => {
    if (disabled || mode !== "visual") return;
    const url = prompt("Enter link URL (e.g. https://example.com):");
    if (url) {
      exec("createLink", url);
    }
  };

  const handleInsertTable = () => {
    if (disabled || mode !== "visual") return;
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #56C8D8;">
            <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">Feature</th>
            <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Target Pet</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Cats &amp; Dogs</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Benefit</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Healthy Coat &amp; Digestion</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    exec("insertHTML", tableHtml);
  };

  const handleInsertTemplate = (
    templateContent: string,
    templateId: string,
  ) => {
    if (disabled) return;
    const separator = value && value.trim().length > 0 ? "<br/>" : "";
    const updated = (value || "") + separator + templateContent;
    onChange(updated);

    if (mode === "visual" && visualRef.current) {
      visualRef.current.innerHTML = updated;
    }

    setCopiedTemplate(templateId);
    setTimeout(() => {
      setCopiedTemplate(null);
    }, 1500);
  };

  return (
    <div className="space-y-3">
      {/* Editor Main Container */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs focus-within:border-[#56C8D8] transition-all">
        {/* Top Control Bar with Mode Switcher & Formatting Tools */}
        <div className="bg-muted/40 border-b border-border/80 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setMode("visual")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                mode === "visual"
                  ? "bg-[#56C8D8] text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Edit3 className="w-3 h-3" />
              Visual
            </button>
            <button
              type="button"
              onClick={() => setMode("html")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                mode === "html"
                  ? "bg-[#56C8D8] text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Code className="w-3 h-3" />
              HTML / Code
            </button>
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                mode === "preview"
                  ? "bg-[#56C8D8] text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Eye className="w-3 h-3" />
              Storefront Preview
            </button>
          </div>

          {/* Visual Formatting Toolbar (Visible in Visual mode) */}
          {mode === "visual" && (
            <div className="flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-0.5 bg-background border border-border/60 rounded-xl p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => handleInsertHeading("h2")}
                  title="Heading 2"
                  className="size-7 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => handleInsertHeading("h3")}
                  title="Heading 3"
                  className="size-7 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => handleInsertHeading("h4")}
                  title="Heading 4"
                  className="size-7 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <Heading4 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-0.5 bg-background border border-border/60 rounded-xl p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("bold")}
                  title="Bold (Ctrl+B)"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("italic")}
                  title="Italic (Ctrl+I)"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("underline")}
                  title="Underline (Ctrl+U)"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <Underline className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("strikeThrough")}
                  title="Strikethrough"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-0.5 bg-background border border-border/60 rounded-xl p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("insertUnorderedList")}
                  title="Bullet List"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("insertOrderedList")}
                  title="Numbered List"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("formatBlock", "<blockquote>")}
                  title="Quote"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <Quote className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-0.5 bg-background border border-border/60 rounded-xl p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={handleInsertTable}
                  title="Insert Comparison Table"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={handleInsertLink}
                  title="Insert Link"
                  className="size-7 rounded-lg cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  onClick={() => exec("removeFormat")}
                  title="Clear Formatting"
                  className="size-7 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Editor Body */}
        <div className="p-3.5 sm:p-4 bg-background">
          {mode === "visual" && (
            <div
              ref={visualRef}
              contentEditable={!disabled}
              onInput={handleVisualInput}
              style={{ minHeight }}
              className="outline-none prose prose-sm max-w-none text-foreground leading-relaxed focus:ring-0 empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60 empty:before:pointer-events-none"
              data-placeholder={placeholder}
            />
          )}

          {mode === "html" && (
            <textarea
              value={value || ""}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder="<p>Write raw HTML here...</p>"
              style={{ minHeight }}
              className="w-full bg-transparent font-mono text-xs sm:text-sm text-foreground outline-none resize-y leading-relaxed"
              rows={8}
            />
          )}

          {mode === "preview" && (
            <div
              style={{ minHeight }}
              className="prose prose-sm max-w-none text-gray-800 bg-[#F0F8FF]/50 rounded-2xl p-5 border border-[#D4EEFC]"
            >
              {value && value.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: value }} />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No description content to preview.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Character & Word Count Status Bar */}
        <div className="px-3.5 py-2 bg-muted/20 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              {value ? value.replace(/<[^>]*>/g, "").length : 0} Characters
            </span>
            <span>•</span>
            <span>
              {value
                ? value
                    .replace(/<[^>]*>/g, " ")
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length
                : 0}{" "}
              Words
            </span>
          </div>
          <span className="text-[10px] font-semibold text-[#56C8D8]">
            Rich HTML &amp; Storefront Ready
          </span>
        </div>
      </div>

      {/* Quick 1-Click Templates */}
      <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            1-Click Description Templates:
          </span>
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground font-normal"
          >
            Click to append into editor
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_TEMPLATES.map((tmpl) => {
            const isCopied = copiedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleInsertTemplate(tmpl.content, tmpl.id)}
                disabled={disabled}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 shadow-2xs",
                  isCopied
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-background text-foreground hover:bg-[#56C8D8]/10 hover:border-[#56C8D8] hover:text-[#56C8D8]",
                )}
              >
                <span>{tmpl.icon}</span>
                <span>{tmpl.title}</span>
                {isCopied ? (
                  <Check className="w-3 h-3 text-emerald-600 ml-0.5" />
                ) : (
                  <span className="text-muted-foreground/80 text-[10px] ml-0.5">
                    +
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
