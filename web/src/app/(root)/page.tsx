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

export default function Home() {
  return (
    <>
      <Hero />

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
