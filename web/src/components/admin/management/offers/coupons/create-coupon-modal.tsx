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
  createCouponAction,
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
  Plus,
  Ticket,
  Sparkles,
  RefreshCw,
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

interface CreateCouponModalProps {
  formData: CouponFormData;
  onCreated?: () => void;
}

export function CreateCouponModal({
  formData,
  onCreated,
}: CreateCouponModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>(
    DiscountType.PERCENTAGE,
  );
  const [discount, setDiscount] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxOrder, setMaxOrder] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
  const [forAllUsers, setForAllUsers] = useState(true);
  const [forAllCategories, setForAllCategories] = useState(true);
  const [forAllSubCategories, setForAllSubCategories] = useState(true);
  const [forAllBrands, setForAllBrands] = useState(true);
  const [forAllProducts, setForAllProducts] = useState(true);
  const [forAllCombos, setForAllCombos] = useState(true);

  // Default expiresAt 30 days from today formatted for datetime-local
  const getDefaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 16);
  };
  const [expiresAt, setExpiresAt] = useState(getDefaultDate());

  // Selected item IDs
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCategoryEnums, setSelectedCategoryEnums] = useState<
    Category[]
  >([]);
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<
    string[]
  >([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MEAW";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouponCode(code);
  };

  const resetForm = () => {
    setName("");
    setCouponCode("");
    setDiscountType(DiscountType.PERCENTAGE);
    setDiscount("");
    setMinOrder("");
    setMaxOrder("");
    setMaxRedemptions("");
    setMinPurchaseAmount("");
    setForAllUsers(true);
    setForAllCategories(true);
    setForAllSubCategories(true);
    setForAllBrands(true);
    setForAllProducts(true);
    setForAllCombos(true);
    setExpiresAt(getDefaultDate());
    setSelectedUserIds([]);
    setSelectedCategoryEnums([]);
    setSelectedSubCategoryIds([]);
    setSelectedBrandIds([]);
    setSelectedProductIds([]);
    setSelectedVariantIds([]);
    setSelectedComboIds([]);
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
      const res = await createCouponAction({
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
        setOpen(false);
        resetForm();
        onCreated?.();
      } else {
        toast.error(res.message || "Failed to create coupon");
      }
    } catch (error) {
      console.error("[CreateCouponModal]:", error);
      toast.error("An unexpected error occurred while creating the coupon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 whitespace-nowrap text-xs font-semibold shadow-xs"
      >
        <Plus className="h-4 w-4" />
        Create Coupon
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[1050px] w-[min(96vw,1050px)] max-w-full max-h-[90vh] overflow-y-auto p-0">
          <div className="flex flex-col gap-0">
            {/* Modal Header */}
            <DialogHeader className="border-b px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-bold">
                    Create Promotional Coupon
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Configure discount rules, customer restrictions, product
                    eligibility, and redemption limits.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
              {/* Section 1: Coupon Essentials & Limits */}
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
                        htmlFor="coupon-name"
                        className="text-xs font-semibold"
                      >
                        Coupon Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="coupon-name"
                        placeholder="e.g. Summer Mega Sale 2026"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9 text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="coupon-code"
                          className="text-xs font-semibold"
                        >
                          Coupon Code{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <button
                          type="button"
                          onClick={generateRandomCode}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Auto Generate
                        </button>
                      </div>
                      <Input
                        id="coupon-code"
                        placeholder="e.g. SUMMER20"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        className="h-9 text-xs font-mono font-bold tracking-wider uppercase"
                        required
                      />
                    </div>

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
                            htmlFor="coupon-discount"
                            className="text-xs font-semibold"
                          >
                            {discountType === DiscountType.PERCENTAGE
                              ? "Percent Off (%)"
                              : "Amount (৳)"}
                            <span className="text-destructive"> *</span>
                          </Label>
                          <Input
                            id="coupon-discount"
                            type="number"
                            min="0"
                            step="any"
                            placeholder={
                              discountType === DiscountType.PERCENTAGE
                                ? "e.g. 15"
                                : "e.g. 100"
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
                        htmlFor="coupon-expiry"
                        className="text-xs font-semibold"
                      >
                        Expiration Date &amp; Time
                      </Label>
                      <Input
                        id="coupon-expiry"
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
                          htmlFor="min-purchase"
                          className="text-xs font-medium"
                        >
                          Min Purchase (৳)
                        </Label>
                        <Input
                          id="min-purchase"
                          type="number"
                          placeholder="Optional"
                          value={minPurchaseAmount}
                          onChange={(e) => setMinPurchaseAmount(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="max-redemptions"
                          className="text-xs font-medium"
                        >
                          Total Usage Limit
                        </Label>
                        <Input
                          id="max-redemptions"
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
                        <Label
                          htmlFor="min-order"
                          className="text-xs font-medium"
                        >
                          Min Cart Quantity
                        </Label>
                        <Input
                          id="min-order"
                          type="number"
                          min="1"
                          placeholder="Optional"
                          value={minOrder}
                          onChange={(e) => setMinOrder(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="max-order"
                          className="text-xs font-medium"
                        >
                          Max Cart Quantity
                        </Label>
                        <Input
                          id="max-order"
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
                        💡 Pro Tip
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed">
                        Leave thresholds empty to allow checkout with any cart
                        total or quantity.
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
                      <Switch
                        checked={forAllUsers}
                        onCheckedChange={setForAllUsers}
                      />
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
                              <CheckCircle2 className="h-3 w-3" /> All
                              Categories Eligible
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
                        {forAllCategories
                          ? "All Categories"
                          : "Specific Categories"}
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
                              <CheckCircle2 className="h-3 w-3" /> All
                              Subcategories Eligible
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
                              <CheckCircle2 className="h-3 w-3" /> All Brands
                              Eligible
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
                              <CheckCircle2 className="h-3 w-3" /> Entire
                              Catalog Eligible
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
                              <CheckCircle2 className="h-3 w-3" /> All Combos
                              Eligible
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
                      Creating...
                    </>
                  ) : (
                    "Publish Coupon"
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
