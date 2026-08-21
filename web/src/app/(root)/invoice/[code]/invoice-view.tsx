"use client";

import React, { useRef, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomInvoiceDocument } from "@/components/invoice/custom-invoice-document";
import {
  generateAndDownloadInvoicePdf,
  printInvoiceDocument,
} from "@/lib/invoice-pdf-generator";
import type { InvoiceData } from "@/schemas/invoice";
import {
  Download,
  Printer,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface StandaloneInvoiceViewProps {
  invoiceData: InvoiceData;
}

export function StandaloneInvoiceView({
  invoiceData,
}: StandaloneInvoiceViewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isPrinting, startPrintTransition] = useTransition();

  const handleDownloadPdf = () => {
    if (!invoiceRef.current) return;

    startDownloadTransition(async () => {
      const filename = `Invoice-${invoiceData.invoiceCode}.pdf`;
      toast.info("Generating invoice PDF...");
      const success = await generateAndDownloadInvoicePdf({
        element: invoiceRef.current!,
        filename,
      });

      if (success) {
        toast.success(`Downloaded ${filename} successfully!`);
      } else {
        toast.error("Failed to generate PDF file.");
      }
    });
  };

  const handlePrint = () => {
    if (invoiceRef.current) {
      startPrintTransition(async () => {
        toast.info("Preparing high-resolution print...");
        await printInvoiceDocument(invoiceRef.current!);
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 py-6 sm:py-10 px-4 flex flex-col items-center justify-start print:bg-white print:p-0">
      {/* Top Floating Control Bar (Hidden on print) */}
      <div className="w-full max-w-[794px] mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting}
            className="h-9 px-4 text-xs font-semibold gap-1.5"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>Print Invoice</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="h-9 px-5 text-xs font-bold gap-1.5 bg-[#56C8D8] hover:bg-[#43B8C8] text-white shadow-xs"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Invoice Document Canvas */}
      <div className="shadow-2xl rounded-sm overflow-hidden border border-gray-300 print:shadow-none print:border-none">
        <CustomInvoiceDocument ref={invoiceRef} data={invoiceData} />
      </div>
    </div>
  );
}
