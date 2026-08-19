"use client";

import React, { useRef, ReactElement } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomerOrderSummary } from "@/schemas/root/account/orders";
import { Printer, Phone, Mail } from "lucide-react";
import { PaymentMethod } from "@/generated/prisma/enums";

interface CustomerOrderInvoiceModalProps {
  order: CustomerOrderSummary;
  trigger?: React.ReactNode;
}

export function CustomerOrderInvoiceModal({
  order,
  trigger,
}: CustomerOrderInvoiceModalProps) {
  const [open, setOpen] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalPrice = parseFloat(order.totalPrice || "0");
  const discountCost = parseFloat(order.discountCost || "0");
  const finalCost = parseFloat(order.finalCost || "0");
  const shippingFee = Math.max(0, finalCost - (totalPrice - discountCost));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as ReactElement)
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Invoice</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[700px] w-[min(96vw,700px)] max-w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Printable Area */}
        <div
          ref={printRef}
          className="p-6 sm:p-8 bg-white text-gray-900 space-y-6"
        >
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-[#56C8D8] tracking-tight">
                  Meawland
                </span>
                <span className="text-xs bg-[#EDF5FA] text-[#0097a7] font-bold px-2 py-0.5 rounded-full">
                  Pet Care Store
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your trusted partner for quality pet essentials &amp; nutrition.
              </p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                Official Receipt / Invoice
              </span>
              <span className="font-mono text-base font-black text-gray-900">
                #{order.code}
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Customer & Delivery Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-xs">
            <div>
              <span className="font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Billed / Shipped To:
              </span>
              <p className="font-bold text-sm text-gray-900">{order.name}</p>
              <p className="text-gray-600 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-gray-400" />
                {order.phone}
              </p>
              <p className="text-gray-600 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 text-gray-400" />
                {order.email}
              </p>
            </div>
            <div>
              <span className="font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Delivery Destination:
              </span>
              <p className="text-gray-800 leading-relaxed">
                {order.address}, <strong>{order.district}</strong>
              </p>
              <p className="text-gray-600 mt-1">
                Payment Method:{" "}
                <strong className="text-gray-900">
                  {order.paymentMethod === PaymentMethod.COD
                    ? "Cash on Delivery (COD)"
                    : "bKash Online Payment"}
                </strong>
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900">{item.name}</div>
                      {item.sku && (
                        <div className="text-[11px] text-gray-400 font-mono">
                          SKU: {item.sku}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      ৳{parseFloat(item.unitPrice).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                      ৳{parseFloat(item.finalCost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Math */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="text-xs text-gray-500 max-w-xs">
              {order.note && (
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[11px]">
                  <strong>Special Instructions:</strong> {order.note}
                </div>
              )}
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>৳{totalPrice.toLocaleString()}</span>
              </div>
              {discountCost > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Savings / Discounts:</span>
                  <span>-৳{discountCost.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span>৳{shippingFee.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
                <span>Grand Total:</span>
                <span className="text-[#56C8D8] text-base">
                  ৳{finalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-gray-100 text-center text-[11px] text-gray-400">
            Thank you for choosing Meawland! If you have any inquiries regarding
            this order, please reach out through our Support Center with Order #
            {order.code}.
          </div>
        </div>

        {/* Modal Action Bar (Hidden on Print) */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            className="rounded-xl"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
