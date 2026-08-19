"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { POSReceiptData } from "@/schemas/admin/scan";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, X } from "lucide-react";

interface PrintableReceiptModalProps {
  receipt: POSReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrintableReceiptModal({
  receipt,
  open,
  onOpenChange,
}: PrintableReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(94vw,420px)] rounded-3xl p-0 overflow-hidden border border-gray-200">
        <div className="bg-[#EDF5FA] border-b border-[#D4EEFC] p-4 flex items-center justify-between no-print">
          <DialogTitle className="text-sm font-black text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>POS Sale Completed</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Printable POS Thermal Receipt
          </DialogDescription>
          <div className="flex items-center gap-1.5">
            <Button
              onClick={handlePrint}
              size="sm"
              className="h-8 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-xl text-gray-500 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Thermal Receipt Content Container */}
        <div
          ref={receiptRef}
          className="p-6 bg-white text-gray-900 font-mono text-xs space-y-4 printable-receipt"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-center mb-1">
              <Image
                src="/logo.png"
                alt="Meawland"
                width={120}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="font-bold text-xs">MEAWLAND PET ESSENTIALS</p>
            <p className="text-[10px] text-gray-500">
              In-Store POS Terminal • Dhaka, Bangladesh
            </p>
            <p className="text-[10px] text-gray-500">
              Hotline: +880 1800-MEAWLAND
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="text-[11px] space-y-1 pb-3 border-b border-dashed border-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No:</span>
              <span className="font-bold">{receipt.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date &amp; Time:</span>
              <span>{new Date(receipt.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer:</span>
              <span className="font-bold">{receipt.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone:</span>
              <span>{receipt.customerPhone}</span>
            </div>
          </div>

          {/* Itemized List */}
          <div className="space-y-2 pb-3 border-b border-dashed border-gray-300 text-[11px]">
            <div className="flex justify-between font-bold text-gray-700 pb-1 border-b border-gray-100">
              <span>Item Description</span>
              <span>Total</span>
            </div>

            {receipt.items.map((itm, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-bold truncate max-w-[200px]">
                    {itm.productName}
                  </span>
                  <span className="font-bold">
                    ৳{(itm.unitPrice * itm.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>
                    {itm.quantity} x ৳{itm.unitPrice.toFixed(2)}
                    {itm.variantLabel ? ` (${itm.variantLabel})` : ""}
                  </span>
                  <span>SKU: {itm.sku}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Calculations */}
          <div className="space-y-1.5 text-xs font-bold">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>৳{receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span>-৳{receipt.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-900">
              <span>NET TOTAL:</span>
              <span>৳{receipt.finalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 pt-1">
              <span>Payment Method:</span>
              <span className="uppercase">
                {receipt.paymentMethod} ({receipt.paymentStatus})
              </span>
            </div>
          </div>

          {/* Barcode Footer */}
          <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-1">
            <p className="text-[10px] font-bold tracking-wider">
              THANK YOU FOR SHOPPING AT MEAWLAND! 🐾
            </p>
            <p className="text-[9px] text-gray-400">
              Goods once sold can be exchanged within 7 days with this invoice.
            </p>
            <div className="pt-2 font-mono text-[10px] tracking-widest text-gray-400">
              *{receipt.orderCode}*
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
