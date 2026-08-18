"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  User,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Package,
  CreditCard,
  FileText,
  Boxes,
  X,
  Loader2,
  Tag,
} from "lucide-react";
import {
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
} from "@/generated/prisma/enums";
import {
  createAdminOrderSchema,
  type CreateAdminOrderInput,
} from "@/schemas/admin/management/orders/order";
import {
  createAdminOrderAction,
  type NewOrderFormData,
} from "@/actions/admin/management/orders/create-order";
import {
  getDeliveryFee,
  isDhakaDistrict,
  DELIVERY_FEE_INSIDE_DHAKA,
  DELIVERY_FEE_OUTSIDE_DHAKA,
} from "@/constants/cart";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateOrderFormProps {
  formData: NewOrderFormData;
}

const isValidImageSrc = (src?: string | null): boolean => {
  if (!src) return false;
  return (
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  );
};

export function CreateOrderForm({ formData }: CreateOrderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { customers, products, combos, coupons } = formData;

  // Search filter states for item catalog
  const [itemSearch, setItemSearch] = useState("");
  const [catalogTab, setCatalogTab] = useState<
    "ALL" | "SIMPLE" | "VARIANTS" | "COMBOS"
  >("ALL");

  // Customer search & selection mode
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  // Initialize react-hook-form
  const form = useForm<CreateAdminOrderInput>({
    resolver: zodResolver(createAdminOrderSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      district: "Dhaka",
      address: "",
      note: "",
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.PENDING,
      orderStatus: OrderStatus.PENDING,
      customDeliveryFee: DELIVERY_FEE_INSIDE_DHAKA,
      couponCode: "",
      customDiscount: 0,
      userId: null,
      items: [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = form;

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const rawWatchedItems = useWatch({ control, name: "items" });
  const watchedItems = useMemo(() => rawWatchedItems ?? [], [rawWatchedItems]);
  const watchedDistrict = useWatch({ control, name: "district" }) || "Dhaka";
  const watchedCustomDeliveryFee = useWatch({
    control,
    name: "customDeliveryFee",
  });
  const watchedCustomDiscount =
    useWatch({ control, name: "customDiscount" }) || 0;
  const watchedCouponCode = useWatch({ control, name: "couponCode" }) || "";
  const watchedPaymentMethod =
    useWatch({ control, name: "paymentMethod" }) || PaymentMethod.COD;
  const watchedPaymentStatus =
    useWatch({ control, name: "paymentStatus" }) || PaymentStatus.PENDING;
  const watchedOrderStatus =
    useWatch({ control, name: "orderStatus" }) || OrderStatus.PENDING;

  // Handle customer pick
  const handleSelectCustomer = (customer: (typeof customers)[0]) => {
    setSelectedCustomerId(customer.id);
    setValue("userId", customer.id);
    setValue("name", customer.name);
    setValue("email", customer.email);
    setValue("phone", customer.phone || "");
    setValue("district", customer.district || "Dhaka");
    setValue("address", customer.address || "");

    // Recalculate delivery fee if district exists
    const dist = customer.district || "Dhaka";
    setValue("customDeliveryFee", getDeliveryFee(dist));
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setValue("userId", null);
    setValue("name", "");
    setValue("email", "");
    setValue("phone", "");
    setValue("district", "Dhaka");
    setValue("address", "");
  };

  // Catalog item flattener for item selector
  const flatCatalog = useMemo(() => {
    const list: Array<{
      key: string;
      itemType: "PRODUCT" | "VARIANT" | "COMBO";
      productId?: string;
      variantId?: string;
      comboProductId?: string;
      name: string;
      sku: string;
      image: string;
      price: number;
      costPrice: number;
      stock: number;
      badgeText: string;
    }> = [];

    // Simple Products (without variants)
    for (const p of products) {
      if (!p.isVariable) {
        list.push({
          key: `prod-${p.id}`,
          itemType: "PRODUCT",
          productId: p.id,
          name: p.name,
          sku: p.sku,
          image: p.image,
          price: parseFloat(p.salePrice || p.regularPrice || "0") || 0,
          costPrice: parseFloat(p.costPrice || "0") || 0,
          stock: p.stock ?? 0,
          badgeText: p.subCategoryName,
        });
      } else {
        // Variable Product Variants
        for (const v of p.variants) {
          const attrString = v.attributes.map((a) => a.value).join(" / ");
          list.push({
            key: `var-${v.id}`,
            itemType: "VARIANT",
            variantId: v.id,
            productId: p.id,
            name: `${p.name} (${attrString || v.sku})`,
            sku: v.sku,
            image: v.image || p.image,
            price: parseFloat(v.salePrice || v.regularPrice || "0") || 0,
            costPrice: parseFloat(v.costPrice || "0") || 0,
            stock: v.stock ?? 0,
            badgeText: `${p.name} Variant`,
          });
        }
      }
    }

    // Combos
    for (const cb of combos) {
      list.push({
        key: `combo-${cb.id}`,
        itemType: "COMBO",
        comboProductId: cb.id,
        name: `[Combo] ${cb.name}`,
        sku: cb.sku,
        image: cb.image,
        price: parseFloat(cb.salePrice || cb.regularPrice || "0") || 0,
        costPrice: cb.costPrice,
        stock: cb.availableStock,
        badgeText: "Bundle / Combo",
      });
    }

    return list;
  }, [products, combos]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return flatCatalog.filter((item) => {
      if (catalogTab === "SIMPLE" && item.itemType !== "PRODUCT") return false;
      if (catalogTab === "VARIANTS" && item.itemType !== "VARIANT")
        return false;
      if (catalogTab === "COMBOS" && item.itemType !== "COMBO") return false;

      if (itemSearch.trim()) {
        const q = itemSearch.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [flatCatalog, catalogTab, itemSearch]);

  // Add Item to Order handler
  const handleAddItem = (item: (typeof flatCatalog)[0]) => {
    // Check if already in items list
    const existingIndex = watchedItems.findIndex(
      (i) =>
        (item.variantId && i.variantId === item.variantId) ||
        (item.productId && !item.variantId && i.productId === item.productId) ||
        (item.comboProductId && i.comboProductId === item.comboProductId),
    );

    if (existingIndex >= 0) {
      const currentItem = watchedItems[existingIndex];
      update(existingIndex, {
        ...currentItem,
        quantity: currentItem.quantity + 1,
      });
    } else {
      append({
        itemType: item.itemType,
        productId: item.productId || null,
        variantId: item.variantId || null,
        comboProductId: item.comboProductId || null,
        name: item.name,
        sku: item.sku,
        image: item.image,
        quantity: 1,
        unitPrice: item.price,
        discountCost: 0,
        totalCost: item.costPrice,
      });
    }
  };

  // Pricing Math Calculations
  const calculations = useMemo(() => {
    let itemsOriginalSubtotal = 0;
    let itemsLineDiscounts = 0;
    let totalOwnerCost = 0;
    let totalQuantity = 0;

    for (const item of watchedItems) {
      const unit = item.unitPrice || 0;
      const qty = item.quantity || 1;
      const lineTotal = unit * qty;
      const lineDisc = item.discountCost || 0;
      const lineOwner = (item.totalCost || 0) * qty;

      itemsOriginalSubtotal += lineTotal;
      itemsLineDiscounts += lineDisc;
      totalOwnerCost += lineOwner;
      totalQuantity += qty;
    }

    const subtotalAfterItemDiscounts = Math.max(
      0,
      itemsOriginalSubtotal - itemsLineDiscounts,
    );

    // Coupon discount
    let couponDiscount = 0;
    let isCouponFreeDelivery = false;
    if (watchedCouponCode.trim()) {
      const matchedCoupon = coupons.find(
        (c) =>
          c.couponCode.toLowerCase() === watchedCouponCode.trim().toLowerCase(),
      );
      if (matchedCoupon) {
        if (matchedCoupon.discountType === "FREE_DELIVERY") {
          isCouponFreeDelivery = true;
        } else if (
          matchedCoupon.discountType === "FIXED" &&
          matchedCoupon.discount
        ) {
          couponDiscount = parseFloat(matchedCoupon.discount) || 0;
        } else if (
          matchedCoupon.discountType === "PERCENTAGE" &&
          matchedCoupon.discount
        ) {
          const pct = parseFloat(matchedCoupon.discount) || 0;
          couponDiscount = Math.round((subtotalAfterItemDiscounts * pct) / 100);
        }
      }
    }

    const totalDiscounts =
      itemsLineDiscounts +
      couponDiscount +
      (Number(watchedCustomDiscount) || 0);

    const deliveryFee =
      watchedCustomDeliveryFee !== undefined &&
      watchedCustomDeliveryFee !== null &&
      !isNaN(watchedCustomDeliveryFee)
        ? Number(watchedCustomDeliveryFee)
        : getDeliveryFee(watchedDistrict, isCouponFreeDelivery);

    const finalSubtotal = Math.max(0, itemsOriginalSubtotal - totalDiscounts);
    const grandFinalCost = finalSubtotal + deliveryFee;

    // Delivery expense incurred by owner when free delivery is granted
    const isDhaka = isDhakaDistrict(watchedDistrict);
    const actualCourierExpense = isDhaka
      ? DELIVERY_FEE_INSIDE_DHAKA
      : DELIVERY_FEE_OUTSIDE_DHAKA;
    const ownerDeliveryExpense = deliveryFee === 0 ? actualCourierExpense : 0;
    const totalOrderOwnerCost = totalOwnerCost + ownerDeliveryExpense;
    const estimatedNetProfit = Math.max(
      0,
      grandFinalCost - totalOrderOwnerCost,
    );
    const profitMarginPct =
      grandFinalCost > 0
        ? Math.round((estimatedNetProfit / grandFinalCost) * 100)
        : 0;

    return {
      itemsOriginalSubtotal,
      itemsLineDiscounts,
      couponDiscount,
      totalDiscounts,
      deliveryFee,
      grandFinalCost,
      totalOwnerCost: totalOrderOwnerCost,
      estimatedNetProfit,
      profitMarginPct,
      totalQuantity,
    };
  }, [
    watchedItems,
    watchedDistrict,
    watchedCustomDeliveryFee,
    watchedCustomDiscount,
    watchedCouponCode,
    coupons,
  ]);

  // Form Submit Handler
  const onSubmit = (data: CreateAdminOrderInput) => {
    if (data.items.length === 0) {
      toast.error("Please add at least one item to the order.");
      return;
    }

    startTransition(async () => {
      const res = await createAdminOrderAction(data);
      if (res.success) {
        toast.success(res.message);
        router.push("/admin/management/orders/all-orders");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 min-w-0 w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Customer info & Item Catalog / Selected Items */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Section 1: Customer Details */}
          <Card className="shadow-xs border-border">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Customer Information
                  </CardTitle>
                </div>
                {selectedCustomerId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCustomer}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Clear Selected Customer
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs">
                Select an existing registered customer or type in new customer
                shipping details.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Existing Customer Quick Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Search Registered Customer (Optional)</span>
                  <span className="text-[11px] text-muted-foreground">
                    {customers.length} total customers
                  </span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customer by name, email, phone, or code..."
                    className="pl-9 text-xs h-9"
                  />
                  {customerSearch && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Customer Dropdown Results */}
                {customerSearch.trim() && (
                  <div className="rounded-lg border border-border bg-card max-h-48 overflow-y-auto divide-y divide-border/60 shadow-lg text-xs">
                    {customers
                      .filter(
                        (c) =>
                          c.name
                            .toLowerCase()
                            .includes(customerSearch.toLowerCase()) ||
                          c.email
                            .toLowerCase()
                            .includes(customerSearch.toLowerCase()) ||
                          (c.phone && c.phone.includes(customerSearch)) ||
                          c.code
                            .toLowerCase()
                            .includes(customerSearch.toLowerCase()),
                      )
                      .slice(0, 8)
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleSelectCustomer(c);
                            setCustomerSearch("");
                          }}
                          className="w-full text-left p-2.5 hover:bg-muted/50 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-foreground">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {c.email} • {c.phone || "No phone"} •{" "}
                              {c.district || "Dhaka"}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {c.code}
                          </Badge>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. John Doe"
                    className="h-9 text-xs"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="e.g. customer@example.com"
                    className="h-9 text-xs"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...register("phone")}
                    placeholder="e.g. 01712345678"
                    className="h-9 text-xs"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    District <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={watchedDistrict}
                    onValueChange={(val) => {
                      if (val) {
                        setValue("district", val);
                        setValue("customDeliveryFee", getDeliveryFee(val));
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANGLADESH_DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.district && (
                    <p className="text-[11px] text-destructive">
                      {errors.district.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Delivery Address <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("address")}
                  placeholder="House / Road / Area / Landmark..."
                  className="h-9 text-xs"
                />
                {errors.address && (
                  <p className="text-[11px] text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* Order Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Customer / Internal Notes (Optional)
                </label>
                <Textarea
                  {...register("note")}
                  placeholder="Special packaging, delivery instructions, or POS remarks..."
                  className="text-xs resize-none h-16"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Selected Order Items */}
          <Card className="shadow-xs border-border">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Order Items ({fields.length})
                  </CardTitle>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  Units: <strong>{calculations.totalQuantity}</strong>
                </span>
              </div>
              <CardDescription className="text-xs">
                Manage quantities, line discounts, and prices for ordered
                products.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {fields.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-2">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-xs font-medium text-muted-foreground">
                    No items added yet. Select products from the catalog below.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {fields.map((field, index) => {
                    const currentItem = watchedItems[index] || field;
                    const lineTotal =
                      (currentItem.unitPrice || 0) *
                        (currentItem.quantity || 1) -
                      (currentItem.discountCost || 0);

                    return (
                      <div
                        key={field.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card"
                      >
                        {/* Item Details */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative h-12 w-12 rounded-lg bg-muted/30 overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
                            {isValidImageSrc(field.image) ? (
                              <Image
                                src={field.image!}
                                alt={field.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-foreground truncate">
                              {field.name}
                            </h4>
                            {field.sku && (
                              <p className="text-[11px] text-muted-foreground">
                                SKU: {field.sku}
                              </p>
                            )}
                            <div className="text-[11px] text-primary font-bold mt-0.5">
                              ৳{currentItem.unitPrice.toLocaleString()} each
                            </div>
                          </div>
                        </div>

                        {/* Controls: Quantity, Line Discount, Line Total, Remove */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          {/* Quantity Adjuster */}
                          <div className="flex items-center space-x-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">
                              Qty:
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={currentItem.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 1;
                                update(index, {
                                  ...currentItem,
                                  quantity: Math.max(1, val),
                                });
                              }}
                              className="w-16 h-8 text-xs text-center"
                            />
                          </div>

                          {/* Line Discount */}
                          <div className="flex items-center space-x-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase font-bold">
                              Disc:
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={currentItem.discountCost}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                update(index, {
                                  ...currentItem,
                                  discountCost: Math.max(0, val),
                                });
                              }}
                              placeholder="৳0"
                              className="w-18 h-8 text-xs text-center"
                            />
                          </div>

                          {/* Line Total */}
                          <div className="text-right w-20">
                            <div className="text-xs font-bold text-foreground">
                              ৳{Math.max(0, lineTotal).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Cost: ৳
                              {(
                                (currentItem.totalCost || 0) *
                                (currentItem.quantity || 1)
                              ).toLocaleString()}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => remove(index)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Product & Variant Catalog Picker */}
          <Card className="shadow-xs border-border">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold">
                    Catalog Item Selector
                  </CardTitle>
                </div>

                {/* Catalog Type Tabs */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setCatalogTab("ALL")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      catalogTab === "ALL"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All Items
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTab("SIMPLE")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      catalogTab === "SIMPLE"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Single Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTab("VARIANTS")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      catalogTab === "VARIANTS"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Variants
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogTab("COMBOS")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors",
                      catalogTab === "COMBOS"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Combos
                  </button>
                </div>
              </div>

              {/* Item Search Input */}
              <div className="relative pt-2">
                <Search className="absolute left-3 top-1/2 translate-y-[-30%] h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search catalog by product name, variant title, or SKU..."
                  className="pl-9 pr-9 text-xs h-9"
                />
                {itemSearch && (
                  <button
                    type="button"
                    onClick={() => setItemSearch("")}
                    className="absolute right-3 top-1/2 translate-y-[-30%] text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredCatalog.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                    No items found matching &quot;{itemSearch}&quot;.
                  </div>
                ) : (
                  filteredCatalog.map((item) => (
                    <div
                      key={item.key}
                      className="p-3 rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative h-11 w-11 rounded-lg bg-muted overflow-hidden shrink-0 border border-border/40 flex items-center justify-center">
                          {isValidImageSrc(item.image) ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-foreground truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>SKU: {item.sku}</span>
                            <span>•</span>
                            <span
                              className={cn(
                                "font-bold",
                                item.stock > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-destructive",
                              )}
                            >
                              Stock: {item.stock}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-primary mt-1">
                            ৳{item.price.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddItem(item)}
                        className="h-8 px-2.5 text-xs shrink-0 gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Order Settings & Pricing Calculation Summary */}
        <div className="space-y-6 min-w-0">
          {/* Order Settings Card */}
          <Card className="shadow-xs border-border">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Order &amp; Payment
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4">
              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Payment Method <span className="text-destructive">*</span>
                </label>
                <Select
                  value={watchedPaymentMethod}
                  onValueChange={(val) => {
                    if (val) setValue("paymentMethod", val as PaymentMethod);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentMethod.COD} className="text-xs">
                      Cash on Delivery (COD)
                    </SelectItem>
                    <SelectItem value={PaymentMethod.BKASH} className="text-xs">
                      bKash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status (PENDING vs PAID) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Payment Status <span className="text-destructive">*</span>
                </label>
                <Select
                  value={watchedPaymentStatus}
                  onValueChange={(val) => {
                    if (val) setValue("paymentStatus", val as PaymentStatus);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-9 text-xs font-bold",
                      watchedPaymentStatus === PaymentStatus.PAID
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                        : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value={PaymentStatus.PENDING}
                      className="text-xs text-amber-600 font-medium"
                    >
                      PENDING (Unpaid / COD)
                    </SelectItem>
                    <SelectItem
                      value={PaymentStatus.PAID}
                      className="text-xs text-emerald-600 font-medium"
                    >
                      PAID (Payment Received)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Initial Order Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Initial Order Status
                </label>
                <Select
                  value={watchedOrderStatus}
                  onValueChange={(val) => {
                    if (val) setValue("orderStatus", val as OrderStatus);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OrderStatus).map((st) => (
                      <SelectItem key={st} value={st} className="text-xs">
                        {st.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Promo Coupon Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Coupon Code (Optional)</span>
                  <Tag className="w-3.5 h-3.5 text-primary" />
                </label>
                <Input
                  {...register("couponCode")}
                  placeholder="e.g. SUMMER25"
                  className="h-9 text-xs uppercase"
                />
              </div>

              {/* Custom Admin Discount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Additional Admin Discount (৳)
                </label>
                <Input
                  type="number"
                  min={0}
                  {...register("customDiscount", { valueAsNumber: true })}
                  placeholder="0"
                  className="h-9 text-xs"
                />
              </div>

              {/* Delivery Fee Override */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Delivery Fee (৳)</span>
                  <span className="text-[11px] text-muted-foreground">
                    {watchedDistrict} (Standard ৳
                    {getDeliveryFee(watchedDistrict)})
                  </span>
                </label>
                <Input
                  type="number"
                  min={0}
                  {...register("customDeliveryFee", { valueAsNumber: true })}
                  placeholder="80"
                  className="h-9 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Math & Owner Margins Summary Card */}
          <Card className="shadow-xs border-border bg-card">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-bold">
                  Calculation Summary
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Subtotal:</span>
                <span className="font-semibold text-foreground">
                  ৳{calculations.itemsOriginalSubtotal.toLocaleString()}
                </span>
              </div>

              {calculations.totalDiscounts > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Total Discounts Applied:</span>
                  <span>-৳{calculations.totalDiscounts.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Charge:</span>
                <span className="font-semibold text-foreground">
                  {calculations.deliveryFee === 0
                    ? "FREE"
                    : `৳${calculations.deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <Separator />

              {/* Customer Payable Grand Total */}
              <div className="flex justify-between items-center text-sm font-bold pt-1">
                <span className="text-foreground">Grand Total:</span>
                <span className="text-primary text-lg">
                  ৳{calculations.grandFinalCost.toLocaleString()}
                </span>
              </div>

              {/* Owner Cost & Profit Margins */}
              <div className="rounded-lg bg-muted/40 p-3 mt-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Owner Inventory Cost:</span>
                  <span>৳{calculations.totalOwnerCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/40">
                  <span>Estimated Profit:</span>
                  <span>
                    ৳{calculations.estimatedNetProfit.toLocaleString()} (
                    {calculations.profitMarginPct}%)
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isPending || fields.length === 0}
                className="w-full h-10 mt-4 text-xs font-bold gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating
                    Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Commit &amp; Place
                    Order
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
