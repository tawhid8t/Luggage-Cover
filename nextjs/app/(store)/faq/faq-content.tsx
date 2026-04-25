"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  question: string;
  answer: React.ReactNode;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("border border-[#e1e5f5] rounded-xl overflow-hidden mb-2 bg-white", open && "bg-gradient-to-br from-[#f0f4ff]/50 to-[#f5f0ff]/50")}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-[0.875rem] transition-all",
          open ? "bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff] text-[#4A90E2]" : "bg-white text-[#1a1f3a] hover:bg-[#f8f9ff]"
        )}
      >
        <span>{question}</span>
        <svg
          className={cn("w-4 h-4 shrink-0 text-[#4A90E2] transition-transform duration-300", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={cn("overflow-hidden", !open && "hidden")}>
        <div className="px-5 py-4 border-t border-[#e1e5f5] text-[0.875rem] text-[#9fa8c7] leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  );
}

interface FAQGroupProps {
  id: string;
  emoji: string;
  title: string;
  items: FAQItemProps[];
}

function FAQGroup({ emoji, title, items }: FAQGroupProps) {
  return (
    <div>
      <h3 className="font-heading text-lg font-bold mb-4 pb-3 border-b-2 border-[#e1e5f5] text-[#1a1f3a]">
        {emoji} {title}
      </h3>
      {items.map((item, i) => (
        <FAQItem key={i} question={item.question} answer={item.answer} />
      ))}
    </div>
  );
}

const SIZES = [
  { size: "Small", range: '18" – 20" (45–50 cm)', price: "৳ 990" },
  { size: "Medium", range: '20" – 24" (50–61 cm)', price: "৳ 1,190" },
  { size: "Large", range: '24" – 28" (61–71 cm)', price: "৳ 1,490" },
];

const FAQ_DATA: FAQGroupProps[] = [
  {
    id: "sizing",
    emoji: "📏",
    title: "Sizing Guide",
    items: [
      {
        question: "How do I choose the right size?",
        answer: (
          <div>
            <p className="mb-3">Measure your luggage height (from wheels to handle, not including the retractable handle). Then match to our size guide:</p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f8f9ff]">
                  <th className="p-2 text-left border border-[#e1e5f5]">Cover Size</th>
                  <th className="p-2 text-left border border-[#e1e5f5]">Luggage Height</th>
                  <th className="p-2 text-left border border-[#e1e5f5]">Price</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((s) => (
                  <tr key={s.size}>
                    <td className="p-2 border border-[#e1e5f5] font-semibold text-[#1a1f3a]">{s.size}</td>
                    <td className="p-2 border border-[#e1e5f5] text-[#9fa8c7]">{s.range}</td>
                    <td className="p-2 border border-[#e1e5f5] text-[#4A90E2] font-semibold">{s.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      },
      {
        question: "What if my luggage is between sizes?",
        answer: (
          <p>
            If your bag falls between sizes, we recommend sizing <strong>up</strong>. The Spandex blend stretches, but it&apos;s always better to have a slightly looser fit than one that&apos;s too tight and difficult to put on.
          </p>
        ),
      },
      {
        question: "Will the cover fit my hardshell suitcase?",
        answer: (
          <p>
            Yes! Our covers are designed to fit both hardshell and softshell luggage. The elastic Polyester + Spandex blend stretches to conform to different luggage shapes.
          </p>
        ),
      },
    ],
  },
  {
    id: "product",
    emoji: "🧳",
    title: "Product",
    items: [
      {
        question: "What material are the covers made from?",
        answer: (
          <div>
            <p className="mb-2">All our covers are made from a premium <strong>Polyester + Spandex blend</strong>. This gives you:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Strong, tear-resistant protection</li>
              <li>4-way elastic stretch for a snug fit</li>
              <li>Dust-proof and water-resistant surface</li>
              <li>Vibrant, fade-resistant printing</li>
              <li>Machine washable for easy care</li>
            </ul>
          </div>
        ),
      },
      {
        question: "How do I put on the cover?",
        answer: (
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li><strong>Place on top</strong> — lay over the top of your suitcase, align handle hole</li>
            <li><strong>Pull down</strong> — gently stretch over all four sides</li>
            <li><strong>Adjust fit</strong> — align wheel and handle openings</li>
            <li><strong>Secure bottom</strong> — done! Fits in just seconds.</li>
          </ol>
        ),
      },
      {
        question: "How do I wash and care for the cover?",
        answer: (
          <p>
            Machine wash on a gentle/delicate cycle with cold water. Do not use bleach. Tumble dry low or air dry. Do not iron directly on the printed surface.
          </p>
        ),
      },
    ],
  },
  {
    id: "ordering",
    emoji: "🛒",
    title: "Ordering",
    items: [
      {
        question: "How do I place an order?",
        answer: (
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Browse designs on our Shop page</li>
            <li>Select your design and click to view</li>
            <li>Choose your size — the price updates automatically</li>
            <li>Add to cart</li>
            <li>Go to checkout, enter your details</li>
            <li>Choose COD or online payment</li>
            <li>Place order and we&apos;ll confirm via phone!</li>
          </ol>
        ),
      },
      {
        question: "How does the 15% bulk discount work?",
        answer: (
          <p>
            Add <strong>4 or more covers</strong> to your cart and the 15% discount applies <strong>automatically</strong> at checkout — no coupon code needed. Mix and match any designs and sizes!
          </p>
        ),
      },
      {
        question: "Can I order by phone or WhatsApp?",
        answer: (
          <p>
            Yes! You can call or WhatsApp us at <strong>+01328-152066</strong> or <strong>+01788-039222</strong> to place an order directly. Mention the design code (e.g., a1b23) and size.
          </p>
        ),
      },
    ],
  },
  {
    id: "delivery",
    emoji: "🚚",
    title: "Delivery",
    items: [
      {
        question: "What are the delivery charges?",
        answer: (
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Inside Dhaka:</strong> ৳60 | Estimated 1–2 business days</li>
            <li><strong>Outside Dhaka:</strong> ৳120 | Estimated 2–4 business days</li>
          </ul>
        ),
      },
      {
        question: "Do you deliver to all districts in Bangladesh?",
        answer: (
          <p>Yes! We deliver nationwide across all 64 districts of Bangladesh through our courier partners.</p>
        ),
      },
    ],
  },
  {
    id: "payment",
    emoji: "💳",
    title: "Payment",
    items: [
      {
        question: "What payment methods do you accept?",
        answer: (
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Cash on Delivery (COD)</strong> — pay when you receive your order</li>
            <li><strong>bKash</strong> — mobile banking payment</li>
            <li><strong>Nagad</strong> — mobile banking payment</li>
          </ul>
        ),
      },
    ],
  },
  {
    id: "returns",
    emoji: "↩️",
    title: "Returns & Refunds",
    items: [
      {
        question: "What is your return policy?",
        answer: (
          <p>
            We accept returns within <strong>7 days</strong> of delivery if the product is unused and in original condition. Contact us by phone or email to start a return. See our full{" "}
            <a href="/returns" className="text-[#4A90E2] underline">Return Policy</a>.
          </p>
        ),
      },
      {
        question: "How do I contact you for support?",
        answer: (
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>📞 Phone/WhatsApp: <strong>+01328-152066</strong> or <strong>+01788-039222</strong></li>
            <li>📧 Email: <strong>luggagecover24@gmail.com</strong></li>
            <li>📱 Instagram: <strong>@luggagecoverbd</strong></li>
            <li>👍 Facebook: <strong>Luggage Cover BD</strong></li>
          </ul>
        ),
      },
    ],
  },
];

const CATEGORIES = [
  { id: "sizing", label: "📏 Sizing" },
  { id: "product", label: "🧳 Product" },
  { id: "ordering", label: "🛒 Ordering" },
  { id: "delivery", label: "🚚 Delivery" },
  { id: "payment", label: "💳 Payment" },
  { id: "returns", label: "↩️ Returns" },
];

export function FAQContent() {
  const [activeCategory, setActiveCategory] = useState("sizing");

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-10">
      {/* Sidebar Nav */}
      <aside className="bg-white rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5] lg:sticky lg:top-24 self-start">
        <h4 className="font-bold text-xs text-[#9fa8c7] uppercase tracking-wider mb-4">
          Categories
        </h4>
        <ul className="space-y-1">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <a
                href={`#${cat.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveCategory(cat.id);
                  document.getElementById(cat.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-[0.875rem] transition-all",
                  activeCategory === cat.id
                    ? "bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff] text-[#4A90E2] font-semibold"
                    : "text-[#9fa8c7] hover:bg-[#f8f9ff] hover:text-[#1a1f3a]"
                )}
              >
                {cat.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* FAQ Content */}
      <div className="space-y-10">
        {FAQ_DATA.map((group) => (
          <div key={group.id} id={group.id}>
            <FAQGroup {...group} />
          </div>
        ))}
      </div>
    </div>
  );
}
