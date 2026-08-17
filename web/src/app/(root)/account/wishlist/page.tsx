import { Metadata } from "next";
import { getWishlistAction } from "@/actions/store/wishlist";
import { WishlistView } from "@/components/root/store/wishlist-view";

export const metadata: Metadata = {
  title: "My Wishlist - Account | Meawland",
  description:
    "View and manage your saved pet food, accessories, and grooming essentials.",
};

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  const result = await getWishlistAction();

  return (
    <WishlistView
      initialProducts={result.products || []}
      unauthorized={result.unauthorized || false}
      isAccountPage={true}
    />
  );
}
