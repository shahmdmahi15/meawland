import { MeawlandLoading } from "@/components/ui/meawland-loading";

export default function AdminLoading() {
  return (
    <MeawlandLoading
      variant="admin"
      text="Loading Admin Portal..."
      subtext="Syncing store inventory, orders & live analytics"
    />
  );
}
