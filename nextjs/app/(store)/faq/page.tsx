import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { FAQContent } from "./faq-content";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Everything you need to know about our luggage covers. Sizing, ordering, delivery, payment, and returns.",
};

export default function FAQPage() {
  return (
    <>
      <PageHero
        title={
          <>
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Questions</span>
          </>
        }
        subtitle="Everything you need to know about our luggage covers"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <FAQContent />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0f1224] via-[#1a1f3a] to-[#2d2060] py-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold text-white mb-3 leading-tight">
                Still Have <span className="bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">Questions?</span>
              </h2>
              <p className="text-white/65">
                Our team is ready to help via phone, WhatsApp, or email.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <Link href="/contact">
                <Button variant="teal" size="lg">
                  <i className="fas fa-phone mr-2"></i> Contact Us
                </Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline-white" size="lg">
                  <i className="fas fa-shopping-bag mr-2"></i> Shop Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
