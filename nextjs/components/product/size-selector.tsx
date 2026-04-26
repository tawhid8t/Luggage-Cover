"use client";

import { cn, SIZES } from "@/lib/utils";
import type { Product, ProductSize } from "@/types";

interface SizeSelectorProps {
  product: Product;
  selected: ProductSize | null;
  onSelect: (size: ProductSize) => void;
}

const PRICE_MAP: Record<ProductSize, "priceSmall" | "priceMedium" | "priceLarge"> = {
  small: "priceSmall",
  medium: "priceMedium",
  large: "priceLarge",
};

const STOCK_MAP: Record<ProductSize, "stockSmall" | "stockMedium" | "stockLarge"> = {
  small: "stockSmall",
  medium: "stockMedium",
  large: "stockLarge",
};

export function SizeSelector({ product, selected, onSelect }: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm">Select Size</span>
        <a
          href="/faq#sizing"
          className="text-brand-blue text-xs flex items-center gap-1 hover:underline"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Size Guide
        </a>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {SIZES.map((size) => {
          const price = (product[PRICE_MAP[size.value]] as number) || 0;
          const stock = (product[STOCK_MAP[size.value]] as number) || 0;
          const outOfStock = stock <= 0;
          const isSelected = selected === size.value;

          return (
            <button
              key={size.value}
              disabled={outOfStock}
              onClick={() => onSelect(size.value)}
              className={cn(
                "px-2 py-3 sm:px-3 sm:py-3.5 rounded-lg border-2 border-[#c5cde2] text-center transition-all duration-200 w-full shadow-sm",
                outOfStock
                  ? "opacity-40 cursor-not-allowed border-[#e1e5f5]"
                  : isSelected
                    ? "border-[#4A90E2] bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff] shadow-[0_4px_16px_rgba(74,144,226,0.2)] ring-2 ring-[#4A90E2] ring-offset-1"
                    : "hover:border-[#4A90E2] hover:shadow-[0_4px_16px_rgba(74,144,226,0.15)] hover:shadow-[0_2px_8px_rgba(74,144,226,0.1)] bg-white"
              )}
            >
              <span className={cn(
                "block font-bold text-base",
                isSelected ? "text-[#4A90E2]" : "text-[#1a1f3a]"
              )}>
                {size.label}
              </span>
              <span className="block text-[0.72rem] text-[#9fa8c7] my-1">
                {size.range}
              </span>
              <span className={cn(
                "block font-extrabold text-base bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent",
                !isSelected && "text-[#4A90E2]"
              )}>
                ৳ {price.toLocaleString()}
              </span>
              {outOfStock && (
                <div className="text-xs text-red-500 mt-1">Out of Stock</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
