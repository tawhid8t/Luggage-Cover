"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";

const SUBJECTS = [
  { value: "general", label: "General Inquiry" },
  { value: "order", label: "Order Question" },
  { value: "sizing", label: "Size Help" },
  { value: "return", label: "Return/Refund" },
  { value: "wholesale", label: "Wholesale / Bulk Order" },
];

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "general",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
    toast("Message sent! We'll get back to you within 24 hours.", "success");
  };

  if (submitted) {
    return (
      <div className="contact-card">
        <div className="form-success">
          <i className="fas fa-check-circle"></i>
          <strong>Message sent!</strong>
          <p>Thank you! We&apos;ll get back to you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-card">
      <h3>Send Us a Message</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Your Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Full name"
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+8801XXXXXXXXX"
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <select
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="form-control"
          >
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Write your message here…"
            className="form-control"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? (
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: "0 auto" }}></div>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i> Send Message
            </>
          )}
        </button>
      </form>
    </div>
  );
}
