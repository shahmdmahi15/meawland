"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscountType } from "@/generated/prisma/enums";
import {
  createCampaignAction,
  CampaignFormData,
} from "@/actions/admin/management/offers/campaigns";
import { ProductVariantPicker, ComboPicker } from "../offer-item-selector";
import { toast } from "sonner";
import {
  Plus,
  Flame,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  Package,
  Boxes,
  Percent,
  Truck,
  DollarSign,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";

interface CreateCampaignModalProps {
  formData: CampaignFormData;
  onCreated?: () => void;
}

export function CreateCampaignModal({
  formData,
  onCreated,
}: CreateCampaignModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [discountType, setDiscountType] = useState<DiscountType>(
    DiscountType.PERCENTAGE,
  );
  const [discount, setDiscount] = useState("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [forAllProducts, setForAllProducts] = useState(true);
  const [forAllCombos, setForAllCombos] = useState(true);

  // Default endsAt 14 days from today
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 16);
  };
  const [endsAt, setEndsAt] = useState(getDefaultDate());

  // Selected item IDs
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Banner image must be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error("Image must be PNG, JPG, or WebP format");
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    removeBanner();
    setDiscountType(DiscountType.PERCENTAGE);
    setDiscount("");
    setMinPurchaseAmount("");
    setMaxRedemptions("");
    setForAllProducts(true);
    setForAllCombos(true);
    setEndsAt(getDefaultDate());
    setSelectedProductIds([]);
    setSelectedVariantIds([]);
    setSelectedComboIds([]);
  };

  const handleProductToggle = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleVariantToggle = (id: string) => {
    setSelectedVariantIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleComboToggle = (id: string) => {
    setSelectedComboIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter campaign name");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter campaign description");
      return;
    }
    if (!bannerFile) {
      toast.error("Please upload a campaign banner image");
      return;
    }
    if (
      discountType !== DiscountType.FREE_DELIVERY &&
      (!discount || parseFloat(discount) <= 0)
    ) {
      toast.error("Please enter a valid discount value");
      return;
    }
    const hasProductSelection =
      forAllProducts ||
      selectedProductIds.length > 0 ||
      selectedVariantIds.length > 0;
    const hasComboSelection = forAllCombos || selectedComboIds.length > 0;

    if (!hasProductSelection && !hasComboSelection) {
      toast.error(
        "Please select at least one product, variant, or combo deal (or enable All Products / All Combos)",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("description", description.trim());
      fd.append("banner", bannerFile);
      fd.append("discountType", discountType);
      fd.append(
        "discount",
        discountType === DiscountType.FREE_DELIVERY ? "" : discount,
      );
      fd.append("minPurchaseAmount", minPurchaseAmount);
      fd.append("maxRedemptions", maxRedemptions);
      fd.append("forAllProducts", String(forAllProducts));
      fd.append("forAllCombos", String(forAllCombos));
      fd.append("endsAt", new Date(endsAt).toISOString());
      fd.append(
        "productIds",
        JSON.stringify(forAllProducts ? [] : selectedProductIds),
      );
      fd.append(
        "variantIds",
        JSON.stringify(forAllProducts ? [] : selectedVariantIds),
      );
      fd.append(
        "comboProductIds",
        JSON.stringify(forAllCombos ? [] : selectedComboIds),
      );

      const res = await createCampaignAction(fd);
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        resetForm();
        onCreated?.();
      } else {
        toast.error(res.message || "Failed to create campaign");
      }
    } catch (error) {
      console.error("[CreateCampaignModal]:", error);
      toast.error("An error occurred while creating the campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const simpleProducts = formData.products.filter((p) => !p.isVariable);
  const variableProducts = formData.products.filter((p) => p.isVariable);
  const allVariantIds = variableProducts.flatMap((p) =>
    p.variants.map((v) => v.id),
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 whitespace-nowrap text-xs font-semibold shadow-xs"
      >
        <Plus className="h-4 w-4" />
        Create Campaign
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[1050px] w-[min(96vw,1050px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
          <div className="flex flex-col gap-0">
            {/* Modal Header */}
            <DialogHeader className="border-b px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold">
                    Launch New Promotional Campaign
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Create high-impact seasonal campaigns with hero banners,
                    discount structures, and product bundles.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              {/* Section 1: Campaign Details, Banner & Mechanics */}
              <div className="grid gap-5 lg:grid-cols-12 items-start">
                {/* Left Sub-column: Info & Banner */}
                <div className="lg:col-span-6 space-y-4 rounded-xl border border-border/80 bg-card p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    1. Campaign Info &amp; Banner
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="campaign-name"
                        className="text-xs font-semibold"
                      >
                        Campaign Title{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="campaign-name"
                        placeholder="e.g. Eid-ul-Fitr Grand Festival"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="campaign-desc"
                        className="text-xs font-semibold"
                      >
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="campaign-desc"
                        placeholder="Promotional highlights, terms, and savings..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="text-xs min-h-16"
                        required
                      />
                    </div>

                    {/* Banner Image Uploader */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        Hero Banner <span className="text-destructive">*</span>
                        <span className="text-[11px] font-normal text-muted-foreground ml-1">
                          (1920×600 or 16:9)
                        </span>
                      </Label>

                      {bannerPreview ? (
                        <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden border border-border bg-muted">
                          <Image
                            src={bannerPreview}
                            alt="Banner Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeBanner}
                            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all text-center"
                        >
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <Upload className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              Click to upload banner
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              PNG, JPG or WebP (max 5MB)
                            </p>
                          </div>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Sub-column: Discount & Timeline */}
                <div className="lg:col-span-6 space-y-4 rounded-xl border border-border/80 bg-card p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    2. Discount &amp; Timeline
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Discount Type
                        </Label>
                        <Select
                          value={discountType}
                          onValueChange={(val) =>
                            setDiscountType(val as DiscountType)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={DiscountType.PERCENTAGE}>
                              <span className="flex items-center gap-1.5">
                                <Percent className="h-3.5 w-3.5 text-blue-500" />
                                Percentage (%)
                              </span>
                            </SelectItem>
                            <SelectItem value={DiscountType.FIXED}>
                              <span className="flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                Fixed (৳)
                              </span>
                            </SelectItem>
                            <SelectItem value={DiscountType.FREE_DELIVERY}>
                              <span className="flex items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-purple-500" />
                                Free Delivery
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {discountType !== DiscountType.FREE_DELIVERY ? (
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="campaign-discount"
                            className="text-xs font-semibold"
                          >
                            {discountType === DiscountType.PERCENTAGE
                              ? "Percent Off (%)"
                              : "Amount (৳)"}
                            <span className="text-destructive"> *</span>
                          </Label>
                          <Input
                            id="campaign-discount"
                            type="number"
                            min="0"
                            step="any"
                            placeholder={
                              discountType === DiscountType.PERCENTAGE
                                ? "e.g. 20"
                                : "e.g. 150"
                            }
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            className="h-9 text-xs"
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Benefit
                          </Label>
                          <div className="h-9 rounded-md border border-border bg-muted/30 flex items-center px-3 text-xs text-muted-foreground">
                            Free Shipping
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label
                        htmlFor="campaign-end"
                        className="text-xs font-semibold"
                      >
                        Campaign End Date &amp; Time
                      </Label>
                      <Input
                        id="campaign-end"
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="campaign-min-purchase"
                          className="text-xs font-medium"
                        >
                          Min Purchase (৳)
                        </Label>
                        <Input
                          id="campaign-min-purchase"
                          type="number"
                          placeholder="Optional"
                          value={minPurchaseAmount}
                          onChange={(e) => setMinPurchaseAmount(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="campaign-max-redemptions"
                          className="text-xs font-medium"
                        >
                          Max Capacity
                        </Label>
                        <Input
                          id="campaign-max-redemptions"
                          type="number"
                          min="1"
                          placeholder="Unlimited"
                          value={maxRedemptions}
                          onChange={(e) => setMaxRedemptions(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Dedicated Participating Item Sections */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    3. Participating Catalog Items
                  </h3>
                </div>

                {/* Scope Part 1: Products & Variants */}
                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                          Products &amp; Variants Scope
                          {forAllProducts ? (
                            <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Entire
                              Catalog Included
                            </span>
                          ) : (
                            <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              {selectedProductIds.length} Products,{" "}
                              {selectedVariantIds.length} Variants
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {forAllProducts
                            ? "This campaign will discount all simple products and variants in the store."
                            : "Choose specific products or variants to participate in this campaign."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {forAllProducts ? "All Products" : "Specific Items"}
                      </span>
                      <Switch
                        checked={forAllProducts}
                        onCheckedChange={setForAllProducts}
                      />
                    </div>
                  </div>

                  {!forAllProducts && (
                    <ProductVariantPicker
                      products={formData.products}
                      selectedProductIds={selectedProductIds}
                      selectedVariantIds={selectedVariantIds}
                      onProductToggle={handleProductToggle}
                      onVariantToggle={handleVariantToggle}
                      onSelectAllProducts={() =>
                        setSelectedProductIds(
                          formData.products.map((p) => p.id),
                        )
                      }
                      onClearAllProducts={() => setSelectedProductIds([])}
                      onSelectAllVariants={() =>
                        setSelectedVariantIds(
                          formData.products.flatMap((p) =>
                            (p.variants || []).map((v) => v.id),
                          ),
                        )
                      }
                      onClearAllVariants={() => setSelectedVariantIds([])}
                    />
                  )}
                </div>

                {/* Scope Part 2: Combo Bundles */}
                <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Boxes className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                          Combo Bundles Scope
                          {forAllCombos ? (
                            <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> All Combos
                              Included
                            </span>
                          ) : (
                            <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                              Restricted to {selectedComboIds.length} Combo(s)
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {forAllCombos
                            ? "This campaign will apply to all bundle packages in the combo inventory."
                            : "Choose specific combo bundles to participate in this campaign."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {forAllCombos ? "All Combos" : "Specific Combos"}
                      </span>
                      <Switch
                        checked={forAllCombos}
                        onCheckedChange={setForAllCombos}
                      />
                    </div>
                  </div>

                  {!forAllCombos && (
                    <ComboPicker
                      combos={formData.combos}
                      selectedComboIds={selectedComboIds}
                      onComboToggle={handleComboToggle}
                      onSelectAll={() =>
                        setSelectedComboIds(formData.combos.map((c) => c.id))
                      }
                      onClearAll={() => setSelectedComboIds([])}
                    />
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-xs font-semibold min-w-36"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Launch Campaign"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
