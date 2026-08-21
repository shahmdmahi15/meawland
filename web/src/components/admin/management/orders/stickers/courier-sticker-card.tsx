"use client";

import React, { forwardRef } from "react";
import { InvoiceBarcode } from "@/components/invoice/invoice-barcode";
import type { CourierStickerData } from "@/schemas/courier-sticker";
import { cn } from "@/lib/utils";

interface CourierStickerCardProps {
  sticker: CourierStickerData;
  className?: string;
}

export const CourierStickerCard = forwardRef<
  HTMLDivElement,
  CourierStickerCardProps
>(function CourierStickerCard({ sticker, className }, ref) {
  return (
    <div
      ref={ref}
      data-courier-sticker
      className={cn(
        "bg-white text-black font-sans relative flex flex-col justify-between items-stretch text-left select-none overflow-hidden box-border",
        // Thermal high-contrast rendering
        "border border-black print:border-none shadow-2xs",
        className,
      )}
      style={{
        width: "2in",
        height: "3in",
        minWidth: "2in",
        minHeight: "3in",
        maxWidth: "2in",
        maxHeight: "3in",
        padding: "1.8mm 2mm 1.8mm 2mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        pageBreakInside: "avoid",
        WebkitFontSmoothing: "antialiased",
        textRendering: "geometricPrecision",
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      {/* 1. Header Logo from public/courier-sticker-logo.svg */}
      <div className="w-full flex flex-col items-center justify-center pt-0.5 pb-0.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/courier-sticker-logo.svg"
          alt="Meawland"
          className="h-10 w-auto max-w-[1.6in] object-contain"
        />
      </div>

      {/* 2. Order & Customer Info Fields */}
      <div
        className="w-full flex flex-col space-y-0.5 text-black leading-tight px-0.5"
        style={{ fontSize: "6.8pt" }}
      >
        <div className="flex items-center">
          <span className="font-semibold">Date:</span>
          <span className="font-normal ml-0.5">{sticker.date}</span>
        </div>

        <div className="flex items-center">
          <span className="font-semibold">Merchant Id:</span>
          <span className="font-normal ml-0.5 font-mono">
            {sticker.merchantId}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-semibold">Invoice ID:</span>
          <span className="font-normal ml-0.5 font-mono">
            {sticker.invoiceId}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-semibold">Courier:</span>
          <span className="font-normal ml-0.5 capitalize">
            {sticker.courierName}
          </span>
        </div>

        <div className="flex items-center">
          <span className="font-semibold">Parcel ID:</span>
          <span className="font-normal ml-0.5 font-mono">
            {sticker.parcelId}
          </span>
        </div>

        {/* Customer Name & Number (Emphasized) */}
        <div className="pt-0.5 flex flex-col space-y-0.5">
          <div className="font-black text-black line-clamp-1">
            <span>Name: </span>
            <span className="uppercase">{sticker.customerName}</span>
          </div>

          <div className="font-black text-black font-mono">
            <span>Number: </span>
            <span>{sticker.customerPhone}</span>
          </div>
        </div>
      </div>

      {/* 3. Courier Barcode Container */}
      <div
        className="w-full border border-black rounded-xs bg-white flex flex-col items-center justify-center p-0.5 mt-0.5"
        style={{ borderWidth: "1.1px" }}
      >
        <span
          className="font-black uppercase tracking-wider text-black text-center leading-none mb-0.5"
          style={{ fontSize: "5.5pt" }}
        >
          COURIER BARCODE
        </span>
        <div className="w-full flex items-center justify-center overflow-hidden">
          <InvoiceBarcode
            value={sticker.consignmentId}
            width={1.3}
            height={20}
            displayValue={false}
            className="max-w-full h-[18px] object-contain"
          />
        </div>
        <span
          className="font-bold font-mono tracking-wider text-black text-center leading-none mt-0.5"
          style={{ fontSize: "5.5pt" }}
        >
          {sticker.consignmentId}
        </span>
      </div>

      {/* 4. Invoice Barcode Container */}
      <div
        className="w-full border border-black rounded-xs bg-white flex flex-col items-center justify-center p-0.5 mt-0.5"
        style={{ borderWidth: "1.1px" }}
      >
        <span
          className="font-black uppercase tracking-wider text-black text-center leading-none mb-0.5"
          style={{ fontSize: "5.5pt" }}
        >
          INVOICE BARCODE
        </span>
        <div className="w-full flex items-center justify-center overflow-hidden">
          <InvoiceBarcode
            value={sticker.invoiceId}
            width={1.3}
            height={20}
            displayValue={false}
            className="max-w-full h-[18px] object-contain"
          />
        </div>
        <span
          className="font-bold font-mono tracking-wider text-black text-center leading-none mt-0.5"
          style={{ fontSize: "5.5pt" }}
        >
          {sticker.invoiceId}
        </span>
      </div>

      {/* 5. COD Container */}
      <div
        className="w-full border-2 border-black rounded-sm bg-white flex items-center justify-center py-0.5 mt-0.5"
        style={{ borderWidth: "1.3px" }}
      >
        <span
          className="font-black tracking-wide text-black uppercase leading-none"
          style={{ fontSize: "7.8pt", fontWeight: 900 }}
        >
          COD {sticker.codAmount}
        </span>
      </div>
    </div>
  );
});
