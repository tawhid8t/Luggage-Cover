import Link from "next/link";

interface PageHeroProps {
  title: React.ReactNode;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
}

export function PageHero({ title, subtitle, breadcrumb }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-br from-[#0f1224] via-[#1a1f3a] to-[#2d2060] text-white py-16 pb-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#4A90E2] blur-[80px] opacity-[0.15] -top-32 -left-32" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#7B68EE] blur-[80px] opacity-[0.15] bottom-0 right-0" />
      </div>
      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <h1 className="font-heading text-[clamp(2rem,4vw,3rem)] font-black mb-4 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/70 mb-4 text-[1rem]">{subtitle}</p>
        )}
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="text-[0.85rem] text-white/50 flex items-center justify-center gap-2">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-[#40E0D0] hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white/70">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
