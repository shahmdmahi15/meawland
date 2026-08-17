"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Truck,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Package,
  ArrowLeft,
} from "lucide-react";

export function CartPageView() {
  const { cart, updateQuantity, removeItem, clearCart, isPending } = useCart();

  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleConfirmClear = async () => {
    setClearDialogOpen(false);
    await clearCart();
  };

  if (cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto mb-6">
          <Image
            src="/empty-cat.gif"
            alt="Empty Cart"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mb-8 font-medium">
          Discover our curated collection of nutritious cat and dog food,
          grooming essentials, handcrafted accessories, and fun toys!
        </p>
        <Link href="/products">
          <Button className="h-11 px-8 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-105">
            <ShoppingBag className="w-4 h-4" />
            Explore Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Top Banner: Free Delivery Threshold Meter */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[#F0F8FF] border border-[#D4EEFC] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <div className="w-7 h-7 rounded-lg bg-[#56C8D8]/20 text-[#56C8D8] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            {cart.isFreeDelivery ? (
              <span className="text-emerald-700 flex items-center gap-1.5 font-extrabold">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Congratulations! You&apos;ve unlocked FREE Delivery across
                Bangladesh.
              </span>
            ) : (
              <span>
                Add{" "}
                <strong className="text-[#56C8D8]">
                  ৳{cart.amountNeededForFreeDelivery}
                </strong>{" "}
                more to qualify for{" "}
                <strong className="text-emerald-600">FREE Delivery</strong>
              </span>
            )}
          </div>
          <span className="text-xs font-black text-gray-500">
            {cart.freeDeliveryProgress}% achieved
          </span>
        </div>
        <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#D4EEFC]">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              cart.isFreeDelivery
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : "bg-gradient-to-r from-[#56C8D8] via-[#45B0BF] to-[#38bdf8]"
            }`}
            style={{ width: `${cart.freeDeliveryProgress}%` }}
          />
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4EEFC]">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                Cart Items
              </h2>
              <Badge className="bg-[#56C8D8] text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                {cart.itemCount} {cart.itemCount === 1 ? "Item" : "Items"}
              </Badge>
            </div>

            <button
              type="button"
              onClick={() => setClearDialogOpen(true)}
              disabled={isPending}
              className="text-xs font-semibold text-gray-400 hover:text-destructive flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {cart.items.map((item) => {
              const isMaxStock = item.quantity >= item.stock;
              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-[#F0F8FF]/60 border border-[#D4EEFC] hover:border-[#56C8D8]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs group"
                >
                  {/* Left: Image & Title */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 border border-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
                          unoptimized={item.image.startsWith("data:")}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300 stroke-1" />
                      )}

                      {item.isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[9px] font-black text-white uppercase tracking-wider">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1">
                        {item.campaignBadge && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {item.campaignBadge.badgeText}
                            </span>
                          </span>
                        )}
                        {item.comboBadge && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#56C8D8] text-white font-bold text-[8px] sm:text-[9px] px-2 py-0.5">
                            {item.comboBadge}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <Link href={`/product/${item.slug}`} className="block">
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#56C8D8] transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>

                      {/* Variant Attributes Details (Color / Size / Weight) */}
                      {item.variantAttributes &&
                        item.variantAttributes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {item.variantAttributes.map((attr, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white text-gray-700 font-bold text-[10px] border border-gray-200 shadow-2xs"
                              >
                                <span className="text-gray-400">
                                  {attr.name}:
                                </span>
                                <span className="text-gray-900">
                                  {attr.value}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                      {/* Unit Price */}
                      <div className="flex items-center gap-2 text-xs pt-0.5">
                        <span className="font-extrabold text-gray-900">
                          ৳{item.unitPrice} each
                        </span>
                        {item.unitOriginalPrice > item.unitPrice && (
                          <span className="text-[11px] text-gray-400 line-through">
                            ৳{item.unitOriginalPrice}
                          </span>
                        )}
                      </div>

                      {/* Stock Warnings */}
                      {item.exceedsStock && (
                        <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {item.itemType === "COMBO"
                              ? `Bundle exceeds available stock across cart (max ${item.stock})`
                              : `Exceeds stock (only ${item.stock} available)`}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Line Total */}
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Stepper */}
                    <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={isPending || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-xl disabled:opacity-40 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-xs sm:text-sm font-black text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={isPending || isMaxStock || item.isOutOfStock}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-xl disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                        title={
                          isMaxStock
                            ? `Max stock (${item.stock}) reached`
                            : undefined
                        }
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-sm sm:text-base font-black text-[#56C8D8]">
                        ৳{item.lineTotal}
                      </span>
                      {item.lineDiscount > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          Save ৳{item.lineDiscount}
                        </p>
                      )}
                    </div>

                    {/* Remove Trash */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-destructive hover:bg-rose-50 transition-colors cursor-pointer"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-[#56C8D8] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary (Sticky) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#D4EEFC] shadow-sm space-y-5">
            <h3 className="text-base sm:text-lg font-black text-gray-900 pb-3 border-b border-[#D4EEFC]">
              Order Summary
            </h3>

            {/* Price Calculations Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Original Subtotal</span>
                <span className="font-bold text-gray-900">
                  ৳{cart.originalSubtotal}
                </span>
              </div>

              {cart.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                    Campaign Savings
                  </span>
                  <span>-৳{cart.totalDiscount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#D4EEFC] flex justify-between text-base sm:text-lg font-black text-gray-900">
                <span>Cart Total</span>
                <span className="text-[#56C8D8]">৳{cart.subtotal}</span>
              </div>

              <p className="text-[11px] text-gray-400 font-medium pt-1">
                * Delivery fees and coupons will be applied at checkout.
              </p>
            </div>

            {/* Stock Error Notice */}
            {cart.isCheckoutDisabled && cart.checkoutDisableReason && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{cart.checkoutDisableReason}</span>
              </div>
            )}

            {/* Checkout Button */}
            <Link href="/checkout" className="block w-full">
              <Button
                disabled={cart.isCheckoutDisabled}
                className="w-full h-12 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>100% Genuine Pet Products Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#56C8D8] shrink-0" />
                <span>Fast Nationwide Express Delivery in Bangladesh</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Clear your shopping cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all {cart.itemCount}{" "}
              {cart.itemCount === 1 ? "item" : "items"}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmClear}
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
