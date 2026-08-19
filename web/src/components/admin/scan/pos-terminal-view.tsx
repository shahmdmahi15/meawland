"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import {
  POSCartItem,
  POSCheckoutInput,
  POSReceiptData,
  ScannedVariantOption,
} from "@/schemas/admin/scan";
import { createPOSOrderAction } from "@/actions/admin/scan";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Loader2,
  User,
  Package,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { scannerAudio } from "./scanner-audio";
import { PrintableReceiptModal } from "./printable-receipt-modal";

interface POSTerminalViewProps {
  cart: POSCartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onUpdateVariant?: (index: number, newVariant: ScannedVariantOption) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export function POSTerminalView({
  cart,
  onUpdateQuantity,
  onUpdateVariant,
  onRemoveItem,
  onClearCart,
}: POSTerminalViewProps) {
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("01700000000");
  const [customerEmail, setCustomerEmail] = useState("");
  const [district] = useState("Dhaka");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.COD,
  );
  const [paymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID);
  const [note, setNote] = useState("");

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<POSReceiptData | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const netPayable = Math.max(0, subtotal - discountAmount);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("POS cart is empty. Scan barcodes to add items.");
      return;
    }

    if (!customerPhone.trim()) {
      toast.error("Please enter a customer phone number.");
      return;
    }

    const payload: POSCheckoutInput = {
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      district,
      address: "In-Store POS Counter",
      items: cart,
      discountAmount,
      paymentMethod,
      paymentStatus,
      note: note || undefined,
    };

    startTransition(async () => {
      const res = await createPOSOrderAction(payload);
      if (res.success && res.receipt) {
        scannerAudio.playSuccessBeep();
        toast.success(res.message);
        setLatestReceipt(res.receipt);
        setReceiptModalOpen(true);
        onClearCart();
        setDiscountAmount(0);
        setNote("");
      } else {
        scannerAudio.playErrorBuzz();
        toast.error(res.message || "POS checkout failed.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        receipt={latestReceipt}
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
      />

      {/* Left: Cart Items Table */}
      <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#56C8D8]" />
            <h2 className="text-base font-black text-gray-900">
              Active POS Register Cart
            </h2>
            <Badge
              variant="outline"
              className="text-[10px] bg-[#EDF5FA] text-[#0097a7] border-[#D4EEFC] font-bold"
            >
              {totalQuantity} items
            </Badge>
          </div>

          {cart.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-rose-600 hover:bg-rose-50 text-xs font-semibold h-8 rounded-xl gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </Button>
          )}
        </div>

        {/* Cart Table */}
        <div className="rounded-2xl border border-gray-200/80 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="text-xs font-bold text-gray-700">
                  Product
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">
                  Unit Price
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-center">
                  Qty
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 text-right">
                  Subtotal
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 w-10 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <TableRow
                    key={`${item.productId}-${item.variantId || idx}`}
                    className="text-xs hover:bg-gray-50/60"
                  >
                    {/* Item */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.productName}
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized={item.thumbnail.startsWith("data:")}
                            />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[200px] space-y-1">
                          <p className="font-bold text-gray-900 truncate">
                            {item.productName}
                          </p>
                          {item.availableVariants &&
                          item.availableVariants.length > 1 ? (
                            <Select
                              value={
                                item.variantId || item.availableVariants[0].id
                              }
                              onValueChange={(newVarId) => {
                                if (!newVarId) return;
                                const targetVar = item.availableVariants?.find(
                                  (v) => v.id === newVarId,
                                );
                                if (targetVar && onUpdateVariant) {
                                  onUpdateVariant(idx, targetVar);
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 w-auto max-w-[210px] text-xs font-bold text-[#0097a7] bg-[#EDF5FA] border-[#D4EEFC] rounded-lg px-2.5 py-0 cursor-pointer">
                                <SelectValue>
                                  <span className="truncate">
                                    {item.availableVariants.find(
                                      (v) =>
                                        v.id ===
                                        (item.variantId ||
                                          item.availableVariants?.[0]?.id),
                                    )?.label ||
                                      item.variantLabel ||
                                      item.sku}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent
                                alignItemWithTrigger={false}
                                className="min-w-[240px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                              >
                                {item.availableVariants.map((v) => (
                                  <SelectItem
                                    key={v.id}
                                    value={v.id}
                                    className="text-xs py-2 pr-8 pl-2.5 rounded-lg cursor-pointer hover:bg-gray-50"
                                  >
                                    <div className="flex items-center justify-between w-full gap-3 pr-4">
                                      <span className="font-bold text-gray-800 truncate">
                                        {v.label}
                                      </span>
                                      <span className="text-emerald-700 font-bold text-[11px] shrink-0 font-mono">
                                        ৳{v.salePrice || v.regularPrice}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-[10px] text-gray-500 font-mono truncate">
                              {item.sku}
                              {item.variantLabel
                                ? ` • ${item.variantLabel}`
                                : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Unit Price */}
                    <TableCell className="text-center font-bold text-gray-700">
                      ৳{item.unitPrice.toFixed(0)}
                    </TableCell>

                    {/* Quantity Controls */}
                    <TableCell className="text-center">
                      <div className="inline-flex items-center border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(
                              idx,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="px-2 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 font-bold font-mono text-xs text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateQuantity(idx, item.quantity + 1)
                          }
                          className="px-2 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </TableCell>

                    {/* Subtotal */}
                    <TableCell className="text-right font-black text-emerald-700">
                      ৳{(item.unitPrice * item.quantity).toFixed(0)}
                    </TableCell>

                    {/* Remove */}
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(idx)}
                        className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-12 text-gray-500 text-xs"
                  >
                    <ShoppingCart className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Cart is empty. Scan product barcodes or click &quot;Add to
                    POS Cart&quot; to begin.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right: Checkout & Customer Information */}
      <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <User className="w-4 h-4 text-[#56C8D8]" />
          <h2 className="text-sm font-black text-gray-900">
            Customer &amp; Payment Details
          </h2>
        </div>

        <form onSubmit={handleCheckout} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">
              Customer Name
            </Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Tanvir Hasan"
              required
              className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Phone Number <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                required
                className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Email Address
              </Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@gmail.com"
                className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Payment Method
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) =>
                  val && setPaymentMethod(val as PaymentMethod)
                }
              >
                <SelectTrigger className="h-10 w-full rounded-xl bg-gray-50/80 border-gray-200 text-xs px-3">
                  <SelectValue>
                    {paymentMethod === PaymentMethod.COD
                      ? "💵 Cash on Counter (COD)"
                      : "📱 bKash / MFS Direct"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="min-w-[220px] bg-white border border-gray-200 shadow-xl rounded-2xl p-1 z-50"
                >
                  <SelectItem
                    value={PaymentMethod.COD}
                    className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                  >
                    <span className="font-bold">💵 Cash on Counter (COD)</span>
                  </SelectItem>
                  <SelectItem
                    value={PaymentMethod.BKASH}
                    className="text-xs py-2 px-2.5 rounded-xl cursor-pointer"
                  >
                    <span className="font-bold text-pink-600">
                      📱 bKash / MFS Direct
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Instant Discount (৳)
              </Label>
              <Input
                type="number"
                min={0}
                value={discountAmount || ""}
                onChange={(e) =>
                  setDiscountAmount(parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Pricing Calculations */}
          <div className="bg-[#EDF5FA]/60 border border-[#D4EEFC] rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({totalQuantity} items):</span>
              <span className="font-bold font-mono">
                ৳{subtotal.toFixed(2)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Applied Discount:</span>
                <span className="font-bold font-mono">
                  -৳{discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-[#D4EEFC]">
              <span>Net Payable:</span>
              <span className="text-emerald-700 font-mono">
                ৳{netPayable.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <Button
            type="submit"
            disabled={isPending || cart.length === 0}
            className="w-full h-12 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-xs sm:text-sm gap-2 shadow-xs cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Receipt className="w-5 h-5" />
            )}
            <span>
              Complete Sale &amp; Print Invoice (৳{netPayable.toFixed(0)})
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}
