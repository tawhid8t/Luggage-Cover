'use client';
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { productionBatchesAPI, type ProductionBatch } from "@/lib/api";

function sumCosts(b: ProductionBatch) {
  return (b.fabric_cost||0)+(b.garments_bill||0)+(b.print_bill||0)+(b.accessories_bill||0)+(b.transport_cost||0)+(b.packaging_cost||0)+(b.other_costs||0);
}
function calcRevenue(b: ProductionBatch) {
  return (b.qty_small||0)*(b.sell_price_small||990)+(b.qty_medium||0)*(b.sell_price_medium||1190)+(b.qty_large||0)*(b.sell_price_large||1490)+(b.qty_xl||0)*(b.sell_price_xl||1690);
}
function totalQty(b: ProductionBatch) {
  return (b.qty_small||0)+(b.qty_medium||0)+(b.qty_large||0)+(b.qty_xl||0);
}

function formatCurrency(n: number) {
  return `৳${(n || 0).toLocaleString("en-BD")}`;
}

export default function ProductionPage() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"batches" | "calculator">("batches");
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editBatch, setEditBatch] = useState<ProductionBatch | null>(null);
  const [saving, setSaving] = useState(false);

  // Calculator state
  const [calcFabric, setCalcFabric] = useState(0);
  const [calcGarments, setCalcGarments] = useState(0);
  const [calcPrint, setCalcPrint] = useState(0);
  const [calcAccessories, setCalcAccessories] = useState(0);
  const [calcTransport, setCalcTransport] = useState(0);
  const [calcPackaging, setCalcPackaging] = useState(0);
  const [calcOther, setCalcOther] = useState(0);
  const [calcQtyS, setCalcQtyS] = useState(0);
  const [calcQtyM, setCalcQtyM] = useState(0);
  const [calcQtyL, setCalcQtyL] = useState(0);
  const [calcQtyXL, setCalcQtyXL] = useState(0);
  const [calcPriceS, setCalcPriceS] = useState(990);
  const [calcPriceM, setCalcPriceM] = useState(1190);
  const [calcPriceL, setCalcPriceL] = useState(1490);
  const [calcPriceXL, setCalcPriceXL] = useState(1690);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
  };

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productionBatchesAPI.getAll(true);
      data.sort((a, b) => ((b.created_at || "") > (a.created_at || "") ? 1 : -1));
      setBatches(data);
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to load production data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Aggregate KPIs
  const totals = batches.reduce((acc, b) => {
    const tc = sumCosts(b);
    const tq = totalQty(b);
    const rev = calcRevenue(b);
    return {
      totalCost: acc.totalCost + tc,
      totalQty: acc.totalQty + tq,
      totalRevenue: acc.totalRevenue + rev,
    };
  }, { totalCost: 0, totalQty: 0, totalRevenue: 0 });
  const grossProfit = totals.totalRevenue - totals.totalCost;
  const avgUnitCost = totals.totalQty > 0 ? totals.totalCost / totals.totalQty : 0;

  // Form submit
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Manual extraction to debug
    const form = e.currentTarget;
    const batch_name = (form.elements.namedItem("batch_name") as HTMLInputElement)?.value || "Default Batch";
    const batch_date = (form.elements.namedItem("batch_date") as HTMLInputElement)?.value || new Date().toISOString().slice(0,10);
    const design_codes = (form.elements.namedItem("design_codes") as HTMLInputElement)?.value || "";
    const status = (form.elements.namedItem("status") as HTMLSelectElement)?.value || "planning";
    const fabric_cost = parseFloat((form.elements.namedItem("fabric_cost") as HTMLInputElement)?.value) || 0;
    const garments_bill = parseFloat((form.elements.namedItem("garments_bill") as HTMLInputElement)?.value) || 0;
    const print_bill = parseFloat((form.elements.namedItem("print_bill") as HTMLInputElement)?.value) || 0;
    const accessories_bill = parseFloat((form.elements.namedItem("accessories_bill") as HTMLInputElement)?.value) || 0;
    const transport_cost = parseFloat((form.elements.namedItem("transport_cost") as HTMLInputElement)?.value) || 0;
    const packaging_cost = parseFloat((form.elements.namedItem("packaging_cost") as HTMLInputElement)?.value) || 0;
    const other_costs = parseFloat((form.elements.namedItem("other_costs") as HTMLInputElement)?.value) || 0;
    const qty_small = parseFloat((form.elements.namedItem("qty_small") as HTMLInputElement)?.value) || 0;
    const qty_medium = parseFloat((form.elements.namedItem("qty_medium") as HTMLInputElement)?.value) || 0;
    const qty_large = parseFloat((form.elements.namedItem("qty_large") as HTMLInputElement)?.value) || 0;
    const qty_xl = parseFloat((form.elements.namedItem("qty_xl") as HTMLInputElement)?.value) || 0;
    const sell_price_small = parseFloat((form.elements.namedItem("sell_price_small") as HTMLInputElement)?.value) || 990;
    const sell_price_medium = parseFloat((form.elements.namedItem("sell_price_medium") as HTMLInputElement)?.value) || 1190;
    const sell_price_large = parseFloat((form.elements.namedItem("sell_price_large") as HTMLInputElement)?.value) || 1490;
    const sell_price_xl = parseFloat((form.elements.namedItem("sell_price_xl") as HTMLInputElement)?.value) || 1690;
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement)?.value || "";
    
    const data = {
      batch_name: batch_name,
      batch_date: batch_date,
      design_codes: design_codes,
      status: status,
      fabric_cost: fabric_cost,
      garments_bill: garments_bill,
      print_bill: print_bill,
      accessories_bill: accessories_bill,
      transport_cost: transport_cost,
      packaging_cost: packaging_cost,
      other_costs: other_costs,
      qty_small: qty_small,
      qty_medium: qty_medium,
      qty_large: qty_large,
      qty_xl: qty_xl,
      sell_price_small: sell_price_small,
      sell_price_medium: sell_price_medium,
      sell_price_large: sell_price_large,
      sell_price_xl: sell_price_xl,
      notes: notes,
    };
    setSaving(true);
    try {
      if (editBatch) {
        await productionBatchesAPI.update(editBatch.id, data);
        showToast("success", "Batch updated successfully!");
      } else {
        await productionBatchesAPI.create(data);
        showToast("success", "Batch created successfully!");
      }
      setShowModal(false);
      setEditBatch(null);
      await loadBatches();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to save batch. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    try {
      await productionBatchesAPI.delete(id);
      showToast("success", "Batch deleted!");
      await loadBatches();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to delete batch.");
    }
  };

  const handleDuplicate = async (b: ProductionBatch) => {
    try {
      const d = { ...b };
      delete (d as Partial<ProductionBatch>).id;
      d.batch_name = (d.batch_name || "Batch") + " (Copy)";
      d.status = "planning";
      d.batch_date = new Date().toISOString();
      await productionBatchesAPI.create(d as Record<string, unknown>);
      showToast("success", "Batch duplicated!");
      await loadBatches();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to duplicate batch.");
    }
  };

  // Calculator
  const calcTotalCost = calcFabric + calcGarments + calcPrint + calcAccessories + calcTransport + calcPackaging + calcOther;
  const calcTotalQty = calcQtyS + calcQtyM + calcQtyL + calcQtyXL;
  const calcUnitCost = calcTotalQty > 0 ? calcTotalCost / calcTotalQty : 0;
  const calcRevenueTotal = calcQtyS * calcPriceS + calcQtyM * calcPriceM + calcQtyL * calcPriceL + calcQtyXL * calcPriceXL;
  const calcProfit = calcRevenueTotal - calcTotalCost;
  const calcMargin = calcRevenueTotal > 0 ? ((calcProfit / calcRevenueTotal) * 100).toFixed(1) : "0";

  return (
    <AdminLayout title="Production & Costs" breadcrumb="Home / Production">
      <>
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <i className="fas fa-check"></i> : toast.type === "error" ? <i className="fas fa-times"></i> : <i className="fas fa-info-circle"></i>} {toast.message}
          </div>
        )}

        {/* Page Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--brand-navy)", marginBottom: 4 }}>
              <i className="fas fa-industry" style={{ color: "var(--brand-blue)", marginRight: 8 }}></i> Production & Cost Tracker
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--admin-muted)", margin: 0 }}>Track production batches, material costs, and profit per unit</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={loadBatches}>
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => { setEditBatch(null); setShowModal(true); }}>
              <i className="fas fa-plus"></i> New Batch
            </button>
          </div>
        </div>

        {/* KPI Summary */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#4A90E2,#7B68EE)" }}><i className="fas fa-layer-group" style={{ color: "white" }}></i></div>
            <div className="stat-info">
              <div className="stat-label">Total Batches</div>
              <div className="stat-value">{batches.length}</div>
              <div className="stat-change up">Recorded</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#40E0D0,#4A90E2)" }}><i className="fas fa-box" style={{ color: "white" }}></i></div>
            <div className="stat-info">
              <div className="stat-label">Total Units</div>
              <div className="stat-value">{totals.totalQty}</div>
              <div className="stat-change up">Produced</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#e67e22,#f39c12)" }}><i className="fas fa-money-bill-wave" style={{ color: "white" }}></i></div>
            <div className="stat-info">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">{formatCurrency(totals.totalCost)}</div>
              <div className="stat-change up">All batches</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#27ae60,#1abc9c)" }}><i className="fas fa-chart-line" style={{ color: "white" }}></i></div>
            <div className="stat-info">
              <div className="stat-label">Gross Profit</div>
              <div className="stat-value" style={{ color: grossProfit >= 0 ? "#27ae60" : "#e74c3c" }}>{formatCurrency(grossProfit)}</div>
              <div className="stat-change up">After COGS</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#9b59b6,#7b68ee)" }}><i className="fas fa-balance-scale" style={{ color: "white" }}></i></div>
            <div className="stat-info">
              <div className="stat-label">Avg Unit Cost</div>
              <div className="stat-value">{formatCurrency(Math.round(avgUnitCost))}</div>
              <div className="stat-change up">Per cover</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="prod-tabs" style={{ marginBottom: 20 }}>
          <button className={`prod-tab ${activeTab === "batches" ? "active" : ""}`} onClick={() => setActiveTab("batches")}>
            <i className="fas fa-boxes"></i> Production Batches
          </button>
          <button className={`prod-tab ${activeTab === "calculator" ? "active" : ""}`} onClick={() => setActiveTab("calculator")}>
            <i className="fas fa-calculator"></i> Quick Calculator
          </button>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner"></div><p>Loading…</p></div>
        ) : null}

        {/* TAB: Batches */}
        {!loading && activeTab === "batches" && (
          batches.length === 0 ? (
            <div className="admin-card" style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏭</div>
              <h3 style={{ color: "var(--brand-navy)", marginBottom: 8 }}>No production batches yet</h3>
              <p style={{ color: "var(--admin-muted)", marginBottom: 24 }}>Record your first batch to start tracking costs and profits.</p>
<button className="admin-btn admin-btn-primary" onClick={() => { setEditBatch(null); setShowModal(true); }}>
                <i className="fas fa-plus"></i> Record First Batch
              </button>
            </div>
          ) : (
            batches.map((b) => {
              const tc = sumCosts(b);
              const tq = totalQty(b);
              const uc = tq > 0 ? tc / tq : 0;
              const rev = calcRevenue(b);
              const profit = rev - tc;
              const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : "0";
              const statusColors: Record<string, string> = { planning: "#f39c12", in_production: "#3498db", completed: "#27ae60" };
              const bDate = b.batch_date ? new Date(b.batch_date).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" }) : "—";
              const isOpen = expandedBatch === b.id;
              const sizes = [
                { label: "S", qty: b.qty_small || 0, price: b.sell_price_small || 990 },
                { label: "M", qty: b.qty_medium || 0, price: b.sell_price_medium || 1190 },
                { label: "L", qty: b.qty_large || 0, price: b.sell_price_large || 1490 },
                { label: "XL", qty: b.qty_xl || 0, price: b.sell_price_xl || 1690 },
              ].filter(s => s.qty > 0);

              return (
                <div key={b.id} className="prod-batch-card" style={{ marginBottom: 16 }}>
                  <div className="prod-batch-header" onClick={() => setExpandedBatch(isOpen ? null : b.id)} style={{ cursor: "pointer", padding: 16, background: "#fff", borderRadius: 12, border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--brand-navy)" }}>
                        <i className="fas fa-layer-group" style={{ color: "var(--brand-blue)" }}></i>
                        {b.batch_name}
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: statusColors[b.status] || "#9fa8c7", background: `${statusColors[b.status] || "#9fa8c7"}22`, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" }}>
                          {b.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--admin-muted)", marginTop: 4 }}>
                        📅 {bDate} {b.design_codes ? ` · 🎨 ${b.design_codes}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--brand-blue)" }}>{tq}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--admin-muted)" }}>Units</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#e67e22" }}>{formatCurrency(tc)}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--admin-muted)" }}>Cost</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: "#27ae60" }}>{formatCurrency(profit)}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--admin-muted)" }}>Profit</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1rem", fontWeight: 800, color: profit >= 0 ? "#27ae60" : "#e74c3c" }}>{margin}%</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--admin-muted)" }}>Margin</div>
                      </div>
                      <i className="fas fa-chevron-down" style={{ color: "var(--admin-muted)", transition: "transform .3s", transform: isOpen ? "rotate(180deg)" : "" }}></i>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: 16, background: "#f8f9fc", borderTop: "1px solid var(--card-border)", borderRadius: "0 0 12px 12px" }}>
                      {/* Cost breakdown */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--brand-navy)", marginBottom: 12, textTransform: "uppercase" }}>💸 Expense Breakdown</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                          {[
                            { label: "🧵 Fabric", val: b.fabric_cost || 0 },
                            { label: "🪡 Garments", val: b.garments_bill || 0 },
                            { label: "🖨️ Print", val: b.print_bill || 0 },
                            { label: "🔩 Accessories", val: b.accessories_bill || 0 },
                            { label: "🚛 Transport", val: b.transport_cost || 0 },
                            { label: "📦 Packaging", val: b.packaging_cost || 0 },
                            { label: "➕ Other", val: b.other_costs || 0 },
                            { label: "💰 Total", val: tc, highlight: true },
                          ].map((item) => (
                            <div key={item.label} style={{ background: item.highlight ? "#f0f4ff" : "#fff", padding: "10px 12px", borderRadius: 8, border: `1px solid ${item.highlight ? "#4A90E2" : "#e1e5f5"}` }}>
                              <div style={{ fontSize: "0.75rem", color: "var(--admin-muted)" }}>{item.label}</div>
                              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: item.highlight ? "#4A90E2" : "var(--brand-navy)" }}>{formatCurrency(item.val)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Size breakdown */}
                      {sizes.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--brand-navy)", marginBottom: 12, textTransform: "uppercase" }}>📐 Per-Size Economics</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {sizes.map((s) => {
                              const profit2 = s.price - uc;
                              const pct = s.price > 0 ? Math.min(100, (profit2 / s.price) * 100) : 0;
                              return (
                                <div key={s.label} style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid var(--card-border)", textAlign: "center" }}>
                                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-blue)" }}>{s.label}</div>
                                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{s.qty} units</div>
                                  <div style={{ fontSize: "0.8rem", color: "#4A90E2" }}>Cost: {formatCurrency(Math.round(uc))}</div>
                                  <div style={{ fontSize: "0.8rem", color: "#27ae60" }}>Sell: {formatCurrency(s.price)}</div>
                                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: profit2 >= 0 ? "#27ae60" : "#e74c3c" }}>Profit: {formatCurrency(Math.round(profit2))} ({pct.toFixed(0)}%)</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {b.notes && (
                        <div style={{ padding: 12, background: "#fff", border: "1px solid #e1e5f5", borderRadius: 8, fontSize: "0.85rem", color: "var(--admin-muted)", marginBottom: 16 }}>
                        📝 {b.notes}
                      </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => { setEditBatch(b); setShowModal(true); }}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => handleDuplicate(b)}>
                          <i className="fas fa-copy"></i> Duplicate
                        </button>
                        <button className="admin-btn admin-btn-danger admin-btn-sm" style={{ marginLeft: "auto" }} onClick={() => handleDelete(b.id)}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        )}

        {/* TAB: Calculator */}
        {!loading && activeTab === "calculator" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Input */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">🧮 Quick Cost Calculator</div>
              </div>
              <div className="admin-card-body">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", marginBottom: 12 }}>💸 Production Expenses</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "🧵 Fabric (৳)", val: calcFabric, set: setCalcFabric },
                      { label: "🪡 Garments (৳)", val: calcGarments, set: setCalcGarments },
                      { label: "🖨️ Print Bill (৳)", val: calcPrint, set: setCalcPrint },
                      { label: "🔩 Accessories (৳)", val: calcAccessories, set: setCalcAccessories },
                      { label: "🚛 Transport (৳)", val: calcTransport, set: setCalcTransport },
                      { label: "📦 Packaging (৳)", val: calcPackaging, set: setCalcPackaging },
                      { label: "➕ Other (৳)", val: calcOther, set: setCalcOther },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">{label}</label>
                        <input type="number" className="admin-input" value={val} onChange={(e) => set(Number(e.target.value))} min={0} />
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", marginBottom: 12 }}>📦 Units Produced</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "S — Qty", val: calcQtyS, set: setCalcQtyS },
                      { label: "M — Qty", val: calcQtyM, set: setCalcQtyM },
                      { label: "L — Qty", val: calcQtyL, set: setCalcQtyL },
                      { label: "XL — Qty", val: calcQtyXL, set: setCalcQtyXL },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">{label}</label>
                        <input type="number" className="admin-input" value={val} onChange={(e) => set(Number(e.target.value))} min={0} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", textAlign: "center", marginBottom: 12 }}>💰 Selling Prices</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "S — Price", val: calcPriceS, set: setCalcPriceS },
                      { label: "M — Price", val: calcPriceM, set: setCalcPriceM },
                      { label: "L — Price", val: calcPriceL, set: setCalcPriceL },
                      { label: "XL — Price", val: calcPriceXL, set: setCalcPriceXL },
                    ].map(({ label, val, set }) => (
                      <div key={label} className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">{label}</label>
                        <input type="number" className="admin-input" value={val} onChange={(e) => set(Number(e.target.value))} min={0} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Results */}
            <div style={{ padding: 24, background: "linear-gradient(135deg,#0f1224,#1a1f3a)", borderRadius: 14, color: "#fff", height: "fit-content" }}>
              <h3 style={{ textAlign: "center", fontWeight: 700, marginBottom: 20 }}>📊 Live Calculation</h3>
              {[
                { label: "Total Expenses", value: formatCurrency(calcTotalCost) },
                { label: "Total Units", value: `${calcTotalQty} pcs` },
                { label: "Avg Unit Cost", value: formatCurrency(Math.round(calcUnitCost)) },
                { label: "Expected Revenue", value: formatCurrency(calcRevenueTotal) },
                { label: "Gross Profit", value: formatCurrency(calcProfit), color: calcProfit >= 0 ? "#27ae60" : "#e74c3c" },
                { label: "Profit Margin", value: `${calcMargin}%`, color: calcProfit >= 0 ? "#27ae60" : "#e74c3c" },
                { label: "Profit per Unit", value: formatCurrency(Math.round(calcTotalQty > 0 ? calcProfit / calcTotalQty : 0)), color: calcProfit >= 0 ? "#27ae60" : "#e74c3c" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: "1px solid rgba(255,255,255,.08)", fontSize: "0.88rem" }}>
                  <span style={{ color: "rgba(255,255,255,.6)" }}>{label}</span>
                  <span style={{ fontWeight: 700, color: color || "#fff" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  {editBatch ? <><i className="fas fa-edit"></i> Edit: {editBatch.batch_name}</> : <><i className="fas fa-plus"></i> New Production Batch</>}
                </div>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="admin-modal-body">
                <form onSubmit={handleSave}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Batch Name *</label>
                      <input type="text" name="batch_name" className="admin-input" required defaultValue={editBatch?.batch_name || ""} placeholder="e.g. Batch-003 Summer" />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Date</label>
                      <input type="date" name="batch_date" className="admin-input" defaultValue={editBatch?.batch_date ? editBatch.batch_date.slice(0, 10) : new Date().toISOString().slice(0, 10)} />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Design Codes</label>
                      <input type="text" name="design_codes" className="admin-input" defaultValue={editBatch?.design_codes || ""} placeholder="A1, B2" />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">Status</label>
                      <select name="status" className="admin-input" defaultValue={editBatch?.status || "planning"}>
                        <option value="planning">Planning</option>
                        <option value="in_production">In Production</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>💸 Expenses</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      ["fabric_cost", "Fabric (৳)", editBatch?.fabric_cost],
                      ["garments_bill", "Garments (৳)", editBatch?.garments_bill],
                      ["print_bill", "Print Bill (৳)", editBatch?.print_bill],
                      ["accessories_bill", "Accessories (৳)", editBatch?.accessories_bill],
                      ["transport_cost", "Transport (৳)", editBatch?.transport_cost],
                      ["packaging_cost", "Packaging (৳)", editBatch?.packaging_cost],
                      ["other_costs", "Other (৳)", editBatch?.other_costs],
                    ].map(([n, l, v]) => (
                      <div key={n as string} className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">{l as string}</label>
                        <input type="number" name={n as string} className="admin-input" defaultValue={v ?? 0} min={0} />
                      </div>
                    ))}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>📦 Units & Prices</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                      ["qty_small","S Qty",editBatch?.qty_small],["qty_medium","M Qty",editBatch?.qty_medium],
                      ["qty_large","L Qty",editBatch?.qty_large],["qty_xl","XL Qty",editBatch?.qty_xl],
                      ["sell_price_small","S Price",editBatch?.sell_price_small||990],
                      ["sell_price_medium","M Price",editBatch?.sell_price_medium||1190],
                      ["sell_price_large","L Price",editBatch?.sell_price_large||1490],
                      ["sell_price_xl","XL Price",editBatch?.sell_price_xl||1690],
                    ].map(([n, l, v]) => (
                      <div key={n as string} className="admin-form-group" style={{ marginBottom: 0 }}>
                        <label className="admin-form-label">{l as string}</label>
                        <input type="number" name={n as string} className="admin-input" defaultValue={v ?? 0} min={0} />
                      </div>
                    ))}
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Notes</label>
                    <textarea name="notes" className="admin-input" rows={2} defaultValue={editBatch?.notes || ""} placeholder="Additional notes…" />
                  </div>

                  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
                    <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                      {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : editBatch ? <><i className="fas fa-save"></i> Update Batch</> : <><i className="fas fa-save"></i> Save Batch</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </>
    </AdminLayout>
  );
}