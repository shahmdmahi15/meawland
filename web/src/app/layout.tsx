import type { Metadata, Viewport } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { MetaPixelProvider } from "@/components/providers/meta-pixel/meta-pixel-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { PWAInstallPrompt } from "@/components/root/pwa-install-prompt";
import { RootJsonLd } from "@/components/seo/structured-data";

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

export const viewport: Viewport = {
  themeColor: "#56C8D8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com",
  ),
  title: {
    default:
      "Meawland | The Ultimate Pet Care & Accessories Store in Bangladesh",
    template: "%s | Meawland",
  },
  description:
    "Shop authentic feline & canine nutrition, gentle grooming care, anti-fungal medicine, handcrafted dresses, collars, and engaging toys with fast nationwide delivery in Bangladesh.",
  applicationName: "Meawland",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meawland",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    "pet store Bangladesh",
    "cat food Dhaka",
    "cat accessories",
    "kitten nutrition",
    "pet medicine",
    "cat grooming shampoo",
    "cat litter sand",
    "royal cat dress",
    "pet toys",
    "Meawland",
  ],
  authors: [{ name: "Meawland Pet Care" }],
  creator: "Meawland",
  publisher: "Meawland",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: "/",
    siteName: "Meawland",
    title: "Meawland | The Ultimate Pet Care & Accessories Store in Bangladesh",
    description:
      "Shop 100% genuine pet food, grooming care, anti-fungal medicine, dresses, and toys with fast nationwide delivery.",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Meawland - The Ultimate Pet Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meawland | The Ultimate Pet Care & Accessories Store",
    description:
      "Shop 100% genuine pet food, grooming care, dresses, and toys with fast nationwide delivery in Bangladesh.",
    images: ["/og-banner.png"],
    creator: "@meawland",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function EntryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${dmSans.variable} ${chewy.variable} h-full antialiased`}
    >
      <head>
        <RootJsonLd />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <MetaPixelProvider>
            <PWAProvider>
              {children}
              <PWAInstallPrompt />
            </PWAProvider>
          </MetaPixelProvider>
        </Suspense>
        <Toaster richColors />
      </body>
    </html>
  );
}
