'use client';
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { couriersAPI, type Courier } from "@/lib/api";

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "rates" | "integration">("list");
  const [showModal, setShowModal] = useState(false);
  const [editCourier, setEditCourier] = useState<Courier | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [trackingBaseUrl, setTrackingBaseUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const loadCouriers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await couriersAPI.getAll(true);
      setCouriers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCouriers(); }, [loadCouriers]);

  const filtered = couriers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.short_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const shortName = (fd.get("short_name") as string || "").toLowerCase().replace(/\s+/g, "_");
    const data = {
      id: editCourier?.id || shortName,
      name: fd.get("name") as string,
      short_name: shortName,
      logo_emoji: fd.get("logo_emoji") as string || "📦",
      phone: fd.get("phone") as string,
      dhaka_charge: parseFloat(fd.get("dhaka_charge") as string) || 60,
      outside_charge: parseFloat(fd.get("outside_charge") as string) || 120,
      estimated_days_dhaka: fd.get("estimated_days_dhaka") as string,
      estimated_days_outside: fd.get("estimated_days_outside") as string,
      tracking_url: fd.get("tracking_url") as string,
      notes: fd.get("notes") as string,
      is_active: fd.get("is_active") === "on",
      is_default: fd.get("is_default") === "on",
    };
    setSaving(true);
    try {
      if (editCourier) await couriersAPI.update(editCourier.id, data);
      else await couriersAPI.create(data);
      setShowModal(false);
      await loadCouriers();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this courier?")) return;
    try { await couriersAPI.delete(id); await loadCouriers(); } catch (e) { console.error(e); }
  };

  const toggleActive = async (c: Courier) => {
    try { await couriersAPI.update(c.id, { is_active: !c.is_active }); await loadCouriers(); }
    catch (e) { console.error(e); }
  };

  const setDefault = async (c: Courier) => {
    try {
      for (const courier of couriers) {
        if (courier.is_default) await couriersAPI.update(courier.id, { is_default: false });
      }
      await couriersAPI.update(c.id, { is_default: true });
      await loadCouriers();
    } catch (e) { console.error(e); }
  };

  return (
    <AdminLayout title="Courier Management" breadcrumb="Home / Couriers">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2>🚚 Courier Management</h2>
          <p>Manage delivery partners, rates, and tracking integration</p>
        </div>
        <div className="flex gap-2">
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={loadCouriers}>🔄 Refresh</button>
          <button className="admin-btn admin-btn-primary" onClick={() => { setEditCourier(null); setShowModal(true); }}>+ Add Courier</button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="sub-tabs" style={{ marginBottom: 20 }}>
        <button className={`sub-tab ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>📋 Courier List</button>
        <button className={`sub-tab ${activeTab === "rates" ? "active" : ""}`} onClick={() => setActiveTab("rates")}>💰 Rate Management</button>
        <button className={`sub-tab ${activeTab === "integration" ? "active" : ""}`} onClick={() => setActiveTab("integration")}>🔗 API Integration</button>
      </div>

      {/* Loading */}
      {loading && <div className="empty-state"><div className="spinner" /><p>Loading couriers…</p></div>}

      {/* ── TAB: List ── */}
      {!loading && activeTab === "list" && (
        <>
          <div className="admin-toolbar">
            <input type="text" placeholder="Search couriers…" value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input" style={{ width: 280 }} />
            <span className="text-sm text-muted">{filtered.length} of {couriers.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="admin-card" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🚚</div>
              <h3 style={{ marginBottom: 8, color: "var(--brand-navy)" }}>No couriers yet</h3>
              <p className="text-muted" style={{ marginBottom: 16 }}>Add your first courier partner to get started.</p>
              <button className="admin-btn admin-btn-primary" onClick={() => { setEditCourier(null); setShowModal(true); }}>+ Add First Courier</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
              {filtered.map((c) => (
                <div key={c.id} className="admin-card" style={{ padding: 0, overflow: "hidden", border: c.is_default ? "2px solid #27ae60" : "1px solid var(--card-border)" }}>
                  {/* Card Header */}
                  <div className="flex items-center gap-3" style={{ background: "linear-gradient(135deg,#f0f4ff,#f5f0ff)", padding: "14px 18px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: "white", border: "2px solid #e1e5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                      {c.logo_emoji || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-700 text-navy">{c.name}</span>
                        {c.is_default && (
                          <span className="badge" style={{ background: "#27ae60", color: "white", fontSize: "0.65rem", flexShrink: 0 }}>DEFAULT</span>
                        )}
                      </div>
                      <div className="text-sm text-muted">{c.short_name || "—"}</div>
                    </div>
                    <span className="badge" style={{ background: c.is_active ? "#27ae6022" : "#e74c3c22", color: c.is_active ? "#27ae60" : "#e74c3c" }}>
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-3">
                    {c.phone && <div className="text-sm text-muted mb-2">📞 {c.phone}</div>}

                    {/* Rates */}
                    <div className="grid-2 mb-3" style={{ gap: 8 }}>
                      <div style={{ background: "#f8f9ff", border: "1px solid #e1e5f5", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                        <div className="text-xs text-muted uppercase mb-1">Dhaka</div>
                        <div className="font-800" style={{ fontSize: "1.1rem", color: "#4A90E2" }}>৳{c.dhaka_charge || 60}</div>
                        {c.estimated_days_dhaka && <div className="text-xs text-muted">{c.estimated_days_dhaka}</div>}
                      </div>
                      <div style={{ background: "#fff8f0", border: "1px solid #e1e5f5", borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                        <div className="text-xs text-muted uppercase mb-1">Outside</div>
                        <div className="font-800" style={{ fontSize: "1.1rem", color: "#e67e22" }}>৳{c.outside_charge || 120}</div>
                        {c.estimated_days_outside && <div className="text-xs text-muted">{c.estimated_days_outside}</div>}
                      </div>
                    </div>

                    {c.tracking_url && (
                      <div className="text-sm mb-2" style={{ color: "#4A90E2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        🔗 <a href={c.tracking_url} target="_blank" rel="noreferrer" style={{ color: "#4A90E2" }}>{c.tracking_url}</a>
                      </div>
                    )}
                    {c.notes && (
                      <div className="text-sm text-muted" style={{ fontStyle: "italic", marginBottom: 8 }}>📝 {c.notes}</div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                      <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => { setEditCourier(c); setShowModal(true); }}>Edit</button>
                      {!c.is_default && (
                        <button className="admin-btn admin-btn-sm" style={{ background: "#f0fff4", color: "#27ae60", border: "1px solid #27ae60" }} onClick={() => setDefault(c)}>⭐ Set Default</button>
                      )}
                      <button className="admin-btn admin-btn-sm" style={{ background: c.is_active ? "#fff3cd" : "#e8f8f0", color: c.is_active ? "#856404" : "#27ae60", border: `1px solid ${c.is_active ? "#ffc107" : "#27ae60"}` }} onClick={() => toggleActive(c)}>
                        {c.is_active ? "⏸ Deactivate" : "▶ Activate"}
                      </button>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" style={{ marginLeft: "auto" }} onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Rate Management ── */}
      {!loading && activeTab === "rates" && (
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">💰 Quick Rate Reference</div>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setActiveTab("list")}>+ Add Courier</button>
          </div>
          <div className="admin-card-body">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Courier</th><th>Dhaka Rate</th><th>Outside Rate</th><th>Dhaka ETA</th><th>Outside ETA</th><th>Tracking</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {couriers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center p-2">No couriers. Add one first.</td></tr>
                  ) : couriers.map((c) => (
                    <tr key={c.id}>
                      <td className="font-600">{c.logo_emoji || "📦"} {c.name}{c.is_default && <span className="badge" style={{ background: "#27ae60", color: "white", fontSize: "0.65rem", marginLeft: 6 }}>DEFAULT</span>}</td>
                      <td className="font-700" style={{ color: "#4A90E2" }}>৳ {c.dhaka_charge || 60}</td>
                      <td className="font-700" style={{ color: "#e67e22" }}>৳ {c.outside_charge || 120}</td>
                      <td className="text-sm text-muted">{c.estimated_days_dhaka || "—"}</td>
                      <td className="text-sm text-muted">{c.estimated_days_outside || "—"}</td>
                      <td>{c.tracking_url ? <a href={c.tracking_url} target="_blank" rel="noreferrer" className="text-sm" style={{ color: "#4A90E2" }}>🔗 Track</a> : "—"}</td>
                      <td><span className="badge" style={{ background: c.is_active ? "#27ae6022" : "#e74c3c22", color: c.is_active ? "#27ae60" : "#e74c3c" }}>{c.is_active ? "Active" : "Inactive"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: API Integration ── */}
      {!loading && activeTab === "integration" && (
        <div className="grid-2 mb-5">
          <div className="admin-card">
            <div className="admin-card-header" style={{ background: "linear-gradient(135deg,#f0f4ff,#f5f0ff)" }}>
              <div className="admin-card-title" style={{ color: "#4A90E2" }}>🔗 Tracking API Setup</div>
            </div>
            <div className="admin-card-body">
              <p className="text-sm text-muted mb-3">Configure automatic tracking number lookup for each courier. Leave blank to disable.</p>
              {[{ label: "Pathao API Key", hint: "Found in your Pathao Merchant Dashboard", value: apiKey, setter: setApiKey, placeholder: "pk_live_xxxxx" },
                { label: "Default Tracking Base URL", hint: "Used when courier has no individual tracking URL", value: trackingBaseUrl, setter: setTrackingBaseUrl, placeholder: "https://pathao.com/track/" },
                { label: "Webhook URL", hint: "Receive courier status updates automatically", value: webhookUrl, setter: setWebhookUrl, placeholder: "https://yourstore.com/api/webhook/courier" },
              ].map((f) => (
                <div key={f.label} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <input type="text" className="admin-input" placeholder={f.placeholder} value={f.value} onChange={(e) => f.setter(e.target.value)} />
                  <small className="text-sm text-muted" style={{ marginTop: 4, display: "block" }}>{f.hint}</small>
                </div>
              ))}
              <button className="admin-btn admin-btn-primary" style={{ marginTop: 8 }}>💾 Save Integration Settings</button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header" style={{ background: "linear-gradient(135deg,#f0fff4,#e8f8f0)" }}>
              <div className="admin-card-title" style={{ color: "#27ae60" }}>📡 Supported Courier APIs</div>
            </div>
            <div className="admin-card-body">
              <div className="flex flex-col gap-3">
                {[
                  { name: "Pathao", emoji: "🚚", status: "Nationwide coverage", color: "#3498db" },
                  { name: "Steadfast", emoji: "🔒", status: "Nationwide coverage", color: "#27ae60" },
                  { name: "RedX", emoji: "📦", status: "Same-day delivery", color: "#e67e22" },
                  { name: "Paperfly", emoji: "🛵", status: "Express delivery", color: "#9b59b6" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3" style={{ padding: "10px 14px", background: "#f8f9ff", border: "1px solid #e1e5f5", borderRadius: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${c.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>{c.emoji}</div>
                    <div>
                      <div className="font-600 text-base">{c.name}</div>
                      <div className="text-sm text-muted">{c.status}</div>
                    </div>
                    <span className="badge" style={{ marginLeft: "auto", background: "#27ae6022", color: "#27ae60" }}>Ready</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "12px 14px", background: "#fff8f0", border: "1px solid #ffd08a", borderRadius: 10 }}>
                <div className="font-600 text-sm mb-1" style={{ color: "#856404" }}>💡 Custom Integration</div>
                <div className="text-sm text-muted">Need a courier not listed? Add their tracking URL in each courier settings — orders will auto-link to their tracking page.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <h3 className="font-800 mb-5 text-navy">{editCourier ? `Edit: ${editCourier.name}` : "Add New Courier"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-grid-2 mb-3">
                <div className="form-group">
                  <label className="form-label">Courier Name *</label>
                  <input type="text" name="name" className="admin-input" required defaultValue={editCourier?.name || ""} placeholder="e.g. Pathao Courier" />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Code *</label>
                  <input type="text" name="short_name" className="admin-input" defaultValue={editCourier?.short_name || ""} placeholder="e.g. pathao" />
                </div>
                <div className="form-group">
                  <label className="form-label">Emoji Icon</label>
                  <input type="text" name="logo_emoji" className="admin-input" defaultValue={editCourier?.logo_emoji || "📦"} placeholder="📦" />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input type="text" name="phone" className="admin-input" defaultValue={editCourier?.phone || ""} placeholder="e.g. 16723" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dhaka Charge (৳)</label>
                  <input type="number" name="dhaka_charge" className="admin-input" defaultValue={editCourier?.dhaka_charge ?? 60} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Outside Dhaka (৳)</label>
                  <input type="number" name="outside_charge" className="admin-input" defaultValue={editCourier?.outside_charge ?? 120} min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">ETA — Dhaka</label>
                  <input type="text" name="estimated_days_dhaka" className="admin-input" defaultValue={editCourier?.estimated_days_dhaka || ""} placeholder="e.g. 1-2 days" />
                </div>
                <div className="form-group">
                  <label className="form-label">ETA — Outside Dhaka</label>
                  <input type="text" name="estimated_days_outside" className="admin-input" defaultValue={editCourier?.estimated_days_outside || ""} placeholder="e.g. 3-5 days" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tracking URL (prefix)</label>
                <input type="text" name="tracking_url" className="admin-input" defaultValue={editCourier?.tracking_url || ""} placeholder="https://courier.com/track/" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="admin-input" defaultValue={editCourier?.notes || ""} rows={2} placeholder="Internal notes…" />
              </div>
              <div className="flex gap-5 mb-4">
                <label className="flex items-center gap-2 text-base font-600" style={{ cursor: "pointer" }}>
                  <input type="checkbox" name="is_active" defaultChecked={editCourier ? editCourier.is_active : true} /> Active
                </label>
                <label className="flex items-center gap-2 text-base font-600" style={{ cursor: "pointer" }}>
                  <input type="checkbox" name="is_default" defaultChecked={editCourier?.is_default || false} /> Set as Default
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>{saving ? "Saving…" : editCourier ? "Save Changes" : "Add Courier"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
