import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Luggage Cover BD. Call, WhatsApp, email, or send us a message.",
};

const CONTACT_METHODS = [
  {
    icon: "fas fa-phone",
    iconBg: "bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff]",
    iconColor: "text-[#4A90E2]",
    iconClass: "cm-icon",
    label: "Call Us",
    value: "+01328-152066",
    href: "tel:+01328152066",
  },
  {
    icon: "fas fa-phone",
    iconBg: "bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff]",
    iconColor: "text-[#4A90E2]",
    iconClass: "cm-icon",
    label: "Call Us",
    value: "+01788-039222",
    href: "tel:+01788039222",
  },
  {
    icon: "fab fa-whatsapp",
    iconBg: "bg-gradient-to-br from-[#25d366] to-[#128c7e]",
    iconColor: "text-white",
    iconClass: "cm-icon whatsapp-icon",
    label: "WhatsApp",
    value: "+01328-152066",
    href: "https://wa.me/01328152066",
  },
  {
    icon: "fas fa-envelope",
    iconBg: "bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff]",
    iconColor: "text-[#4A90E2]",
    iconClass: "cm-icon",
    label: "Email",
    value: "luggagecover24@gmail.com",
    href: "mailto:luggagecover24@gmail.com",
  },
  {
    icon: "fas fa-map-marker-alt",
    iconBg: "bg-gradient-to-br from-[#f0f4ff] to-[#f5f0ff]",
    iconColor: "text-[#4A90E2]",
    iconClass: "cm-icon",
    label: "Location",
    value: "Dhaka, Bangladesh",
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="contact-page-hero">
        <div className="max-w-7xl mx-auto px-5">
          <h1 className="contact-hero-title">
            Get in <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="contact-hero-subtitle">
            We&apos;d love to hear from you. Reach out via phone, email, or the form below.
          </p>
          <div className="contact-breadcrumb">
            <a href="/">Home</a> / <span>Contact</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="max-w-7xl mx-auto px-5">
          <div className="contact-layout">
            {/* Contact Info */}
            <div className="contact-info-panel">
              <h2 className="section-title font-heading text-[clamp(1.8rem,3vw,2.5rem)] font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-[#4A90E2] to-[#7B68EE] bg-clip-text text-transparent">Contact</span> Info
              </h2>
              <p className="contact-desc">
                Have a question about sizing? Want to place a bulk order? Our friendly team is ready to help.
              </p>

              <div className="contact-methods">
                {CONTACT_METHODS.map((m, i) =>
                  m.href ? (
                    <a
                      key={i}
                      href={m.href}
                      target={m.href.startsWith("http") ? "_blank" : undefined}
                      rel={m.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="cm-item"
                    >
                      <div className={m.iconClass}>
                        <i className={m.icon}></i>
                      </div>
                      <div>
                        <strong>{m.label}</strong>
                        <span>{m.value}</span>
                      </div>
                    </a>
                  ) : (
                    <div key={i} className="cm-item">
                      <div className={m.iconClass}>
                        <i className={m.icon}></i>
                      </div>
                      <div>
                        <strong>{m.label}</strong>
                        <span>{m.value}</span>
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="social-links-contact">
                <h4>Follow Us</h4>
                <div className="scl-row">
                  <a href="#" className="scl-btn fb">
                    <i className="fab fa-facebook-f"></i> Facebook
                  </a>
                  <a href="#" className="scl-btn ig">
                    <i className="fab fa-instagram"></i> Instagram
                  </a>
                </div>
              </div>

              <div className="business-hours">
                <h4>Business Hours</h4>
                <div className="bh-row">
                  <span>Saturday – Thursday</span>
                  <strong>9:00 AM – 9:00 PM</strong>
                </div>
                <div className="bh-row">
                  <span>Friday</span>
                  <strong>2:00 PM – 9:00 PM</strong>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-panel">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
