"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Trash2,
  ShoppingCart,
  Sparkles,
  Flame,
  Layers3,
  Package,
  ShoppingBag,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  removeFromWishlistAction,
  clearWishlistAction,
  type WishlistProductItem,
} from "@/actions/store/wishlist";
import { useCart } from "@/context/cart-context";

interface WishlistViewProps {
  initialProducts?: WishlistProductItem[];
  unauthorized?: boolean;
  isAccountPage?: boolean;
}

export function WishlistView({
  initialProducts = [],
  unauthorized = false,
  isAccountPage = false,
}: WishlistViewProps) {
  const [products, setProducts] =
    useState<WishlistProductItem[]>(initialProducts);
  const [isPending, startTransition] = useTransition();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const { addToCart } = useCart();

  const handleRemove = (productId: string, productName: string) => {
    // Optimistic update
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    startTransition(async () => {
      const res = await removeFromWishlistAction(productId);
      if (res.success) {
        toast.info(`Removed ${productName} from wishlist`);
      } else {
        toast.error(res.message || "Failed to remove item");
        // Revert on error
        setProducts(initialProducts);
      }
    });
  };

  const handleConfirmClearAll = () => {
    if (products.length === 0) return;
    setClearDialogOpen(false);
    setProducts([]);

    startTransition(async () => {
      const res = await clearWishlistAction();
      if (res.success) {
        toast.info("Your wishlist has been cleared");
      } else {
        toast.error(res.message || "Failed to clear wishlist");
        setProducts(initialProducts);
      }
    });
  };

  // Unauthorized State
  if (unauthorized) {
    return (
      <div className="min-h-[45vh] flex flex-col items-center justify-center text-center px-4 py-8 sm:py-16">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-4">
          <Image
            src="/empty-cat.gif"
            alt="Sign in required"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          Sign In to Access Your Wishlist
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6 font-medium">
          Create an account or log in to sync your favorite pet items across all
          your devices and never lose track of what your furry friend loves!
        </p>
        <Link href="/login?redirect=/wishlist">
          <Button className="h-11 px-8 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-105">
            <LogIn className="w-4 h-4" />
            Log In / Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  // Empty State
  if (products.length === 0) {
    return (
      <div className="min-h-[45vh] flex flex-col items-center justify-center text-center px-4 py-8 sm:py-16">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 mb-4">
          <Image
            src="/empty-cat.gif"
            alt="Empty Wishlist"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          Your Wishlist is Empty
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6 font-medium">
          Explore our pet essentials, nutrition, handcrafted fashion, and
          grooming care. Tap the heart on any product to save it here!
        </p>
        <Link href="/products">
          <Button className="h-11 px-8 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-105">
            <ShoppingBag className="w-4 h-4" />
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D4EEFC] mb-6 sm:mb-8">
        <div>
          {isAccountPage ? (
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Heart className="h-5 w-5 fill-rose-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                My Saved Wishlist
              </h1>
              <Badge className="bg-[#56C8D8] hover:bg-[#56C8D8] text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                {products.length} {products.length === 1 ? "Item" : "Items"}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600">
              <span>Showing</span>
              <Badge className="bg-[#56C8D8] text-white text-xs font-black px-2 py-0.5 rounded-full">
                {products.length}{" "}
                {products.length === 1 ? "Product" : "Products"}
              </Badge>
              <span>saved for later</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            disabled={isPending || products.length === 0}
            className="text-xs font-semibold text-gray-600 hover:text-destructive hover:border-destructive/40 rounded-full h-9 px-4 gap-1.5 cursor-pointer transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Wishlist
          </Button>

          <Link href="/products">
            <Button
              size="sm"
              className="text-xs font-bold bg-[#56C8D8] hover:bg-[#45B0BF] text-white rounded-full h-9 px-4 gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-105"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      {/* Wishlist Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {products.map((product) => {
          const productSlug = product.slug || product.id;
          return (
            <div
              key={product.id}
              className="w-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-xl transition-all duration-300 hover:border-[#56C8D8]/50 group"
            >
              {/* Product Image Frame */}
              <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-white p-2 sm:p-3 border border-gray-100 flex items-center justify-center mb-3 overflow-hidden group-hover:border-[#56C8D8]/30 transition-all shadow-xs">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-contain p-2 group-hover:scale-108 transition-transform duration-500"
                    unoptimized={product.image.startsWith("data:")}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300 p-2">
                    <Package className="w-10 h-10 stroke-1 mb-1" />
                    <span className="text-[10px] text-gray-400">Meawland</span>
                  </div>
                )}

                {/* Badges Stack */}
                <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1 z-10">
                  {product.campaignBadge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-extrabold text-[8px] sm:text-[9px] px-2 py-0.5 shadow-xs uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate max-w-[120px]">
                        {product.campaignBadge.badgeText}
                      </span>
                    </span>
                  )}
                  {product.discountPercent &&
                    product.discountPercent > 0 &&
                    !product.campaignBadge && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 shadow-xs uppercase tracking-wider">
                        <Flame className="h-2.5 w-2.5" />
                        {product.discountPercent}% OFF
                      </span>
                    )}
                  {product.isVariable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white font-bold text-[8px] px-2 py-0.5 shadow-xs">
                      <Layers3 className="h-2.5 w-2.5" />
                      Variants
                    </span>
                  )}
                </div>

                {/* Stock Out Overlay */}
                {product.isStockOut && (
                  <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-20">
                    <Badge className="bg-black/90 text-white font-black text-xs px-3.5 py-1 rounded-full border-0 shadow-md uppercase tracking-wider">
                      Stock Out
                    </Badge>
                  </div>
                )}

                {/* Remove Wishlist Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(product.id, product.name)}
                  className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/95 backdrop-blur-xs shadow-xs border border-gray-100 text-rose-500 hover:bg-rose-50 hover:scale-110 transition-all cursor-pointer z-10"
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Category / Subcategory Label */}
              {product.subCategoryName && (
                <p className="text-[11px] font-semibold text-[#56C8D8] truncate max-w-[180px] mb-1">
                  {product.subCategoryName}
                </p>
              )}

              {/* Title */}
              <Link href={`/product/${productSlug}`} className="w-full">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#56C8D8] transition-colors line-clamp-2 min-h-10 leading-snug">
                  {product.name}
                </h3>
              </Link>

              {/* Price & Stock */}
              <div className="w-full flex items-center justify-center gap-2 mt-2">
                {product.originalPrice && (
                  <span className="text-[11px] font-semibold text-gray-400 line-through">
                    {product.originalPrice}
                  </span>
                )}
                <span className="text-sm sm:text-base font-black text-gray-900">
                  {product.price}
                </span>
              </div>

              {/* CTA Action Button */}
              <div className="w-full mt-3">
                {product.isStockOut ? (
                  <Button
                    size="sm"
                    disabled
                    className="w-full h-8.5 rounded-xl bg-gray-200 text-gray-400 text-xs font-bold shadow-none"
                  >
                    Out of Stock
                  </Button>
                ) : product.isVariable ? (
                  <Link
                    href={`/product/${productSlug}`}
                    className="block w-full"
                  >
                    <Button
                      size="sm"
                      className="w-full h-8.5 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white text-xs font-bold shadow-xs gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Select Options
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      addToCart({ productId: product.id, quantity: 1 }, true)
                    }
                    className="w-full h-8.5 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white text-xs font-bold shadow-xs gap-1.5 cursor-pointer transition-transform active:scale-95"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Bag
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear Wishlist Confirmation AlertDialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 className="w-5 h-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Clear your entire wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all {products.length} saved{" "}
              {products.length === 1 ? "item" : "items"}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmClearAll}
            >
              Clear Wishlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
