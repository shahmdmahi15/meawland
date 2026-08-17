"use client";

import React from "react";
import {
  type ProductDetailVariant,
  type AttributeGroup,
} from "@/actions/store/products/get-product-details";
import { AttributeType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

interface VariantSelectorProps {
  variants: ProductDetailVariant[];
  selectedVariant: ProductDetailVariant | null;
  selectedAttributes: Record<string, string>;
  onSelectOption: (type: AttributeType, optionName: string) => void;
  attributeGroups: AttributeGroup[];
  hasValidationError?: boolean;
}

export function VariantSelector({
  variants,
  selectedVariant,
  selectedAttributes,
  onSelectOption,
  attributeGroups,
  hasValidationError = false,
}: VariantSelectorProps) {
  if (variants.length === 0 || attributeGroups.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-4 py-4 px-4 rounded-3xl border-2 transition-all duration-300",
        hasValidationError && !selectedVariant
          ? "border-rose-400 bg-rose-50/50 ring-4 ring-rose-100 animate-shake"
          : "border-[#D4EEFC] bg-[#F0F8FF]/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Choose Options
          </span>
          {hasValidationError && !selectedVariant && (
            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Please select all options
            </span>
          )}
        </div>
        {selectedVariant ? (
          <span className="text-xs font-bold text-[#56C8D8] flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Option Selected
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-gray-400">
            No option selected
          </span>
        )}
      </div>

      {attributeGroups.map((group) => {
        const currentSelectedName = selectedAttributes[group.type];

        return (
          <div key={group.type} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">{group.title}:</span>
              {currentSelectedName && (
                <span className="font-black text-gray-900">
                  {currentSelectedName}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2.5">
              {group.options.map((opt) => {
                const isSelected =
                  currentSelectedName?.toLowerCase() === opt.name.toLowerCase();

                // Check if color swatch
                const isColor = group.type === AttributeType.COLOR;

                if (isColor) {
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => onSelectOption(group.type, opt.name)}
                      className={cn(
                        "group/color relative flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all cursor-pointer",
                        isSelected
                          ? "border-[#56C8D8] bg-white shadow-xs ring-2 ring-[#56C8D8]/20 scale-102"
                          : "border-gray-200 bg-white hover:border-[#56C8D8]/50 hover:bg-gray-50",
                      )}
                      title={`${opt.name} (${opt.value})`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shadow-2xs shrink-0"
                        style={{ backgroundColor: opt.value }}
                      />
                      <span className="text-xs font-bold text-gray-800">
                        {opt.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#56C8D8] stroke-3" />
                      )}
                    </button>
                  );
                }

                // Size or Weight or other
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => onSelectOption(group.type, opt.name)}
                    className={cn(
                      "relative px-4 py-2 rounded-2xl text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-1.5",
                      isSelected
                        ? "border-[#56C8D8] bg-white text-[#56C8D8] shadow-xs ring-2 ring-[#56C8D8]/20 scale-102"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                    )}
                  >
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#56C8D8] stroke-3" />
                    )}
                    <span>{opt.name}</span>
                    {opt.value &&
                      opt.value.toLowerCase() !== opt.name.toLowerCase() && (
                        <span className="text-[10px] text-gray-400 font-medium ml-0.5">
                          ({opt.value})
                        </span>
                      )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
