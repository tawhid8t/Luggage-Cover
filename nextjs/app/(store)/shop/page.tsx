import type { Metadata } from "next";
import { productsAPI } from "@/lib/api";
import { PageHero } from "@/components/layout/page-hero";
import { ShopClient } from "./shop-client";

export const metadata: Metadata = {
  title: "Shop All Designs – Luggage Covers",
  description:
    "Browse all 14 premium luggage cover designs. Small, Medium, Large sizes. COD available in Bangladesh. Prices from ৳990.",
  keywords: [
    "luggage cover shop Bangladesh",
    "buy luggage cover online",
    "bag cover designs",
    "travel accessory Bangladesh",
    "luggages online BD",
  ],
  openGraph: {
    title: "Shop All Designs | Luggage Cover BD",
    description:
      "14 premium luggage cover designs. S/M/L sizes. COD available.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  let products: Awaited<ReturnType<typeof productsAPI.getAll>> = [];

  try {
    products = await productsAPI.getAll(true);
  } catch (e) {
    console.warn("Shop: products load failed", e);
  }

  return (
    <>
      <PageHero
        title={
          <>
            All <span className="bg-gradient-primary bg-clip-text text-transparent">Designs</span>
          </>
        }
        subtitle="14 unique covers. 3 sizes. Prices from ৳990. COD available."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Shop" }]}
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-5">
          <ShopClient initialProducts={products} />
        </div>
      </section>
    </>
  );
}
