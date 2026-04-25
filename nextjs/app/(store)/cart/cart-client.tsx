"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

const DHAKA_CHARGE = 60;
const OUTSIDE_CHARGE = 120;

export function CartClient() {
  const router = useRouter();
  const { items, updateQty, removeItem, clear, getSubtotal, getTotalQty, getDiscount, getDeliveryCharge } = useCartStore();

  const [discount, setDiscount] = useState({ amount: 0, applied: false, percent: 15, minQty: 4 });
  const [deliveryCharge, setDeliveryCharge] = useState(DHAKA_CHARGE);
  const [locationType, setLocationType] = useState<"inside" | "outside">("inside");

  useEffect(() => {
    recalculate();
  }, [items]);

  const recalculate = async () => {
    const d = await getDiscount();
    setDiscount(d);
    const charge = await getDeliveryCharge(locationType === "inside" ? "dhaka" : "outside");
    setDeliveryCharge(charge);
  };

  const handleLocationChange = (type: "inside" | "outside") => {
    setLocationType(type);
    const charge = type === "inside" ? DHAKA_CHARGE : OUTSIDE_CHARGE;
    setDeliveryCharge(charge);
  };

  const subtotal = getSubtotal();
  const totalQty = getTotalQty();
  const total = subtotal - discount.amount + deliveryCharge;
  const minQty = discount.minQty;
  const needed = Math.max(0, minQty - totalQty);

  if (items.length === 0) {
    return (
      <>
        <PageHero
          title={<><span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Cart</span></>}
          breadcrumb={[{ label: "Home", href: "/" }, { label: "Cart" }]}
        />
        <section className="py-20 bg-white">
          <div className="max-w-2xl mx-auto px-5 text-center">
            <div className="text-7xl mb-6">🛒</div>
            <h2 className="font-heading text-3xl font-bold mb-3 text-[#1a1f3a]">Your cart is empty</h2>
            <p className="text-[#9fa8c7] mb-8">
              Looks like you haven&apos;t added any covers yet. Explore our stunning designs!
            </p>
            <Link href="/shop">
              <Button variant="primary" size="lg">
                <i className="fas fa-shopping-bag mr-2"></i> Browse All Designs
              </Button>
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        title={<><span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Cart</span></>}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Cart" }]}
      />

      <section className="py-8 md:py-12 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-5">
          <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4 md:mb-5">
                <h2 className="font-bold text-base md:text-lg text-[#1a1f3a]">
                  Shopping Cart ({items.length} item{items.length !== 1 ? "s" : ""})
                </h2>
                <button
                  onClick={() => { if (confirm("Remove all items?")) clear(); }}
                  className="text-[#e74c3c] text-[0.8rem] md:text-[0.875rem] font-semibold flex items-center gap-1.5 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All
                </button>
              </div>

              {discount.applied && (
                <div className="flex items-center gap-3 p-3 bg-[rgba(39,174,96,0.1)] border border-[rgba(39,174,96,0.2)] rounded-xl text-[#27ae60] text-[0.8rem] md:text-[0.875rem] font-medium mb-4 md:mb-5">
                  <span className="text-lg">🎉</span>
                  <span>
                    <strong>15% bulk discount applied!</strong> You&apos;re saving {formatPrice(discount.amount)}
                  </span>
                </div>
              )}

              <div className="space-y-0">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 py-4 border-b border-[#e1e5f5] last:border-b-0"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-[#f0f3ff] to-[#e8ecfc] flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.productName} width={64} height={64} className="rounded-xl object-cover" />
                      ) : (
                        <span>{item.emoji || "🧳"}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <div className="font-bold text-[0.8rem] sm:text-[0.875rem] text-[#1a1f3a]">{item.productName}</div>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                        <span className="text-[0.65rem] sm:text-[0.7rem] bg-[rgba(74,144,226,0.1)] text-[#4A90E2] px-1.5 sm:px-2 py-0.5 rounded-full font-bold">{item.productCode}</span>
                        <span className="text-[0.65rem] sm:text-[0.7rem] bg-[rgba(123,104,238,0.1)] text-[#7B68EE] px-1.5 sm:px-2 py-0.5 rounded-full font-bold">{item.size.charAt(0).toUpperCase() + item.size.slice(1)}</span>
                      </div>
                      <div className="text-[0.7rem] sm:text-[0.75rem] text-[#9fa8c7] mt-1">{formatPrice(item.price)} each</div>
                    </div>
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3 mt-2 sm:mt-0">
                      <div className="flex items-center border border-[#e1e5f5] rounded-lg overflow-hidden shrink-0">
                        <button onClick={() => updateQty(item.key, item.qty - 1)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#f8f9ff] hover:bg-[#4A90E2] hover:text-white transition-all text-[0.8rem] sm:text-[0.875rem]">−</button>
                        <span className="w-10 sm:w-12 text-center font-bold text-[0.8rem] sm:text-[0.875rem]">{item.qty}</span>
                        <button onClick={() => updateQty(item.key, item.qty + 1)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-[#f8f9ff] hover:bg-[#4A90E2] hover:text-white transition-all text-[0.8rem] sm:text-[0.875rem]">+</button>
                      </div>
                      <div className="font-extrabold text-[0.8rem] sm:text-[0.875rem] text-[#4A90E2] min-w-[60px] sm:min-w-[80px] text-right">{formatPrice(item.price * item.qty)}</div>
                      <button
                        onClick={() => removeItem(item.key)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[rgba(231,76,60,0.1)] text-[#e74c3c] flex items-center justify-center hover:bg-[#e74c3c] hover:text-white transition-all shrink-0"
                      >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Link href="/shop" className="inline-flex items-center gap-2 text-[#4A90E2] text-[0.875rem] font-semibold hover:underline">
                  <i className="fas fa-arrow-left"></i>
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5] lg:sticky lg:top-24">
                <h3 className="font-bold text-base md:text-lg mb-4 md:mb-5 text-[#1a1f3a]">Order Summary</h3>

                <div className="mb-4 md:mb-5">
                  <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-2 text-[#1a1f3a]">Delivery Location</label>
                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={() => handleLocationChange("inside")}
                      className={cn(
                        "flex-1 py-2.5 md:py-3 rounded-xl text-[0.8rem] md:text-[0.875rem] font-semibold border-2 transition-all",
                        locationType === "inside" ? "border-[#4A90E2] bg-[rgba(74,144,226,0.05)] text-[#4A90E2]" : "border-[#e1e5f5] hover:border-[rgba(74,144,226,0.5)] text-[#9fa8c7]"
                      )}
                    >
                      Inside Dhaka
                      <span className="block text-[0.7rem] md:text-[0.75rem] font-normal">{formatPrice(DHAKA_CHARGE)}</span>
                    </button>
                    <button
                      onClick={() => handleLocationChange("outside")}
                      className={cn(
                        "flex-1 py-2.5 md:py-3 rounded-xl text-[0.8rem] md:text-[0.875rem] font-semibold border-2 transition-all",
                        locationType === "outside" ? "border-[#4A90E2] bg-[rgba(74,144,226,0.05)] text-[#4A90E2]" : "border-[#e1e5f5] hover:border-[rgba(74,144,226,0.5)] text-[#9fa8c7]"
                      )}
                    >
                      Outside Dhaka
                      <span className="block text-[0.7rem] md:text-[0.75rem] font-normal">{formatPrice(OUTSIDE_CHARGE)}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5 md:space-y-3 mb-4 md:mb-5">
                  <div className="flex justify-between text-[0.8rem] md:text-[0.875rem]">
                    <span className="text-[#9fa8c7]">Subtotal ({totalQty} items)</span>
                    <span className="font-medium text-[#1a1f3a]">{formatPrice(subtotal)}</span>
                  </div>
                  {discount.applied && (
                    <div className="flex justify-between text-[0.8rem] md:text-[0.875rem] text-[#27ae60]">
                      <span className="flex items-center gap-1.5">
                        <i className="fas fa-tag text-[0.7rem] md:text-[0.75rem]"></i>
                        15% Bulk Discount
                      </span>
                      <span className="font-bold">− {formatPrice(discount.amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[0.8rem] md:text-[0.875rem]">
                    <span className="text-[#9fa8c7]">Delivery</span>
                    <span className="font-medium text-[#1a1f3a]">{formatPrice(deliveryCharge)}</span>
                  </div>
                  <div className="border-t border-[#e1e5f5] pt-2.5 md:pt-3 flex justify-between font-bold text-base md:text-lg">
                    <span className="text-[#1a1f3a]">Total</span>
                    <span className="text-[#4A90E2]">{formatPrice(total)}</span>
                  </div>
                </div>

                {!discount.applied && needed > 0 && (
                  <div className="flex items-center gap-2 p-2.5 md:p-3 bg-[rgba(74,144,226,0.05)] border border-[rgba(74,144,226,0.15)] rounded-xl text-[0.8rem] md:text-[0.875rem] text-[#4A90E2] mb-3 md:mb-4">
                    <i className="fas fa-info-circle"></i>
                    Add <strong>{needed} more</strong> item{needed !== 1 ? "s" : ""} to get <strong>15% off!</strong>
                  </div>
                )}

                <Link href="/checkout">
                  <Button variant="teal" size="lg" className="w-full justify-center">
                    <i className="fas fa-lock mr-2"></i> Proceed to Checkout
                  </Button>
                </Link>

                <div className="flex justify-around pt-4 md:pt-5 mt-3 md:mt-4 border-t border-[#e1e5f5]">
                  {[{ icon: "🚚", label: "Fast Delivery" }, { icon: "🛡️", label: "Secure Order" }, { icon: "↩️", label: "Easy Returns" }].map((t) => (
                    <div key={t.label} className="flex flex-col items-center gap-1 text-[0.7rem] md:text-[0.75rem] text-[#9fa8c7]">
                      <span className="text-base md:text-lg">{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 md:p-4 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5] text-center">
                <p className="text-[0.7rem] md:text-[0.75rem] text-[#9fa8c7] mb-2 md:mb-3 font-semibold">We Accept</p>
                <div className="flex justify-center gap-2 md:gap-3">
                  {["COD", "bKash", "Nagad"].map((p) => (
                    <span key={p} className="px-2 md:px-3 py-1 md:py-1.5 bg-[#f8f9ff] rounded-lg text-[0.7rem] md:text-[0.75rem] font-bold text-[#9fa8c7]">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
