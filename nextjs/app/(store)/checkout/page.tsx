'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";
import { ordersAPI, customersAPI } from "@/lib/api";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn, formatPrice, DISTRICTS } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; desc: string; icon: string }[] = [
  { value: "cod", label: "Cash on Delivery", desc: "Pay cash when your order arrives", icon: "💵" },
  { value: "bkash", label: "bKash", desc: "Pay via bKash mobile banking", icon: "📱" },
  { value: "nagad", label: "Nagad", desc: "Pay via Nagad mobile banking", icon: "📲" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getDeliveryCharge, clear } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    district: "",
    area: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [discount, setDiscount] = useState({ amount: 0, applied: false });
  const [deliveryCharge, setDeliveryCharge] = useState(60);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; phone: string } | null>(null);

  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      router.replace("/cart");
      return;
    }
    recalculate();
  }, [items]);

  const recalculate = async () => {
    const d = await getDiscount();
    setDiscount(d);
    const charge = await getDeliveryCharge(form.district || "dhaka");
    setDeliveryCharge(charge);
  };

  const handleDistrictChange = async (district: string) => {
    setForm({ ...form, district });
    const charge = await getDeliveryCharge(district);
    setDeliveryCharge(charge);
  };

  const subtotal = getSubtotal();
  const total = subtotal - discount.amount + deliveryCharge;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Please enter your name.";
    if (!form.phone.trim()) errs.phone = "Please enter a valid phone number.";
    else if (!/^(\+?8801|01)[0-9]{8,10}$/.test(form.phone.replace(/\s|-/g, ""))) {
      errs.phone = "Please enter a valid BD phone number (e.g., 01712345678).";
    }
    if (!form.address.trim()) errs.address = "Please enter your address.";
    if (!form.district) errs.district = "Please select your district.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) {
      toast("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim(),
        shippingAddress: `${form.address.trim()}${form.area ? ", " + form.area.trim() : ""}, ${form.district}`,
        district: form.district,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productCode: i.productCode,
          size: i.size,
          price: i.price,
          qty: i.qty,
          total: i.price * i.qty,
        })),
        subtotal,
        discountAmount: discount.amount,
        deliveryCharge: deliveryCharge,
        totalAmount: total,
        paymentMethod: paymentMethod,
        orderNotes: form.notes.trim(),
      };

      const order = await ordersAPI.create(orderData) as { orderNumber: string };

      try {
        const customers = await customersAPI.getAll();
        const existing = customers.find((c: { phone: string }) => c.phone === form.phone.trim());
        if (existing) {
          await customersAPI.getById(existing.id);
        }
      } catch {}

      clear();
      setOrderSuccess({ orderNumber: order.orderNumber, phone: form.phone });
    } catch (e) {
      console.error("Order failed", e);
      toast("Failed to place order. Please try again or call us.", "error");
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-lg mx-auto px-5 text-center">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="font-heading text-3xl font-black text-[#27ae60] mb-4">
            Order Placed Successfully!
          </h2>
          <p className="text-[#9fa8c7] mb-4">Thank you for your order. Your order number is:</p>
          <div className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white py-4 px-8 rounded-2xl font-bold text-2xl tracking-widest inline-block mb-4 shadow-[0_4px_20px_rgba(74,144,226,0.4)]">
            {orderSuccess.orderNumber}
          </div>
          <p className="text-[#9fa8c7] mb-8">
            We will contact you at <strong>{orderSuccess.phone}</strong> to confirm your order and delivery details.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/shop">
              <Button variant="primary" size="lg"><i className="fas fa-shopping-bag mr-2"></i> Continue Shopping</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg"><i className="fas fa-home mr-2"></i> Back to Home</Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHero
        title={<><span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Checkout</span></>}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />

      <div className="bg-white border-b border-[#e1e5f5] py-3 md:py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-5">
          <div className="flex items-center justify-center gap-0">
            {[
              { step: 1, label: "Cart", done: true },
              { step: 2, label: "Details", done: true },
              { step: 3, label: "Confirm", done: false },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center">
                {i > 0 && <div className="w-8 md:w-16 h-0.5 bg-[#e1e5f5] mx-1 md:mx-2" />}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className={cn(
                    "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[0.65rem] md:text-[0.75rem] font-bold",
                    s.done ? "bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white" : "bg-[#e1e5f5] text-[#9fa8c7]"
                  )}>
                    {s.done ? "✓" : s.step}
                  </div>
                  <span className={cn("text-[0.75rem] md:text-[0.875rem] font-semibold", s.done ? "text-[#4A90E2]" : "text-[#9fa8c7]")}>
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="py-6 md:py-10 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-4 md:px-5">
          <div className="grid lg:grid-cols-[1fr_400px] gap-6 md:gap-8 items-start">
            <div className="space-y-4 md:space-y-5">
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
                <h3 className="font-bold text-sm md:text-base mb-4 md:mb-5 flex items-center gap-2 pb-2 md:pb-3 border-b border-[#e1e5f5]">
                  <span className="text-[#4A90E2]">👤</span> Customer Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className={cn(
                        "w-full px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none",
                        errors.name ? "border-[#e74c3c] focus:ring-2 focus:ring-[rgba(231,76,60,0.1)]" : "border-[#e1e5f5] focus:border-[#4A90E2] focus:ring-2 focus:ring-[rgba(74,144,226,0.15)]"
                      )}
                    />
                    {errors.name && <p className="text-[#e74c3c] text-[0.7rem] md:text-[0.75rem] mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">Phone Number *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+8801XXXXXXXXX"
                      className={cn(
                        "w-full px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none",
                        errors.phone ? "border-[#e74c3c] focus:ring-2 focus:ring-[rgba(231,76,60,0.1)]" : "border-[#e1e5f5] focus:border-[#4A90E2] focus:ring-2 focus:ring-[rgba(74,144,226,0.15)]"
                      )}
                    />
                    {errors.phone && <p className="text-[#e74c3c] text-[0.7rem] md:text-[0.75rem] mt-1">{errors.phone}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">Email <span className="text-[#9fa8c7] font-normal">(optional)</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-[#e1e5f5] rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none focus:border-[#4A90E2] focus:ring-2 focus:ring-[rgba(74,144,226,0.15)]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
                <h3 className="font-bold text-sm md:text-base mb-4 md:mb-5 flex items-center gap-2 pb-2 md:pb-3 border-b border-[#e1e5f5]">
                  <span className="text-[#4A90E2]">📍</span> Delivery Address
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">Full Address *</label>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="House/Road/Area details…"
                      className={cn(
                        "w-full px-3 md:px-4 py-2.5 md:py-3 border-2 rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none resize-none",
                        errors.address ? "border-[#e74c3c]" : "border-[#e1e5f5] focus:border-[#4A90E2]"
                      )}
                    />
                    {errors.address && <p className="text-[#e74c3c] text-[0.7rem] md:text-[0.75rem] mt-1">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">District *</label>
                      <div className="relative">
                        <select
                          value={form.district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className={cn(
                            "w-full px-3 md:px-4 py-2.5 md:py-3 pr-8 border-2 rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none bg-white appearance-none cursor-pointer",
                            errors.district ? "border-[#e74c3c]" : "border-[#e1e5f5] focus:border-[#4A90E2]"
                          )}
                        >
                          <option value="">Select District…</option>
                          <optgroup label="Inside Dhaka (৳60)">
                            <option value="Dhaka">Dhaka</option>
                          </optgroup>
                          <optgroup label="Outside Dhaka (৳120)">
                            {DISTRICTS.filter(d => d !== "Dhaka").map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-[#9fa8c7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.district && <p className="text-[#e74c3c] text-[0.7rem] md:text-[0.75rem] mt-1">{errors.district}</p>}
                    </div>
                    <div>
                      <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">Area/Upazila</label>
                      <input
                        type="text"
                        value={form.area}
                        onChange={(e) => setForm({ ...form, area: e.target.value })}
                        placeholder="Area, Upazila…"
                        className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-[#e1e5f5] rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none focus:border-[#4A90E2]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.8rem] md:text-[0.875rem] font-semibold mb-1.5 md:mb-2 text-[#1a1f3a]">Order Notes <span className="text-[#9fa8c7] font-normal">(optional)</span></label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Any special instructions…"
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-[#e1e5f5] rounded-xl text-[0.8rem] md:text-[0.875rem] transition-all outline-none resize-none focus:border-[#4A90E2]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
                <h3 className="font-bold text-sm md:text-base mb-4 md:mb-5 flex items-center gap-2 pb-2 md:pb-3 border-b border-[#e1e5f5]">
                  <span className="text-[#4A90E2]">💳</span> Payment Method
                </h3>
                <div className="space-y-2 md:space-y-3">
                  {PAYMENT_METHODS.map((pm) => (
                    <label
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={cn(
                        "flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all",
                        paymentMethod === pm.value
                          ? "border-[#4A90E2] bg-[rgba(74,144,226,0.05)]"
                          : "border-[#e1e5f5] hover:border-[rgba(74,144,226,0.5)]"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.value}
                        checked={paymentMethod === pm.value}
                        onChange={() => setPaymentMethod(pm.value)}
                        className="sr-only"
                      />
                      <div className="text-xl md:text-2xl">{pm.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-[0.8rem] md:text-[0.875rem] text-[#1a1f3a]">{pm.label}</div>
                        <div className="text-[0.7rem] md:text-[0.75rem] text-[#9fa8c7]">{pm.desc}</div>
                      </div>
                      <div className={cn(
                        "w-4 h-4 md:w-5 md:h-5 rounded-full border-2 flex items-center justify-center",
                        paymentMethod === pm.value ? "border-[#4A90E2] bg-[#4A90E2]" : "border-[#e1e5f5]"
                      )}>
                        {paymentMethod === pm.value && (
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                  <div className="flex items-start gap-2 md:gap-3 p-3 md:p-4 bg-[rgba(52,152,219,0.05)] border border-[rgba(52,152,219,0.2)] rounded-xl mt-3 text-[0.8rem] md:text-[0.875rem]">
                    <i className="fas fa-info-circle text-[#3498db] mt-0.5"></i>
                    <div>
                      <strong className="block mb-1 text-[#1a1f3a]">Payment Instructions</strong>
                      <p className="text-[#9fa8c7]">
                        Send your total ({formatPrice(total)}) to {paymentMethod === "bkash" ? "bKash" : "Nagad"}: <strong>+01328-152066</strong> (Personal). Use &quot;Order&quot; as reference. Send screenshot on WhatsApp.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="lg:sticky lg:top-24 self-start space-y-4">
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
                  <h3 className="font-bold text-sm md:text-base mb-4 md:mb-5 flex items-center gap-2 pb-2 md:pb-3 border-b border-[#e1e5f5]">
                    <span className="text-[#4A90E2]">🧾</span> Order Summary
                  </h3>

                  <div className="max-h-48 md:max-h-64 overflow-y-auto space-y-2.5 md:space-y-3 mb-3 md:mb-4">
                    {items.map((item) => (
                      <div key={item.key} className="flex items-center gap-2 md:gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#f0f3ff] to-[#e8ecfc] flex items-center justify-center text-xl md:text-2xl shrink-0">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.productName} width={48} height={48} className="rounded-xl object-cover" />
                          ) : (
                            <span>{item.emoji || "🧳"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.8rem] md:text-[0.875rem] font-semibold truncate text-[#1a1f3a]">{item.productName}</div>
                          <div className="text-[0.7rem] md:text-[0.75rem] text-[#9fa8c7]">
                            {item.productCode} · {item.size.charAt(0).toUpperCase() + item.size.slice(1)} × {item.qty}
                          </div>
                        </div>
                        <div className="font-bold text-[0.8rem] md:text-[0.875rem] text-[#4A90E2] shrink-0">
                          {formatPrice(item.price * item.qty)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#e1e5f5] pt-3 md:pt-4 space-y-2 md:space-y-3">
                    <div className="flex justify-between text-[0.8rem] md:text-[0.875rem]">
                      <span className="text-[#9fa8c7]">Subtotal</span>
                      <span className="font-medium text-[#1a1f3a]">{formatPrice(subtotal)}</span>
                    </div>
                    {discount.applied && (
                      <div className="flex justify-between text-[0.8rem] md:text-[0.875rem] text-[#27ae60]">
                        <span>15% Bulk Discount</span>
                        <span className="font-bold">− {formatPrice(discount.amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[0.8rem] md:text-[0.875rem]">
                      <span className="text-[#9fa8c7]">Delivery</span>
                      <span className="font-medium text-[#1a1f3a]">{formatPrice(deliveryCharge)}</span>
                    </div>
                    <div className="border-t border-[#e1e5f5] pt-2 md:pt-3 flex justify-between font-bold text-base md:text-lg">
                      <span className="text-[#1a1f3a]">Total</span>
                      <span className="text-[#4A90E2]">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full mt-4 md:mt-5 bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] text-[#0f1224] py-3 md:py-4 rounded-full font-bold text-[0.85rem] md:text-[0.95rem] flex items-center justify-center gap-2 hover:shadow-[0_8px_28px_rgba(64,224,208,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(64,224,208,0.3)]"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        Place Order
                      </>
                    )}
                  </button>
                  <p className="text-center text-[0.7rem] md:text-[0.75rem] text-[#9fa8c7] mt-2 md:mt-3 flex items-center justify-center gap-1">
                    <i className="fas fa-lock text-[0.6rem] md:text-[0.65rem]"></i>
                    Your information is 100% secure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
