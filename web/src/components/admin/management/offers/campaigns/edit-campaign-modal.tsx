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
import { DiscountType, Category } from "@/generated/prisma/enums";
import {
  updateCampaignAction,
  CampaignRow,
  CampaignFormData,
} from "@/actions/admin/management/offers/campaigns";
import {
  CategoryPicker,
  SubCategoryPicker,
  BrandPicker,
  ProductVariantPicker,
  ComboPicker,
} from "../offer-item-selector";
import { toast } from "sonner";
import {
  Pencil,
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
  Tag,
  FolderTree,
  Award,
} from "lucide-react";

interface EditCampaignModalProps {
  campaign: CampaignRow | null;
  formData: CampaignFormData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

interface EditCampaignFormProps {
  campaign: CampaignRow;
  formData: CampaignFormData;
  onClose: () => void;
  onUpdated?: () => void;
}

function EditCampaignForm({
  campaign,
  formData,
  onClose,
  onUpdated,
}: EditCampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states initialized directly from campaign prop
  const [name, setName] = useState(campaign.name);
  const [description, setDescription] = useState(campaign.description);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    campaign.bannerBase64 ?? null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [discountType, setDiscountType] = useState<DiscountType>(
    campaign.discountType,
  );
  const [discount, setDiscount] = useState(campaign.discount ?? "");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(
    campaign.minPurchaseAmount ?? "",
  );
  const [maxRedemptions, setMaxRedemptions] = useState(
    campaign.maxRedemptions ? String(campaign.maxRedemptions) : "",
  );
  const [forAllCategories, setForAllCategories] = useState(
    campaign.forAllCategories,
  );
  const [forAllSubCategories, setForAllSubCategories] = useState(
    campaign.forAllSubCategories,
  );
  const [forAllBrands, setForAllBrands] = useState(campaign.forAllBrands);
  const [forAllProducts, setForAllProducts] = useState(campaign.forAllProducts);
  const [forAllCombos, setForAllCombos] = useState(campaign.forAllCombos);
  const [endsAt, setEndsAt] = useState(
    new Date(campaign.endsAt).toISOString().slice(0, 16),
  );

  // Selected item IDs
  const [selectedCategoryEnums, setSelectedCategoryEnums] = useState<
    Category[]
  >(campaign.categories || []);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<
    string[]
  >(campaign.subCategories?.map((s) => s.id) || []);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(
    campaign.brands?.map((b) => b.id) || [],
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    campaign.products.map((p) => p.id),
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>(
    campaign.variants.map((v) => v.id),
  );
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>(
    campaign.comboProducts.map((c) => c.id),
  );

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
    setBannerPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategoryEnums((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const handleSubCategoryToggle = (id: string) => {
    setSelectedSubCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBrandToggle = (id: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
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
    if (
      discountType !== DiscountType.FREE_DELIVERY &&
      (!discount || parseFloat(discount) <= 0)
    ) {
      toast.error("Please enter a valid discount value");
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("campaignId", campaign.id);
      fd.append("name", name.trim());
      fd.append("description", description.trim());
      if (bannerFile) {
        fd.append("banner", bannerFile);
      }
      fd.append("discountType", discountType);
      fd.append(
        "discount",
        discountType === DiscountType.FREE_DELIVERY ? "" : discount,
      );
      fd.append("minPurchaseAmount", minPurchaseAmount);
      fd.append("maxRedemptions", maxRedemptions);
      fd.append("forAllCategories", String(forAllCategories));
      fd.append("forAllSubCategories", String(forAllSubCategories));
      fd.append("forAllBrands", String(forAllBrands));
      fd.append("forAllProducts", String(forAllProducts));
      fd.append("forAllCombos", String(forAllCombos));
      fd.append("endsAt", new Date(endsAt).toISOString());
      fd.append(
        "categoryEnums",
        JSON.stringify(forAllCategories ? [] : selectedCategoryEnums),
      );
      fd.append(
        "subCategoryIds",
        JSON.stringify(forAllSubCategories ? [] : selectedSubCategoryIds),
      );
      fd.append(
        "brandIds",
        JSON.stringify(forAllBrands ? [] : selectedBrandIds),
      );
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

      const res = await updateCampaignAction(fd);
      if (res.success) {
        toast.success(res.message);
        onClose();
        onUpdated?.();
      } else {
        toast.error(res.message || "Failed to update campaign");
      }
    } catch (error) {
      console.error("[EditCampaignModal]:", error);
      toast.error("An error occurred while updating the campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
      {/* Section 1: Campaign Info, Banner & Mechanics */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Sub-column: Essentials & Banner */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-border/80 bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            1. Campaign Info &amp; Banner
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-campaign-name"
                className="text-xs font-semibold"
              >
                Campaign Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="edit-campaign-desc"
                className="text-xs font-semibold"
              >
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="edit-campaign-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-16"
                required
              />
            </div>

            {/* Banner Image Uploader */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Hero Banner
                  <span className="text-[10px] font-normal text-muted-foreground ml-1">
                    (Upload new to replace)
                  </span>
                </Label>
                {bannerPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    Change
                  </Button>
                )}
              </div>

              {bannerPreview ? (
                <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden border border-border bg-muted">
                  <Image
                    src={bannerPreview}
                    alt="Banner Preview"
                    fill
                    className="object-cover"
                  />
                  {bannerFile && (
                    <button
                      type="button"
                      onClick={removeBanner}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
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
                      Click to upload new banner
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      PNG, JPG or WebP up to 5MB
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

        {/* Right Sub-column: Mechanics */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-border/80 bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            2. Discount &amp; Duration
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Discount Type</Label>
                <Select
                  value={discountType}
                  onValueChange={(val) => setDiscountType(val as DiscountType)}
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
                    htmlFor="edit-campaign-discount"
                    className="text-xs font-semibold"
                  >
                    {discountType === DiscountType.PERCENTAGE
                      ? "Percent Off (%)"
                      : "Amount (৳)"}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    id="edit-campaign-discount"
                    type="number"
                    min="0"
                    step="any"
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
                htmlFor="edit-campaign-end"
                className="text-xs font-semibold"
              >
                Campaign End Date &amp; Time
              </Label>
              <Input
                id="edit-campaign-end"
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
                  htmlFor="edit-campaign-min-purchase"
                  className="text-xs font-medium"
                >
                  Min Purchase (৳)
                </Label>
                <Input
                  id="edit-campaign-min-purchase"
                  type="number"
                  placeholder="Optional"
                  value={minPurchaseAmount}
                  onChange={(e) => setMinPurchaseAmount(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-campaign-max-redemptions"
                  className="text-xs font-medium"
                >
                  Max Capacity
                </Label>
                <Input
                  id="edit-campaign-max-redemptions"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                💡 Current Redemptions
              </p>
              <p className="mt-0.5 text-[11px]">
                This campaign has been redeemed{" "}
                <strong className="text-foreground">
                  {campaign.currentRedemptions}
                </strong>{" "}
                times.
              </p>
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

        {/* Scope Part 1: Main Categories Scope */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  Main Categories Scope
                  {forAllCategories ? (
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> All Categories
                      Included
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedCategoryEnums.length} Category(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllCategories
                    ? "This campaign applies to all product categories across the store."
                    : "Choose specific categories that qualify for this campaign."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-medium text-muted-foreground">
                {forAllCategories ? "All Categories" : "Specific Categories"}
              </span>
              <Switch
                checked={forAllCategories}
                onCheckedChange={setForAllCategories}
              />
            </div>
          </div>

          {!forAllCategories && (
            <CategoryPicker
              categories={formData.categories}
              selectedCategoryEnums={selectedCategoryEnums}
              onCategoryToggle={handleCategoryToggle}
              onSelectAll={() =>
                setSelectedCategoryEnums(
                  formData.categories.map((c) => c.enumValue),
                )
              }
              onClearAll={() => setSelectedCategoryEnums([])}
            />
          )}
        </div>

        {/* Scope Part 2: Subcategories Scope */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                <FolderTree className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  Subcategories Scope
                  {forAllSubCategories ? (
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> All Subcategories
                      Included
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedSubCategoryIds.length} Subcategory(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllSubCategories
                    ? "This campaign applies to all product subcategories across the store."
                    : "Choose specific subcategories that qualify for this campaign."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-medium text-muted-foreground">
                {forAllSubCategories
                  ? "All Subcategories"
                  : "Specific Subcategories"}
              </span>
              <Switch
                checked={forAllSubCategories}
                onCheckedChange={setForAllSubCategories}
              />
            </div>
          </div>

          {!forAllSubCategories && (
            <SubCategoryPicker
              subCategories={formData.subCategories}
              selectedSubCategoryIds={selectedSubCategoryIds}
              onSubCategoryToggle={handleSubCategoryToggle}
              onSelectAll={() =>
                setSelectedSubCategoryIds(
                  formData.subCategories.map((sc) => sc.id),
                )
              }
              onClearAll={() => setSelectedSubCategoryIds([])}
            />
          )}
        </div>

        {/* Scope Part 3: Brands Scope */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  Brands Scope
                  {forAllBrands ? (
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> All Brands Included
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedBrandIds.length} Brand(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllBrands
                    ? "This campaign applies to all brands."
                    : "Choose specific brands that qualify for this campaign."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-medium text-muted-foreground">
                {forAllBrands ? "All Brands" : "Specific Brands"}
              </span>
              <Switch
                checked={forAllBrands}
                onCheckedChange={setForAllBrands}
              />
            </div>
          </div>

          {!forAllBrands && (
            <BrandPicker
              brands={formData.brands}
              selectedBrandIds={selectedBrandIds}
              onBrandToggle={handleBrandToggle}
              onSelectAll={() =>
                setSelectedBrandIds(formData.brands.map((b) => b.id))
              }
              onClearAll={() => setSelectedBrandIds([])}
            />
          )}
        </div>

        {/* Scope Part 4: Products & Variants */}
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
                      <CheckCircle2 className="h-3 w-3" /> Entire Catalog
                      Included
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
                setSelectedProductIds(formData.products.map((p) => p.id))
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
                      <CheckCircle2 className="h-3 w-3" /> All Combos Included
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
          onClick={onClose}
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
              Saving Changes...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

export function EditCampaignModal({
  campaign,
  formData,
  open,
  onOpenChange,
  onUpdated,
}: EditCampaignModalProps) {
  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1050px] w-[min(96vw,1050px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col gap-0">
          {/* Modal Header */}
          <DialogHeader className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Edit Campaign: {campaign.name}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  Modify campaign copy, replace banner image, or adjust
                  participating products.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <EditCampaignForm
            key={campaign.id}
            campaign={campaign}
            formData={formData}
            onClose={() => onOpenChange(false)}
            onUpdated={onUpdated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
