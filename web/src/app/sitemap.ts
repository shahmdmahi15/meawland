import { MetadataRoute } from "next";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com";
  const now = new Date();

  // 1. Static high-value landing & informational pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/combo-products`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/returns`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // 2. Primary 7 Pet Categories
  const categorySlugs = [
    "pet-food",
    "pet-care",
    "pet-accessories",
    "pet-medicine",
    "pet-dress",
    "pet-toy",
    "pet-litter",
  ];

  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${baseUrl}/category/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  try {
    // 3. Dynamic Sub-categories, Products, and Combo Bundles
    const [subCategories, products, combos] = await Promise.all([
      db.subCategory.findMany({
        select: {
          slug: true,
          category: true,
          updatedAt: true,
        },
      }),
      db.product.findMany({
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
      db.comboProduct.findMany({
        select: {
          slug: true,
          updatedAt: true,
        },
      }),
    ]);

    const subCategoryPages: MetadataRoute.Sitemap = subCategories.map((sub) => {
      const parentSlug = sub.category.toLowerCase().replace(/_/g, "-");
      return {
        url: `${baseUrl}/category/${parentSlug}/${sub.slug}`,
        lastModified: sub.updatedAt || now,
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

    const productPages: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt || now,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const comboPages: MetadataRoute.Sitemap = combos.map((c) => ({
      url: `${baseUrl}/product/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: "daily",
      priority: 0.85,
    }));

    return [
      ...staticPages,
      ...categoryPages,
      ...subCategoryPages,
      ...productPages,
      ...comboPages,
    ];
  } catch (error) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("[Sitemap Generation Error]:", error);
    return [...staticPages, ...categoryPages];
  }
}
