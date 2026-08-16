import { Metadata } from "next";
import { ContactView } from "@/components/root/store/contact-view";

export const metadata: Metadata = {
  title: "Contact Us | Meawland - 24/7 Dedicated Pet Support",
  description:
    "Get in touch with Meawland pet care team for order inquiries, pet nutrition advice, WhatsApp instant support, or store location in Dhaka, Bangladesh.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Meawland - 24/7 Dedicated Pet Support",
    description:
      "Get in touch with Meawland pet care team for order inquiries, pet nutrition advice, WhatsApp instant support, or store location in Dhaka, Bangladesh.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return <ContactView />;
}
