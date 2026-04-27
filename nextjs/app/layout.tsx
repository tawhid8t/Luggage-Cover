import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/analytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://luggagecoverbd.com"
  ),
  title: {
    default: "Luggage Cover BD – Your Travel Buddy",
    template: "%s | Luggage Cover BD",
  },
  description:
    "Shop premium luggage covers in Bangladesh. Protect & style your bag with our Polyester+Spandex covers. 14 designs, 3 sizes (S/M/L). COD available. Fast delivery in Dhaka.",
  keywords: [
    "luggage cover BD",
    "luggage cover Bangladesh",
    "travel accessories Bangladesh",
    "bag cover",
    "luggages protector",
    "suitcase cover",
    "luggage skin",
    "buy luggage cover online Bangladesh",
  ],
  authors: [{ name: "Luggage Cover BD" }],
  creator: "Luggage Cover BD",
  publisher: "Luggage Cover BD",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Luggage Cover BD",
    title: "Luggage Cover BD – Your Travel Buddy",
    description:
      "Shop premium luggage covers in Bangladesh. 14 designs, 3 sizes. COD available.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Luggage Cover BD – Premium luggage covers for Bangladesh",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luggage Cover BD",
    description: "Premium luggage covers in Bangladesh. 14 designs, 3 sizes. COD available.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  verification: {
    google: "YOUR_GOOGLE_SITE_VERIFICATION",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" />
      </head>
      <body suppressHydrationWarning className="font-body antialiased">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
