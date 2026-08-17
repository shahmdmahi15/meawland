"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { DiscountType } from "@/generated/prisma/enums";
import { CampaignRow } from "@/actions/admin/management/offers/campaigns";
import {
  Package,
  Boxes,
  Percent,
  Truck,
  DollarSign,
  Clock,
  Flame,
  Tag,
  FolderTree,
  Award,
} from "lucide-react";

interface CampaignPreviewModalProps {
  campaign: CampaignRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignPreviewModal({
  campaign,
  open,
  onOpenChange,
}: CampaignPreviewModalProps) {
  if (!campaign) return null;

  const getDiscountIcon = () => {
    switch (campaign.discountType) {
      case DiscountType.PERCENTAGE:
        return <Percent className="h-4 w-4" />;
      case DiscountType.FREE_DELIVERY:
        return <Truck className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getDiscountDisplay = () => {
    switch (campaign.discountType) {
      case DiscountType.PERCENTAGE:
        return `${campaign.discount}% OFF`;
      case DiscountType.FREE_DELIVERY:
        return "FREE DELIVERY";
      case DiscountType.FIXED:
        return `৳${campaign.discount} FLAT DISCOUNT`;
      default:
        return "SPECIAL PROMOTION";
    }
  };

  const isExpired = campaign.status === "EXPIRED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] w-[min(96vw,860px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col gap-0">
          <DialogHeader className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  {campaign.name}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  Preview of the promotional hero banner and campaign target
                  catalogue.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Campaign Hero Card */}
          <div className="p-5 sm:p-6 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-md">
              {/* Banner Container */}
              <div className="relative aspect-[21/9] w-full bg-muted overflow-hidden">
                {campaign.bannerBase64 ? (
                  <Image
                    src={campaign.bannerBase64}
                    alt={campaign.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                    No Banner Image Available
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground font-bold text-xs gap-1 shadow-sm">
                      {getDiscountIcon()}
                      {getDiscountDisplay()}
                    </Badge>
                    <Badge
                      variant={isExpired ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {isExpired ? "Campaign Ended" : "Live Campaign"}
                    </Badge>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white mt-1.5 drop-shadow-sm">
                    {campaign.name}
                  </h3>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Campaign Description
                  </p>
                  <p className="text-xs sm:text-sm text-foreground mt-1 whitespace-pre-line leading-relaxed">
                    {campaign.description}
                  </p>
                </div>

                {/* Campaign Metrics & Constraints */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Ends At
                    </p>
                    <p className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {formatDate(campaign.endsAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Min Purchase
                    </p>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {campaign.minPurchaseAmount
                        ? `৳${campaign.minPurchaseAmount}`
                        : "None"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Redemptions
                    </p>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {campaign.currentRedemptions}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        / {campaign.maxRedemptions ?? "∞"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Target Catalog Items */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Participating Products &amp; Bundles
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    {/* Categories */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/30">
                      <Tag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">
                          Main Categories:{" "}
                        </span>
                        {campaign.forAllCategories ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Applicable to all categories
                          </span>
                        ) : campaign.categories.length > 0 ? (
                          <div className="mt-1">
                            <span>
                              {campaign.categories.length} category(s) included:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.categories.map((cat) => (
                                <Badge
                                  key={cat}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Not category-restricted
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subcategories */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/30">
                      <FolderTree className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">
                          Subcategories:{" "}
                        </span>
                        {campaign.forAllSubCategories ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Applicable to all subcategories
                          </span>
                        ) : campaign.subCategories.length > 0 ? (
                          <div className="mt-1">
                            <span>
                              {campaign.subCategories.length} subcategory(s)
                              included:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.subCategories.map((sc) => (
                                <Badge
                                  key={sc.id}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {sc.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Not subcategory-restricted
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Brands */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-muted/30">
                      <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">
                          Brands:{" "}
                        </span>
                        {campaign.forAllBrands ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Applicable to all brands
                          </span>
                        ) : campaign.brands.length > 0 ? (
                          <div className="mt-1">
                            <span>
                              {campaign.brands.length} brand(s) included:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.brands.map((b) => (
                                <Badge
                                  key={b.id}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {b.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Not brand-restricted
                          </span>
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
                        {campaign.forAllProducts ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            All store products and variants
                          </span>
                        ) : campaign.products.length > 0 ||
                          campaign.variants.length > 0 ? (
                          <div className="mt-1">
                            <span>
                              {campaign.products.length} product(s) and{" "}
                              {campaign.variants.length} variant(s) included:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                              {campaign.products.map((p) => (
                                <Badge
                                  key={p.id}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {p.name}
                                </Badge>
                              ))}
                              {campaign.variants.map((v) => (
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
                            No individual products included (combos only)
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
                        {campaign.forAllCombos ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            All combo bundle offers
                          </span>
                        ) : campaign.comboProducts.length > 0 ? (
                          <div className="mt-1">
                            <span>
                              {campaign.comboProducts.length} combo bundle(s)
                              included:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {campaign.comboProducts.map((c) => (
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
                            No combo bundles included (products only)
                          </span>
                        )}
                      </div>
                    </div>
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
