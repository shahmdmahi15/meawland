"use client";

import { useState } from "react";
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
  updateCouponAction,
  CouponRow,
  CouponFormData,
} from "@/actions/admin/management/offers/coupons";
import {
  UserPicker,
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
  Users,
  Package,
  Boxes,
  Percent,
  Truck,
  DollarSign,
  CheckCircle2,
  Tag,
  FolderTree,
  Award,
} from "lucide-react";

interface EditCouponModalProps {
  coupon: CouponRow | null;
  formData: CouponFormData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

interface EditCouponFormProps {
  coupon: CouponRow;
  formData: CouponFormData;
  onClose: () => void;
  onUpdated?: () => void;
}

function EditCouponForm({
  coupon,
  formData,
  onClose,
  onUpdated,
}: EditCouponFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states initialized directly from coupon prop
  const [name, setName] = useState(coupon.name);
  const [couponCode, setCouponCode] = useState(coupon.couponCode);
  const [discountType, setDiscountType] = useState<DiscountType>(
    coupon.discountType,
  );
  const [discount, setDiscount] = useState(coupon.discount ?? "");
  const [minOrder, setMinOrder] = useState(coupon.minOrder ?? "");
  const [maxOrder, setMaxOrder] = useState(coupon.maxOrder ?? "");
  const [maxRedemptions, setMaxRedemptions] = useState(
    coupon.maxRedemptions ? String(coupon.maxRedemptions) : "",
  );
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(
    coupon.minPurchaseAmount ?? "",
  );
  const [forAllUsers, setForAllUsers] = useState(coupon.forAllUsers);
  const [forAllCategories, setForAllCategories] = useState(
    coupon.forAllCategories,
  );
  const [forAllSubCategories, setForAllSubCategories] = useState(
    coupon.forAllSubCategories,
  );
  const [forAllBrands, setForAllBrands] = useState(coupon.forAllBrands);
  const [forAllProducts, setForAllProducts] = useState(coupon.forAllProducts);
  const [forAllCombos, setForAllCombos] = useState(coupon.forAllCombos);
  const [expiresAt, setExpiresAt] = useState(
    new Date(coupon.expiresAt).toISOString().slice(0, 16),
  );

  // Selected item IDs
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    coupon.users.map((u) => u.id),
  );
  const [selectedCategoryEnums, setSelectedCategoryEnums] = useState<
    Category[]
  >(coupon.categories || []);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<
    string[]
  >(coupon.subCategories?.map((s) => s.id) || []);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(
    coupon.brands?.map((b) => b.id) || [],
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    coupon.products.map((p) => p.id),
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>(
    coupon.variants.map((v) => v.id),
  );
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>(
    coupon.comboProducts.map((c) => c.id),
  );

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

  const handleUserToggle = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter coupon name");
      return;
    }
    if (!couponCode.trim()) {
      toast.error("Please enter a valid coupon code");
      return;
    }
    if (
      discountType !== DiscountType.FREE_DELIVERY &&
      (!discount || parseFloat(discount) <= 0)
    ) {
      toast.error("Please enter a valid discount amount");
      return;
    }
    if (!forAllUsers && selectedUserIds.length === 0) {
      toast.error(
        "Please select at least one customer or enable 'All Customers'",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateCouponAction({
        couponId: coupon.id,
        name: name.trim(),
        couponCode: couponCode.trim().toUpperCase(),
        discountType,
        discount: discountType === DiscountType.FREE_DELIVERY ? null : discount,
        minOrder: minOrder ? minOrder : null,
        maxOrder: maxOrder ? maxOrder : null,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        minPurchaseAmount: minPurchaseAmount ? minPurchaseAmount : null,
        forAllUsers,
        forAllCategories,
        forAllSubCategories,
        forAllBrands,
        forAllProducts,
        forAllCombos,
        expiresAt: new Date(expiresAt),
        userIds: forAllUsers ? [] : selectedUserIds,
        categoryEnums: forAllCategories ? [] : selectedCategoryEnums,
        subCategoryIds: forAllSubCategories ? [] : selectedSubCategoryIds,
        brandIds: forAllBrands ? [] : selectedBrandIds,
        productIds: forAllProducts ? [] : selectedProductIds,
        variantIds: forAllProducts ? [] : selectedVariantIds,
        comboProductIds: forAllCombos ? [] : selectedComboIds,
      });

      if (res.success) {
        toast.success(res.message);
        onClose();
        onUpdated?.();
      } else {
        toast.error(res.message || "Failed to update coupon");
      }
    } catch (error) {
      console.error("[EditCouponModal]:", error);
      toast.error("An unexpected error occurred while updating the coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
      {/* Section 1: Essentials & Limits */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* Left Sub-column: Essentials */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-border/80 bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            1. Coupon Essentials
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-coupon-name"
                className="text-xs font-semibold"
              >
                Coupon Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-coupon-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="edit-coupon-code"
                className="text-xs font-semibold"
              >
                Coupon Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-coupon-code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono font-bold tracking-wider uppercase"
                required
              />
            </div>

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
                    htmlFor="edit-coupon-discount"
                    className="text-xs font-semibold"
                  >
                    {discountType === DiscountType.PERCENTAGE
                      ? "Percent Off (%)"
                      : "Amount (৳)"}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    id="edit-coupon-discount"
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
                htmlFor="edit-coupon-expiry"
                className="text-xs font-semibold"
              >
                Expiration Date &amp; Time
              </Label>
              <Input
                id="edit-coupon-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Sub-column: Limits */}
        <div className="lg:col-span-6 space-y-4 rounded-xl border border-border/80 bg-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            2. Purchase Limits &amp; Thresholds
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-min-purchase"
                  className="text-xs font-medium"
                >
                  Min Purchase (৳)
                </Label>
                <Input
                  id="edit-min-purchase"
                  type="number"
                  placeholder="Optional"
                  value={minPurchaseAmount}
                  onChange={(e) => setMinPurchaseAmount(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-max-redemptions"
                  className="text-xs font-medium"
                >
                  Total Usage Limit
                </Label>
                <Input
                  id="edit-max-redemptions"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-min-order" className="text-xs font-medium">
                  Min Cart Quantity
                </Label>
                <Input
                  id="edit-min-order"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-max-order" className="text-xs font-medium">
                  Max Cart Quantity
                </Label>
                <Input
                  id="edit-max-order"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={maxOrder}
                  onChange={(e) => setMaxOrder(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                💡 Current Redemptions
              </p>
              <p className="mt-0.5 text-[11px]">
                This coupon has been redeemed{" "}
                <strong className="text-foreground">
                  {coupon.currentRedemptions}
                </strong>{" "}
                times so far.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Dedicated Target Scope Sections */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3. Target Eligibility &amp; Selection
          </h3>
        </div>

        {/* Scope Part 1: Customer Audience */}
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                  Customer Audience
                  {forAllUsers ? (
                    <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> All Customers
                      Eligible
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Restricted to {selectedUserIds.length} customer(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllUsers
                    ? "This coupon can be redeemed by any registered customer."
                    : "Select specific customers who can apply this coupon code."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-medium text-muted-foreground">
                {forAllUsers ? "All Customers" : "Specific Users"}
              </span>
              <Switch checked={forAllUsers} onCheckedChange={setForAllUsers} />
            </div>
          </div>

          {!forAllUsers && (
            <UserPicker
              users={formData.users}
              selectedUserIds={selectedUserIds}
              onUserToggle={handleUserToggle}
              onSelectAll={() =>
                setSelectedUserIds(formData.users.map((u) => u.id))
              }
              onClearAll={() => setSelectedUserIds([])}
            />
          )}
        </div>

        {/* Scope Part 2: Main Categories Scope */}
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
                      Eligible
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedCategoryEnums.length} Category(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllCategories
                    ? "Applicable to all product categories across the catalog."
                    : "Limit this discount to specific main categories."}
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

        {/* Scope Part 3: Subcategories Scope */}
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
                      Eligible
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedSubCategoryIds.length} Subcategory(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllSubCategories
                    ? "Applicable to all product subcategories across the catalog."
                    : "Limit this discount to specific subcategories."}
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

        {/* Scope Part 4: Brands Scope */}
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
                      <CheckCircle2 className="h-3 w-3" /> All Brands Eligible
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedBrandIds.length} Brand(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllBrands
                    ? "Applicable to all brands and manufacturers."
                    : "Limit this discount to specific brands."}
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

        {/* Scope Part 5: Products & Variants Scope */}
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
                      Eligible
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
                    ? "Applicable to all simple products and variable product variants across the store."
                    : "Choose specific simple products and variants eligible for this discount."}
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

        {/* Scope Part 3: Combo Deals Scope */}
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
                      <CheckCircle2 className="h-3 w-3" /> All Combos Eligible
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Restricted to {selectedComboIds.length} Combo(s)
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {forAllCombos
                    ? "Applicable to all bundle packages in the combo inventory."
                    : "Choose specific combo bundles eligible for this coupon."}
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

export function EditCouponModal({
  coupon,
  formData,
  open,
  onOpenChange,
  onUpdated,
}: EditCouponModalProps) {
  if (!coupon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1050px] w-[min(96vw,1050px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col gap-0">
          {/* Modal Header */}
          <DialogHeader className="border-b px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Edit Coupon: {coupon.couponCode}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  Modify discount criteria, redemption limits, or customer and
                  product eligibility scopes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <EditCouponForm
            key={coupon.id}
            coupon={coupon}
            formData={formData}
            onClose={() => onOpenChange(false)}
            onUpdated={onUpdated}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
