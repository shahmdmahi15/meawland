"use client";

import React, {
  useState,
  useRef,
  useTransition,
  useMemo,
  ReactNode,
  ReactElement,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Loader2, Truck, AlertCircle } from "lucide-react";
import { CourierStickerCard } from "./courier-sticker-card";
import {
  extractCourierStickersFromOrders,
  COURIER_STICKER_DIMENSIONS,
} from "@/schemas/courier-sticker";
import type { AdminOrder } from "@/actions/admin/management/orders/get-orders";
import {
  generateAndDownloadCourierStickersPdf,
  printThermalCourierStickers,
} from "@/lib/courier-sticker-generator";
import { toast } from "sonner";

interface CourierStickerModalProps {
  orders: AdminOrder[];
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}

export function CourierStickerModal({
  orders,
  trigger,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  title,
}: CourierStickerModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [copies, setCopies] = useState<number>(1);
  const [isPrinting, startPrintTransition] = useTransition();
  const [isDownloading, startDownloadTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);

  // Extract stickers from valid courier shipments
  const stickers = useMemo(() => {
    return extractCourierStickersFromOrders(orders, Math.max(1, copies));
  }, [orders, copies]);

  const nonCourierOrdersCount = useMemo(() => {
    return orders.filter(
      (o) =>
        !o.shipment ||
        (!o.shipment.consignmentId &&
          !o.shipment.trackingCode &&
          !o.shipment.status),
    ).length;
  }, [orders]);

  const handlePrint = () => {
    if (!containerRef.current || stickers.length === 0) return;

    startPrintTransition(async () => {
      try {
        toast.info(
          `Preparing ${stickers.length} courier sticker(s) for 2" × 3" thermal printing...`,
        );
        await printThermalCourierStickers({
          containerElement: containerRef.current!,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to initialize courier sticker printing.");
      }
    });
  };

  const handleDownloadPdf = () => {
    if (!containerRef.current || stickers.length === 0) return;

    startDownloadTransition(async () => {
      try {
        const count = stickers.length;
        const filename = `Courier-Barcode-Stickers-2x3in-${count}pcs.pdf`;
        toast.info(`Generating ${count}-page courier PDF (2" × 3")...`);

        const success = await generateAndDownloadCourierStickersPdf({
          containerElement: containerRef.current!,
          filename,
        });

        if (success) {
          toast.success(`Downloaded ${filename} successfully!`);
        } else {
          toast.error("Failed to generate courier stickers PDF.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error occurred while generating courier PDF.");
      }
    });
  };

  const dialogTitle =
    title ||
    (orders.length === 1
      ? `Print Courier Sticker: ${orders[0].code}`
      : `Bulk Print Courier Stickers (${stickers.length} Stickers)`);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <Truck className="w-3.5 h-3.5 text-primary" />
              <span>Courier Sticker</span>
            </Button>
          }
        />
      ) : null}

      <DialogContent className="sm:max-w-[840px] w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-muted/20">
        {/* Header */}
        <div className="bg-background border-b border-border p-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                {dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {stickers.length} courier parcel label(s) • Thermal size:{" "}
                {COURIER_STICKER_DIMENSIONS.label}
              </DialogDescription>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isDownloading || isPrinting || stickers.length === 0}
              className="h-9 px-3 text-xs font-semibold gap-1.5 hidden sm:inline-flex cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PDF</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting || isDownloading || stickers.length === 0}
              className="h-9 px-4 text-xs font-bold gap-1.5 bg-[#56C8D8] hover:bg-[#43B8C8] text-white shadow-xs cursor-pointer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Print...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print Courier Stickers ({stickers.length})</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="bg-muted/40 border-b border-border px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Exact Dimension Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                Size:
              </span>
              <Badge
                variant="outline"
                className="bg-background text-xs font-semibold px-2.5 py-1 rounded-lg"
              >
                {COURIER_STICKER_DIMENSIONS.label}
              </Badge>
            </div>

            {/* Copies Per Item */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                Copies / Parcel:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5].map((qty) => (
                  <Button
                    key={qty}
                    type="button"
                    variant={copies === qty ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCopies(qty)}
                    className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {qty}x
                  </Button>
                ))}
                <div className="w-16 ml-1">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={copies}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) setCopies(val);
                    }}
                    className="h-7 text-xs font-bold text-center px-1 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {nonCourierOrdersCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>
                {nonCourierOrdersCount} selected order(s) not yet sent to
                courier were skipped
              </span>
            </div>
          )}
        </div>

        {/* Sticker Preview Grid Viewport */}
        <div className="overflow-y-auto overflow-x-hidden p-6 flex-1 min-h-0 bg-neutral-100/70 dark:bg-muted/20">
          {stickers.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Truck className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <h3 className="font-bold text-sm text-foreground">
                No Courier Shipments Found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                None of the selected orders have been sent to Steadfast Courier
                yet. Send them to courier first to generate consignment tracking
                barcodes.
              </p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center"
            >
              {stickers.map((sticker, idx) => (
                <div
                  key={`${sticker.orderId}-${idx}`}
                  className="transition-transform hover:scale-102 duration-150 flex flex-col items-center"
                >
                  <CourierStickerCard sticker={sticker} />
                  <span className="text-[10px] font-mono text-muted-foreground mt-1.5">
                    Sticker #{idx + 1} • {sticker.invoiceId} (CID:{" "}
                    {sticker.consignmentId})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Bar for Mobile */}
        <div className="p-3 bg-background border-t border-border flex sm:hidden items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading || isPrinting || stickers.length === 0}
            className="flex-1 text-xs"
          >
            Download PDF
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting || isDownloading || stickers.length === 0}
            className="flex-1 text-xs bg-[#56C8D8] text-white"
          >
            Print ({stickers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
