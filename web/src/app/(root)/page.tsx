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

export default async function Home() {
  const slidersRes = await getSlidersAction();
  const sliders = slidersRes.sliders ?? [];

  return (
    <>
      <Hero sliders={sliders} />

      <Categories />

      <Products />

      <ComboDeals />

      <Reviews />

      <Bestsellers />

      <MiddleBanner />

      <PetPurpose />

      <WhyBest />

      <FAQ />

      <QualityFeatures />
    </>
  );
}
