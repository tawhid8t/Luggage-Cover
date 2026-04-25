"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductTabsProps {
  productCode: string;
  howtoSteps?: { step: number; title: string; desc: string; img: string }[];
}

const TABS = [
  { id: "details", label: "Product Details" },
  { id: "howto", label: "How to Use" },
  { id: "sizing", label: "Size Guide" },
  { id: "shipping", label: "Shipping & Returns" },
];

export function ProductTabs({ productCode, howtoSteps }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div>
      {/* Tab Nav */}
      <div className="tabs-nav flex gap-1 border-b-2 border-border-light mb-8 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "tab-btn px-5 py-3 font-semibold border-b-2 whitespace-nowrap -mb-px",
              activeTab === tab.id
                ? "tab-btn-active text-brand-blue border-brand-blue"
                : "text-text-muted border-transparent hover:text-brand-blue"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <div className="tab-content">
          <div className="w-full">
            <h3 className="font-bold mb-4">Product Information</h3>
            <table className="info-table w-full">
              <tbody>
                {[
                  ["Material", "High-Quality Polyester + Spandex Blend"],
                  ["Fit Type", "Elastic, 4-Way Stretch"],
                  ["Design Code", productCode],
                  ["Available Sizes", "Small, Medium, Large"],
                  ["Care", "Machine washable, gentle cycle"],
                  ["Origin", "Bangladesh"],
                ].map(([th, td]) => (
                  <tr key={th}>
                    <th className="pr-3 text-left font-medium text-text-muted">{th}</th>
                    <td className="py-2.5">{td}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="hidden md:block mt-10">
            <h3 className="font-bold text-lg mb-4">Why You'll Love It</h3>
            <ul className="space-y-3">
              {[
                "Instantly recognizable on any baggage carousel",
                "Protects from dust, stains, scratches & light water",
                "Stretches to hug your luggage perfectly",
                "Lightweight — barely adds any weight",
                "Easy to remove, wash, and reuse",
                "Makes a perfect travel gift",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <svg className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === "howto" && (
        <div className="howto-steps-inline grid sm:grid-cols-2 gap-6">
          {(howtoSteps && howtoSteps.length > 0 ? howtoSteps : [
            { step: 1, title: "Place on Top", desc: "Lay the cover over the top of your suitcase, handle-hole aligned.", img: "" },
            { step: 2, title: "Pull Down", desc: "Gently stretch and pull the cover down all four sides.", img: "" },
            { step: 3, title: "Adjust Fit", desc: "Align openings for handles and wheels. Spandex ensures a snug fit.", img: "" },
            { step: 4, title: "Done!", desc: "Secure the bottom closure. Your luggage is protected and ready to fly!", img: "" },
          ]).map((s) => (
            <div key={s.step} className="step-inline flex flex-col md:flex-row gap-4 p-5 bg-surface-light rounded-xl text-center md:text-left">
              <div className="si-num w-10 h-10 rounded-full bg-gradient-primary text-white flex items-center justify-center font-extrabold text-lg shrink-0 mx-auto md:mx-0">
                {s.step}
              </div>
              <div>
                <strong className="block font-semibold mb-1">{s.title}</strong>
                <p className="text-sm text-text-muted">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "sizing" && (
        <div className="sizing-table-wrap">
          <h3 className="font-bold mb-5">Luggage Cover Size Guide</h3>
          <table className="sizing-table w-full mb-5">
            <thead>
              <tr>
                {["Cover Size", "Luggage Size Range", "Price", "Best For"].map((h) => (
                  <th key={h} className="bg-gradient-primary text-white p-3 text-left first:rounded-tl-lg last:rounded-tr-lg">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { size: "Small", range: '18" – 20" (45–50 cm)', price: "৳ 990", best: "Cabin / Carry-On bags" },
                { size: "Medium", range: '20" – 24" (50–61 cm)', price: "৳ 1,190", best: "Standard checked bags" },
                { size: "Large", range: '24" – 28" (61–71 cm)', price: "৳ 1,490", best: "Large checked bags & family luggage" },
              ].map((row, i) => (
                <tr key={row.size} className={i === 1 ? "bg-brand-blue/5" : ""}>
                  <td className="p-3 font-semibold">{row.size}</td>
                  <td className="p-3">{row.range}</td>
                  <td className="p-3 font-semibold text-brand-blue">{row.price}</td>
                  <td className="p-3 text-text-muted">{row.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sizing-tip flex items-start gap-2 p-3 bg-brand-blue/5 rounded-xl text-brand-blue">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span><strong>Tip:</strong> If your bag is between sizes, size up for the best stretch coverage.</span>
          </div>
        </div>
      )}

      {activeTab === "shipping" && (
        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="font-bold text-lg mb-4">Delivery</h3>
            <ul className="space-y-3">
              {[
                <><strong>Inside Dhaka:</strong> ৳60 | 1–2 business days</>,
                <><strong>Outside Dhaka:</strong> ৳120 | 2–4 business days</>,
                <><strong>Cash on Delivery (COD)</strong> available nationwide</>,
                <><strong>bKash & Nagad</strong> online payment accepted</>,
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <svg className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Returns & Refunds</h3>
            <ul className="space-y-3 mb-5">
              {[
                "7-day return window from delivery date",
                "Product must be unused and in original condition",
                "Contact us by phone or email to start a return",
                "Refunds processed within 3–5 business days",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <svg className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/returns">
              <Button variant="outline" size="sm">Full Return Policy</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}