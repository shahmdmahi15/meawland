import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Tracking | Meawland",
  description:
    "Track live shipping and delivery progress for your Meawland pet care orders.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  return <>Page</>;
}
