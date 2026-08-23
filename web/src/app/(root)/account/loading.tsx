import { MeawlandLoading } from "@/components/ui/meawland-loading";

export default function AccountLoading() {
  return (
    <div className="p-6 rounded-2xl bg-white min-h-105 flex items-center justify-center">
      <MeawlandLoading
        variant="card"
        text="Loading account details..."
        subtext="Fetching your order history, tracking & wishlist"
      />
    </div>
  );
}
