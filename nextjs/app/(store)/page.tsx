import type { Metadata } from "next";
import Link from "next/link";
import { productsAPI, settingsAPI, SettingsAPI } from "@/lib/api";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { FacebookReviews } from "@/components/facebook-reviews";

export const metadata: Metadata = {
  title: "Luggage Cover BD – Your Travel Buddy",
  description:
    "Shop premium luggage covers in Bangladesh. Protect & style your bag with our Polyester+Spandex covers. 14 designs, 3 sizes (S/M/L). COD available. Fast delivery in Dhaka.",
  keywords: [
    "buy luggage cover Bangladesh",
    "luggage cover online BD",
    "travel bag cover",
    "premium luggage protector",
    "luggage skin Bangladesh",
  ],
  openGraph: {
    title: "Luggage Cover BD – Your Travel Buddy",
    description:
      "14 premium luggage cover designs in Bangladesh. 3 sizes, COD available. Fast delivery.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export const dynamic = "force-dynamic";

async function getSettings() {
  try {
    return await settingsAPI.load();
  } catch {
    return {};
  }
}

async function getFeaturedProducts() {
  try {
    const all = await productsAPI.getAll(true);
    const featured = all.filter((p) => p.featured).slice(0, 4);
    return featured.length > 0 ? featured : all.slice(0, 4);
  } catch {
    return [];
  }
}

const SIZE_CARDS = [
  { size: "Small", range: '18" – 20"', price: 990, popular: false },
  { size: "Medium", range: '20" – 24"', price: 1190, popular: true },
  { size: "Large", range: '24" – 28"', price: 1490, popular: false },
];

const VALUE_CARDS = [
  {
    icon: "👁️",
    gradient: "from-brand-blue to-brand-purple",
    title: "Easy to Spot",
    desc: "Instantly recognize your bag at the baggage carousel with our distinctive, vibrant designs.",
  },
  {
    icon: "🛡️",
    gradient: "from-brand-teal to-brand-blue",
    title: "Maximum Protection",
    desc: "Guard against dust, stains, scratches, and water damage throughout your entire journey.",
  },
  {
    icon: "✨",
    gradient: "from-brand-purple to-purple-600",
    title: "Fits in Seconds",
    desc: "Our elastic Polyester + Spandex blend stretches to fit perfectly. No tools. No effort. Instant.",
  },
  {
    icon: "🎨",
    gradient: "from-yellow-500 to-orange-500",
    title: "14 Unique Designs",
    desc: "From World Travel to Beach Breeze — choose a design that tells your travel story.",
  },
  {
    icon: "🚚",
    gradient: "from-green-500 to-emerald-500",
    title: "Nationwide Delivery",
    desc: "We deliver to all districts in Bangladesh. COD available — pay when you receive!",
  },
  {
    icon: "🏷️",
    gradient: "from-red-500 to-rose-500",
    title: "15% Bulk Discount",
    desc: "Traveling with family? Buy 4 or more covers and save 15% automatically at checkout.",
  },
];

export default async function HomePage() {
  const settings = await getSettings();
  const settingsApi = new SettingsAPI();
  await settingsApi.loadAll();
  const fbReviews = settingsApi.getFbReviews();
  const featured = await getFeaturedProducts();
  const howtoSteps = settingsApi.getHowToSteps();

  return (
    <>
      {/* Hero Section */}
    <section className="bg-gradient-to-br from-[#0f1224] via-[#1a1f3a] to-[#2d2060] text-white py-20 lg:py-24 min-h-[90vh] overflow-hidden relative flex items-center">
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[#4A90E2] blur-[80px] opacity-[0.25] -top-32 -left-32" style={{ animation: 'orbFloat 8s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#7B68EE] blur-[80px] opacity-[0.25] bottom-0 right-0" style={{ animation: 'orbFloat 10s ease-in-out infinite reverse' }} />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-[#40E0D0] blur-[80px] opacity-[0.25] top-1/2 left-1/2" style={{ animation: 'orbFloat 12s ease-in-out infinite 2s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-5 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-[60px] items-center">
            {/* Hero Text */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-[#40E0D0] text-[0.8rem] font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide">
                <i className="fas fa-star"></i> Bangladesh&apos;s #1 Luggage Cover Store
              </div>
              <h1 className="font-heading text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[1.1] mb-5">
{settings.hero_title ? (
  <>
    {settings.hero_title.split(" ")[0]} <span className="bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">{settings.hero_title.split(" ")[1]}</span> {settings.hero_title.split(" ").slice(2).join(" ")}
  </>
) : (
  <>
Your <span className="bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">Travel</span><br/>
Buddy <span className="inline-flex items-center justify-center w-[1.2em] h-[1.2em] align-middle shrink-0"><img src="/bg-removed.png" alt="" className="w-full h-full object-contain" /></span>
</>
)}
              </h1>
              <p className="text-[1.15rem] text-white/75 mb-7 leading-relaxed">
                {settings.hero_subtitle || "Protect & Personalize Your Luggage — Elastic Fit, Stunning Designs"}
              </p>
              <ul className="space-y-2.5 mb-8 flex flex-col gap-2.5">
                {[
                  "Instantly recognizable at baggage claim",
                  "Protects from dust, stains & scratches",
                  "Fits in seconds — elastic Spandex blend",
                  "14 stunning designs to choose from",
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-[0.95rem] text-white/85">
                    <i className="fas fa-check-circle text-[#40E0D0] text-[0.9rem]"></i>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4 flex-wrap mb-6">
                <Link href="/shop">
                  <Button variant="teal" size="lg">
                    <i className="fas fa-shopping-bag"></i> Shop Now
                  </Button>
                </Link>
                <a href="#featured">
                  <Button variant="outline-white" size="lg">
                    View Designs <i className="fas fa-arrow-down ml-1"></i>
                  </Button>
                </a>
              </div>
              <div className="inline-flex items-center gap-2 bg-[rgba(64,224,208,0.1)] border border-[rgba(64,224,208,0.3)] text-[#40E0D0] text-[0.85rem] font-semibold px-4 py-2 rounded-xl">
                <span>🎁</span>
                <strong>Buy 4 items → Get 15% OFF automatically</strong>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hidden lg:flex flex-col items-center gap-6">
              <div className="relative w-[300px] h-[300px]">
                <div className="absolute top-0 left-0 w-[160px] h-[160px] rounded-[24px] bg-gradient-to-br from-[#1a1f3a] to-[#2d2060] rotate-[-8deg] flex items-center justify-center text-5xl shadow-2xl border border-white/10" style={{ animation: 'cardFloat1 6s ease-in-out infinite' }}>
                  🌍
                </div>
                <div className="absolute bottom-0 right-0 w-[160px] h-[160px] rounded-[24px] bg-gradient-to-br from-[#2d2060] to-[#1a3a5c] rotate-[6deg] flex items-center justify-center text-5xl shadow-2xl border border-white/10" style={{ animation: 'cardFloat2 7s ease-in-out infinite' }}>
                  🏖️
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[200px] h-[200px] rounded-[24px] bg-gradient-to-br from-[#4A90E2] to-[#7B68EE] flex flex-col items-center justify-center text-center shadow-2xl border-2 border-white/20" style={{ animation: 'mainCardFloat 5s ease-in-out infinite' }}>
                  <span className="text-[4.5rem] mb-2">🧳</span>
                  <span className="text-[0.7rem] font-bold bg-white/20 px-3 py-1 rounded-full">✨ Premium Cover</span>
                </div>
              </div>
              {/* Hero Stats */}
              <div className="flex gap-6 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl">
                <div className="text-center">
                  <span className="block font-heading font-extrabold text-[1.4rem] bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">14+</span>
                  <small className="text-[0.75rem] text-white/60">Designs</small>
                </div>
                <div className="text-center">
                  <span className="block font-heading font-extrabold text-[1.4rem] bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">3</span>
                  <small className="text-[0.75rem] text-white/60">Sizes</small>
                </div>
                <div className="text-center">
                  <span className="block font-heading font-extrabold text-[1.4rem] bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">COD</span>
                  <small className="text-[0.75rem] text-white/60">Available</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Size & Pricing */}
      <section className="py-10 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08)] relative z-10">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-6">
            {SIZE_CARDS.map((card) => (
              <div
                key={card.size}
                className={`text-center p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg relative ${
                  card.popular
                    ? "border-[#4A90E2] bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff] transform scale-[1.03] shadow-lg cursor-pointer"
                    : "border-[#e1e5f5] hover:border-[#4A90E2] cursor-pointer"
                }`}
              >
                {card.popular && (
                  <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] text-white text-[0.75rem] font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="text-3xl mb-2">🏷️</div>
                <div className="font-heading font-extrabold text-[1.4rem] text-[#1a1f3a] mb-1">
                  {card.size}
                </div>
                <div className="text-[0.85rem] text-[#9fa8c7] mb-4">{card.range}</div>
                <div className="font-heading text-[2rem] font-black bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent mb-5">
                  ৳ {card.price.toLocaleString()}
                </div>
                <Link href="/shop">
                  <Button variant={card.popular ? "teal" : "primary"} size="sm">
                    Shop {card.size}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section id="featured" className="py-20 bg-[#f8f9ff]">
          <div className="max-w-7xl mx-auto px-5">
            <div className="text-center mb-14">
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-4">
                Featured <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Designs</span>
              </h2>
              <p className="text-[#9fa8c7] max-w-lg mx-auto text-[1.1rem]">
                Handpicked bestsellers — loved by travelers across Bangladesh
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 2} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/shop">
                <Button variant="primary" size="lg">
                  View All 14 Designs <i className="fas fa-arrow-right ml-2"></i>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-4">
              Why <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Luggage Cover BD?</span>
            </h2>
            <p className="text-[1.1rem] text-[#9fa8c7] max-w-[600px] mx-auto">
              Everything you need to travel with style and confidence
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {VALUE_CARDS.map((card) => (
              <div
                key={card.title}
                className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(74,144,226,0.2)] transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-[1.5rem] mx-auto mb-5 text-white`}
                >
                  {card.icon}
                </div>
                <h3 className="font-heading font-bold text-[1.1rem] mb-2.5">{card.title}</h3>
                <p className="text-[#9fa8c7] text-[0.9rem] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 bg-gradient-to-br from-[#1a1f3a] to-[#0f1224]">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-4 text-white">
              How to Put It On — <span className="bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">4 Easy Steps</span>
            </h2>
            <p className="text-white/60 max-w-lg mx-auto text-[1.1rem]">
              Ready in just seconds. No tools. No hassle.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howtoSteps.map((item) => (
              <div key={item.step} className="bg-white/[0.05] rounded-2xl overflow-hidden text-center border border-white/[0.08] hover:bg-white/[0.09] transition-all duration-300 hover:-translate-y-1 relative hover:border-[rgba(64,224,208,0.3)]">
                <div className="absolute top-3 left-3 text-[1.4rem] font-black bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent opacity-80 z-10">0{item.step}</div>
                <div className="w-full aspect-[4/3] bg-white/[0.04] flex items-center justify-center overflow-hidden">
                  {item.img ? (
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-400 hover:scale-105" />
                  ) : (
                    <span className="text-[3.5rem]">
                      {item.step === 1 ? "👆" : item.step === 2 ? "👇" : item.step === 3 ? "🔄" : "✅"}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-bold text-[1rem] text-white mb-2 px-5 mt-4">{item.title}</h3>
                <p className="text-white/60 text-[0.875rem] leading-relaxed px-5 pb-5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Material */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-[60px] items-center">
            <div>
              <div className="inline-block bg-[rgba(74,144,226,0.15)] text-[#4A90E2] text-[0.75rem] font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
                Premium Quality
              </div>
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold mb-5 leading-tight">
                High-Quality<br />
                <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Polyester + Spandex Blend</span>
              </h2>
              <p className="text-[#9fa8c7] mb-6 leading-[1.7]">
                Our covers are made from a premium Polyester + Spandex blend — the perfect combination of durability, flexibility, and style. The elastic fabric stretches to hug your luggage like a second skin, protecting it from every angle.
              </p>
              <ul className="space-y-3 mb-8 flex flex-col gap-3">
                {[
                  "Durable, tear-resistant polyester",
                  "4-way elastic Spandex stretch",
                  "Dust-proof & water-resistant",
                  "Vibrant, fade-resistant print",
                  "Machine washable",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[0.95rem] text-[#9fa8c7]">
                    <i className="fas fa-check text-[#4A90E2]"></i>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/shop">
                <Button variant="primary" size="lg"><i className="fas fa-shopping-bag"></i> Shop All Designs</Button>
              </Link>
            </div>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "🧵", title: "Polyester", desc: "Strong & durable base" },
                  { icon: "🤸", title: "Spandex", desc: "4-way elastic stretch" },
                  { icon: "🎨", title: "HD Print", desc: "Fade-resistant colors" },
                  { icon: "🛡️", title: "Protection", desc: "Dust, stain & scratch proof" },
                ].map((item) => (
                  <div key={item.title} className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#e1e5f5] flex items-center gap-3">
                    <div className="text-[1.8rem]">{item.icon}</div>
                    <div>
                      <div className="font-bold text-[0.9rem]">{item.title}</div>
                      <div className="text-[0.75rem] text-[#9fa8c7]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-br from-[#1a1f3a] to-[#0f1224] rounded-2xl p-6 text-white">
                <h4 className="font-heading font-bold text-lg mb-4">Size Guide</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[0.9rem]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2.5 px-3 font-semibold text-[#40E0D0]">Size</th>
                        <th className="text-left py-2.5 px-3 font-semibold text-[#40E0D0]">Luggage</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-[#40E0D0]">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/10">
                        <td className="py-2.5 px-3">Small</td>
                        <td className="py-2.5 px-3 text-white/80">18&quot; – 20&quot;</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white/80">৳ 990</td>
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="py-2.5 px-3">Medium</td>
                        <td className="py-2.5 px-3 text-white/80">20&quot; – 24&quot;</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white/80">৳ 1,190</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3">Large</td>
                        <td className="py-2.5 px-3 text-white/80">24&quot; – 28&quot;</td>
                        <td className="py-2.5 px-3 text-right font-bold text-white/80">৳ 1,490</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facebook Reviews Carousel */}
      <FacebookReviews 
        reviews={fbReviews}
        reviewCount={settings.fb_review_count || "500+"}
        rating={settings.fb_rating || "4.9"}
      />

      {/* CTA Banner */}
      <section className="bg-gradient-to-br from-[#0f1224] via-[#1a1f3a] to-[#2d2060] py-20 relative overflow-hidden">
        <div className="absolute right-[-5%] top-[-20%] text-[20rem] opacity-[0.03] pointer-events-none">🧳</div>
        <div className="max-w-7xl mx-auto px-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="font-heading text-[clamp(1.8rem,3vw,2.8rem)] font-bold text-white mb-3 leading-tight">
                Buy 4 Covers,<br/>
                <span className="bg-gradient-to-r from-[#40E0D0] to-[#4A90E2] bg-clip-text text-transparent">
                  Save 15%!
                </span>
              </h2>
              <p className="text-white/65 max-w-[480px] text-[1rem]">
                Planning a family trip? Buy 4 or more covers and the discount applies automatically. No coupon needed.
              </p>
            </div>
            <div className="flex gap-4 flex-wrap shrink-0">
              <Link href="/shop">
                <Button variant="teal" size="lg">
                  <i className="fas fa-shopping-bag"></i> Shop Now
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline-white" size="lg">
                  <i className="fas fa-phone"></i> Call Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
