"use client";

import { useState, useRef, ReactNode, ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Receipt, PawPrint } from "lucide-react";
import { AdminOrder } from "@/actions/admin/management/orders/get-orders";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";

interface OrderInvoiceModalProps {
  order: AdminOrder;
  trigger?: ReactNode;
}

export function OrderInvoiceModal({ order, trigger }: OrderInvoiceModalProps) {
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalPrice = parseFloat(order.totalPrice) || 0;
  const discountCost = parseFloat(order.discountCost) || 0;
  const finalCost = parseFloat(order.finalCost) || 0;
  const deliveryFee = Math.max(0, finalCost - (totalPrice - discountCost));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as ReactElement)
          ) : (
            <Button variant="ghost" size="icon-sm" title="Print invoice">
              <Printer className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )
        }
      />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <div>
              <DialogTitle className="text-base font-bold">
                Invoice / Receipt
              </DialogTitle>
              <DialogDescription className="text-xs">
                Order #{order.code}
              </DialogDescription>
            </div>
          </div>
          <Button size="sm" onClick={handlePrint} className="gap-2 mr-6">
            <Printer className="w-3.5 h-3.5" /> Print Receipt
          </Button>
        </DialogHeader>

        {/* Printable Invoice Container */}
        <div
          ref={printRef}
          className="p-6 sm:p-8 bg-white text-neutral-900 font-sans print:p-0"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-primary">
                  MEAWLAND
                </span>
                <PawPrint className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Pet Care &amp; Accessories Store
              </p>
              <p className="text-xs text-neutral-500">Dhaka, Bangladesh</p>
              <p className="text-xs text-neutral-500">
                support@meawland.com | +880 1800-000000
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-800">
                INVOICE
              </h2>
              <p className="text-sm font-semibold text-neutral-700 mt-1">
                #{order.code}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Date:{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-neutral-100 text-neutral-700 border border-neutral-200">
                {order.paymentStatus === PaymentStatus.PAID
                  ? "PAID"
                  : "PAYMENT DUE (COD)"}
              </div>
            </div>
          </div>

          {/* Billed To / Shipping Address */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-neutral-200 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                CUSTOMER / BILLED TO
              </p>
              <p className="font-bold text-neutral-800 text-sm">{order.name}</p>
              <p className="text-neutral-600 mt-0.5">{order.email}</p>
              <p className="text-neutral-600">{order.phone}</p>
              {order.userCode && (
                <p className="text-[10px] text-neutral-400 mt-1">
                  ID: {order.userCode}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                DELIVERY DESTINATION
              </p>
              <p className="font-semibold text-neutral-800">{order.district}</p>
              <p className="text-neutral-600 mt-0.5">{order.address}</p>
              <p className="text-neutral-600 mt-1">
                Method:{" "}
                <strong>
                  {order.paymentMethod === PaymentMethod.COD
                    ? "Cash On Delivery"
                    : "bKash Online Payment"}
                </strong>{" "}
                ({order.paymentStatus})
              </p>
              {order.paymentMethod === PaymentMethod.BKASH && order.payment?.trxID && (
                <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  bKash TrxID: <strong>{order.payment.trxID}</strong>
                  {order.payment.customerMsisdn && ` | ${order.payment.customerMsisdn}`}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-300 text-neutral-600 uppercase text-[10px] tracking-wider">
                  <th className="py-2 text-left">Item Description</th>
                  <th className="py-2 text-center w-16">Qty</th>
                  <th className="py-2 text-right w-24">Unit Price</th>
                  <th className="py-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold text-neutral-800">
                        {item.name}
                      </p>
                      {item.sku && (
                        <p className="text-[10px] text-neutral-400">
                          SKU: {item.sku}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 text-center font-medium text-neutral-700">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 text-right text-neutral-600">
                      ৳{parseFloat(item.unitPrice).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-neutral-800">
                      ৳{parseFloat(item.finalCost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex justify-end pt-4 border-t-2 border-neutral-200">
            <div className="w-64 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-medium text-neutral-800">
                  ৳{totalPrice.toLocaleString()}
                </span>
              </div>
              {discountCost > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discounts Applied:</span>
                  <span>-৳{discountCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee ({order.district}):</span>
                <span className="font-medium text-neutral-800">
                  {deliveryFee === 0 ? "FREE" : `৳${deliveryFee}`}
                </span>
              </div>
              <div className="border-t border-neutral-300 pt-2 mt-2 flex justify-between text-base font-bold text-neutral-900">
                <span>Grand Total:</span>
                <span className="text-primary">
                  ৳{finalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-8 pt-6 border-t border-dashed border-neutral-300 text-center text-[11px] text-neutral-400">
            <p className="font-medium text-neutral-600">
              Thank you for shopping with Meawland! 🐾
            </p>
            <p className="mt-0.5">
              For return requests or support, contact us with order reference #
              {order.code}.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
