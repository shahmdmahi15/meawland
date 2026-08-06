import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";

const dmSans = localFont({
  src: "../assets/fonts/DMSans-VariableFont_opsz,wght.ttf",
  variable: "--font-dm-sans",
  display: "swap",
});

const chewy = localFont({
  src: "../assets/fonts/Chewy-Regular.ttf",
  variable: "--font-chewy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Meawland - Pet Accessories & E-Commerce",
  description: "A pet accessory e-commerce website.",
};

export default function EntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${chewy.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
