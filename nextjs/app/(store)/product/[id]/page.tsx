import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productsAPI, settingsAPI, SettingsAPI } from "@/lib/api";
import { ProductClient } from "./product-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const product = await productsAPI.getById(params.id);
    if (!product) return { title: "Product Not Found" };
    const images = productsAPI.getAllImages(product);
    const imageUrl = images[0] || undefined;
    return {
      title: product.name,
      description: product.description || `${product.name} — Premium luggage cover. Shop now on Luggage Cover BD.`,
      keywords: [product.name, "luggage cover", "bag cover", "travel accessory"],
      openGraph: {
        title: `${product.name} | Luggage Cover BD`,
        description: product.description || `${product.name} — Premium luggage cover. Shop now on Luggage Cover BD.`,
        images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      },
      twitter: {
        card: "summary",
        title: `${product.name} | Luggage Cover BD`,
        description: product.description || `${product.name} — Premium luggage cover.`,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  let product = null;
  let related: Awaited<ReturnType<typeof productsAPI.getAll>> = [];
  interface HowToStep {
  step: number;
  title: string;
  desc: string;
  img: string;
}

let howtoSteps: HowToStep[] = [];

  try {
    product = await productsAPI.getById(params.id);
    if (!product) notFound();

    const all = await productsAPI.getAll(true);
    related = all.filter((p) => p.id !== product!.id).slice(0, 4);

    // Load How to Use steps from settings
    const settingsApi = new SettingsAPI();
    await settingsApi.loadAll();
    howtoSteps = settingsApi.getHowToSteps();
  } catch (e) {
    console.warn("Product page load failed", e);
  }

  return <ProductClient product={product} related={related} howtoSteps={howtoSteps} />;
}
