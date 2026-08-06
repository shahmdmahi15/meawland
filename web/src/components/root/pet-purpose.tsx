"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PurposeItem {
  id: string;
  name: string;
  price: string;
  image: string;
  stockOut?: boolean;
}

const row1List: PurposeItem[] = [
  {
    id: "pur-1",
    name: "Luxury Shimmer Velvet Royal Gown",
    price: "999 tk",
    image: "/product-luxury-shimmer-gown.png",
  },
  {
    id: "pur-2",
    name: "Premium Lolita Vintage Pet Gown",
    price: "1099 tk",
    image: "/product-premium-lolita-gown.png",
  },
  {
    id: "pur-3",
    name: "Royal Vintage Pet Dress",
    price: "1199 tk",
    image: "/product-royal-vintage-dress.png",
  },
  {
    id: "pur-4",
    name: "Adorable Sunflower Cat Dress",
    price: "450 tk",
    image: "/product-sunflower-cat-dress.png",
    stockOut: true,
  },
  {
    id: "pur-5",
    name: "Fluffy Blossom Skirt",
    price: "350 tk",
    image: "/product-fluffy-blossom-skirt.png",
  },
];

const row2List: PurposeItem[] = [
  {
    id: "pur-6",
    name: "Floral Bow Cat Collar",
    price: "250 tk",
    image: "/product-floral-bow-collar.png",
  },
  {
    id: "pur-7",
    name: "Royal Love Charm Cat Collar",
    price: "320 tk",
    image: "/product-royal-love-collar.png",
    stockOut: true,
  },
  {
    id: "pur-8",
    name: "Heart Crystal Pearl Cat Collar",
    price: "199 tk",
    image: "/product-heart-crystal-collar.png",
  },
  {
    id: "pur-9",
    name: "Cute Crochet Pet Hat",
    price: "199 tk",
    image: "/product-crochet-pet-hat.png",
    stockOut: true,
  },
  {
    id: "pur-10",
    name: "The PoshKitty Harness",
    price: "990 tk",
    image: "/product-poshkitty-harness.png",
    stockOut: true,
  },
];

export function PetPurpose() {
  const [emblaRef1, emblaApi1] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const [emblaRef2, emblaApi2] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev1 = useCallback(() => {
    if (emblaApi1) emblaApi1.scrollPrev();
  }, [emblaApi1]);

  const scrollNext1 = useCallback(() => {
    if (emblaApi1) emblaApi1.scrollNext();
  }, [emblaApi1]);

  const scrollPrev2 = useCallback(() => {
    if (emblaApi2) emblaApi2.scrollPrev();
  }, [emblaApi2]);

  const scrollNext2 = useCallback(() => {
    if (emblaApi2) emblaApi2.scrollNext();
  }, [emblaApi2]);

  const renderCard = (item: PurposeItem) => (
    <div
      key={item.id}
      className="flex-none basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-0 flex justify-center"
    >
      <div className="w-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-lg transition-all group">
        {/* Image Box */}
        <div className="relative w-full h-56 sm:h-64 md:h-68 rounded-2xl bg-white p-3 border border-gray-100 flex items-center justify-center mb-5">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="320px"
            className="object-cover rounded-xl group-hover:scale-105 transition-transform"
          />
          {item.stockOut && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
              <Badge className="bg-black/80 text-white font-black text-xs sm:text-sm px-4 py-1.5 rounded-full border-0">
                Stock out
              </Badge>
            </div>
          )}
          <button
            className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md text-gray-500 hover:text-red-500 border border-gray-100 transition-colors cursor-pointer z-10"
            aria-label="Add to wishlist"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-black text-gray-900 line-clamp-2 min-h-[52px] flex items-center justify-center text-center mb-3 leading-snug">
          {item.name}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="text-base sm:text-xl text-gray-900 font-black">
            {item.price}
          </span>
        </div>

        {/* View Product Button */}
        <Link href={`/product/${item.id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full border-2 border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl py-3 px-5 transition-all shadow-xs cursor-pointer"
          >
            VIEW PRODUCT
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container max-w-[1440px] px-4 sm:px-6 md:px-8 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">
            Shop by Pet & Purpose
          </h2>
          <p className="text-[#56C8D8] font-black text-base sm:text-lg md:text-xl">
            Find What Fits Your Furry Friend
          </p>
        </div>

        {/* Row 1 Slider */}
        <div className="relative px-2 sm:px-6 md:px-10 mb-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev1}
            className="hidden sm:flex absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="overflow-hidden" ref={emblaRef1}>
            <div className="flex gap-6 sm:gap-8 py-3">
              {row1List.map(renderCard)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext1}
            className="hidden sm:flex absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Row 2 Slider */}
        <div className="relative px-2 sm:px-6 md:px-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev2}
            className="hidden sm:flex absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="overflow-hidden" ref={emblaRef2}>
            <div className="flex gap-6 sm:gap-8 py-3">
              {row2List.map(renderCard)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext2}
            className="hidden sm:flex absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md flex items-center justify-center cursor-pointer transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
