"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCartCount } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = useCartCount();

  return (
    <>
      {/* Promo Bar */}
      <div className="bg-gradient-primary text-white text-center py-2.5 text-sm font-semibold tracking-wide">
        🎉 Special Offer:{" "}
        <span className="bg-white/20 px-2.5 py-0.5 rounded-full mx-2">
          BUY 4 OR MORE — GET 15% OFF!
        </span>
        Free delivery on large orders. Shop Now
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-brand-dark/95 backdrop-blur-xl border-b border-white/[0.08] transition-all">
        <div className="max-w-7xl mx-auto px-5">
          <nav className="flex items-center justify-between h-[70px] gap-6">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0"
            >
              <img src="/bg-removed.png" alt="" className="w-8 h-8 object-contain" />
              <div className="leading-tight">
                <div className="font-heading font-extrabold text-white text-base tracking-widest">
                  LUGGAGE
                </div>
                <div className="text-[10px] tracking-[3px] font-semibold bg-gradient-to-r from-brand-teal to-brand-blue bg-clip-text text-transparent">
                  COVER BD
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <ul className="hidden md:flex items-center gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      pathname === link.href
                        ? "bg-white/10 text-white"
                        : "text-white/75 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-gradient-primary transition-all"
                aria-label="Cart"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-teal text-brand-dark text-xs font-bold rounded-full flex items-center justify-center animate-cart-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile Hamburger */}
              <button
                className="md:hidden flex flex-col gap-1.5 bg-transparent p-1"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                <span
                  className={cn(
                    "block w-6 h-0.5 bg-white rounded transition-all",
                    mobileOpen && "rotate-45 translate-y-2"
                  )}
                />
                <span
                  className={cn(
                    "block w-6 h-0.5 bg-white rounded transition-all",
                    mobileOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "block w-6 h-0.5 bg-white rounded transition-all",
                    mobileOpen && "-rotate-45 -translate-y-2"
                  )}
                />
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 bg-brand-dark border-t border-white/[0.06]",
            mobileOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <ul className="px-5 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <style jsx global>{`
        @keyframes cartPulse {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .animate-cart-pulse {
          animation: cartPulse 0.4s ease;
        }
      `}</style>
    </>
  );
}
