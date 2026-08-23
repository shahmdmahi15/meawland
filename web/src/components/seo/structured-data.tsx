import React from "react";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com";

/**
 * Root schema: WebSite with Sitelinks Searchbox + PetStore / Organization + Primary SiteNavigationElement
 */
export function RootJsonLd() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Meawland",
    alternateName: ["Meawland Pet Store", "Meawland Bangladesh"],
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["PetStore", "OnlineStore"],
    name: "Meawland",
    legalName: "Meawland Pet Care & Accessories",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    image: `${BASE_URL}/logo.png`,
    description:
      "Bangladesh's premier online destination for genuine pet nutrition, anti-fungal grooming care, handcrafted apparel, and playful accessories.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      addressLocality: "Dhaka",
      addressRegion: "Dhaka Division",
    },
    currenciesAccepted: "BDT",
    paymentAccepted: "Cash, Cash on Delivery, bKash, Nagad, Visa, MasterCard",
    priceRange: "৳৳",
    sameAs: [
      "https://www.facebook.com/meawland1",
      "https://www.instagram.com/meawland",
      "https://www.tiktok.com/@meawland",
    ],
  };

  const sitenavSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      {
        "@type": "SiteNavigationElement",
        position: 1,
        name: "All Products",
        description:
          "Browse Meawland's full catalog of pet essentials and food.",
        url: `${BASE_URL}/products`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 2,
        name: "Combo Deals & Bundles",
        description:
          "Curated value money-saving bundle deals with massive discounts.",
        url: `${BASE_URL}/combo-products`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 3,
        name: "Pet Food & Nutrition",
        description:
          "Premium cat & dog kibble, wet gravy pouches, treats, and supplements.",
        url: `${BASE_URL}/category/pet-food`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 4,
        name: "Pet Medicine & Health",
        description:
          "Anti-fungal sprays, ear drops, dewormers, and feline healthcare supplies.",
        url: `${BASE_URL}/category/pet-medicine`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 5,
        name: "Pet Care & Grooming",
        description:
          "Gentle shampoos, de-shedding combs, wipes, and hygiene products.",
        url: `${BASE_URL}/category/pet-care`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 6,
        name: "Pet Accessories",
        description:
          "Collars, harnesses, feeding bowls, carriers, and scratchers.",
        url: `${BASE_URL}/category/pet-accessories`,
      },
      {
        "@type": "SiteNavigationElement",
        position: 7,
        name: "About Meawland",
        description: "Learn about Bangladesh's most trusted pet care store.",
        url: `${BASE_URL}/about`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sitenavSchema) }}
      />
    </>
  );
}

/**
 * Breadcrumbs structured data
 */
export function BreadcrumbsJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Product detail structured data
 */
export function ProductJsonLd({
  name,
  description,
  image,
  price,
  sku,
  inStock = true,
  category,
}: {
  name: string;
  description?: string;
  image?: string;
  price: number;
  sku?: string;
  inStock?: boolean;
  category?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description:
      description ||
      `Buy authentic ${name} at Meawland with fast nationwide delivery in Bangladesh.`,
    image: image ? [image] : [`${BASE_URL}/logo.png`],
    sku: sku || name.toLowerCase().replace(/\s+/g, "-"),
    category: category || "Pet Supplies",
    brand: {
      "@type": "Brand",
      name: "Meawland",
    },
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/product/${sku || ""}`,
      priceCurrency: "BDT",
      price: price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Meawland",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ page structured data
 */
export function FaqJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
