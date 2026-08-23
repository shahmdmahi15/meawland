import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meawland | Pet Care & Accessories Store",
    short_name: "Meawland",
    description:
      "Bangladesh's premier online destination for genuine pet nutrition, anti-fungal grooming care, handcrafted fashion, and playful accessories.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#56C8D8",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["shopping", "lifestyle", "pets"],
    shortcuts: [
      {
        name: "All Products",
        short_name: "Products",
        description: "Browse all pet food and care essentials",
        url: "/products",
        icons: [{ src: "/logo.png", sizes: "192x192" }],
      },
      {
        name: "Combo Deals",
        short_name: "Combos",
        description: "Save big on curated money-saving pet bundles",
        url: "/combo-products",
        icons: [{ src: "/logo.png", sizes: "192x192" }],
      },
      {
        name: "Track Order",
        short_name: "Tracking",
        description: "Check your order delivery live status",
        url: "/account/tracking",
        icons: [{ src: "/logo.png", sizes: "192x192" }],
      },
    ],
  };
}
