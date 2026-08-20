"use client";

import React, { useState, useEffect, useTransition } from "react";
import { EmailAudienceFilter } from "@/actions/admin/support-marketing/marketing/email/types";
import { calculateEmailAudienceCountAction } from "@/actions/admin/support-marketing/marketing/email/segments";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Crown,
  Repeat,
  Moon,
  MapPin,
  Tag,
  Sparkles,
  ShoppingCart,
  Mail,
  List,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Category } from "@/generated/prisma/enums";

interface AudienceSegmentBuilderProps {
  value: EmailAudienceFilter;
  onChange: (val: EmailAudienceFilter) => void;
  categories?: Array<{ label: string; value: string }>;
  brands?: Array<{ id: string; name: string }>;
  districts?: string[];
}

const SEGMENT_OPTIONS: Array<{
  id: EmailAudienceFilter["targetType"];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "ALL_CUSTOMERS",
    label: "All Customers & VIPs",
    description: "Every registered user, customer, and verified newsletter subscriber.",
    icon: Users,
  },
  {
    id: "NEWSLETTER_SUBSCRIBERS",
    label: "Newsletter Subscribers",
    description: "Active subscribers from footer club, checkout opt-ins, and popups.",
    icon: Mail,
  },
  {
    id: "VIP_SPENDERS",
    label: "VIP High Spenders",
    description: "Customers who have spent above a threshold amount in total.",
    icon: Crown,
  },
  {
    id: "REPEAT_BUYERS",
    label: "Repeat & Loyal Buyers",
    description: "Customers with 2 or more completed orders.",
    icon: Repeat,
  },
  {
    id: "CART_ABANDONERS",
    label: "Cart Abandoners",
    description: "Users with unpurchased pet items currently saved in their cart.",
    icon: ShoppingCart,
  },
  {
    id: "INACTIVE_CUSTOMERS",
    label: "Inactive (Win-Back)",
    description: "Customers who haven't ordered in 30, 60, or 90 days.",
    icon: Moon,
  },
  {
    id: "DISTRICT_TARGET",
    label: "Location / District",
    description: "Target pet parents in specific districts across Bangladesh.",
    icon: MapPin,
  },
  {
    id: "PRODUCT_CATEGORY_BUYERS",
    label: "Product Category",
    description: "Customers who previously purchased pet food, care, or toys.",
    icon: Tag,
  },
  {
    id: "BRAND_BUYERS",
    label: "Brand Admirers",
    description: "Customers who bought specific brands (Me-O, Royal Canin, etc.).",
    icon: Sparkles,
  },
  {
    id: "CUSTOM_EMAILS",
    label: "Custom Email List",
    description: "Paste a manual list of comma or newline-separated email addresses.",
    icon: List,
  },
];

const DEFAULT_DISTRICTS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
  "Narail",
  "Gazipur",
  "Narayanganj",
  "Cumilla",
  "Bogura",
  "Jessore",
];

