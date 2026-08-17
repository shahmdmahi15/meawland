import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getProductDetailsAction } from "@/actions/store/products/get-product-details";
import { getWishlistProductIdsAction } from "@/actions/store/wishlist";
import { ProductDetailsView } from "@/components/root/store/product-details-view";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductDetailsAction(slug);

  if (!result.success || !result.product) {
    return {
      title: "Product Not Found | Meawland Pet Store",
      description: "The requested pet product could not be found.",
    };
  }

  const p = result.product;
  const description =
    p.shortDescription ||
    `Buy ${p.name} at Meawland with fast nationwide delivery in Bangladesh. 100% authentic pet supplies.`;

  return {
    title: `${p.name} | Meawland Pet Store`,
    description,
    alternates: {
      canonical: `/product/${slug}`,
    },
    openGraph: {
      title: `${p.name} – Meawland`,
      description,
      url: `/product/${slug}`,
      images: p.image ? [{ url: p.image }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [productRes, wishlistIds] = await Promise.all([
    getProductDetailsAction(slug),
    getWishlistProductIdsAction(),
  ]);

  if (!productRes.success || !productRes.product) {
    return (
      <main className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="relative w-44 h-44 mb-6">
          <Image
            src="/not-found-cat.gif"
            alt="Product Not Found"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
          Product Not Found
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-8 font-medium">
          We couldn&apos;t find the product you were looking for. It might have
          been removed, renamed, or is currently unavailable.
        </p>
        <Link href="/products">
          <Button className="h-11 px-8 rounded-full bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs sm:text-sm shadow-md gap-2 cursor-pointer">
            <ShoppingBag className="w-4 h-4" />
            Explore All Products
          </Button>
        </Link>
      </main>
    );
  }

  const isWishlisted = wishlistIds.includes(productRes.product.id);

  return (
    <main className="min-h-screen bg-white pb-20 pt-20 sm:pt-24 md:pt-28">
      <ProductDetailsView
        product={productRes.product}
        initialWishlisted={isWishlisted}
      />
    </main>
  );
}
