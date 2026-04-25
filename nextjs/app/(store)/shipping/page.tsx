import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Shipping and delivery information for Luggage Cover BD. Delivery charges, processing time, COD details.",
};

const DELIVERY_CHARGES = [
  { zone: "Inside Dhaka", charge: "৳ 60", time: "1–2 business days" },
  { zone: "Outside Dhaka (all districts)", charge: "৳ 120", time: "2–4 business days" },
];

const PROCESSING = [
  "Orders are confirmed by phone before shipping",
  "Processing time: 1 business day after confirmation",
  "Tracking number provided once shipped",
];

export default function ShippingPage() {
  return (
    <>
      <PageHero
        title={
          <>
            Shipping <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Policy</span>
          </>
        }
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Shipping" }]}
      />

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-5">
          <div className="bg-white rounded-3xl p-10 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
            <h2 className="font-heading text-2xl font-bold mb-5 text-[#1a1f3a]">Delivery Information</h2>
            <p className="text-[#9fa8c7] mb-8 leading-[1.7]">
              We deliver to all 64 districts of Bangladesh through our trusted courier partners.
            </p>

            <h3 className="font-bold text-lg mb-4 text-[#4A90E2]">Delivery Charges</h3>
            <table className="w-full mb-8 text-[0.875rem]">
              <thead>
                <tr className="bg-[#f8f9ff]">
                  <th className="p-3 text-left border border-[#e1e5f5] font-semibold text-[#1a1f3a]">Zone</th>
                  <th className="p-3 text-left border border-[#e1e5f5] font-semibold text-[#1a1f3a]">Charge</th>
                  <th className="p-3 text-left border border-[#e1e5f5] font-semibold text-[#1a1f3a]">Estimated Time</th>
                </tr>
              </thead>
              <tbody>
                {DELIVERY_CHARGES.map((row, i) => (
                  <tr key={row.zone} className={i === 0 ? "" : "border-t border-[#e1e5f5]"}>
                    <td className="p-3 border border-[#e1e5f5] text-[#9fa8c7]">{row.zone}</td>
                    <td className="p-3 border border-[#e1e5f5] font-semibold text-[#4A90E2]">{row.charge}</td>
                    <td className="p-3 border border-[#e1e5f5] text-[#9fa8c7]">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="font-bold text-lg mb-4 text-[#4A90E2]">Order Processing</h3>
            <ul className="list-disc list-inside space-y-2 mb-8 text-[#9fa8c7]">
              {PROCESSING.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="font-bold text-lg mb-4 text-[#4A90E2]">Cash on Delivery (COD)</h3>
            <p className="text-[#9fa8c7] leading-[1.7]">
              COD is available for all areas. Pay the full amount to the delivery agent when you receive your order.
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-[#9fa8c7] mb-4">Ready to place an order?</p>
            <Link href="/shop" className="inline-block bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white px-8 py-3.5 rounded-full font-semibold text-[0.95rem] hover:shadow-[0_8px_28px_rgba(74,144,226,0.5)] hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(74,144,226,0.4)]">
              <i className="fas fa-shopping-bag mr-2"></i> Browse All Designs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
