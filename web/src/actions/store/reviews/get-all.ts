"use server";

export interface StoreCustomerReview {
  id: string;
  name: string;
  location?: string;
  petType?: string;
  avatar: string;
  rating: number;
  text: string;
  verifiedBuyer: boolean;
  date?: string;
}

const MOCK_REVIEWS: StoreCustomerReview[] = [
  {
    id: "rev-1",
    name: "Tanzina Rahman",
    location: "Dhanmondi, Dhaka",
    petType: "Persian Cat Parent",
    avatar: "/review-user-avatar-1.png",
    rating: 5,
    text: "They sell very good and qualityful products. I bought a female cat dress and ear cleaner for my cat. I have had a very good experience using them so far. Highly recommended!",
    verifiedBuyer: true,
    date: "2 days ago",
  },
  {
    id: "rev-2",
    name: "Ahsan Habib",
    location: "Uttara, Dhaka",
    petType: "British Shorthair Parent",
    avatar: "/review-user-avatar-2.png",
    rating: 5,
    text: "DermaPaws shower gel completely solved my cat's fungal itching within 2 weeks. The quality and genuine packaging from Meawland is unbeatable in Bangladesh.",
    verifiedBuyer: true,
    date: "1 week ago",
  },
  {
    id: "rev-3",
    name: "Nusrat Jahan",
    location: "Gulshan, Dhaka",
    petType: "Ragdoll Parent",
    avatar: "/review-user-avatar-1.png",
    rating: 5,
    text: "Super fast delivery and packaging was very premium! My kitten loves the Milky Sandwich Sticks and hairball grass treats. Will order again!",
    verifiedBuyer: true,
    date: "Just now",
  },
  {
    id: "rev-4",
    name: "Sabbir Hossain",
    location: "Chattogram",
    petType: "2 Rescue Cats Parent",
    avatar: "/review-user-avatar-2.png",
    rating: 5,
    text: "The combo deals saved me almost 500 taka! Great bundle of shampoo and vitamins. Customer support was very helpful and responsive.",
    verifiedBuyer: true,
    date: "3 days ago",
  },
  {
    id: "rev-5",
    name: "Farhana Ahmed",
    location: "Sylhet",
    petType: "Siamese Cat Parent",
    avatar: "/review-user-avatar-1.png",
    rating: 5,
    text: "Ordered cat harness and flea spray. The quality is 100% authentic. Meawland is definitely my go-to store for all cat essentials now.",
    verifiedBuyer: true,
    date: "5 days ago",
  },
  {
    id: "rev-6",
    name: "Mahir Chowdhury",
    location: "Banani, Dhaka",
    petType: "Maine Coon Parent",
    avatar: "/review-user-avatar-2.png",
    rating: 5,
    text: "Best cat store in Bangladesh hands down. Authentic imported items, reasonable prices, and my cat loves the organic catnip treats!",
    verifiedBuyer: true,
    date: "2 weeks ago",
  },
];

export async function getStoreReviewsAction(): Promise<{
  success: boolean;
  message: string;
  reviews: StoreCustomerReview[];
}> {
  try {
    return {
      success: true,
      message: "Successfully retrieved customer reviews",
      reviews: MOCK_REVIEWS,
    };
  } catch (error) {
    console.error("[GetStoreReviewsAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch customer reviews",
      reviews: MOCK_REVIEWS,
    };
  }
}
