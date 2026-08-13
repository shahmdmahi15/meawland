export interface MockProduct {
  id: string;
  name: string;
  originalPrice: string;
  price: string;
  image: string;
  rating?: number;
  categorySlug: string;
  subCategorySlug?: string;
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: "mp-1",
    name: "Anti-Choke Baby Cat Milk Feeding Bottle 60ml",
    originalPrice: "599 tk",
    price: "450 tk",
    image: "/product-dermapaws-shower-gel.png",
    categorySlug: "pet-food",
    subCategorySlug: "kitten-milk-feeder",
  },
  {
    id: "mp-2",
    name: "Reflex Plus Adult Cat Food Chicken & Rice 1.5kg",
    originalPrice: "1450 tk",
    price: "1250 tk",
    image: "/product-flea-free-shower-gel.png",
    categorySlug: "pet-food",
    subCategorySlug: "adult-food",
  },
  {
    id: "mp-3",
    name: "Me-O Creamy Cat Treats Salmon Flavor 4x15g",
    originalPrice: "320 tk",
    price: "280 tk",
    image: "/product-pet-glow-shower-gel.png",
    categorySlug: "pet-food",
    subCategorySlug: "pet-treat-snacks",
  },
  {
    id: "mp-4",
    name: "Royal Canin Kitten Health Nutrition Food 2kg",
    originalPrice: "2400 tk",
    price: "2150 tk",
    image: "/product-milky-sandwich-sticks.png",
    categorySlug: "pet-food",
    subCategorySlug: "kitten-food",
  },
  {
    id: "mp-5",
    name: "Meaw Organic Hairball Remedy Grass Sticks",
    originalPrice: "350 tk",
    price: "299 tk",
    image: "/product-meaw-grass-sticks.png",
    categorySlug: "pet-food",
    subCategorySlug: "pet-treat-snacks",
  },
  {
    id: "mp-6",
    name: "Whiskas Adult Wet Cat Food Pouch Ocean Fish 85g",
    originalPrice: "120 tk",
    price: "99 tk",
    image: "/product-dermapaws-shower-gel.png",
    categorySlug: "pet-food",
    subCategorySlug: "adult-food",
  },
  {
    id: "mp-7",
    name: "SmartHeart Kitten Food Chicken Fish & Milk 1.1kg",
    originalPrice: "850 tk",
    price: "720 tk",
    image: "/product-flea-free-shower-gel.png",
    categorySlug: "pet-food",
    subCategorySlug: "kitten-food",
  },
  {
    id: "mp-8",
    name: "Catit Creamy Lickable Healthy Cat Treats Chicken 4-Pack",
    originalPrice: "380 tk",
    price: "320 tk",
    image: "/product-pet-glow-shower-gel.png",
    categorySlug: "pet-food",
    subCategorySlug: "pet-treat-snacks",
  },
];

export function getMockProducts(
  categorySlug: string,
  subCategorySlug?: string,
): MockProduct[] {
  return MOCK_PRODUCTS.filter((product) => {
    if (subCategorySlug) {
      return (
        product.categorySlug === categorySlug &&
        product.subCategorySlug === subCategorySlug
      );
    }
    return product.categorySlug === categorySlug;
  })
    .concat(
      // If filtered array has few items, duplicate mock data so grid looks populated
      MOCK_PRODUCTS.map((p, idx) => ({
        ...p,
        id: `${p.id}-copy-${idx}`,
        categorySlug,
        subCategorySlug,
      })),
    )
    .slice(0, 8);
}
