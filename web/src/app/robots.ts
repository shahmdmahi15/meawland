import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/products",
          "/combo-products",
          "/category/",
          "/product/",
          "/about",
          "/contact",
          "/faq",
          "/terms",
          "/privacy",
          "/returns",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/checkout/",
          "/account/",
          "/login",
          "/wishlist",
          "/unsubscribe",
          "/invoice/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
