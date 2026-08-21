"use client";

import React, { forwardRef } from "react";
import { InvoiceBarcode } from "./invoice-barcode";
import type { InvoiceData } from "@/schemas/invoice";
import { cn } from "@/lib/utils";

interface CustomInvoiceDocumentProps {
  data: InvoiceData;
  className?: string;
}

export const CustomInvoiceDocument = forwardRef<
  HTMLDivElement,
  CustomInvoiceDocumentProps
>(function CustomInvoiceDocument({ data, className }, ref) {
  return (
    <div
      ref={ref}
      data-invoice-root
      className={cn(
        "relative bg-white text-gray-900 font-sans shadow-sm overflow-hidden select-text",
        // Standard A4 dimensions in px (794px x 1123px @ 96 DPI)
        "w-[794px] min-h-[1123px] max-h-[1123px] h-[1123px] p-10 flex flex-col justify-between box-border",
        // Print-specific rules
        "print:shadow-none print:w-[210mm] print:h-[297mm] print:min-h-[297mm] print:max-h-[297mm] print:p-8 print:m-0",
        className,
      )}
      style={{
        boxSizing: "border-box",
      }}
    >
      {/* Background Watermark Illustration */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center opacity-85">
        <img
          src="/invoice-bg.svg"
          alt="Invoice Watermark"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content (Above Watermark) */}
      <div className="relative z-10 flex flex-col flex-1 justify-between">
        <div className="space-y-4">
          {/* Top Header Section */}
          <div className="flex items-start justify-between gap-4">
            {/* Left: Logo */}
            <div className="w-[120px] flex items-center justify-start">
              <img
                src="/logo.svg"
                alt="Meawland"
                className="w-24 h-auto object-contain max-h-20"
              />
            </div>

            {/* Center: Brand Info */}
            <div className="text-center space-y-0.5 flex-1">
              <h1 className="text-2xl font-black tracking-wider uppercase text-[#382b26] font-[family-name:var(--font-chewy),cursive]">
                {data.company.name}
              </h1>
              <p className="text-[11px] text-gray-700 font-medium">
                Mobile: {data.company.mobile}
              </p>
              <p className="text-[11px] text-gray-700 font-medium">
                Email: {data.company.email}
              </p>
              <p className="text-[11px] text-gray-700 font-medium">
                Web: {data.company.web}
              </p>
            </div>

            {/* Right: Barcode & Invoice Meta */}
            <div className="w-[170px] text-right space-y-1">
              <div className="flex justify-end">
                <InvoiceBarcode
                  value={data.invoiceCode}
                  width={1.4}
                  height={34}
                />
              </div>
              <div className="text-[12px] font-medium text-gray-800 leading-tight">
                <div>
                  Invoice :{" "}
                  <strong className="font-bold">{data.invoiceCode}</strong>
                </div>
                <div>
                  Date : <span>{data.formattedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Invoice Badge */}
          <div className="flex justify-center pt-1">
            <div className="bg-[#f0f4f8]/90 px-7 py-1 rounded-full border border-gray-200/80 shadow-2xs">
              <span className="text-sm font-bold text-gray-900 tracking-wide">
                Sales Invoice
              </span>
            </div>
          </div>

          {/* Customer & Address Information Grid */}
          <div className="grid grid-cols-2 gap-8 pt-2 text-[12px] leading-relaxed">
            {/* Left Column: Billing To */}
            <div className="space-y-1">
              <h3 className="font-black text-[14px] text-gray-900 mb-1">
                Billing To
              </h3>
              <p className="font-bold text-[13px] text-gray-900">
                {data.customer.name}
              </p>
              <p className="text-gray-800">
                Contact: <span>{data.customer.phone}</span>
              </p>
              <p className="text-gray-800 break-all">
                Client ID:{" "}
                <span className="font-mono text-[11px]">
                  {data.customer.clientId}
                </span>
              </p>
              <p className="text-gray-800">
                Traking ID:{" "}
                <span className="font-mono text-[11px]">
                  {data.customer.trackingId}
                </span>
              </p>
              <p className="text-gray-800 pt-0.5">
                Payment:{" "}
                <span className="font-semibold text-gray-900">
                  {data.paymentMethod === "COD"
                    ? "Cash On Delivery (COD)"
                    : data.paymentMethod === "BKASH"
                      ? "bKash Online Payment"
                      : data.paymentMethod}
                </span>{" "}
                <span className="text-[11px] font-bold text-gray-600 uppercase">
                  ({data.paymentStatus})
                </span>
                {data.trxID && (
                  <span className="block text-[11px] text-gray-500 font-mono">
                    TrxID: {data.trxID}
                  </span>
                )}
              </p>
            </div>

            {/* Right Column: Address & Notes */}
            <div className="space-y-1">
              <h3 className="font-black text-[14px] text-gray-900 mb-1">
                Address
              </h3>
              <p className="text-gray-800 leading-snug">
                {data.customer.address}
              </p>
              <p className="text-gray-800">
                District:{" "}
                <span className="font-semibold text-gray-900">
                  {data.customer.district || "Dhaka"}
                </span>
              </p>
              <p className="text-gray-800">
                Email: <span>{data.customer.email || "N/A"}</span>
              </p>
              {data.note && (
                <div className="mt-1.5 p-2 rounded-lg bg-gray-50/80 border border-gray-200/80 text-[11px] text-gray-700">
                  <span className="font-bold text-gray-900">Note: </span>
                  <span>{data.note}</span>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table & Financials */}
          <div className="pt-2">
            <table className="w-full text-[12px] border-collapse border border-gray-300">
              <thead>
                <tr className="border-b border-gray-300 font-bold text-gray-900 bg-gray-50/60">
                  <th className="py-1.5 px-2 border-r border-gray-300 text-center w-9">
                    #
                  </th>
                  <th className="py-1.5 px-3 border-r border-gray-300 text-left">
                    Description
                  </th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-center w-20">
                    Price
                  </th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-center w-14">
                    Qty
                  </th>
                  <th className="py-1.5 px-2 border-r border-gray-300 text-center w-16">
                    Dis
                  </th>
                  <th className="py-1.5 px-2 text-center w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className="border-b border-gray-300 text-gray-800 bg-white/70"
                  >
                    <td className="py-2 px-2 border-r border-gray-300 text-center font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-300 font-medium">
                      {item.name}
                    </td>
                    <td className="py-2 px-2 border-r border-gray-300 text-center font-mono">
                      {item.unitPrice}
                    </td>
                    <td className="py-2 px-2 border-r border-gray-300 text-center font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 border-r border-gray-300 text-center font-mono">
                      {item.discount > 0 ? item.discount : "-"}
                    </td>
                    <td className="py-2 px-2 text-center font-bold font-mono">
                      {item.total}
                    </td>
                  </tr>
                ))}

                {/* Sub Total */}
                <tr className="border-b border-gray-300 text-gray-900 font-semibold bg-gray-50/40">
                  <td
                    colSpan={5}
                    className="py-1.5 px-3 border-r border-gray-300 text-right font-bold"
                  >
                    Sub Total
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold font-mono">
                    {data.subTotal}
                  </td>
                </tr>

                {/* Discount */}
                {data.discountAmount > 0 && (
                  <tr className="border-b border-gray-300 text-gray-900 font-semibold bg-gray-50/40">
                    <td
                      colSpan={5}
                      className="py-1.5 px-3 border-r border-gray-300 text-right font-bold"
                    >
                      Discount
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold font-mono">
                      -{data.discountAmount}
                    </td>
                  </tr>
                )}

                {/* Delivery Charge */}
                <tr className="border-b border-gray-300 text-gray-900 font-semibold bg-gray-50/40">
                  <td
                    colSpan={5}
                    className="py-1.5 px-3 border-r border-gray-300 text-right font-bold"
                  >
                    Delivery Charge
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold font-mono">
                    {data.deliveryCharge}
                  </td>
                </tr>

                {/* Gross Total */}
                <tr className="border-b border-gray-300 text-gray-900 font-semibold bg-gray-50/60">
                  <td
                    colSpan={5}
                    className="py-1.5 px-3 border-r border-gray-300 text-right font-black"
                  >
                    Gross Total
                  </td>
                  <td className="py-1.5 px-2 text-center font-black font-mono">
                    {data.grossTotal}
                  </td>
                </tr>

                {/* Paid Amount */}
                <tr className="text-gray-900 font-semibold bg-gray-50/40">
                  <td
                    colSpan={5}
                    className="py-1.5 px-3 border-r border-gray-300 text-right font-bold"
                  >
                    Paid Amount
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold font-mono">
                    {data.paidAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount In Words Banner */}
          <div className="pt-2">
            <p className="text-[12px] font-bold text-gray-900 uppercase tracking-wide">
              Amount In Words: <span>{data.amountInWords}</span>
            </p>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-2 text-[11px] leading-snug">
            <h4 className="font-bold text-[12px] text-gray-900 mb-1">
              terms &amp; Conditions
            </h4>
            <ul className="space-y-0.5 text-gray-800 list-disc list-inside">
              <li>VAT &amp; Taxes are not included in the above price</li>
              <li>Sold products are not refundable</li>
              <li>Check parcel before accepting.</li>
              <li>No return/refund after delivery person leaves.</li>
              <li>Report any issue during delivery.</li>
              <li>Opened products are not returnable.</li>
              <li>Delivery charge is non-refundable.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});
