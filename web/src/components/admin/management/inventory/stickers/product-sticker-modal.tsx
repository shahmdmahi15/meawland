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
import { Printer, Download, Loader2, Tag } from "lucide-react";
import { ProductStickerCard } from "./product-sticker-card";
import {
  extractStickersFromProducts,
  STICKER_DIMENSIONS,
} from "@/schemas/product-sticker";
import type { FullProduct } from "@/actions/admin/management/inventory/get-all-products";
import {
  generateAndDownloadStickersPdf,
  printThermalStickers,
} from "@/lib/product-sticker-generator";
import { toast } from "sonner";

interface ProductStickerModalProps {
  products: FullProduct[];
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}

export function ProductStickerModal({
  products,
  trigger,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen,
  title,
}: ProductStickerModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const [copies, setCopies] = useState<number>(1);
  const [isPrinting, startPrintTransition] = useTransition();
  const [isDownloading, startDownloadTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);

  // Generate stickers according to product type (variable -> 1 per variant; simple -> 1 per product)
  const stickers = useMemo(() => {
    return extractStickersFromProducts(products, Math.max(1, copies));
  }, [products, copies]);

  const totalUniqueItems = useMemo(() => {
    return products.reduce((acc, p) => {
      if (p.isVariable && p.variants && p.variants.length > 0) {
        return acc + p.variants.length;
      }
      return acc + 1;
    }, 0);
  }, [products]);

  const handlePrint = () => {
    if (!containerRef.current) return;

    startPrintTransition(async () => {
      try {
        toast.info(
          `Preparing ${stickers.length} barcode sticker(s) for 2" × 1" thermal printing...`,
        );
        await printThermalStickers({
          containerElement: containerRef.current!,
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to initialize thermal printing.");
      }
    });
  };

  const handleDownloadPdf = () => {
    if (!containerRef.current) return;

    startDownloadTransition(async () => {
      try {
        const count = stickers.length;
        const filename = `Product-Barcode-Stickers-2x1in-${count}pcs.pdf`;
        toast.info(`Generating ${count}-page thermal PDF (2" × 1")...`);

        const success = await generateAndDownloadStickersPdf({
          containerElement: containerRef.current!,
          filename,
        });

        if (success) {
          toast.success(`Downloaded ${filename} successfully!`);
        } else {
          toast.error("Failed to generate stickers PDF.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error occurred while generating PDF.");
      }
    });
  };

  const dialogTitle =
    title ||
    (products.length === 1
      ? `Print Barcode: ${products[0].name}`
      : `Bulk Print Barcode Stickers (${products.length} Products)`);

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
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Print Barcode</span>
            </Button>
          }
        />
      ) : null}

      <DialogContent className="sm:max-w-[840px] w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-muted/20">
        {/* Header */}
        <div className="bg-background border-b border-border p-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                {dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {totalUniqueItems} SKU item(s) • Total {stickers.length}{" "}
                label(s) (2" × 1" / 50.8mm × 25.4mm)
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
                  <span>Print Stickers ({stickers.length})</span>
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
                {STICKER_DIMENSIONS.label}
              </Badge>
            </div>

            {/* Copies Per Item */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                Copies / SKU:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 5, 10].map((qty) => (
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

          <div className="text-xs font-medium text-muted-foreground">
            {products.some((p) => p.isVariable) && (
              <span className="text-primary font-semibold">
                ✓ Variable products expanded to individual variant SKUs
              </span>
            )}
          </div>
        </div>

        {/* Sticker Preview Grid Viewport */}
        <div className="overflow-y-auto overflow-x-hidden p-6 flex-1 min-h-0 bg-neutral-100/70 dark:bg-muted/20">
          <div
            ref={containerRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center"
          >
            {stickers.map((sticker, idx) => (
              <div
                key={`${sticker.id}-${idx}`}
                className="transition-transform hover:scale-105 duration-150 flex flex-col items-center"
              >
                <ProductStickerCard sticker={sticker} />
                <span className="text-[10px] font-mono text-muted-foreground mt-1">
                  Label #{idx + 1} • {sticker.sku}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar for Mobile */}
        <div className="p-3 bg-background border-t border-border flex sm:hidden items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading || isPrinting}
            className="flex-1 text-xs"
          >
            Download PDF
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting || isDownloading}
            className="flex-1 text-xs bg-[#56C8D8] text-white"
          >
            Print ({stickers.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
