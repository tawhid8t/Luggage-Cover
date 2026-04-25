import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";

export const metadata: Metadata = {
  title: "Return & Refund Policy",
  description:
    "Return and refund policy for Luggage Cover BD. 7-day return window, refund methods, and how to initiate a return.",
};

const RETURN_POLICY = [
  "Unused and unworn",
  "In original condition",
  "In original packaging (if available)",
];

const HOW_TO_RETURN = [
  'Contact us at +01328-152066 or luggagecover24@gmail.com',
  "Provide your order number and reason for return",
  "We will arrange pickup or guide you on how to send it back",
  "Refund processed within 3–5 business days after we receive the item",
];

const REFUND_METHODS = [
  "COD orders: Refunded via bKash or Nagad",
  "Online payments: Refunded to original payment method",
];

const NON_RETURNABLE = [
  "Used or washed covers",
  "Covers with damage caused by customer",
  "Returns after 7 days of delivery",
];

export default function ReturnsPage() {
  return (
    <>
      <PageHero
        title={
          <>
            Return & Refund <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Policy</span>
          </>
        }
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Returns" }]}
      />

      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-5">
          <div className="bg-white rounded-3xl p-10 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5]">
            <h2 className="font-heading text-2xl font-bold mb-5 text-[#1a1f3a]">Return Policy</h2>
            <p className="text-[#9fa8c7] mb-4 leading-[1.7]">
              We accept returns within <strong>7 days</strong> of delivery if the product is:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-8 text-[#9fa8c7]">
              {RETURN_POLICY.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="font-bold text-lg mb-3 text-[#4A90E2]">How to Return</h3>
            <ol className="list-decimal list-inside space-y-2 mb-8 text-[#9fa8c7]">
              {HOW_TO_RETURN.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <h3 className="font-bold text-lg mb-3 text-[#4A90E2]">Refund Methods</h3>
            <ul className="list-disc list-inside space-y-2 mb-8 text-[#9fa8c7]">
              {REFUND_METHODS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3 className="font-bold text-lg mb-3 text-[#4A90E2]">Non-Returnable Items</h3>
            <ul className="list-disc list-inside space-y-2 text-[#9fa8c7]">
              {NON_RETURNABLE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="mt-8 bg-[#f8f9ff] rounded-2xl p-8 text-center border border-[#e1e5f5]">
            <p className="text-[#9fa8c7] mb-4">
              Need help with a return or have questions?
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="tel:+01328152066" className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white px-6 py-3 rounded-full font-semibold text-[0.875rem] hover:shadow-[0_8px_28px_rgba(74,144,226,0.5)] hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(74,144,226,0.4)]">
                📞 Call +01328-152066
              </a>
              <Link href="/contact" className="bg-[#1a1f3a] text-white px-6 py-3 rounded-full font-semibold text-[0.875rem] hover:bg-[#0f1224] hover:shadow-[0_8px_28px_rgba(26,31,58,0.5)] hover:-translate-y-0.5 transition-all shadow-[0_4px_20px_rgba(26,31,58,0.3)]">
                ✉️ Send a Message
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
