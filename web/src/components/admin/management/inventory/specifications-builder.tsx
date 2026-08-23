"use client";

import React from "react";
import { Plus, Trash2, Sparkles, Tag, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ProductSpecificationInput } from "@/schemas/admin/management/inventory/create-product";
import { cn } from "@/lib/utils";

const PRESET_SPECIFICATIONS = [
  {
    key: "Material",
    placeholder: "e.g. 100% Cotton, Stainless Steel, Natural Catnip",
  },
  { key: "Pet Type", placeholder: "e.g. Cats & Kittens, Dogs, All Pets" },
  {
    key: "Life Stage",
    placeholder: "e.g. All Life Stages, Kitten (0-12m), Adult",
  },
  { key: "Net Weight / Volume", placeholder: "e.g. 250g, 500ml, 1.5kg" },
  {
    key: "Country of Origin",
    placeholder: "e.g. Thailand, Germany, USA, Japan",
  },
  {
    key: "Flavor / Formula",
    placeholder: "e.g. Salmon & Tuna Gravy, Anti-Hairball",
  },
  { key: "Shelf Life", placeholder: "e.g. 24 Months from MFG Date" },
  {
    key: "Special Feature",
    placeholder: "e.g. Tear-Free, Organic, Flea & Tick Shield",
  },
];

interface SpecificationsBuilderProps {
  specifications: ProductSpecificationInput[];
  onChange: (specs: ProductSpecificationInput[]) => void;
  disabled?: boolean;
}

export function SpecificationsBuilder({
  specifications = [],
  onChange,
  disabled = false,
}: SpecificationsBuilderProps) {
  const handleAddRow = (initialKey = "", initialValue = "") => {
    onChange([...specifications, { key: initialKey, value: initialValue }]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = specifications.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateRow = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const updated = [...specifications];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange(updated);
  };

  const handleApplyPreset = (presetKey: string) => {
    // If already exists, don't duplicate
    const exists = specifications.some(
      (s) => s.key.toLowerCase().trim() === presetKey.toLowerCase().trim(),
    );
    if (!exists) {
      handleAddRow(presetKey, "");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Preset Quick Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#56C8D8]" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Custom Product Specifications
            </h4>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {specifications.length}{" "}
              {specifications.length === 1 ? "Item" : "Items"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Add custom key-value details shown in the product specifications
            tab.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddRow()}
          disabled={disabled}
          className="rounded-xl border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white font-bold text-xs gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Specification
        </Button>
      </div>

      {/* Preset Quick Badges */}
      <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 space-y-2">
        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Quick Add Presets:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SPECIFICATIONS.map((preset) => {
            const isAdded = specifications.some(
              (s) =>
                s.key.toLowerCase().trim() === preset.key.toLowerCase().trim(),
            );
            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handleApplyPreset(preset.key)}
                disabled={disabled || isAdded}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1",
                  isAdded
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60 cursor-default"
                    : "bg-background text-foreground hover:bg-[#56C8D8]/10 hover:border-[#56C8D8] hover:text-[#56C8D8]",
                )}
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{preset.key}</span>
                {isAdded ? " ✓" : " +"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Specifications Dynamic Rows List */}
      {specifications.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl border border-dashed border-border/80 text-center space-y-2 bg-muted/20">
          <Layers className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-semibold text-muted-foreground">
            No custom specifications added yet.
          </p>
          <p className="text-[11px] text-muted-foreground/70 max-w-sm mx-auto">
            Click any quick preset above or tap &quot;Add Specification&quot; to
            define attributes like Material, Pet Type, Life Stage, Net Weight,
            etc.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {specifications.map((spec, index) => {
            const matchedPreset = PRESET_SPECIFICATIONS.find(
              (p) =>
                p.key.toLowerCase().trim() === spec.key.toLowerCase().trim(),
            );
            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2.5 rounded-2xl bg-background border border-border shadow-2xs group hover:border-[#56C8D8]/40 transition-colors"
              >
                <div className="w-1/3 min-w-[120px]">
                  <Input
                    placeholder="Label (e.g. Material)"
                    value={spec.key}
                    disabled={disabled}
                    onChange={(e) =>
                      handleUpdateRow(index, "key", e.target.value)
                    }
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                </div>

                <div className="flex-1">
                  <Input
                    placeholder={
                      matchedPreset?.placeholder ||
                      "Value (e.g. 100% Breathable Cotton)"
                    }
                    value={spec.value}
                    disabled={disabled}
                    onChange={(e) =>
                      handleUpdateRow(index, "value", e.target.value)
                    }
                    className="h-9 text-xs font-medium rounded-xl"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => handleRemoveRow(index)}
                  className="size-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                  aria-label="Remove specification"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
