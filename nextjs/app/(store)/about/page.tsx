import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Luggage Cover BD — Bangladesh's trusted luggage cover brand. 14+ designs, 3 sizes, COD available.",
};

const STATS = [
  { value: "14+", label: "Unique Designs" },
  { value: "3", label: "Size Options" },
  { value: "64", label: "Districts Served" },
  { value: "COD", label: "Pay on Delivery" },
];

const VALUES = [
  {
    icon: "⭐",
    gradient: "from-[#4A90E2] to-[#7B68EE]",
    title: "Quality First",
    desc: "Every cover is made with premium Polyester + Spandex blend. We never compromise on material quality.",
  },
  {
    icon: "😊",
    gradient: "from-[#40E0D0] to-[#4A90E2]",
    title: "Customer Happiness",
    desc: "Your satisfaction is our priority. We're here to help before, during, and after your purchase.",
  },
  {
    icon: "🎨",
    gradient: "from-[#7B68EE] to-[#9B59B6]",
    title: "Unique Designs",
    desc: "We curate designs that actually stand out. From sporty to elegant, there's a cover for every traveler.",
  },
];

type ContactLine = { text: string; href?: string };

const CONTACT_CARDS: Array<{ icon: string; title: string; lines: ContactLine[] }> = [
  {
    icon: "📞",
    title: "Phone",
    lines: [
      { text: "+01328-152066", href: "tel:+01328152066" },
      { text: "+01788-039222", href: "tel:+01788039222" },
    ],
  },
  {
    icon: "📧",
    title: "Email",
    lines: [
      { text: "luggagecover24@gmail.com", href: "mailto:luggagecover24@gmail.com" },
    ],
  },
  {
    icon: "📍",
    title: "Location",
    lines: [{ text: "Dhaka, Bangladesh" }],
  },
  {
    icon: "👍",
    title: "Social",
    lines: [
      { text: "Facebook: Luggage Cover BD", href: "#" },
      { text: "Instagram: @luggagecoverbd", href: "#" },
    ],
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title={
          <>
            About <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Us</span>
          </>
        }
        subtitle="Bangladesh's trusted luggage cover brand"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      {/* Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-[rgba(74,144,226,0.1)] text-[#4A90E2] text-[0.75rem] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4">
                Our Story
              </span>
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">
                  Who We Are
                </span>
              </h2>
              <div className="space-y-4 text-[#9fa8c7] leading-[1.7]">
                <p>
                  Luggage Cover BD was born from a simple frustration — standing at a
                  baggage carousel, watching identical black suitcases roll by, wondering
                  which one is yours.
                </p>
                <p>
                  We set out to solve that. Based in Dhaka, Bangladesh, we design and
                  deliver premium luggage covers that combine real protection with
                  standout style.
                </p>
                <p>
                  Every cover is crafted from high-quality Polyester + Spandex blend —
                  durable, elastic, easy to fit in seconds. Our designs range from
                  world maps to football legends, from beach vibes to executive prestige.
                </p>
                <p>
                  We&apos;re proud to serve travelers across all of Bangladesh with fast
                  delivery, Cash on Delivery, and genuine quality you can feel.
                </p>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1224] rounded-3xl p-10 grid grid-cols-2 gap-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-heading text-4xl font-black bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent mb-2">
                    {s.value}
                  </div>
                  <div className="text-white/60 text-[0.875rem]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-[#f8f9ff]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-4">
              Our <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Values</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(74,144,226,0.2)] transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center text-[1.5rem] mx-auto mb-5 text-white`}
                >
                  {v.icon}
                </div>
                <h3 className="font-heading font-bold text-[1.1rem] mb-3">{v.title}</h3>
                <p className="text-[#9fa8c7] text-[0.9rem] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-4">
              Contact <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Information</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_CARDS.map((c) => (
              <div
                key={c.title}
                className="bg-white rounded-2xl p-7 text-center shadow-[0_2px_16px_rgba(0,0,0,0.08)] border border-[#e1e5f5] hover:shadow-[0_8px_32px_rgba(74,144,226,0.15)] transition-all"
              >
                <div className="text-3xl mb-4">{c.icon}</div>
                <h4 className="font-bold mb-3 text-[#1a1f3a]">{c.title}</h4>
                {c.lines.map((line, i) =>
                  line.href ? (
                    <a
                      key={i}
                      href={line.href}
                      className="block text-[0.875rem] text-[#9fa8c7] hover:text-[#4A90E2] transition-colors mb-1"
                    >
                      {line.text}
                    </a>
                  ) : (
                    <span key={i} className="block text-[0.875rem] text-[#9fa8c7] mb-1">
                      {line.text}
                    </span>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-br from-[#0f1224] via-[#1a1f3a] to-[#2d2060] py-20">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold text-white mb-3 leading-tight">
                Ready to Travel <span className="bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">in Style?</span>
              </h2>
              <p className="text-white/65 max-w-md">
                Browse our 14 unique designs and find your perfect travel companion.
              </p>
            </div>
            <Link href="/shop">
              <Button variant="teal" size="lg">
                <i className="fas fa-shopping-bag mr-2"></i> Shop Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
