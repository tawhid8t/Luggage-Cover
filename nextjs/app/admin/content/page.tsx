'use client';
import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { contentBudgetAPI, type ContentBudgetEntry } from "@/lib/api";
import { formatPrice as fp } from "@/lib/utils";

const CATEGORIES = ["video", "photo", "graphic", "copywriting", "model", "other"] as const;
const CAT_LABELS: Record<string, string> = {
  video: "🎬 Video", photo: "📷 Photo", graphic: "🎨 Graphic",
  copywriting: "✍️ Copywriting", model: "👤 Model", other: "📦 Other"
};
const PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", youtube: "YouTube",
  website: "Website", all: "All Platforms"
};

function resolveCost(e: ContentBudgetEntry) {
  return (e.amountBdt && e.amountBdt > 0) ? e.amountBdt : (e.amountUsd || 0) * (e.exchangeRate || 110);
}

export default function ContentPage() {
  const [entries, setEntries] = useState<ContentBudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<ContentBudgetEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [previewVal, setPreviewVal] = useState(0);
  const [catFilter, setCatFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contentBudgetAPI.getAll(true);
      data.sort((a, b) => ((b.createdAt || "") > (a.createdAt || "") ? 1 : -1));
      setEntries(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const calcPreview = () => {
    const bdt = parseFloat((document.getElementById("cb_bdt") as HTMLInputElement)?.value) || 0;
    const usd = parseFloat((document.getElementById("cb_usd") as HTMLInputElement)?.value) || 0;
    const rate = parseFloat((document.getElementById("cb_rate") as HTMLInputElement)?.value) || 110;
    setPreviewVal(bdt > 0 ? bdt : usd * rate);
  };

  useEffect(() => {
    if (showModal) setPreviewVal(0);
  }, [showModal]);

  const activeEntries = entries.filter(e => e.status !== "cancelled");
  const totalBDT = activeEntries.reduce((s, e) => s + resolveCost(e), 0);
  const byCategory: Record<string, number> = {};
  CATEGORIES.forEach(c => {
    byCategory[c] = activeEntries.filter(e => e.category === c).reduce((s, e) => s + resolveCost(e), 0);
  });
  const allMonths = Array.from(new Set(entries.map(e => e.month).filter(Boolean))).sort().reverse();

  const filtered = entries.filter(e => {
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (monthFilter && e.month !== monthFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(e.title || "").toLowerCase().includes(s) && !(e.vendorName || "").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const filteredTotal = filtered.filter(e => e.status !== "cancelled").reduce((s, e) => s + resolveCost(e), 0);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const bdt = parseFloat(fd.get("amountBdt") as string) || 0;
    const usd = parseFloat(fd.get("amountUsd") as string) || 0;
    const rate = parseFloat(fd.get("exchangeRate") as string) || 110;
    const effective = bdt > 0 ? bdt : usd * rate;
    const data = {
      title: fd.get("title") as string,
      category: fd.get("category") as string,
      month: fd.get("month") as string,
      vendorName: fd.get("vendorName") as string,
      platform: fd.get("platform") as string,
      amountBdt: bdt || null,
      amountUsd: usd || null,
      exchangeRate: rate,
      effectiveBdt: effective,
      status: fd.get("status") as string,
      notes: fd.get("notes") as string,
    };
    setSaving(true);
    try {
      if (editEntry) {
        await contentBudgetAPI.update(editEntry.id, data);
      } else {
        await contentBudgetAPI.create(data);
      }
      setShowModal(false);
      await loadEntries();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try { await contentBudgetAPI.delete(id); await loadEntries(); } catch (e) { console.error(e); }
  };

  const statusClass = (s: string) => s === "paid" ? "#27ae60" : s === "cancelled" ? "#e74c3c" : "#e67e22";

  return (
    <AdminLayout title="Content Budget" breadcrumb="Home / Content Budget">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-800 text-navy m-0">
            🎬 Content Budget Tracker
          </h2>
          <p className="text-sm text-muted mt-1">
            Track all content creation costs for accurate net profit
          </p>
        </div>
        <div className="flex gap-2-5">
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={loadEntries}>🔄 Refresh</button>
          <button className="admin-btn admin-btn-primary" style={{ background: "linear-gradient(135deg,#9b59b6,#7b68ee)", border: "none" }} onClick={() => { setEditEntry(null); setShowModal(true); }}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid kpi-grid-7 gap-3-5 mb-6">
        <div className="kpi-card p-3-5 text-center">
          <div className="kpi-val text-xl font-900 text-purple">{fp(totalBDT)}</div>
          <div className="kpi-lbl text-xs text-muted uppercase" style={{ letterSpacing: ".5px" }}>Total Spend</div>
        </div>
        {CATEGORIES.map(c => (
          <div key={c} className="kpi-card p-3-5 text-center">
            <div className="kpi-val text-lg font-900 text-purple">{fp(byCategory[c] || 0)}</div>
            <div className="kpi-lbl text-xs text-muted uppercase">{CAT_LABELS[c].split(" ")[0]} {CAT_LABELS[c].split(" ")[1]}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-card mb-4 p-3">
        <div className="flex gap-2-5 flex-wrap items-center">
          <input type="text" placeholder="Search title/vendor…" value={search} onChange={e => setSearch(e.target.value)} className="admin-input" style={{ width: 220 }} />
          <select className="admin-input" value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <select className="admin-input" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All Months</option>
            {allMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="admin-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="ml-auto text-sm text-muted">
            {filtered.length} entries · <strong className="text-purple">Total: {fp(filteredTotal)}</strong>
          </span>
        </div>
      </div>

      {/* Table */}
      {loading && <div className="empty-state"><div className="spinner" /><p>Loading…</p></div>}

      {!loading && (
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th><th>Title</th><th>Category</th><th>Month</th>
                    <th>Platform</th><th>Vendor</th><th>Amount (BDT)</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center p-8">No entries found.</td></tr>
                  ) : (
                    filtered.map((e) => {
                      const cost = resolveCost(e);
                      return (
                        <tr key={e.id}>
                          <td>
                            <span className="badge" style={{ background: `${statusClass(e.status)}22`, color: statusClass(e.status), fontSize: "0.75rem" }}>
                              {e.status}
                            </span>
                          </td>
                          <td className="font-600">{e.title || "—"}</td>
                          <td>
                            <span className="cat-badge">{CAT_LABELS[e.category] || e.category}</span>
                          </td>
                          <td className="text-sm text-muted">{e.month || "—"}</td>
                          <td className="text-sm">{PLATFORM_LABELS[e.platform] || e.platform || "—"}</td>
                          <td className="text-sm text-muted">{e.vendorName || "—"}</td>
                          <td className="font-700 text-purple">{fp(Math.round(cost))}</td>
                          <td>
                            <div className="flex gap-1-5">
                              <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => { setEditEntry(e); setShowModal(true); }}>Edit</button>
                              <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(e.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-800 mb-5 text-navy">
              {editEntry ? `Edit: ${editEntry.title}` : "Add Content Budget Entry"}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-grid-2 gap-3 mb-3">
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Title / Description *</label>
                  <input type="text" name="title" className="admin-input" required defaultValue={editEntry?.title || ""} placeholder="e.g. Eid campaign product video" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="admin-input" defaultValue={editEntry?.category || "video"}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <input type="month" name="month" className="admin-input" defaultValue={editEntry?.month || new Date().toISOString().slice(0, 7)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor / Freelancer</label>
                  <input type="text" name="vendorName" className="admin-input" defaultValue={editEntry?.vendorName || ""} placeholder="e.g. Studio XYZ" />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform</label>
                  <select name="platform" className="admin-input" defaultValue={editEntry?.platform || "all"}>
                    {["facebook","instagram","youtube","website","all"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              {/* Currency */}
              <div className="currency-box">
                <div className="currency-box-title">💰 Cost — BDT or USD</div>
                <div className="form-grid-2 gap-2-5 mb-2">
                  <div className="form-group mb-0">
                    <label className="form-label text-sm">Amount BDT (primary)</label>
                    <input type="number" name="amountBdt" className="admin-input" id="cb_bdt" defaultValue={editEntry?.amountBdt ?? ""} placeholder="e.g. 5000" min={0} onInput={() => calcPreview()} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label text-sm">OR Amount USD</label>
                    <input type="number" name="amountUsd" className="admin-input" id="cb_usd" defaultValue={editEntry?.amountUsd ?? ""} placeholder="e.g. 50" min={0} onInput={() => calcPreview()} />
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label text-sm">Exchange Rate (1 USD = X BDT)</label>
                  <input type="number" name="exchangeRate" className="admin-input" id="cb_rate" defaultValue={editEntry?.exchangeRate ?? 110} min={1} onInput={() => calcPreview()} />
                </div>
                {previewVal > 0 && (
                  <div className="preview-box">
                    Effective Cost: ৳{previewVal.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="admin-input" defaultValue={editEntry?.status || "pending"}>
                  <option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="admin-input" rows={2} defaultValue={editEntry?.notes || ""} />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ background: "linear-gradient(135deg,#9b59b6,#7b68ee)", border: "none" }} disabled={saving}>
                  {saving ? "Saving…" : editEntry ? "Save Changes" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
