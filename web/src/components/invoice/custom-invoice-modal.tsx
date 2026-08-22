"use client";

import React, {
  useState,
  useRef,
  useTransition,
  ReactNode,
  ReactElement,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2, Receipt, FileText } from "lucide-react";
import { CustomInvoiceDocument } from "./custom-invoice-document";
import {
  generateAndDownloadInvoicePdf,
  printInvoiceDocument,
} from "@/lib/invoice-pdf-generator";
import { getOrderInvoiceDataAction } from "@/actions/invoice/get-invoice-data";
import type { InvoiceData } from "@/schemas/invoice";
import { toast } from "sonner";

interface CustomInvoiceModalProps {
  orderCode?: string;
  initialInvoiceData?: InvoiceData | null;
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoDownloadOnOpen?: boolean;
}

export function CustomInvoiceModal({
  orderCode = "",
  initialInvoiceData = null,
  trigger,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  autoDownloadOnOpen = false,
}: CustomInvoiceModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(
    initialInvoiceData,
  );
  const [isLoading, startFetchTransition] = useTransition();
  const [isDownloading, startDownloadTransition] = useTransition();
  const [isPrinting, startPrintTransition] = useTransition();

  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  const fetchInvoice = (code: string) => {
    if (!code) return;
    startFetchTransition(async () => {
      const res = await getOrderInvoiceDataAction(code);
      if (res.success && res.data) {
        setInvoiceData(res.data);
      } else {
        toast.error(res.message || "Failed to load invoice data.");
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      if (!invoiceData && orderCode) {
        fetchInvoice(orderCode);
      }
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceContainerRef.current) {
      toast.error("Invoice document is not ready for export.");
      return;
    }

    startDownloadTransition(async () => {
      try {
        const code = invoiceData?.invoiceCode || orderCode || "Meawland";
        const filename = `Invoice-${code}.pdf`;

        toast.info("Generating high-resolution invoice PDF...");
        const success = await generateAndDownloadInvoicePdf({
          element: invoiceContainerRef.current!,
          filename,
        });

        if (success) {
          toast.success(`Downloaded ${filename} successfully!`);
        } else {
          toast.error("Failed to generate PDF. You can try printing instead.");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred during PDF generation.");
      }
    });
  };

  const handlePrint = () => {
    if (invoiceContainerRef.current) {
      startPrintTransition(async () => {
        toast.info("Preparing high-resolution print...");
        await printInvoiceDocument(invoiceContainerRef.current!);
      });
    } else {
      window.print();
    }
  };

  const currentCode = invoiceData?.invoiceCode || orderCode;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger render={trigger as ReactElement} />
      ) : controlledOpen === undefined ? (
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Invoice</span>
            </Button>
          }
        />
      ) : null}

      <DialogContent className="sm:max-w-[860px] w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-muted/20">
        {/* Top Actions Bar (Hidden on window.print) */}
        <div className="bg-background border-b border-border p-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground">
                Official Sales Invoice
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Order #{currentCode} • Ready for download &amp; print
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isLoading || isPrinting || !invoiceData}
              className="h-9 px-3 text-xs font-semibold gap-1.5 hidden sm:inline-flex"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Print</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isLoading || isDownloading || !invoiceData}
              className="h-9 px-4 text-xs font-bold gap-1.5 bg-[#56C8D8] hover:bg-[#43B8C8] text-white shadow-xs"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
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

        {/* Invoice Viewport (Scalable preview container) */}
        <div className="overflow-y-auto overflow-x-auto p-4 sm:p-6 flex justify-center items-start flex-1 min-h-0 bg-muted/40">
          {isLoading && !invoiceData ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-semibold">
                Generating custom invoice...
              </p>
            </div>
          ) : !invoiceData ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-sm text-foreground">
                Invoice data could not be loaded.
              </p>
              <Button size="sm" onClick={() => fetchInvoice(orderCode)}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="shadow-2xl rounded-sm overflow-hidden border border-gray-300 transform scale-90 sm:scale-100 origin-top transition-transform">
              <CustomInvoiceDocument
                ref={invoiceContainerRef}
                data={invoiceData}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
