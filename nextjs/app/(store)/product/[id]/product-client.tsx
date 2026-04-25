"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Product, ProductSize } from "@/types";
import { productsAPI } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { ImageGallery, SizeSelector, ProductTabs } from "@/components/product";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn, formatPrice } from "@/lib/utils";

interface ProductClientProps {
  product: Product | null;
  related: Product[];
  howtoSteps?: { step: number; title: string; desc: string; img: string }[];
}

const PRICE_MAP: Record<ProductSize, keyof Product> = {
  small: "price_small",
  medium: "price_medium",
  large: "price_large",
};

const STOCK_MAP: Record<ProductSize, keyof Product> = {
  small: "stock_small",
  medium: "stock_medium",
  large: "stock_large",
};

export function ProductClient({ product, related, howtoSteps }: ProductClientProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(!product);
  const router = useRouter();
  const { addItem } = useCartStore();

  useEffect(() => {
    if (product) return;
    setLoading(false);
  }, [product]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[rgba(74,144,226,0.2)] border-t-[#4A90E2] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9fa8c7] text-[0.875rem]">Loading product…</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-4">🧳</div>
          <h2 className="font-heading text-2xl font-bold mb-3 text-[#1a1f3a]">Product Not Found</h2>
          <p className="text-[#9fa8c7] mb-6">This product doesn&apos;t exist or has been removed.</p>
          <Link href="/shop">
            <Button variant="primary"><i className="fas fa-shopping-bag mr-2"></i>Browse All Designs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const price = selectedSize ? (product[PRICE_MAP[selectedSize]] as number) || 0 : 0;
  const stock = selectedSize ? (product[STOCK_MAP[selectedSize]] as number) || 0 : 0;
  const emoji = productsAPI.getEmoji(product);

  const allImages = productsAPI.getAllImages(product);
  const galleryImages: Array<{ url?: string; emoji?: string; alt: string }> = allImages.map((url, i) => ({
    url,
    alt: `${product.name} — Image ${i + 1}`,
  }));
  if (galleryImages.length === 0) {
    galleryImages.push({ emoji, alt: product.name });
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast("Please select a size first!", "warning");
      return;
    }
    addItem(product, selectedSize, qty);
    toast(`${product.name} (${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)}) added to cart!`, "success");
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast("Please select a size first!", "warning");
      return;
    }
    addItem(product, selectedSize, qty);
    router.push("/cart");
  };

  const changeQty = (delta: number) => {
    const newQty = qty + delta;
    if (newQty < 1) return;
    if (selectedSize && newQty > stock && stock > 0) {
      toast(`Only ${stock} in stock.`, "warning");
      return;
    }
    setQty(newQty);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-[#f8f9ff] py-3 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-[0.875rem] text-[#9fa8c7]">
            <Link href="/" className="hover:text-[#4A90E2] transition-colors">Home</Link>
            <span>›</span>
            <Link href="/shop" className="hover:text-[#4A90E2] transition-colors">Shop</Link>
            <span>›</span>
            <span className="text-[#1a1f3a] font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="product-section py-12 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="product-layout grid lg:grid-cols-2 gap-[60px] items-start">
            {/* Gallery — Sticky on desktop */}
            <div className="product-gallery lg:sticky lg:top-[90px]">
              <ImageGallery images={galleryImages} productName={product.name} />

              {/* Badges */}
              <div className="product-badges-row flex gap-2 mt-4 flex-wrap">
                <span className="bg-[rgba(64,224,208,0.15)] text-[#40E0D0] text-[0.75rem] font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  🚚 COD Available
                </span>
                <span className="bg-[rgba(74,144,226,0.15)] text-[#4A90E2] text-[0.75rem] font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  🛡️ Quality Guaranteed
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div>
              {/* Code */}
              <div className="product-code-label text-[11px] font-bold tracking-[1px] uppercase bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent mb-2">
                CODE: {product.code}
              </div>

              {/* Title */}
              <h1 className="product-title font-heading text-[clamp(1.8rem,3vw,2.5rem)] font-black text-[#1a1f3a] mb-5 leading-tight">
                {product.name}
              </h1>

              {/* Price Block */}
              <div className="product-price-block bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff] rounded-[var(--radius-lg)] p-5 mb-5 border border-[rgba(74,144,226,0.2)]">
                <div className="current-price text-[2.5rem] font-black font-heading bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent leading-none">
                  {selectedSize ? formatPrice(price) : "—"}
                </div>
                <div className="price-size-note text-[0.85rem] text-[#9fa8c7] mt-1">
                  {selectedSize
                    ? `For ${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} size`
                    : "Select a size to see price"}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p className="product-desc text-[#9fa8c7] leading-[1.7] mb-7 text-[0.95rem]">
                  {product.description}
                </p>
              )}

              {/* Size Selector */}
              <div className="size-selector-section mb-7">
                <SizeSelector
                  product={product}
                  selected={selectedSize}
                  onSelect={(size) => {
                    setSelectedSize(size);
                    setQty(1);
                  }}
                />
              </div>

              {/* Quantity */}
              {selectedSize && (
                <div className="qty-section flex items-center gap-5 mb-6 flex-wrap">
                  <span className="qty-label font-bold text-[0.95rem]">Quantity</span>
                  <div className="qty-control flex items-center border-2 border-[#e1e5f5] rounded-[var(--radius-md)] overflow-hidden">
                    <button
                      onClick={() => changeQty(-1)}
                      className="qty-btn w-10 h-10 flex items-center justify-center bg-[#f8f9ff] hover:bg-[#4A90E2] hover:text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="qty-value w-12 text-center font-bold text-base">{qty}</span>
                    <button
                      onClick={() => changeQty(1)}
                      className="qty-btn w-10 h-10 flex items-center justify-center bg-[#f8f9ff] hover:bg-[#4A90E2] hover:text-white transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  {stock > 0 && (
                    <span className={cn(
                      "stock-info text-[0.85rem] font-semibold",
                      stock > 10 ? "stock-ok text-[#27ae60]" : "stock-low text-[#f39c12]"
                    )}>
                      {stock > 10 ? "✓ In Stock" : `Only ${stock} left!`}
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="product-actions flex sm:flex-row flex-col gap-3 mb-5">
                <Button variant="primary" size="lg" className="flex-1" onClick={handleAddToCart}>
                  <i className="fas fa-shopping-cart mr-2"></i> Add to Cart
                </Button>
                <Button variant="teal" size="lg" className="flex-1" onClick={handleBuyNow}>
                  ⚡ Buy Now
                </Button>
              </div>

              {/* Bulk Discount Reminder */}
              <div className="bulk-reminder flex items-center gap-3 p-4 bg-[rgba(64,224,208,0.08)] rounded-[var(--radius-md)] text-[0.85rem] mb-6 border border-[rgba(64,224,208,0.25)] text-[#40E0D0]">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>
                  Add <strong>4+ total items</strong> → Get <strong>15% OFF!</strong> (auto applied)
                </span>
              </div>

              {/* Product Features */}
              <div className="product-features p-5 bg-[#f8f9ff] rounded-[var(--radius-md)] space-y-2">
                {[
                  "High-Quality Polyester + Spandex Blend",
                  "Elastic & Flexible 4-Way Stretch",
                  "Dust, Stain & Scratch Resistant",
                  "Vibrant Fade-Resistant Print",
                  "Easy to Put On — Fits in Seconds",
                  "Delivery: Dhaka ৳60 | Outside ৳120",
                ].map((feat) => (
                  <div key={feat} className="pf-item flex items-center gap-2.5 text-[0.9rem] text-[#1a1f3a]">
                    <i className="fas fa-check text-[#4A90E2] shrink-0"></i>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Tabs */}
      <section className="product-tabs-section py-10 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <ProductTabs productCode={product.code} howtoSteps={howtoSteps} />
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="related-section py-16 bg-[#f8f9ff]">
          <div className="max-w-7xl mx-auto px-5">
            <div className="text-center mb-10">
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold">
                You May Also <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Like</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
