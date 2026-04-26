"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { productsAPI } from "@/lib/api";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority }: ProductCardProps) {
  const emoji = productsAPI.getEmoji(product);
  const price = product.priceSmall ?? 990;
  
  return (
    <Link href={`/product/${product.id}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(74,144,226,0.2)] transition-all duration-300 hover:-translate-y-1.5">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-[#f0f3ff] to-[#e8ecfc] overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {emoji}
            </div>
          )}
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#1a1f3a]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white text-[#1a1f3a] px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="text-[11px] font-bold tracking-[1px] uppercase bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent mb-1">
            #{product.code}
          </div>
          <h3 className="font-heading font-bold text-[#1a1f3a] text-base mb-1 group-hover:text-brand-blue transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-[1.1rem] font-extrabold text-brand-blue">
              ৳ {price.toLocaleString()}
            </span>
            <span className="text-xs text-[#9fa8c7] font-medium">
              / cover
            </span>
          </div>
          <button 
            className="w-full mt-2 bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-[0_4px_20px_rgba(74,144,226,0.4)] hover:shadow-[0_8px_28px_rgba(74,144,226,0.5)] hover:-translate-y-0.5 transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/product/${product.id}`;
            }}
          >
            <i className="fas fa-shopping-bag mr-1.5"></i>
            Choose Size
          </button>
        </div>
      </article>
    </Link>
  );
}
