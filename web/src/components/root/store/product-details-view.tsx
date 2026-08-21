"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ProductDetailData,
  type ProductDetailVariant,
} from "@/actions/store/products/get-product-details";
import { ProductGallery } from "@/components/root/store/product-gallery";
import { VariantSelector } from "@/components/root/store/variant-selector";
import { ComboBundleView } from "@/components/root/store/combo-bundle-view";
import { useCart } from "@/context/cart-context";
import { toggleWishlistAction } from "@/actions/store/wishlist";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Plus,
  Minus,
  Star,
  ChevronRight,
  Flame,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AttributeType } from "@/generated/prisma/enums";
import { trackMetaPixelEvent, generateBrowserEventId } from "@/lib/meta-pixel";
import {
  trackMetaViewContentAction,
  trackMetaAddToCartAction,
  trackMetaAddToWishlistAction,
} from "@/actions/meta";

interface ProductDetailsViewProps {
  product: ProductDetailData;
  initialWishlisted?: boolean;
}

export function ProductDetailsView({
  product,
  initialWishlisted = false,
}: ProductDetailsViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  // Do NOT select any item initially for variable products
  const [selectedVariant, setSelectedVariant] =
    useState<ProductDetailVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [hasValidationError, setHasValidationError] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "usage" | "specs">(
    "description",
  );

  // Track ViewContent on initial product view (Browser Pixel + Server CAPI with shared Event ID)
  React.useEffect(() => {
    const eventId = generateBrowserEventId("vc");
    const priceVal = product.numericPrice || 0;
    const categoryTitle =
      product.categoryTitle || product.subCategoryName || "Pet Supplies";

    trackMetaPixelEvent(
      "ViewContent",
      {
        content_name: product.name,
        content_category: categoryTitle,
        content_ids: [product.sku || product.id],
        content_type: "product",
        value: priceVal,
        currency: "BDT",
      },
      eventId,
    );

    trackMetaViewContentAction({
      productId: product.id,
      productName: product.name,
      price: priceVal,
      category: categoryTitle,
      sku: product.sku,
      eventId,
    }).catch(() => {});
  }, [product.id]);

  const handleSelectOption = (type: AttributeType, optionName: string) => {
    const updated = {
      ...selectedAttributes,
      [type]: optionName,
    };
    setSelectedAttributes(updated);
    setHasValidationError(false);

    // Check if all groups matched
    const allSelected = product.attributeGroups.every((g) =>
      Boolean(updated[g.type]),
    );
    if (allSelected) {
      const matched = product.variants.find((v) => {
        return product.attributeGroups.every((g) => {
          const expected = updated[g.type];
          return v.attributes.some(
            (a) =>
              a.type === g.type &&
              a.name.toLowerCase() === expected.toLowerCase(),
          );
        });
      });
      setSelectedVariant(matched || null);
      setQuantity(1);
    } else if (product.attributeGroups.length === 1) {
      const matched = product.variants.find((v) =>
        v.attributes.some(
          (a) =>
            a.type === type &&
            a.name.toLowerCase() === optionName.toLowerCase(),
        ),
      );
      setSelectedVariant(matched || null);
      setQuantity(1);
    } else {
      setSelectedVariant(null);
    }
  };

  // Dynamic price & stock based on active variant or base product
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = selectedVariant
    ? selectedVariant.stock <= 0
    : product.isOutOfStock;

  const currentPrice = selectedVariant
    ? selectedVariant.salePrice
    : product.priceRange
      ? product.priceRange.formatted
      : product.price;

  const originalPrice = selectedVariant
    ? selectedVariant.numericOriginalPrice
      ? selectedVariant.regularPrice
      : undefined
    : product.originalPrice;

  const numericCurrentPrice = selectedVariant
    ? selectedVariant.numericPrice
    : product.numericPrice;

  const numericOriginalPrice = selectedVariant
    ? selectedVariant.numericOriginalPrice
    : product.numericOriginalPrice;

  const discountPercent =
    numericOriginalPrice && numericOriginalPrice > numericCurrentPrice
      ? Math.round(
          ((numericOriginalPrice - numericCurrentPrice) /
            numericOriginalPrice) *
            100,
        )
      : product.discountPercent;

  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  // Active gallery images: when unselected show product main image & gallery; when variant selected show variant image first
  const galleryImages = [
    ...(selectedVariant?.image ? [selectedVariant.image] : []),
    ...product.gallery,
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Stepper handlers
  const handleIncrease = () => {
    if (product.isVariable && !selectedVariant) {
      setHasValidationError(true);
      toast.info("Please select an option before choosing quantity.");
      return;
    }
    if (quantity < activeStock) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.info(
        product.itemType === "COMBO"
          ? `Maximum available bundle capacity (${activeStock}) reached.`
          : `Maximum stock limit (${activeStock}) reached.`,
      );
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Wishlist Toggle
  const handleToggleWishlist = async () => {
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    if (nextState) {
      const eventId = generateBrowserEventId("atw");
      const priceVal = numericCurrentPrice || product.numericPrice || 0;
      const categoryTitle =
        product.categoryTitle || product.subCategoryName || "Pet Supplies";

      trackMetaPixelEvent(
        "AddToWishlist",
        {
          content_name: product.name,
          content_category: categoryTitle,
          content_ids: [currentSku || product.id],
          content_type: "product",
          value: priceVal,
          currency: "BDT",
        },
        eventId,
      );

      trackMetaAddToWishlistAction({
        productId: product.id,
        productName: product.name,
        price: priceVal,
        category: categoryTitle,
        sku: currentSku,
        eventId,
      }).catch(() => {});
    }

    const res = await toggleWishlistAction(product.id);
    if (res.success) {
      toast.success(res.message);
    } else if (res.unauthorized) {
      setIsWishlisted(false);
      toast.error("Please login to save items to your wishlist.", {
        action: {
          label: "Login",
          onClick: () =>
            router.push(`/login?redirect=/product/${product.slug}`),
        },
      });
    } else {
      setIsWishlisted(initialWishlisted);
      toast.error(res.message || "Failed to update wishlist.");
    }
  };

  // Add to Cart with validation
  const handleAddToCart = async () => {
    if (product.isVariable && !selectedVariant) {
      setHasValidationError(true);
      toast.error(
        "Please select product options (Color / Size / Weight) before adding to bag.",
      );
      return;
    }

    if (isOutOfStock || activeStock <= 0) {
      toast.error(
        product.itemType === "COMBO"
          ? "This combo bundle is currently out of stock."
          : "This product is currently out of stock.",
      );
      return;
    }

    if (quantity > activeStock) {
      toast.error(
        product.itemType === "COMBO"
          ? `Only ${activeStock} bundle(s) available in stock.`
          : `Only ${activeStock} units available in stock.`,
      );
      return;
    }

    const eventId = generateBrowserEventId("atc");
    const priceVal = numericCurrentPrice || product.numericPrice || 0;
    const categoryTitle =
      product.categoryTitle || product.subCategoryName || "Pet Supplies";

    trackMetaPixelEvent(
      "AddToCart",
      {
        content_name: product.name,
        content_category: categoryTitle,
        content_ids: [currentSku || product.id],
        content_type: "product",
        value: priceVal * quantity,
        currency: "BDT",
        num_items: quantity,
      },
      eventId,
    );

    trackMetaAddToCartAction({
      productId: product.id,
      productName: product.name,
      price: priceVal,
      quantity,
      category: categoryTitle,
      sku: currentSku,
      eventId,
    }).catch(() => {});

    if (product.itemType === "COMBO") {
      await addToCart({ comboProductId: product.id, quantity }, true);
    } else if (selectedVariant) {
      await addToCart({ variantId: selectedVariant.id, quantity }, true);
    } else {
      await addToCart({ productId: product.id, quantity }, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
        <Link href="/" className="hover:text-[#56C8D8] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <Link
          href="/products"
          className="hover:text-[#56C8D8] transition-colors"
        >
          Shop
        </Link>
        {product.categorySlug && product.categoryTitle && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <Link
              href={`/category/${product.categorySlug}`}
              className="hover:text-[#56C8D8] transition-colors"
            >
              {product.categoryTitle}
            </Link>
          </>
        )}
        {product.categorySlug &&
          product.subCategorySlug &&
          product.subCategoryName && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <Link
                href={`/category/${product.categorySlug}/${product.subCategorySlug}`}
                className="hover:text-[#56C8D8] transition-colors"
              >
                {product.subCategoryName}
              </Link>
            </>
          )}
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Product Hero: 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <ProductGallery
            images={galleryImages}
            productName={product.name}
            isWishlisted={isWishlisted}
            onToggleWishlist={handleToggleWishlist}
            campaignBadge={product.campaignBadge}
            discountPercent={discountPercent}
            isOutOfStock={isOutOfStock}
          />
        </div>

        {/* Right Column: Information & Actions */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {product.brandName && (
                <span className="px-3 py-1 rounded-full bg-[#56C8D8]/15 text-[#56C8D8] font-black text-xs border border-[#56C8D8]/30">
                  {product.brandName}
                </span>
              )}
              {product.subCategoryName && (
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
                  {product.subCategoryName}
                </span>
              )}
              {product.itemType === "COMBO" && (
                <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-black text-xs border border-purple-200">
                  Bundle Deal
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Code / SKU / Rating summary */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-500 pt-1">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-gray-900 font-black">5.0</span>
                <span className="text-gray-400 font-medium">
                  (Verified Pet Care)
                </span>
              </div>
              <span>•</span>
              <span>
                SKU:{" "}
                <strong className="text-gray-800 uppercase">
                  {currentSku}
                </strong>
              </span>
              <span>•</span>
              <span>
                Code: <strong className="text-gray-800">{product.code}</strong>
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#F0F8FF]/80 border border-[#D4EEFC] flex items-center justify-between shadow-2xs">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {product.isVariable && !selectedVariant
                  ? "Price Range"
                  : "Special Online Price"}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-[#56C8D8]">
                  {currentPrice}
                </span>
                {originalPrice && (
                  <span className="text-sm sm:text-base font-bold text-gray-400 line-through">
                    {originalPrice}
                  </span>
                )}
              </div>
              {product.isVariable && !selectedVariant && (
                <p className="text-[11px] text-gray-500 font-medium">
                  Select an option below to view exact price
                </p>
              )}
            </div>

            {discountPercent && discountPercent > 0 && (
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs shadow-xs">
                  <Flame className="w-3.5 h-3.5" />
                  Save {discountPercent}%
                </span>
                <span className="text-[10px] text-gray-400 font-bold mt-1">
                  Limited Time Offer
                </span>
              </div>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Free Shipping Hint Bar */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Add{" "}
              <strong className="text-emerald-700">
                ৳{Math.max(0, 2000 - numericCurrentPrice)}
              </strong>{" "}
              more to cart for{" "}
              <strong className="text-emerald-700 underline">
                FREE Nationwide Delivery!
              </strong>
            </span>
          </div>

          {/* Multi-Variant Selector */}
          {product.isVariable && product.variants.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              selectedAttributes={selectedAttributes}
              onSelectOption={handleSelectOption}
              attributeGroups={product.attributeGroups}
              hasValidationError={hasValidationError}
            />
          )}

          {/* Combo Bundle Preview */}
          {product.itemType === "COMBO" && (
            <ComboBundleView comboProducts={product.comboProducts} />
          )}

          {/* Stock Status */}
          <div className="flex items-center gap-2 text-xs font-bold">
            {isOutOfStock ? (
              <span className="text-rose-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Currently Out of Stock
              </span>
            ) : product.isVariable && !selectedVariant ? (
              <span className="text-gray-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#56C8D8]" />
                {activeStock} units available across all options
              </span>
            ) : activeStock <= 5 ? (
              <span className="text-amber-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Hurry! Only {activeStock} left in stock
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                In Stock ({activeStock} units available)
              </span>
            )}
          </div>

          {/* Actions: Stepper + Add to Cart */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center justify-between sm:justify-center bg-white rounded-2xl border-2 border-gray-200 p-1 shadow-2xs h-12 shrink-0">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || isOutOfStock || activeStock <= 0}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-black text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={
                    quantity >= activeStock || isOutOfStock || activeStock <= 0
                  }
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
                  aria-label="Increase quantity"
                  title={
                    quantity >= activeStock ? "Max stock reached" : undefined
                  }
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock || activeStock <= 0}
                className="flex-1 h-12 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {isOutOfStock || activeStock <= 0
                    ? "Currently Out of Stock"
                    : "Add to Shopping Bag"}
                </span>
              </Button>
            </div>
          </div>

          {/* Guarantee Badges Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-[#56C8D8] shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Fast Delivery</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Nationwide 24-72h
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">100% Genuine</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Authentic Pet Care
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
              <RotateCcw className="w-5 h-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">7 Days Return</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Hassle-Free Exchange
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center gap-2.5">
              <Headphones className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">Pet Helpline</p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Dedicated Support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section: Description, Usage/Ingredients, Specifications */}
      <div className="pt-8 border-t border-[#D4EEFC]">
        <div className="flex items-center gap-3 border-b border-[#D4EEFC] pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === "description"
                ? "bg-[#56C8D8] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Features &amp; Compatibility
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("usage")}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === "usage"
                ? "bg-[#56C8D8] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Usage &amp; Pet Care Guidelines
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === "specs"
                ? "bg-[#56C8D8] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Product Specifications
          </button>
        </div>

        {/* Tab Contents */}
        <div className="py-6">
          {activeTab === "description" && (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed font-medium bg-[#F0F8FF]/40 rounded-3xl p-6 sm:p-8 border border-[#D4EEFC]">
              <div
                dangerouslySetInnerHTML={{
                  __html:
                    product.longDescription ||
                    product.shortDescription ||
                    "<p>No description provided for this product.</p>",
                }}
              />
            </div>
          )}

          {activeTab === "usage" && (
            <div className="bg-[#F0F8FF]/40 rounded-3xl p-6 sm:p-8 border border-[#D4EEFC] space-y-4">
              <h3 className="text-base font-black text-gray-900">
                Safe Application &amp; Usage Steps
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-700 font-medium list-disc list-inside">
                <li>
                  Use clean, warm water to fully moisten your pet&apos;s fur.
                </li>
                <li>
                  Apply an appropriate amount of the product evenly over the
                  pet&apos;s body.
                </li>
                <li>
                  Gently massage into the coat for 3 to 5 minutes, allowing
                  active ingredients to nourish the skin.
                </li>
                <li>
                  Rinse thoroughly with clean, warm water and dry your pet with
                  a clean towel.
                </li>
                <li>Store in a cool, dry place away from direct sunlight.</li>
              </ul>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="bg-[#F0F8FF]/40 rounded-3xl p-6 sm:p-8 border border-[#D4EEFC]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">
                    Product Brand
                  </span>
                  <span className="font-bold text-gray-900">
                    {product.brandName || "Meawland Original"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Category</span>
                  <span className="font-bold text-gray-900">
                    {product.categoryTitle || "Pet Supplies"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">
                    Sub Category
                  </span>
                  <span className="font-bold text-gray-900">
                    {product.subCategoryName || "General Care"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">SKU</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {currentSku}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">Item Code</span>
                  <span className="font-bold text-gray-900">
                    {product.code}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500 font-medium">
                    Available Stock
                  </span>
                  <span className="font-bold text-gray-900">
                    {activeStock} Units
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel / Grid */}
      {product.relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-[#D4EEFC] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Related Products
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Pet parents also loved these essentials
              </p>
            </div>
            <Link
              href={
                product.categorySlug
                  ? `/category/${product.categorySlug}`
                  : "/products"
              }
              className="text-xs font-bold text-[#56C8D8] hover:underline"
            >
              View More &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {product.relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                href={`/product/${rp.slug}`}
                className="bg-[#F0F8FF] border border-[#D4EEFC] rounded-2xl sm:rounded-3xl p-3 sm:p-4 flex flex-col justify-between items-center text-center shadow-2xs hover:shadow-lg transition-all duration-300 hover:border-[#56C8D8]/50 group"
              >
                <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-white p-2 border border-gray-100 flex items-center justify-center mb-3 overflow-hidden">
                  <Image
                    src={rp.image}
                    alt={rp.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain p-2 group-hover:scale-108 transition-transform duration-300"
                    unoptimized={rp.image.startsWith("data:")}
                  />
                  {rp.campaignBadge && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-[8px] px-1.5 py-0.5 shadow-xs">
                        <Sparkles className="w-2 h-2" />
                        <span className="truncate max-w-[80px]">
                          {rp.campaignBadge.badgeText}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-1">
                  {rp.subCategoryName && (
                    <p className="text-[10px] font-bold text-[#56C8D8] truncate">
                      {rp.subCategoryName}
                    </p>
                  )}
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#56C8D8] transition-colors line-clamp-2 min-h-8">
                    {rp.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    {rp.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {rp.originalPrice}
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-black text-gray-900">
                      {rp.price}
                    </span>
                  </div>
                </div>

                <div className="w-full mt-3">
                  <div className="w-full py-1.5 rounded-xl border border-[#56C8D8] text-[#56C8D8] group-hover:bg-[#56C8D8] group-hover:text-white font-bold text-[10px] sm:text-xs transition-colors">
                    View Product
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
