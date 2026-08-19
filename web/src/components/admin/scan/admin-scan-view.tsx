"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useTransition,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ScannerMode,
  BarcodeLookupResult,
  ScannedProductItem,
  ScannedVariantOption,
  POSCartItem,
} from "@/schemas/admin/scan";
import { lookupBarcodeAction } from "@/actions/admin/scan";
import { StockModifierCard } from "./stock-modifier-card";
import { OrderReturnCard } from "./order-return-card";
import { POSTerminalView } from "./pos-terminal-view";
import { scannerAudio } from "./scanner-audio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Scan,
  Boxes,
  RotateCcw,
  ShoppingCart,
  Search,
  X,
  Loader2,
  Clock,
  ExternalLink,
  User,
  Ticket,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentScanItem {
  barcode: string;
  timestamp: Date;
  entityType: string;
  label: string;
}

export function AdminScanView() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [mode, setMode] = useState<ScannerMode>("AUTO_DETECT");
  const [activeResult, setActiveResult] = useState<BarcodeLookupResult | null>(
    null,
  );
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([]);
  const [posCart, setPosCart] = useState<POSCartItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddToCart = useCallback((product: ScannedProductItem) => {
    setPosCart((prev) => {
      const existingIdx = prev.findIndex(
        (itm) =>
          itm.productId === product.id &&
          itm.variantId === product.variantId &&
          itm.comboProductId === (product.isCombo ? product.id : undefined),
      );

      const price =
        parseFloat(product.salePrice || product.regularPrice || "0") || 0;

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            variantId: product.variantId,
            comboProductId: product.isCombo ? product.id : undefined,
            isCombo: product.isCombo,
            productName: product.name,
            sku: product.sku,
            unitPrice: price,
            quantity: 1,
            thumbnail: product.thumbnail,
            variantLabel: product.isCombo
              ? "Combo Bundle"
              : product.variantLabel,
            availableVariants: product.availableVariants,
          },
        ];
      }
    });

    toast.success(`Added ${product.name} to POS Cart!`);
  }, []);

  const handleExecuteScan = useCallback(
    (codeToScan: string) => {
      const clean = codeToScan.trim();
      if (!clean) return;

      setBarcodeInput(clean);

      startTransition(async () => {
        const res = await lookupBarcodeAction(clean);
        if (res.success && res.result) {
          const result = res.result;
          setActiveResult(result);

          if (result.entityType === "NOT_FOUND") {
            scannerAudio.playErrorBuzz();
            toast.error(`No record found for barcode "${clean}".`);
          } else {
            scannerAudio.playSuccessBeep();
            toast.success(
              `Found ${result.entityType}: ${
                result.product?.name ||
                result.order?.code ||
                result.customer?.name ||
                result.ticket?.code
              }`,
            );

            // Add to recent scans log
            const label =
              result.product?.name ||
              result.order?.code ||
              result.customer?.name ||
              result.ticket?.code ||
              clean;

            setRecentScans((prev) => [
              {
                barcode: clean,
                timestamp: new Date(),
                entityType: result.entityType,
                label,
              },
              ...prev.slice(0, 14),
            ]);

            // If in POS Mode and product found, auto-add to cart
            if (mode === "POS_TERMINAL" && result.product) {
              handleAddToCart(result.product);
            }
          }
        } else {
          scannerAudio.playErrorBuzz();
          toast.error(res.message || "Barcode scan lookup failed.");
        }
      });
    },
    [mode, handleAddToCart],
  );

  // Auto-focus barcode input on mount and on mode change
  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  // Hardware USB Barcode Wedge Scanner Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e || typeof e.key !== "string") return;

      // Ignore if user is currently typing in another form input or textarea
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName;
      if (
        activeTag === "TEXTAREA" ||
        (activeTag === "INPUT" && activeElement !== inputRef.current)
      ) {
        return;
      }

      const currentTime = Date.now();
      const char = e.key;

      if (currentTime - lastKeyTime > 150) {
        buffer = "";
      }
      lastKeyTime = currentTime;

      if (char === "Enter") {
        if (buffer && buffer.length > 2) {
          handleExecuteScan(buffer);
          buffer = "";
        }
      } else if (char && char.length === 1) {
        buffer += char;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExecuteScan]);

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    setPosCart((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleUpdateCartVariant = (
    index: number,
    newVariant: ScannedVariantOption,
  ) => {
    setPosCart((prev) => {
      const updated = [...prev];
      const currentItem = updated[index];
      if (!currentItem) return prev;

      const price =
        parseFloat(newVariant.salePrice || newVariant.regularPrice || "0") || 0;

      // Check if another cart item already matches this variant
      const existingOtherIdx = updated.findIndex(
        (itm, idx) =>
          idx !== index &&
          itm.productId === currentItem.productId &&
          itm.variantId === newVariant.id,
      );

      if (existingOtherIdx >= 0) {
        // Merge quantities and remove duplicate row
        updated[existingOtherIdx].quantity += currentItem.quantity;
        return updated.filter((_, idx) => idx !== index);
      }

      updated[index] = {
        ...currentItem,
        variantId: newVariant.id,
        variantLabel: newVariant.label,
        sku: newVariant.sku,
        unitPrice: price,
        thumbnail: newVariant.thumbnail || currentItem.thumbnail,
      };
      return updated;
    });

    toast.success(`Switched variant to ${newVariant.label}`);
  };

  const handleRemoveCartItem = (index: number) => {
    setPosCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Scan className="w-6 h-6 text-[#56C8D8]" />
            <span>Barcode Scanner &amp; POS Operations Hub</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Scan hardware barcodes, modify warehouse stocks, process order
            returns, and run the in-store POS register.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setMode("AUTO_DETECT")}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
            mode === "AUTO_DETECT"
              ? "bg-[#EDF5FA] border-[#56C8D8] shadow-xs"
              : "bg-white border-gray-200 hover:bg-gray-50/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900">
              Omni / Auto-Detect
            </span>
            <Scan className="w-4 h-4 text-[#56C8D8]" />
          </div>
          <p className="text-[10px] text-gray-500 line-clamp-1">
            Auto-detects products, orders, users, tickets
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("STOCK_MODIFIER")}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
            mode === "STOCK_MODIFIER"
              ? "bg-[#EDF5FA] border-[#56C8D8] shadow-xs"
              : "bg-white border-gray-200 hover:bg-gray-50/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900">
              Stock Modifier
            </span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-[10px] text-gray-500 line-clamp-1">
            Restock, damage, and audit log events
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("ORDER_RETURNS")}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
            mode === "ORDER_RETURNS"
              ? "bg-[#EDF5FA] border-[#56C8D8] shadow-xs"
              : "bg-white border-gray-200 hover:bg-gray-50/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900">
              Orders &amp; Returns
            </span>
            <RotateCcw className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-[10px] text-gray-500 line-clamp-1">
            Invoice lookup and item-by-item returns
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode("POS_TERMINAL")}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
            mode === "POS_TERMINAL"
              ? "bg-[#EDF5FA] border-[#56C8D8] shadow-xs"
              : "bg-white border-gray-200 hover:bg-gray-50/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-gray-900">
              POS Terminal
            </span>
            <ShoppingCart className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-[10px] text-gray-500 line-clamp-1">
            In-store retail cart and instant checkout
          </p>
        </button>
      </div>

      {/* Main Barcode Scanner Input Bar */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteScan(barcodeInput);
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Scan className="w-5 h-5 text-[#56C8D8] absolute left-4 top-1/2 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or type barcode, SKU, Order Code (#MEAWORD-...), or Customer Phone..."
              className="pl-12 pr-10 h-13 rounded-2xl bg-gray-50/80 border-gray-200 text-sm font-mono placeholder:font-sans placeholder:text-gray-400 focus:bg-white transition-all shadow-inner"
            />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => {
                  setBarcodeInput("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending || !barcodeInput.trim()}
            className="h-13 px-6 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-xs sm:text-sm gap-2 cursor-pointer shadow-xs shrink-0"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>Scan / Lookup</span>
          </Button>
        </form>

        {/* Hardware scanner indicator badge */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Hardware USB wedge scanner listener active (Auto-Enter enabled)
            </span>
          </div>

          {recentScans.length > 0 && (
            <span className="text-gray-500">
              {recentScans.length} recent scan(s) in session
            </span>
          )}
        </div>
      </div>

      {/* POS Terminal Mode View */}
      {mode === "POS_TERMINAL" && (
        <POSTerminalView
          cart={posCart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onUpdateVariant={handleUpdateCartVariant}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={() => setPosCart([])}
        />
      )}

      {/* Active Scan Result Container */}
      {mode !== "POS_TERMINAL" && activeResult && (
        <div className="space-y-4">
          {activeResult.entityType === "PRODUCT" && activeResult.product && (
            <StockModifierCard
              product={activeResult.product}
              onAddToPOS={(prod) => {
                handleAddToCart(prod);
                setMode("POS_TERMINAL");
              }}
            />
          )}

          {activeResult.entityType === "ORDER" && activeResult.order && (
            <OrderReturnCard
              order={activeResult.order}
              onOrderUpdated={() => handleExecuteScan(activeResult.barcode)}
            />
          )}

          {activeResult.entityType === "CUSTOMER" && activeResult.customer && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                    {activeResult.customer.avatar ? (
                      <Image
                        src={activeResult.customer.avatar}
                        alt={activeResult.customer.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized={activeResult.customer.avatar.startsWith(
                          "data:",
                        )}
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">
                      {activeResult.customer.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-mono">
                      {activeResult.customer.code} •{" "}
                      {activeResult.customer.email} •{" "}
                      {activeResult.customer.phone}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/support-marketing/support/customers`}
                  className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200"
                >
                  <span>Customer 360 Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    District
                  </span>
                  <span className="font-bold text-gray-900">
                    {activeResult.customer.district || "Unassigned"}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    Total Orders
                  </span>
                  <span className="font-bold text-gray-900">
                    {activeResult.customer.totalOrders}
                  </span>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                    Lifetime Spend
                  </span>
                  <span className="font-black text-emerald-800">
                    ৳{activeResult.customer.lifetimeSpent.toFixed(2)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">
                    Role
                  </span>
                  <span className="font-bold text-gray-900">
                    {activeResult.customer.role}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeResult.entityType === "TICKET" && activeResult.ticket && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-[#56C8D8]" />
                  <div>
                    <h2 className="text-base font-black text-gray-900">
                      Support Ticket #{activeResult.ticket.code}
                    </h2>
                    <p className="text-xs text-gray-500">
                      From:{" "}
                      <span className="font-bold">
                        {activeResult.ticket.userName}
                      </span>{" "}
                      ({activeResult.ticket.userPhone})
                    </p>
                  </div>
                </div>

                <Link
                  href={`/admin/support-marketing/support/tickets`}
                  className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200"
                >
                  <span>Open Ticket Manager</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-gray-900">
                  {activeResult.ticket.subject}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {activeResult.ticket.message}
                </p>
              </div>
            </div>
          )}

          {activeResult.entityType === "NOT_FOUND" && (
            <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 text-center space-y-2">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">
                No Record Found for &quot;{activeResult.barcode}&quot;
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Check that the scanned code belongs to a valid Product SKU,
                Product Code, Order Invoice, Customer Code, or Support Ticket.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Scans Session Log */}
      {recentScans.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>Recent Scans in This Session</span>
            </h3>
            <button
              type="button"
              onClick={() => setRecentScans([])}
              className="text-[11px] text-gray-400 hover:text-gray-600 font-semibold"
            >
              Clear Log
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {recentScans.map((scan, idx) => (
              <button
                key={`${scan.barcode}-${idx}`}
                type="button"
                onClick={() => handleExecuteScan(scan.barcode)}
                className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-[#EDF5FA] border border-gray-200 hover:border-[#D4EEFC] rounded-xl px-3 py-1.5 text-xs text-gray-700 hover:text-[#0097a7] transition-all cursor-pointer"
              >
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 border-gray-300"
                >
                  {scan.entityType}
                </Badge>
                <span className="font-bold truncate max-w-[140px]">
                  {scan.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
