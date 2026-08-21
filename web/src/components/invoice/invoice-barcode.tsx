"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface InvoiceBarcodeProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export function InvoiceBarcode({
  value,
  width = 1.6,
  height = 36,
  displayValue = false,
  className,
}: InvoiceBarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          margin: 0,
          background: "transparent",
          lineColor: "#000000",
        });
      } catch (err) {
        console.error("Failed to generate barcode:", err);
      }
    }
  }, [value, width, height, displayValue]);

  return (
    <svg
      ref={svgRef}
      className={className}
      style={{ shapeRendering: "crispEdges" }}
    />
  );
}
