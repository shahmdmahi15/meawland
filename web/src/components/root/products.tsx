"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ProductItem {
  id: string;
  name: string;
  originalPrice: string;
  price: string;
  image: string;
  stockOut?: boolean;
}

const productList: ProductItem[] = [
  {
    id: "p1",
    name: "DermaPaws Anti-Fungal Shower Gel",
    originalPrice: "499 tk",
    price: "499 tk",
    image: "/product-dermapaws-shower-gel.png",
  },
  {
    id: "p2",
    name: "Flea Free Meaw Shower Gel",
    originalPrice: "499 tk",
    price: "499 tk",
    image: "/product-flea-free-shower-gel.png",
  },
  {
    id: "p3",
    name: "Pet Glow Anti-Shed Shower Gel",
    originalPrice: "499 tk",
    price: "499 tk",
    image: "/product-pet-glow-shower-gel.png",
  },
  {
    id: "p4",
    name: "Milky Sandwich Sticks",
    originalPrice: "299 tk",
    price: "299 tk",
    image: "/product-milky-sandwich-sticks.png",
  },
  {
    id: "p5",
    name: "Meaw Grass Sticks",
    originalPrice: "299 tk",
    price: "299 tk",
    image: "/product-meaw-grass-sticks.png",
  },
];

export function Products() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="container max-w-360 px-4 sm:px-6 md:px-8 mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight">
            Products of <span className="uppercase">MEAWLAND</span>
          </h2>
          <p className="text-[#56C8D8] font-black text-base sm:text-lg md:text-xl">
            Best product for your cat
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative px-2 sm:px-6 md:px-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollPrev}
            className="hidden sm:flex absolute -left-2 sm:left-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md items-center justify-center cursor-pointer transition-all"
            aria-label="Previous products"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Embla Viewport */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6 sm:gap-8 py-4">
              {productList.map((product) => (
                <div
                  key={product.id}
                  className="flex-none basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 min-w-0 flex justify-center"
                >
                  <div className="w-full bg-[#F0F8FF] border border-[#D4EEFC] rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between items-center text-center shadow-sm hover:shadow-lg transition-all group">
                    {/* White Image Frame */}
                    <div className="relative w-full h-56 sm:h-64 md:h-68 rounded-2xl bg-white p-3 border border-gray-100 flex items-center justify-center mb-5">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="320px"
                        className="object-contain p-2 group-hover:scale-105 transition-transform"
                      />
                      {/* Heart Wishlist Trigger */}
                      <button
                        className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md text-gray-500 hover:text-red-500 border border-gray-100 transition-colors cursor-pointer"
                        aria-label="Add to wishlist"
                      >
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Product Title */}
                    <h3 className="text-base sm:text-lg font-black text-gray-900 line-clamp-2 min-h-13 flex items-center justify-center text-center mb-3 leading-snug">
                      {product.name}
                    </h3>

                    {/* Pricing */}
                    <div className="flex items-center justify-center gap-3 mb-5">
                      <span className="text-sm text-gray-400 font-bold line-through">
                        {product.originalPrice}
                      </span>
                      <span className="text-base sm:text-xl text-gray-900 font-black">
                        {product.price}
                      </span>
                    </div>

                    {/* View Product CTA Button */}
                    <Link href={`/product/${product.id}`} className="w-full">
                      <Button
                        variant="outline"
                        className="w-full border-2 border-[#56C8D8] text-[#56C8D8] hover:bg-[#56C8D8] hover:text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-2xl py-3 px-5 transition-all shadow-xs cursor-pointer"
                      >
                        VIEW PRODUCT
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={scrollNext}
            className="hidden sm:flex absolute -right-2 sm:right-0 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-md items-center justify-center cursor-pointer transition-all"
            aria-label="Next products"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