export function AudienceSegmentBuilder({
  value,
  onChange,
  categories = Object.values(Category).map((c) => ({
    label: c.replace(/_/g, " "),
    value: c,
  })),
  brands = [],
  districts = DEFAULT_DISTRICTS,
}: AudienceSegmentBuilderProps) {
  const [isCalculating, startTransition] = useTransition();
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [sampleRecipients, setSampleRecipients] = useState<
    Array<{ maskedEmail: string; name: string; district?: string | null }>
  >([]);

  const calculateCount = () => {
    startTransition(async () => {
      const res = await calculateEmailAudienceCountAction(value);
      if (res.success) {
        setRecipientCount(res.count);
        setSampleRecipients(res.sampleRecipients || []);
      }
    });
  };

  useEffect(() => {
    calculateCount();
  }, [
    value.targetType,
    value.district,
    value.category,
    value.brandId,
    value.minSpend,
    value.minOrders,
    value.inactiveDays,
    value.customEmails,
  ]);

  return (
    <div className="space-y-4">
      {/* Segment Selector Grid */}
      <div>
        <Label className="text-xs font-bold text-gray-700 mb-2 block">
          Target Audience Segment
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {SEGMENT_OPTIONS.map((opt) => {
            const isSelected = value.targetType === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    targetType: opt.id,
                  })
                }
                className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                  isSelected
                    ? "border-[#56C8D8] bg-[#EDF5FA] ring-2 ring-[#56C8D8]/20 shadow-xs"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-xl ${
                        isSelected
                          ? "bg-[#56C8D8] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-gray-900 leading-tight">
                      {opt.label}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#0097a7] shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Segment Parameters */}
      {value.targetType === "VIP_SPENDERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Minimum Lifetime Spend (BDT)</Label>
          <Input
            type="number"
            placeholder="e.g. 5000"
            value={value.minSpend || 5000}
            onChange={(e) =>
              onChange({
                ...value,
                minSpend: parseFloat(e.target.value) || 0,
              })
            }
            className="h-8 max-w-xs text-xs bg-white"
          />
        </div>
      )}

      {value.targetType === "REPEAT_BUYERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Minimum Placed Orders</Label>
          <Input
            type="number"
            placeholder="e.g. 2"
            value={value.minOrders || 2}
            onChange={(e) =>
              onChange({
                ...value,
                minOrders: parseInt(e.target.value, 10) || 1,
              })
            }
            className="h-8 max-w-xs text-xs bg-white"
          />
        </div>
      )}

      {value.targetType === "INACTIVE_CUSTOMERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Days Since Last Order</Label>
          <Input
            type="number"
            placeholder="e.g. 30"
            value={value.inactiveDays || 30}
            onChange={(e) =>
              onChange({
                ...value,
                inactiveDays: parseInt(e.target.value, 10) || 30,
              })
            }
            className="h-8 max-w-xs text-xs bg-white"
          />
        </div>
      )}

      {value.targetType === "DISTRICT_TARGET" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Select Target District</Label>
          <Select
            value={value.district || "Dhaka"}
            onValueChange={(val) =>
              onChange({
                ...value,
                district: val || "Dhaka",
              })
            }
          >
            <SelectTrigger className="h-8 max-w-xs text-xs bg-white">
              <SelectValue>
                {value.district || "Dhaka"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56 z-50 bg-white">
              {districts.map((d) => (
                <SelectItem key={d} value={d} className="text-xs">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.targetType === "PRODUCT_CATEGORY_BUYERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Select Product Category</Label>
          <Select
            value={value.category || "PET_FOOD"}
            onValueChange={(val) =>
              onChange({
                ...value,
                category: val || "PET_FOOD",
              })
            }
          >
            <SelectTrigger className="h-8 max-w-xs text-xs bg-white">
              <SelectValue>
                {categories.find((c) => c.value === (value.category || "PET_FOOD"))?.label ||
                  (value.category || "Pet Food").replace(/_/g, " ")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56 z-50 bg-white">
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.targetType === "BRAND_BUYERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Select Brand</Label>
          <Select
            value={value.brandId || ""}
            onValueChange={(val) =>
              onChange({
                ...value,
                brandId: val || "",
              })
            }
          >
            <SelectTrigger className="h-8 max-w-xs text-xs bg-white">
              <SelectValue>
                {brands.find((b) => b.id === value.brandId)?.name || "Select Brand"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56 z-50 bg-white">
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-xs">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.targetType === "CUSTOM_EMAILS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Paste Custom Email Addresses</Label>
          <Textarea
            placeholder="customer1@example.com, customer2@example.com&#10;vip@domain.com"
            value={value.customEmails || ""}
            onChange={(e) =>
              onChange({
                ...value,
                customEmails: e.target.value,
              })
            }
            rows={3}
            className="text-xs bg-white resize-none"
          />
        </div>
      )}

      {/* Live Audience Count Calculation Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EDF5FA] text-[#0097a7]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900">
              Estimated Audience Reach
            </p>
            <p className="text-[11px] text-gray-500">
              Deduplicated and validated email contacts matching selected criteria.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCalculating ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Calculating...</span>
            </div>
          ) : (
            <div className="text-right">
              <span className="text-lg font-black text-[#0097a7]">
                {recipientCount !== null ? recipientCount.toLocaleString() : "0"}
              </span>
              <span className="text-xs text-gray-500 font-semibold ml-1">
                recipients
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sample Recipients Preview */}
      {sampleRecipients.length > 0 && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 space-y-1">
          <span className="font-bold text-gray-800">Sample Audience Preview: </span>
          <span className="text-gray-600">
            {sampleRecipients
              .map((s) => `${s.maskedEmail} (${s.name}${s.district ? ` • ${s.district}` : ""})`)
              .join(" • ")}
          </span>
        </div>
      )}

      {recipientCount === 0 && !isCalculating && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            No email recipients matched this segment. Try selecting <strong>All Customers</strong> or widening the criteria.
          </span>
        </div>
      )}
    </div>
  );
}
