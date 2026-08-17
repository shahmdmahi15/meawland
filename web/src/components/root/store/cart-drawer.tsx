"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { useCart } from "@/context/cart-context";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Package,
  Truck,
} from "lucide-react";

export function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
    isPending,
  } = useCart();

  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleConfirmClear = async () => {
    setClearDialogOpen(false);
    await clearCart();
  };

  return (
    <>
      <Sheet
        open={isDrawerOpen}
        onOpenChange={(open) => !open && closeDrawer()}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col justify-between bg-white z-50 overflow-hidden"
          showCloseButton={true}
        >
          {/* Header */}
          <SheetHeader className="px-5 py-4 border-b border-[#D4EEFC] bg-linear-to-b from-[#F0F8FF] to-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#56C8D8]/15 text-[#56C8D8] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  Shopping Bag
                </SheetTitle>
                <p className="text-[11px] text-gray-500 font-medium">
                  {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in
                  your cart
                </p>
              </div>
            </div>

            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={() => setClearDialogOpen(true)}
                disabled={isPending}
                className="text-[11px] font-bold text-gray-400 hover:text-destructive flex items-center gap-1 transition-colors mr-6 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </SheetHeader>

          {/* Free Delivery Threshold Meter */}
          {cart.items.length > 0 && (
            <div className="bg-[#EDF8FD] px-5 py-3 border-b border-[#D4EEFC]">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <div className="flex items-center gap-1.5 text-gray-800">
                  <Truck className="w-4 h-4 text-[#56C8D8]" />
                  {cart.isFreeDelivery ? (
                    <span className="text-emerald-700 font-extrabold">
                      🎉 You unlocked FREE Delivery!
                    </span>
                  ) : (
                    <span>
                      Add{" "}
                      <strong className="text-[#56C8D8]">
                        ৳{cart.amountNeededForFreeDelivery}
                      </strong>{" "}
                      more for Free Delivery
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-black text-gray-500">
                  {cart.freeDeliveryProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#D4EEFC]">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    cart.isFreeDelivery
                      ? "bg-linear-to-r from-emerald-400 to-emerald-500"
                      : "bg-linear-to-r from-[#56C8D8] to-[#38bdf8]"
                  }`}
                  style={{ width: `${cart.freeDeliveryProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
            {cart.items.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="relative w-36 h-36 mx-auto">
                  <Image
                    src="/empty-cat.gif"
                    alt="Empty Cart"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900">
                    Your Cart is Empty
                  </h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto font-medium">
                    Looks like you haven&apos;t added any pet meals or toys yet.
                    Explore our collections and spoil your fur baby!
                  </p>
                </div>
                <Link href="/products" onClick={closeDrawer}>
                  <Button className="rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs px-6 h-10 shadow-md cursor-pointer">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              cart.items.map((item) => {
                const isMaxStock = item.quantity >= item.stock;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 rounded-2xl bg-[#F0F8FF]/60 border border-[#D4EEFC] hover:border-[#56C8D8]/50 transition-all shadow-2xs group"
                  >
                    {/* Item Image */}
                    <div className="relative w-20 h-20 rounded-xl bg-white p-1.5 border border-gray-100 shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain p-1"
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

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        {/* Tags / Badges */}
                        <div className="flex flex-wrap items-center gap-1 mb-0.5">
                          {item.campaignBadge && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-[8px] px-1.5 py-0.2 shadow-2xs">
                              <Sparkles className="w-2 h-2 shrink-0" />
                              <span className="truncate max-w-[110px]">
                                {item.campaignBadge.badgeText}
                              </span>
                            </span>
                          )}
                          {item.comboBadge && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#56C8D8] text-white font-bold text-[8px] px-1.5 py-0.2">
                              {item.comboBadge}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeDrawer}
                          className="block"
                        >
                          <h4 className="text-xs font-bold text-gray-900 hover:text-[#56C8D8] transition-colors truncate">
                            {item.name}
                          </h4>
                        </Link>

                        {/* Variant Attributes Details (Color / Size / Weight) */}
                        {item.variantAttributes &&
                          item.variantAttributes.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {item.variantAttributes.map((attr, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white text-gray-700 font-bold text-[9px] border border-gray-200 shadow-2xs"
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
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-black text-gray-900">
                            ৳{item.unitPrice}
                          </span>
                          {item.unitOriginalPrice > item.unitPrice && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ৳{item.unitOriginalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Warning */}
                      {item.exceedsStock && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>
                            {item.itemType === "COMBO"
                              ? `Bundle exceeds available stock across cart (max ${item.stock})`
                              : `Exceeds stock (only ${item.stock} available)`}
                          </span>
                        </p>
                      )}

                      {/* Controls (Stepper + Trash) */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
                        <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-2xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={isPending || item.quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg disabled:opacity-40 cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-black text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              isPending || isMaxStock || item.isOutOfStock
                            }
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg disabled:opacity-40 cursor-pointer"
                            aria-label="Increase quantity"
                            title={
                              isMaxStock
                                ? `Max stock (${item.stock}) reached`
                                : undefined
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#56C8D8]">
                            ৳{item.lineTotal}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={isPending}
                            className="p-1 rounded-md text-gray-400 hover:text-destructive hover:bg-rose-50 transition-colors cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Summary & Checkout CTA */}
          {cart.items.length > 0 && (
            <div className="p-5 border-t border-[#D4EEFC] bg-[#F0F8FF]/80 backdrop-blur-xs space-y-3">
              <div className="space-y-1.5 text-xs font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
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

                <div className="pt-2 border-t border-[#D4EEFC] flex justify-between text-sm font-black text-gray-900">
                  <span>Cart Total</span>
                  <span className="text-base text-[#56C8D8]">
                    ৳{cart.subtotal}
                  </span>
                </div>
              </div>

              {/* Checkout / Error Notice */}
              {cart.isCheckoutDisabled && cart.checkoutDisableReason && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{cart.checkoutDisableReason}</span>
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="block w-full"
                >
                  <Button
                    disabled={cart.isCheckoutDisabled}
                    className="w-full h-11 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="block text-center text-xs font-bold text-gray-600 hover:text-[#56C8D8] transition-colors py-1"
                >
                  View &amp; Edit Full Cart Page
                </Link>
              </div>

              {/* Security Seal */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Genuine Pet Essentials • Fast Dispatch</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Clear your shopping bag?</AlertDialogTitle>
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
              Clear Bag
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
