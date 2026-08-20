"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import {
  DELIVERY_FEE_INSIDE_DHAKA,
  DELIVERY_FEE_OUTSIDE_DHAKA,
  getDeliveryFee,
  isDhakaDistrict,
} from "@/constants/cart";
import {
  placeOrderAction,
  type CheckoutInitialData,
} from "@/actions/store/checkout";
import { validateStoreCouponAction } from "@/actions/store/coupon";
import { PaymentMethod } from "@/generated/prisma/enums";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Truck,
  ShieldCheck,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Banknote,
  Smartphone,
  Trash2,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackMetaPixelEvent, generateBrowserEventId } from "@/lib/meta-pixel";
import {
  trackMetaInitiateCheckoutAction,
  trackMetaAddPaymentInfoAction,
} from "@/actions/meta";

interface CheckoutPageViewProps {
  initialData: CheckoutInitialData;
}

export function CheckoutPageView({ initialData }: CheckoutPageViewProps) {
  const router = useRouter();
  const { cart, refreshCart } = useCart();
  const [isSubmitting, startTransition] = useTransition();

  // Prefer context cart if loaded, fallback to server initial cart
  const currentCart = cart.items.length > 0 ? cart : initialData.cart;

  // Form state
  const [name, setName] = useState(initialData.userProfile?.name || "");
  const [email, setEmail] = useState(initialData.userProfile?.email || "");
  const [phone, setPhone] = useState(initialData.userProfile?.phone || "");
  const [district, setDistrict] = useState(
    initialData.userProfile?.district || "Dhaka",
  );
  const [address, setAddress] = useState(
    initialData.userProfile?.address || "",
  );
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.COD,
  );

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    isFreeDelivery: boolean;
    name: string;
  } | null>(null);

  // Delivery and Totals Calculation
  const isDhaka = isDhakaDistrict(district);
  const isFreeDeliveryQualified =
    currentCart.isFreeDelivery ||
    (appliedCoupon ? appliedCoupon.isFreeDelivery : false);

  const deliveryFee = getDeliveryFee(district, isFreeDeliveryQualified);
  const subtotal = currentCart.subtotal;
  const originalSubtotal = currentCart.originalSubtotal;
  const campaignDiscount = currentCart.totalDiscount;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalSavings = campaignDiscount + couponDiscount;

  const finalSubtotal = Math.max(0, subtotal - couponDiscount);
  const grandTotal = finalSubtotal + deliveryFee;

  // Track InitiateCheckout on page mount with items
  React.useEffect(() => {
    if (currentCart.items.length > 0) {
      const eventId = generateBrowserEventId("ic");
      trackMetaPixelEvent(
        "InitiateCheckout",
        {
          value: grandTotal,
          currency: "BDT",
          num_items: currentCart.items.reduce((sum, i) => sum + i.quantity, 0),
          content_type: "product",
          content_ids: currentCart.items.map((i) => i.variantId || i.productId || i.comboProductId || i.id),
        },
        eventId,
      );

      trackMetaInitiateCheckoutAction({
        totalValue: grandTotal,
        numItems: currentCart.items.reduce((sum, i) => sum + i.quantity, 0),
        items: currentCart.items.map((i) => ({
          id: i.variantId || i.productId || i.comboProductId || i.id,
          name: i.name,
          price: i.unitPrice,
          quantity: i.quantity,
        })),
        eventId,
      }).catch(() => {});
    }
  }, []);

  // Track AddPaymentInfo when payment method changes
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    const eventId = generateBrowserEventId("api");

    trackMetaPixelEvent(
      "AddPaymentInfo",
      {
        value: grandTotal,
        currency: "BDT",
        status: method === PaymentMethod.COD ? "COD" : "BKASH",
      },
      eventId,
    );

    trackMetaAddPaymentInfoAction({
      paymentMethod: method === PaymentMethod.COD ? "COD" : "BKASH",
      totalValue: grandTotal,
      eventId,
    }).catch(() => {});
  };

  // Apply Coupon Handler
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const res = await validateStoreCouponAction({
        code: couponInput.trim(),
        subtotal: currentCart.subtotal,
        userId: initialData.userProfile?.id,
        categoryEnums: [],
        subCategoryIds: [],
        brandIds: [],
        productIds: currentCart.items
          .map((i) => i.productId)
          .filter(Boolean) as string[],
        variantIds: currentCart.items
          .map((i) => i.variantId)
          .filter(Boolean) as string[],
        comboProductIds: currentCart.items
          .map((i) => i.comboProductId)
          .filter(Boolean) as string[],
        totalItemsCount: currentCart.itemCount,
      });

      if (res.isValid && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.couponCode,
          discountAmount: res.coupon.discountAmount,
          isFreeDelivery: res.coupon.isFreeDelivery,
          name: res.coupon.name,
        });
        toast.success(
          `Coupon "${res.coupon.couponCode}" applied successfully! 🎉`,
        );
      } else {
        toast.error(res.message || "Invalid coupon code.");
      }
    } catch {
      toast.error("Failed to validate coupon.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    toast.info("Coupon removed.");
  };

  // Place Order Handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      toast.error("Please enter a valid 11-digit phone number.");
      return;
    }
    if (!address.trim() || address.length < 5) {
      toast.error("Please provide your full delivery street address.");
      return;
    }
    if (!district) {
      toast.error("Please select your district.");
      return;
    }

    if (currentCart.items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (currentCart.isCheckoutDisabled) {
      toast.error(
        currentCart.checkoutDisableReason ||
          "Some items in your cart exceed available stock. Please adjust quantities.",
      );
      return;
    }

    startTransition(async () => {
      const res = await placeOrderAction({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        district: district.trim(),
        address: address.trim(),
        note: note.trim() || null,
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      });

      if (res.success && res.orderId) {
        await refreshCart();
        if (res.bkashURL) {
          toast.info("Redirecting to bKash Secure Payment...");
          window.location.href = res.bkashURL;
        } else {
          toast.success("Order placed successfully! 🐾");
          router.push(`/checkout/success/${res.orderId}`);
        }
      } else {
        toast.error(res.message || "Failed to place order. Please try again.");
      }
    });
  };

  // If cart is empty
  if (currentCart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-[#EDF8FD] rounded-full flex items-center justify-center border-2 border-[#D4EEFC]">
          <ShoppingBag className="w-12 h-12 text-[#56C8D8]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Your Bag is Empty
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You don&apos;t have any items in your bag to checkout. Explore our
            premium pet foods, treats, and bundles!
          </p>
        </div>
        <div>
          <Link href="/products">
            <Button className="h-12 px-8 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-sm shadow-md cursor-pointer transition-transform hover:scale-105">
              Explore Pet Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Breadcrumbs & Title */}
      <div className="space-y-3">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
          <Link href="/" className="hover:text-[#56C8D8] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <Link href="/cart" className="hover:text-[#56C8D8] transition-colors">
            Shopping Bag
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-gray-900 font-bold">Secure Checkout</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Checkout &amp; Delivery Details 🐾
          </h1>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#56C8D8] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shopping Bag</span>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Shipping & Payment Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Account / Guest Header Banner */}
            {initialData.isGuest ? (
              <div className="p-4 rounded-2xl bg-[#EDF8FD] border border-[#D4EEFC] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#56C8D8] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <p className="font-extrabold text-gray-900">
                    Guest Checkout with Instant Account Creation
                  </p>
                  <p className="mt-0.5 text-gray-600">
                    We will automatically save your order and create an account
                    using your email so you can track your pet supplies.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Logged in as{" "}
                    <strong>{initialData.userProfile?.name}</strong> (
                    {initialData.userProfile?.email})
                  </span>
                </div>
              </div>
            )}

            {/* 1. Customer Information Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#D4EEFC] shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3.5">
                <div className="w-7 h-7 rounded-full bg-[#56C8D8]/15 text-[#56C8D8] font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h2 className="text-base font-black text-gray-900">
                  Contact Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    type="text"
                    placeholder="e.g. Shakib Al Hasan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 focus:border-[#56C8D8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 focus:border-[#56C8D8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 focus:border-[#56C8D8]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Address Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#D4EEFC] shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3.5">
                <div className="w-7 h-7 rounded-full bg-[#56C8D8]/15 text-[#56C8D8] font-black text-xs flex items-center justify-center">
                  2
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    Delivery Address
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Select your district for accurate delivery fee calculation
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">
                      Destination District{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-extrabold text-[#56C8D8]">
                      {isDhaka
                        ? `Inside Dhaka (৳${DELIVERY_FEE_INSIDE_DHAKA})`
                        : `Outside Dhaka (৳${DELIVERY_FEE_OUTSIDE_DHAKA})`}
                    </span>
                  </div>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#56C8D8] cursor-pointer shadow-2xs"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}{" "}
                        {d === "Dhaka"
                          ? "— Inside Dhaka (৳80 fee)"
                          : "— Outside Dhaka (৳120 fee)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Street Address / House &amp; Road Details{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Textarea
                    required
                    rows={2}
                    placeholder="House number, Road number, Area / Thana, Landmark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-[#56C8D8] resize-none text-xs sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">
                    Special Delivery Instructions (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Please deliver after 3 PM or leave with security"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="h-10 rounded-xl border-gray-200 focus:border-[#56C8D8] text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Method Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#D4EEFC] shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3.5">
                <div className="w-7 h-7 rounded-full bg-[#56C8D8]/15 text-[#56C8D8] font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h2 className="text-base font-black text-gray-900">
                  Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Cash On Delivery */}
                <label
                  onClick={() => handlePaymentMethodChange(PaymentMethod.COD)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    paymentMethod === PaymentMethod.COD
                      ? "border-[#56C8D8] bg-[#EDF8FD]/50 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === PaymentMethod.COD}
                    onChange={() => handlePaymentMethodChange(PaymentMethod.COD)}
                    className="mt-1 text-[#56C8D8] focus:ring-[#56C8D8]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs sm:text-sm font-black text-gray-900">
                        Cash on Delivery
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Pay cash when your pet package arrives at your doorstep.
                    </p>
                  </div>
                </label>

                {/* bKash Payment */}
                <label
                  onClick={() => handlePaymentMethodChange(PaymentMethod.BKASH)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    paymentMethod === PaymentMethod.BKASH
                      ? "border-[#56C8D8] bg-[#EDF8FD]/50 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === PaymentMethod.BKASH}
                    onChange={() => handlePaymentMethodChange(PaymentMethod.BKASH)}
                    className="mt-1 text-[#56C8D8] focus:ring-[#56C8D8]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#e2136e]" />
                      <span className="text-xs sm:text-sm font-black text-gray-900">
                        bKash Payment
                      </span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-[#e2136e]/10 text-[#e2136e]">
                        Popular
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Pay easily &amp; securely via bKash personal / merchant.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Placement (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#D4EEFC] shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#56C8D8]" />
                  <h2 className="text-base font-black text-gray-900">
                    Order Summary ({currentCart.itemCount}{" "}
                    {currentCart.itemCount === 1 ? "item" : "items"})
                  </h2>
                </div>
                <Link
                  href="/cart"
                  className="text-xs font-bold text-[#56C8D8] hover:underline"
                >
                  Edit Cart
                </Link>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
                {currentCart.items.map((item) => (
                  <div
                    key={item.id}
                    className="pt-3 first:pt-0 flex items-center gap-3"
                  >
                    <div className="relative w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 shrink-0 p-1 overflow-hidden flex items-center justify-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                        unoptimized={item.image.startsWith("data:")}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        {item.variantTitle && <span>{item.variantTitle}</span>}
                        {item.comboBadge && (
                          <span className="text-[#56C8D8] font-bold">
                            {item.comboBadge}
                          </span>
                        )}
                        <span>Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-gray-900">
                        ৳{item.lineTotal.toLocaleString()}
                      </p>
                      {item.lineDiscount > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          -৳{item.lineDiscount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#56C8D8]" />
                  <span>Promo Code or Coupon</span>
                </label>

                {appliedCoupon ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-extrabold text-emerald-900">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-[10px] text-emerald-700">
                          {appliedCoupon.isFreeDelivery
                            ? "Free Delivery unlocked!"
                            : `৳${appliedCoupon.discountAmount.toLocaleString()} discount applied`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) =>
                        setCouponInput(e.target.value.toUpperCase())
                      }
                      className="h-10 rounded-xl border-gray-200 uppercase text-xs font-bold"
                    />
                    <Button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="h-10 px-4 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs shrink-0 cursor-pointer"
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-3 border-t border-gray-100 text-xs font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">
                    ৳{originalSubtotal.toLocaleString()}
                  </span>
                </div>

                {campaignDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Campaign Discount</span>
                    <span>-৳{campaignDiscount.toLocaleString()}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>-৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#56C8D8]" />
                    <span>
                      Delivery Fee ({isDhaka ? "Inside Dhaka" : "Outside Dhaka"}
                      )
                    </span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-black uppercase text-[10px]">
                        FREE
                      </span>
                    ) : (
                      `৳${deliveryFee}`
                    )}
                  </span>
                </div>

                {isFreeDeliveryQualified && (
                  <p className="text-[10px] text-emerald-600 font-bold text-right">
                    🎉 Free delivery applied to this order!
                  </p>
                )}

                <div className="pt-3 border-t border-[#D4EEFC] flex justify-between items-baseline text-sm font-black text-gray-900">
                  <span>Grand Total</span>
                  <span className="text-xl font-black text-[#56C8D8]">
                    ৳{grandTotal.toLocaleString()}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center text-emerald-800 font-bold text-xs">
                    🌟 You are saving a total of ৳
                    {totalSavings.toLocaleString()} on this order!
                  </div>
                )}
              </div>

              {/* Stock / Checkout Warnings */}
              {currentCart.isCheckoutDisabled && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{currentCart.checkoutDisableReason}</span>
                </div>
              )}

              {/* Place Order CTA Button */}
              <Button
                type="submit"
                disabled={isSubmitting || currentCart.isCheckoutDisabled}
                className={cn(
                  "w-full h-13 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg cursor-pointer transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed",
                  paymentMethod === PaymentMethod.BKASH
                    ? "bg-[#e2136e] hover:bg-[#c2105e]"
                    : "bg-[#56C8D8] hover:bg-[#45B0BF]",
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      {paymentMethod === PaymentMethod.BKASH
                        ? "Connecting to bKash Gateway..."
                        : "Placing Your Order..."}
                    </span>
                  </div>
                ) : paymentMethod === PaymentMethod.BKASH ? (
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5" />
                    <span>Pay ৳{grandTotal.toLocaleString()} with bKash 🚀</span>
                  </div>
                ) : (
                  <span>Confirm &amp; Place Order (COD) 🐾</span>
                )}
              </Button>

              {/* Trust Badges */}
              <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Secure Checkout • Authentic Pet Essentials</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
