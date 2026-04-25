'use client';
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { settingsAPI } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

interface Setting {
  setting_key: string;
  setting_value: string;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("lcbd_admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    console.error("API Error:", endpoint, error);
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

const SETTING_GROUPS = [
  {
    label: "Store Information",
    key: "store",
    icon: "fas fa-store",
    items: [
      { key: "site_name", label: "Site Name" },
      { key: "store_tagline", label: "Store Tagline" },
      { key: "free_delivery_threshold", label: "Free Delivery Min. Order", suffix: "৳" },
    ],
  },
  {
    label: "Promotions & Discounts",
    key: "promotion",
    icon: "fas fa-tag",
    items: [
      { key: "promo_bar_text", label: "Promo Bar Text" },
      { key: "promo_bar_enabled", label: "Promo Bar Enabled", type: "boolean" },
      { key: "promo_bulk_enabled", label: "Bulk Discount Enabled", type: "boolean" },
      { key: "promo_bulk_qty", label: "Min Qty for Bulk Discount" },
      { key: "promo_bulk_percent", label: "Bulk Discount %", suffix: "%" },
    ],
  },
  {
    label: "Shipping & Delivery",
    key: "delivery",
    icon: "fas fa-truck",
    items: [
      { key: "delivery_charge_dhaka", label: "Dhaka Delivery Charge", suffix: "৳" },
      { key: "delivery_charge_outside", label: "Outside Dhaka Charge", suffix: "৳" },
    ],
  },
  {
    label: "Payment Methods",
    key: "payment",
    icon: "fas fa-credit-card",
    items: [
      { key: "payment_cod_enabled", label: "COD Enabled", type: "boolean" },
      { key: "payment_bkash_enabled", label: "bKash Enabled", type: "boolean" },
      { key: "payment_nogod_enabled", label: "Nagad Enabled", type: "boolean" },
    ],
  },
  {
    label: "Social Media",
    key: "social",
    icon: "fab fa-facebook",
    items: [
      { key: "social_facebook", label: "Facebook Page URL" },
      { key: "social_instagram", label: "Instagram URL" },
    ],
  },
  {
    label: "SEO & Meta",
    key: "seo",
    icon: "fas fa-search",
    items: [
      { key: "seo_meta_description", label: "Meta Description" },
      { key: "seo_meta_keywords", label: "Meta Keywords" },
    ],
  },
  {
    label: "Contact",
    key: "contact",
    icon: "fas fa-phone",
    items: [
      { key: "contact_phone", label: "Primary Phone" },
      { key: "contact_email", label: "Email" },
    ],
  },
  {
    label: "Default Prices",
    key: "pricing",
    icon: "fas fa-dollar-sign",
    items: [
      { key: "price_small", label: "Small Size Price", suffix: "৳" },
      { key: "price_medium", label: "Medium Size Price", suffix: "৳" },
      { key: "price_large", label: "Large Size Price", suffix: "৳" },
    ],
  },
];

const HOWTO_STEPS = [
  { key: 1, titleKey: "howto_step1_title", descKey: "howto_step1_desc", imgKey: "howto_step1_img", defaultTitle: "Place on Top" },
  { key: 2, titleKey: "howto_step2_title", descKey: "howto_step2_desc", imgKey: "howto_step2_img", defaultTitle: "Pull Down" },
  { key: 3, titleKey: "howto_step3_title", descKey: "howto_step3_desc", imgKey: "howto_step3_img", defaultTitle: "Adjust Fit" },
  { key: 4, titleKey: "howto_step4_title", descKey: "howto_step4_desc", imgKey: "howto_step4_img", defaultTitle: "Done!" },
];

const FB_REVIEWS = Array.from({ length: 6 }, (_, i) => i + 1);

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      showToast("info", "Loading settings...");
      const data = await fetchAPI("/settings/all");
      const settingsData = data.data || [];
      const map: Record<string, string> = {};
      settingsData.forEach((s: { key: string; value: string }) => {
        map[s.key] = s.value || "";
      });
      setSettings(map);
      showToast("success", `Loaded ${settingsData.length} settings`);
    } catch (e: any) {
      console.error("Failed to load settings:", e);
      showToast("error", e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSaveGroup = async (groupKey: string) => {
    setSavingGroup(groupKey);
    setSaving(true);
    try {
      const groupItems = SETTING_GROUPS.find(g => g.key === groupKey)?.items || [];
      const settingsArray = groupItems.map(item => ({
        key: item.key,
        value: settings[item.key] || "",
        label: item.label,
        group: groupKey,
        type: item.type === "boolean" ? "boolean" : "text"
      }));
      await fetchAPI("/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: settingsArray }),
      });
      settingsAPI.invalidate();
      setSaved(true);
      showToast("success", "Settings saved!");
    } catch (e: any) {
      console.error("Failed to save:", e);
      showToast("error", e.message || "Failed to save settings");
    } finally {
      setSavingGroup(null);
      setSaving(false);
    }
  };

  const handleSaveHomepage = async () => {
    setSavingGroup("homepage");
    setSaving(true);
    try {
      const homepageKeys = [
        "hero_title", "hero_subtitle",
        ...HOWTO_STEPS.flatMap(s => [s.titleKey, s.descKey, s.imgKey]),
        "fb_review_count", "fb_rating",
        ...FB_REVIEWS.flatMap(i => [
          `fb_review${i}_name`, `fb_review${i}_location`, `fb_review${i}_avatar`,
          `fb_review${i}_avatar_color`, `fb_review${i}_text`, `fb_review${i}_screenshot`,
          `fb_review${i}_product`, `fb_review${i}_date`, `fb_review${i}_likes`,
          `fb_review${i}_comments`, `fb_review${i}_content`
        ])
      ];

      const settingsArray = homepageKeys.map(key => ({
        key,
        value: settings[key] || "",
        label: key,
        group: "homepage",
        type: "text"
      }));

      await fetchAPI("/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: settingsArray }),
      });
      settingsAPI.invalidate();
      setSaved(true);
      showToast("success", "Homepage saved!");
    } catch (e: any) {
      console.error("Failed to save:", e);
      showToast("error", e.message || "Failed to save homepage");
    } finally {
      setSavingGroup(null);
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Settings / CMS"
      breadcrumb="Home / Settings"
    >
      {toast && (
        <div className={`admin-alert ${toast.type === "error" ? "admin-alert-error" : toast.type === "success" ? "admin-alert-success" : "admin-alert-info"}`} style={{ marginBottom: 16 }}>
          <span>{toast.type === "error" ? "❌" : toast.type === "success" ? "✅" : "ℹ️"}</span>
          <div>{toast.message}</div>
        </div>
      )}

      {saved && (
        <div className="admin-alert admin-alert-success" style={{ marginBottom: 16 }}>
          <span>✅</span>
          <div>Settings saved successfully!</div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading settings...</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* General Settings Groups */}
          {SETTING_GROUPS.map((group) => (
            <div key={group.key} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">
                  <i className={group.icon}></i> {group.label}
                </div>
                <button
                  className="admin-btn admin-btn-primary admin-btn-sm"
                  onClick={() => handleSaveGroup(group.key)}
                  disabled={saving && savingGroup !== group.key}
                >
                  {savingGroup === group.key ? (
                    <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                  ) : (
                    <><i className="fas fa-save"></i> Save</>
                  )}
                </button>
              </div>
              <div className="admin-card-body padded">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {group.items.map((item) => (
                    <div key={item.key} className="admin-form-group">
                      <label className="admin-form-label">{item.label}</label>
                      {item.type === "boolean" ? (
                        <label className="admin-toggle" style={{ marginTop: 4 }}>
                          <input
                            type="checkbox"
                            checked={settings[item.key] === "true"}
                            onChange={(e) => handleChange(item.key, e.target.checked ? "true" : "false")}
                          />
                          {settings[item.key] === "true" ? "Enabled" : "Disabled"}
                        </label>
                      ) : (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="text"
                            className="admin-input"
                            value={settings[item.key] || ""}
                            onChange={(e) => handleChange(item.key, e.target.value)}
                            placeholder={`Enter ${item.label.toLowerCase()}...`}
                          />
                          {item.suffix && (
                            <span style={{ color: "var(--admin-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                              {item.suffix}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "var(--admin-muted)", marginTop: 4 }}>
                        Key: <code style={{ fontSize: "0.7rem" }}>{item.key}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Homepage CMS Section */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">
                <i className="fas fa-home"></i> Homepage Content CMS
              </div>
              <button
                className="admin-btn admin-btn-primary admin-btn-sm"
                onClick={handleSaveHomepage}
                disabled={saving && savingGroup !== "homepage"}
              >
                {savingGroup === "homepage" ? (
                  <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                ) : (
                  <><i className="fas fa-save"></i> Save All</>
                )}
              </button>
            </div>
            <div className="admin-card-body padded">
              {/* Hero Section */}
              <div className="admin-form-group">
                <label className="admin-form-label">Hero Headline</label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings["hero_title"] || ""}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  placeholder="Your Travel Buddy"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Hero Subheadline</label>
                <input
                  type="text"
                  className="admin-input"
                  value={settings["hero_subtitle"] || ""}
                  onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                  placeholder="Enter subheadline..."
                />
              </div>

              {/* How-to-Use Step Images */}
              <div style={{ borderTop: "1px solid var(--border-light)", margin: "20px 0", paddingTop: 20 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-blue)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fas fa-camera"></i> How-to-Use Section — Step Images
                </div>
                <div style={{ background: "#f0f4ff", border: "1px solid #dde4f5", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: "0.75rem", color: "#5a6080" }}>
                  <i className="fas fa-info-circle" style={{ color: "#4A90E2" }}></i>
                  <strong> How to add images:</strong> Upload your step photos to <a href="https://imgbb.com" target="_blank" style={{ color: "#4A90E2" }}>imgbb.com</a> (free), copy the &quot;Direct link&quot; URL, paste below.
                  Recommended: 4:3 ratio, min 600x450px, showing the luggage cover being put on.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {HOWTO_STEPS.map((step) => (
                    <div key={step.key} className="admin-form-group">
                      <label className="admin-form-label">Step {step.key} Image URL</label>
                      <input
                        type="text"
                        className="admin-input"
                        value={settings[step.imgKey] || ""}
                        onChange={(e) => handleChange(step.imgKey, e.target.value)}
                        placeholder="https://i.ibb.co/.../step1.jpg"
                      />
                      {settings[step.imgKey] && (
                        <div style={{ marginTop: 8 }}>
                          <img
                            src={settings[step.imgKey]}
                            alt={`Step ${step.key}`}
                            style={{ width: "100%", maxHeight: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #e1e5f5" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* How-to-Use Step Titles & Descriptions */}
              <div style={{ borderTop: "1px solid var(--border-light)", margin: "20px 0", paddingTop: 20 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-blue)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fas fa-pencil-alt"></i> How-to-Use — Step Titles & Descriptions
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {HOWTO_STEPS.map((step) => (
                    <div key={step.key} style={{ display: "contents" }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Step {step.key} Title</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[step.titleKey] || ""}
                          onChange={(e) => handleChange(step.titleKey, e.target.value)}
                          placeholder={step.defaultTitle}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Step {step.key} Description</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[step.descKey] || ""}
                          onChange={(e) => handleChange(step.descKey, e.target.value)}
                          placeholder="Enter description..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facebook Reviews Section */}
              <div style={{ borderTop: "1px solid var(--border-light)", margin: "20px 0", paddingTop: 20 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand-blue)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fab fa-facebook"></i> Facebook Reviews Section
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Total Reviews Count (e.g., &quot;500+&quot;)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={settings["fb_review_count"] || ""}
                      onChange={(e) => handleChange("fb_review_count", e.target.value)}
                      placeholder="500+"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Average Rating (e.g., &quot;4.9&quot;)</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={settings["fb_rating"] || ""}
                      onChange={(e) => handleChange("fb_rating", e.target.value)}
                      placeholder="4.9"
                    />
                  </div>
                </div>

                {FB_REVIEWS.map((i) => (
                  <div key={i} style={{ background: "#f8f9fc", border: "1px solid #e9ecf2", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, color: "var(--brand-dark)", marginBottom: 12 }}>Review {i}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Name</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_name`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_name`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Location</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_location`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_location`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Avatar Initials</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_avatar`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_avatar`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Avatar Color</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_avatar_color`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_avatar_color`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group" style={{ gridColumn: "span 2" }}>
                        <label className="admin-form-label">Review Text</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_text`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_text`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group" style={{ gridColumn: "span 2" }}>
                        <label className="admin-form-label">Screenshot Image URL</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_screenshot`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_screenshot`, e.target.value)}
                          placeholder="https://i.ibb.co/.../review1.jpg"
                        />
                        {settings[`fb_review${i}_screenshot`] && (
                          <div style={{ marginTop: 6 }}>
                            <img
                              src={settings[`fb_review${i}_screenshot`]}
                              alt={`Review ${i}`}
                              style={{ height: 60, borderRadius: 4, border: "1px solid #ddd" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Product Tag</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_product`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_product`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Date</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_date`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_date`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Likes</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_likes`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_likes`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group">
                        <label className="admin-form-label">Comments</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_comments`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_comments`, e.target.value)}
                        />
                      </div>
                      <div className="admin-form-group" style={{ gridColumn: "span 2" }}>
                        <label className="admin-form-label">Facebook Post Content</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={settings[`fb_review${i}_content`] || ""}
                          onChange={(e) => handleChange(`fb_review${i}_content`, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="admin-alert admin-alert-info" style={{ marginTop: 8 }}>
                <i className="fas fa-info-circle"></i> After saving, refresh the store homepage to see changes.
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}