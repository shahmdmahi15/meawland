"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { DiscountType } from "@/generated/prisma/enums";
import { CouponRow } from "@/actions/admin/management/offers/coupons";
import {
  Copy,
  Check,
  Calendar,
  Users,
  Package,
  Boxes,
  Sparkles,
  Percent,
  Truck,
  DollarSign,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CouponPreviewModalProps {
  coupon: CouponRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CouponPreviewModal({
  coupon,
  open,
  onOpenChange,
}: CouponPreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!coupon) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.couponCode);
    setCopied(true);
    toast.success(`Copied "${coupon.couponCode}" to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDiscountIcon = () => {
    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:
        return <Percent className="h-5 w-5" />;
      case DiscountType.FREE_DELIVERY:
        return <Truck className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getDiscountDisplay = () => {
    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:
        return `${coupon.discount}% OFF`;
      case DiscountType.FREE_DELIVERY:
        return "FREE DELIVERY";
      case DiscountType.FIXED:
        return `৳${coupon.discount} FLAT OFF`;
      default:
        return "SPECIAL OFFER";
    }
  };

  const isExpired = coupon.status === "EXPIRED";
  const isExhausted = coupon.status === "EXHAUSTED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] w-[min(96vw,760px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col gap-0">
          <DialogHeader className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  {coupon.name}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  Review detailed discount rules, redemption limits, and product
                  eligibility.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Voucher Preview Card */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-5 sm:p-6 shadow-inner">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
                    {getDiscountIcon()}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Meawland Voucher
                    </span>
                    <h3 className="text-2xl font-black tracking-tight text-foreground">
                      {getDiscountDisplay()}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-background/90 backdrop-blur-xs border border-border px-3.5 py-2 rounded-xl shadow-xs">
                  <span className="font-mono font-bold text-sm text-foreground select-all tracking-wider">
                    {coupon.couponCode}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={copyCode}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-border/80 pt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Valid Until: {formatDate(coupon.expiresAt)}</span>
                </div>
                <span>•</span>
                <Badge
                  variant={
                    isExpired
                      ? "destructive"
                      : isExhausted
                        ? "secondary"
                        : "default"
                  }
                  className="text-[10px] px-2 py-0"
                >
                  {coupon.status}
                </Badge>
              </div>
            </div>

            {/* Rules & Limits Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Redemptions
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {coupon.currentRedemptions}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    / {coupon.maxRedemptions ?? "∞"}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Min Purchase
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {coupon.minPurchaseAmount
                    ? `৳${coupon.minPurchaseAmount}`
                    : "None"}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Min Quantity
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {coupon.minOrder ? `${coupon.minOrder} items` : "None"}
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Max Quantity
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {coupon.maxOrder ? `${coupon.maxOrder} items` : "None"}
                </p>
              </div>
            </div>

            {/* Scope and Eligibility summary */}
            <div className="space-y-3 border-t border-border pt-4 text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Applicability &amp; Target Restrictions
              </h4>

              <div className="space-y-2.5 text-xs">
                {/* Users */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/30">
                  <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">
                      User Audience:{" "}
                    </span>
                    {coupon.forAllUsers ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Available for all registered customers
                      </span>
                    ) : (
                      <div className="mt-1">
                        <span>
                          Restricted to {coupon.users.length} customer(s):
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {coupon.users.map((u) => (
                            <Badge
                              key={u.id}
                              variant="outline"
                              className="text-[10px] font-normal"
                            >
                              {u.name} ({u.email})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/30">
                  <Package className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">
                      Products &amp; Variants:{" "}
                    </span>
                    {coupon.forAllProducts ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Applicable to all store products and variants
                      </span>
                    ) : coupon.products.length > 0 ||
                      coupon.variants.length > 0 ? (
                      <div className="mt-1">
                        <span>
                          {coupon.products.length} product(s) and{" "}
                          {coupon.variants.length} variant(s) selected:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                          {coupon.products.map((p) => (
                            <Badge
                              key={p.id}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {p.name}
                            </Badge>
                          ))}
                          {coupon.variants.map((v) => (
                            <Badge
                              key={v.id}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {v.productName} ({v.sku})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Not applicable to individual products
                      </span>
                    )}
                  </div>
                </div>

                {/* Combos */}
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/30">
                  <Boxes className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-foreground">
                      Combo Bundles:{" "}
                    </span>
                    {coupon.forAllCombos ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Applicable to all combo bundles
                      </span>
                    ) : coupon.comboProducts.length > 0 ? (
                      <div className="mt-1">
                        <span>
                          {coupon.comboProducts.length} combo bundle(s)
                          selected:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {coupon.comboProducts.map((c) => (
                            <Badge
                              key={c.id}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {c.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Not applicable to combo bundles
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
