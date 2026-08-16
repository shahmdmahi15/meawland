import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | Meawland",
  description:
    "View and track your previous and active pet care orders at Meawland.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page() {
  return <>Page</>;
}
