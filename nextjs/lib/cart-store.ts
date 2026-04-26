import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductSize, DiscountInfo } from "@/types";
import { settingsAPI } from "@/lib/api";

interface CartStore {
  items: CartItem[];
  // Actions
  addItem: (product: Product, size: ProductSize, qty?: number) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  // Computed
  getCount: () => number;
  getSubtotal: () => number;
  getTotalQty: () => number;
  // Discount
  discount: DiscountInfo;
  setDiscount: (discount: DiscountInfo) => void;
  getDiscount: () => Promise<DiscountInfo>;
  getDeliveryCharge: (district: string) => Promise<number>;
}

const getItemKey = (productId: string, size: ProductSize) =>
  `${productId}_${size}`;

const getPriceForSize = (product: Product, size: ProductSize): number => {
  const priceMap: Record<ProductSize, keyof Product> = {
    small: "priceSmall",
    medium: "priceMedium",
    large: "priceLarge",
  };
  return (product[priceMap[size]] as number) || product.priceSmall || 990;
};

const EMOJI_MAP: Record<string, string> = {
  a1b23: "🌍",
  a2b34: "🌸",
  a3b45: "💼",
  b1c23: "🏰",
  b2c34: "✨",
  b3c45: "⚽",
  c1d23: "🎡",
  c2d34: "⏰",
  c3d45: "🗺️",
  d1e23: "🎨",
  d1e34: "🐱",
  d3e45: "🏯",
  e1f23: "🏖️",
  e2f34: "😎",
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: { amount: 0, percent: 0, applied: false, minQty: 4 },

      addItem: (product, size, qty = 1) => {
        const key = getItemKey(product.id, size);
        const price = getPriceForSize(product, size);
        const existing = get().items.find((i) => i.key === key);

        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === key ? { ...i, qty: i.qty + qty } : i
            ),
          });
        } else {
          const newItem: CartItem = {
            key,
            productId: product.id,
            productName: product.name,
            productCode: product.code,
            emoji: EMOJI_MAP[product.code] || "🧳",
            imageUrl: product.imageUrl,
            size,
            price,
            qty,
          };
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (key) => {
        set({ items: get().items.filter((i) => i.key !== key) });
      },

      updateQty: (key, qty) => {
        if (qty <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) => (i.key === key ? { ...i, qty } : i)),
        });
      },

      clear: () => {
        set({ items: [], discount: { amount: 0, percent: 0, applied: false, minQty: 4 } });
      },

      getCount: () => get().items.length,

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      getTotalQty: () =>
        get().items.reduce((sum, i) => sum + i.qty, 0),

      setDiscount: (discount) => set({ discount }),

      async getDiscount(): Promise<DiscountInfo> {
        const items = get().items;
        if (items.length === 0) return { amount: 0, percent: 0, applied: false, minQty: 4 };
        try {
          await settingsAPI.load();
        } catch {}
        const enabled = settingsAPI.getBool("promo_bulk_enabled", true);
        const minQty = settingsAPI.getNumber("promo_bulk_qty", 4);
        const pct = settingsAPI.getNumber("promo_bulk_percent", 15);
        if (!enabled) return { amount: 0, percent: 0, applied: false, minQty };
        const totalQty = items.reduce((s, i) => s + i.qty, 0);
        if (totalQty >= minQty) {
          const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
          const amount = Math.round(subtotal * pct / 100);
          return { amount, percent: pct, applied: true, minQty };
        }
        return { amount: 0, percent: pct, applied: false, minQty };
      },

      async getDeliveryCharge(district: string): Promise<number> {
        try {
          await settingsAPI.load();
        } catch {}
        const dhakaCharge = settingsAPI.getNumber("delivery_charge_dhaka", 60);
        const outsideCharge = settingsAPI.getNumber("delivery_charge_outside", 120);
        const isDhaka = (district || "").toLowerCase().includes("dhaka");
        return isDhaka ? dhakaCharge : outsideCharge;
      },
    }),
    {
      name: "lcbd_cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Cart item count hook (for badge)
export function useCartCount() {
  return useCartStore((s) => s.items.reduce((sum, i) => sum + i.qty, 0));
}

export function useCartSubtotal() {
  return useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.price * i.qty, 0)
  );
}
