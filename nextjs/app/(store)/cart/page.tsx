import type { Metadata } from "next";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "My Cart",
  description: "Review your cart and proceed to checkout. Buy 4+ covers and get 15% off automatically!",
};

export default function CartPage() {
  return <CartClient />;
}
