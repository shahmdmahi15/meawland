"use client";

import React, { forwardRef } from "react";
import { InvoiceBarcode } from "@/components/invoice/invoice-barcode";
import type { ProductStickerItem } from "@/schemas/product-sticker";
import { cn } from "@/lib/utils";

interface ProductStickerCardProps {
  sticker: ProductStickerItem;
  className?: string;
}

export const ProductStickerCard = forwardRef<
  HTMLDivElement,
  ProductStickerCardProps
>(function ProductStickerCard({ sticker, className }, ref) {
  return (
    <div
      ref={ref}
      data-thermal-sticker
      className={cn(
        "bg-white text-black font-sans relative flex flex-col justify-between items-center text-center select-none overflow-hidden box-border",
        "border border-black/80 print:border-none",
        className,
      )}
      style={{
        width: "2in",
        height: "1in",
        minWidth: "2in",
        minHeight: "1in",
        maxWidth: "2in",
        maxHeight: "1in",
        padding: "1.2mm 1.6mm 1mm 1.6mm",
        boxSizing: "border-box",
        pageBreakAfter: "always",
        pageBreakInside: "avoid",
        WebkitFontSmoothing: "antialiased",
        textRendering: "geometricPrecision",
        backgroundColor: "#ffffff",
        color: "#000000",
      }}
    >
      {/* Header Info: Product Name & Attributes (Pure Black for Crisp Thermal Burn) */}
      <div className="w-full flex flex-col items-center justify-center space-y-0.5 overflow-hidden">
        <h2
          className="font-black text-black leading-tight tracking-tight uppercase line-clamp-1 w-full text-center"
          style={{
            fontSize: "7.2pt",
            color: "#000000",
            fontWeight: 900,
          }}
          title={sticker.title}
        >
          {sticker.title}
        </h2>

        {sticker.subtitle && (
          <p
            className="font-bold text-black leading-none tracking-normal line-clamp-1"
            style={{
              fontSize: "6pt",
              color: "#000000",
              fontWeight: 700,
            }}
          >
            {sticker.subtitle}
          </p>
        )}
      </div>

      {/* Price Pill Box */}
      <div className="my-0.5">
        <div
          className="border-2 border-black rounded-full bg-white flex items-center justify-center"
          style={{
            borderWidth: "1.2px",
            borderColor: "#000000",
            padding: "0.2mm 2.2mm",
          }}
        >
          <span
            className="font-black tracking-tight text-black"
            style={{
              fontSize: "6.8pt",
              color: "#000000",
              fontWeight: 900,
            }}
          >
            Price : {sticker.price}
          </span>
        </div>
      </div>

      {/* Barcode Dashed Container */}
      <div
        className="w-full flex flex-col items-center justify-center border border-dashed border-black rounded-xs bg-white overflow-hidden"
        style={{
          borderWidth: "1px",
          borderColor: "#000000",
          padding: "0.4mm 1mm 0.4mm 1mm",
        }}
      >
        <div className="w-full flex items-center justify-center overflow-hidden">
          <InvoiceBarcode
            value={sticker.barcodeValue || sticker.sku}
            width={1.35}
            height={22}
            displayValue={false}
            className="max-w-full h-[19px] object-contain"
          />
        </div>
        <span
          className="font-black font-mono tracking-widest text-black mt-0.5 leading-none"
          style={{
            fontSize: "5.8pt",
            color: "#000000",
            fontWeight: 800,
          }}
        >
          {sticker.sku}
        </span>
      </div>
    </div>
  );
});
