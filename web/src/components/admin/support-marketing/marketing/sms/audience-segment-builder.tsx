"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  type AudienceFilterInput,
} from "@/actions/admin/support-marketing/marketing/sms/types";
import { calculateAudienceCountAction } from "@/actions/admin/support-marketing/marketing/sms/segments";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Crown,
  Repeat,
  Sparkles,
  UserX,
  Clock,
  ShoppingCart,
  MapPin,
  Tag,
  Package,
  Layers,
  PhoneCall,
  Loader2,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Category } from "@/generated/prisma/enums";

interface AudienceSegmentBuilderProps {
  value: AudienceFilterInput;
  onChange: (value: AudienceFilterInput) => void;
  categories?: { label: string; value: string }[];
  brands?: { id: string; name: string }[];
  products?: { id: string; name: string }[];
  districts?: string[];
}

const SEGMENT_OPTIONS: Array<{
  id: AudienceFilterInput["targetType"];
  label: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
}> = [
  {
    id: "ALL_CUSTOMERS",
    label: "All Customers & Members",
    description: "Every registered user and customer with a valid mobile number.",
    icon: Users,
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "VIP_SPENDERS",
    label: "VIP High Spenders",
    description: "Customers who have spent above a threshold amount.",
    icon: Crown,
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "REPEAT_BUYERS",
    label: "Repeat & Loyal Buyers",
    description: "Customers with 2 or more placed orders.",
    icon: Repeat,
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "FIRST_TIME_BUYERS",
    label: "First-Time Buyers",
    description: "Customers who placed their first order (welcome offers).",
    icon: Sparkles,
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    id: "NEVER_ORDERED",
    label: "Registered Non-Buyers",
    description: "Registered accounts that haven't placed an order yet.",
    icon: UserX,
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
  {
    id: "INACTIVE_USERS",
    label: "Inactive Win-back (30-90 Days)",
    description: "Past buyers who haven't ordered in recent weeks.",
    icon: Clock,
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    id: "ABANDONED_CART",
    label: "Cart Abandoners",
    description: "Customers with items currently waiting in their cart.",
    icon: ShoppingCart,
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  {
    id: "DISTRICT_TARGET",
    label: "District / City Location",
    description: "Customers located in a specific district (e.g. Dhaka, Narail).",
    icon: MapPin,
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "PRODUCT_CATEGORY_BUYERS",
    label: "Category Buyers",
    description: "Customers who purchased Cat Food, Accessories, Medicine, etc.",
    icon: Layers,
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
  },
  {
    id: "BRAND_BUYERS",
    label: "Brand Enthusiasts",
    description: "Customers who bought specific pet brands (e.g. Me-O, SmartHeart).",
    icon: Tag,
    badgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  },
  {
    id: "CUSTOM_NUMBERS",
    label: "Manual Phone Number List",
    description: "Paste a custom list of Bangladeshi mobile numbers.",
    icon: PhoneCall,
    badgeColor: "bg-gray-100 text-gray-800 border-gray-300",
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
    Array<{ maskedPhone: string; name: string; district?: string | null }>
  >([]);

  const calculateCount = () => {
    startTransition(async () => {
      const res = await calculateAudienceCountAction(value);
      if (res.success) {
        setRecipientCount(res.count);
        setSampleRecipients(res.sampleRecipients || []);
      }
    });
  };

  useEffect(() => {
    calculateCount();
  }, [value.targetType, value.district, value.category, value.brandId, value.minSpend, value.minOrders, value.inactiveDays, value.customNumbers]);

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

      {/* Segment Parameter Configs */}
      {value.targetType === "VIP_SPENDERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Minimum Lifetime Spend (৳)</Label>
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
            className="h-8 max-w-xs text-xs"
          />
        </div>
      )}

      {value.targetType === "REPEAT_BUYERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Minimum Order Count</Label>
          <Input
            type="number"
            placeholder="e.g. 2"
            value={value.minOrders || 2}
            onChange={(e) =>
              onChange({
                ...value,
                minOrders: parseInt(e.target.value) || 2,
              })
            }
            className="h-8 max-w-xs text-xs"
          />
        </div>
      )}

      {value.targetType === "INACTIVE_USERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <Label className="font-bold text-gray-700">Days Since Last Order</Label>
          <Input
            type="number"
            placeholder="e.g. 60"
            value={value.inactiveDays || 60}
            onChange={(e) =>
              onChange({
                ...value,
                inactiveDays: parseInt(e.target.value) || 60,
              })
            }
            className="h-8 max-w-xs text-xs"
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

      {value.targetType === "CUSTOM_NUMBERS" && (
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <Label className="font-bold text-gray-700">
              Mobile Numbers (Comma or Newline separated)
            </Label>
            <span className="text-[10px] text-gray-500">
              Format: 017XXXXXXXX or 88017XXXXXXXX
            </span>
          </div>
          <Textarea
            rows={4}
            placeholder="01712345678, 01887654321, 01911223344"
            value={value.customNumbers || ""}
            onChange={(e) =>
              onChange({
                ...value,
                customNumbers: e.target.value,
              })
            }
            className="text-xs font-mono bg-white"
          />
        </div>
      )}

      {/* Real-time Audience Calculator Bar */}
      <div className="p-3 rounded-xl bg-[#EDF5FA] border border-[#D4EEFC] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#56C8D8] text-white">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-gray-600 font-medium">Matching Audience: </span>
            <strong className="font-black text-sm text-[#0097a7]">
              {isCalculating ? "Calculating..." : `${recipientCount ?? 0} Recipients`}
            </strong>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isCalculating}
          onClick={calculateCount}
          className="h-7 text-xs bg-white gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isCalculating ? "animate-spin" : ""}`} />
          <span>Refresh Count</span>
        </Button>
      </div>

      {sampleRecipients.length > 0 && (
        <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600 space-y-1">
          <span className="font-bold text-gray-700 block">Sample Recipients:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleRecipients.map((s, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[10px] bg-white font-mono gap-1"
              >
                <span>{s.name}</span>
                <span className="text-gray-400">({s.maskedPhone})</span>
                {s.district && (
                  <span className="text-primary font-sans">• {s.district}</span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
