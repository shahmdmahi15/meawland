import { Hero } from "@/components/root/hero";
import { Categories } from "@/components/root/categories";
import { Products } from "@/components/root/products";
import { ComboDeals } from "@/components/root/combo-deals";
import { Reviews } from "@/components/root/reviews";
import { Bestsellers } from "@/components/root/bestsellers";
import { MiddleBanner } from "@/components/root/middle-banner";
import { PetPurpose } from "@/components/root/pet-purpose";
import { WhyBest } from "@/components/root/why-best";
import { FAQ } from "@/components/root/faq";
import { QualityFeatures } from "@/components/root/quality-features";
import { getSlidersAction } from "@/actions/root/store/sliders/get-all";
import { getProductsByBrandSlugAction } from "@/actions/store/products/get-by-brand";
import { getStoreComboProductsAction } from "@/actions/store/combo-products/get-all";
import { getStoreReviewsAction } from "@/actions/store/reviews/get-all";
import { getBestsellerProductsAction } from "@/actions/store/products/get-bestsellers";
import type { Metadata } from "next";
import { getProductsByPurposeAction } from "@/actions/store/products/get-by-purpose";

export const metadata: Metadata = {
  title: "Meawland | Premium Pet Care, Food, Toys & Royal Accessories",
  description:
    "Explore Bangladesh's #1 trusted pet shop for veterinary-grade kitten & cat food, anti-fungal hygiene, royal dresses, and engaging toys with doorstep delivery.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Meawland | Premium Pet Care, Food, Toys & Royal Accessories",
    description:
      "Explore Bangladesh's #1 trusted pet shop for veterinary-grade kitten & cat food, anti-fungal hygiene, royal dresses, and engaging toys with doorstep delivery.",
    url: "/",
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    slidersRes,
    meawlandRes,
    comboRes,
    reviewsRes,
    bestsellersRes,
    purposeRes,
  ] = await Promise.all([
    getSlidersAction(),
    getProductsByBrandSlugAction("meawland"),
    getStoreComboProductsAction(),
    getStoreReviewsAction(),
    getBestsellerProductsAction(),
    getProductsByPurposeAction(),
  ]);

  const sliders = slidersRes.sliders ?? [];
  const meawlandProducts = meawlandRes.products ?? [];
  const comboProducts = comboRes.combos ?? [];
  const customerReviews = reviewsRes.reviews ?? [];
  const bestsellerProducts = bestsellersRes.products ?? [];
  const purposeProducts = purposeRes.products ?? [];

  return (
    <>
      <Hero sliders={sliders} />

      <Categories />

      <Products products={meawlandProducts} />

      <ComboDeals combos={comboProducts} />

      <Reviews reviews={customerReviews} />

      <Bestsellers products={bestsellerProducts} />

      <MiddleBanner />

      <PetPurpose products={purposeProducts} />

      <WhyBest />

      <FAQ />

      <QualityFeatures />
    </>
  );
}
