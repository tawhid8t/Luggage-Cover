import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#0a0c1a] text-white/70 pt-16 pb-5">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-8 lg:gap-10 pb-12 border-b border-white/10">
          {/* Brand */}
          <div>
            <div className="footer-logo mb-4">
              <img src="/bg-removed.png" alt="" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold text-white">LUGGAGE COVER BD</span>
            </div>
            <p className="text-[0.9rem] leading-[1.7] mb-6">
              Your premium travel partner. Protect your luggage, travel in style.
            </p>
            <div className="footer-social">
              <a
                href="#"
                className="social-btn w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[0.9rem] hover:bg-[#4A90E2] hover:text-white transition-all"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f" />
              </a>
              <a
                href="#"
                className="social-btn w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[0.9rem] hover:bg-[#4A90E2] hover:text-white transition-all"
                aria-label="Instagram"
              >
                <i className="fab fa-instagram" />
              </a>
              <a
                href="#"
                className="social-btn whatsapp w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[0.9rem] hover:bg-[#25d366] hover:text-white transition-all"
                aria-label="WhatsApp"
              >
                <i className="fab fa-whatsapp" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links">
            <h4 className="text-white font-bold mb-5 text-[0.95rem] tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Home" },
                { href: "/shop", label: "Shop All Designs" },
                { href: "/about", label: "About Us" },
                { href: "/faq", label: "FAQ" },
                { href: "/contact", label: "Contact" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.9rem] hover:text-[#40E0D0] transition-all"
                    style={{ paddingLeft: 0 }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-links">
            <h4 className="text-white font-bold mb-5 text-[0.95rem] tracking-wide">Support</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/faq#sizing", label: "Size Guide" },
                { href: "/returns", label: "Return Policy" },
                { href: "/shipping", label: "Shipping Info" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms & Conditions" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[0.9rem] hover:text-[#40E0D0] transition-all"
                    style={{ paddingLeft: 0 }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-contact">
            <h4 className="text-white font-bold mb-5 text-[0.95rem] tracking-wide">Contact Us</h4>
            <div className="footer-contact-list space-y-3">
              <div className="fc-item flex items-center gap-2.5 text-[0.9rem]">
                <i className="fas fa-phone text-[#4A90E2] w-4 shrink-0" />
                <a href="tel:+01328152066" className="hover:text-[#40E0D0] transition-all">
                  +01328-152066
                </a>
              </div>
              <div className="fc-item flex items-center gap-2.5 text-[0.9rem]">
                <i className="fas fa-phone text-[#4A90E2] w-4 shrink-0" />
                <a href="tel:+01788039222" className="hover:text-[#40E0D0] transition-all">
                  +01788-039222
                </a>
              </div>
              <div className="fc-item flex items-center gap-2.5 text-[0.9rem]">
                <i className="fas fa-envelope text-[#4A90E2] w-4 shrink-0" />
                <a href="mailto:luggagecover24@gmail.com" className="hover:text-[#40E0D0] transition-all">
                  luggagecover24@gmail.com
                </a>
              </div>
              <div className="fc-item flex items-center gap-2.5 text-[0.9rem]">
                <i className="fas fa-map-marker-alt text-[#4A90E2] w-4 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-5 text-[0.8rem] text-white/40">
          <p>© 2024 Luggage Cover BD. All rights reserved. | Made with ❤️ in Bangladesh</p>
          <div className="payment-icons flex gap-2">
            <span className="pay-icon px-3 py-1 bg-white/10 rounded-md text-white/60 font-semibold text-[0.75rem]">COD</span>
            <span className="pay-icon px-3 py-1 bg-white/10 rounded-md text-white/60 font-semibold text-[0.75rem]">bKash</span>
            <span className="pay-icon px-3 py-1 bg-white/10 rounded-md text-white/60 font-semibold text-[0.75rem]">Nagad</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
