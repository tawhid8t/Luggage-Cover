'use client';
import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { fbCampaignsAPI, type FBCampaign } from "@/lib/api";
import { formatPrice as fp } from "@/lib/utils";

function calcProfit(c: FBCampaign) {
  const rate = c.exchange_rate || 110;
  const bdtSpent = (c.usd_spent || 0) * rate;
  const orders = c.actual_orders || c.predicted_orders || 0;
  const revenue = (c.avg_order_value || 0) * orders;
  const prodCost = (c.unit_production_cost || 0) * orders;
  const delivCost = (c.delivery_cost_per_order || 0) * orders;
  const totalCost = bdtSpent + prodCost + delivCost + (c.other_costs_bdt || 0);
  return { bdtSpent, orders, revenue, totalCost, profit: revenue - totalCost };
}

function fbBreakEvenOrders(c: FBCampaign) {
  const bdtSpent = (c.usd_spent || 0) * ((c.exchange_rate || 110));
  const profitPerOrder = (c.avg_order_value || 0) - (c.unit_production_cost || 0) - (c.delivery_cost_per_order || 0);
  if (profitPerOrder <= 0) return "∞";
  return Math.ceil(bdtSpent / profitPerOrder);
}

type FBTab = "campaigns" | "calculator" | "analytics" | "guide";

export default function FacebookPage() {
  const [campaigns, setCampaigns] = useState<FBCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FBTab>("campaigns");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCampaign, setEditCampaign] = useState<FBCampaign | null>(null);
  const [saving, setSaving] = useState(false);

  const [calcUSD, setCalcUSD] = useState(100);
  const [calcRate, setCalcRate] = useState(110);
  const [calcOrders, setCalcOrders] = useState(80);
  const [calcAOV, setCalcAOV] = useState(1190);
  const [calcProd, setCalcProd] = useState(400);
  const [calcDeliv, setCalcDeliv] = useState(80);
  const [calcOther, setCalcOther] = useState(0);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fbCampaignsAPI.getAll(true);
      data.sort((a, b) => ((b.created_at || "") > (a.created_at || "") ? 1 : -1));
      setCampaigns(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const totalUSD = campaigns.reduce((s, c) => s + (c.usd_spent || 0), 0);
  const totalBDT = campaigns.reduce((s, c) => s + ((c.usd_spent || 0) * (c.exchange_rate || 110)), 0);
  const totalPredOrders = campaigns.reduce((s, c) => s + (c.predicted_orders || 0), 0);
  const totalActualOrders = campaigns.reduce((s, c) => s + (c.actual_orders || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => {
    const orders = c.actual_orders || c.predicted_orders || 0;
    return s + (c.avg_order_value || 0) * orders;
  }, 0);
  const totalProfit = campaigns.reduce((s, c) => s + calcProfit(c).profit, 0);

  const adBDT = calcUSD * calcRate;
  const calcRevenue = calcOrders * calcAOV;
  const calcProdTotal = calcProd * calcOrders;
  const calcDelivTotal = calcDeliv * calcOrders;
  const calcTotalCost = adBDT + calcProdTotal + calcDelivTotal + calcOther;
  const calcProfitAmt = calcRevenue - calcTotalCost;
  const calcMargin = calcRevenue > 0 ? ((calcProfitAmt / calcRevenue) * 100).toFixed(1) : "0";
  const calcROAS = adBDT > 0 ? (calcRevenue / adBDT).toFixed(2) : "0";
  const breakEven = calcAOV - calcProd - calcDeliv > 0 ? Math.ceil(adBDT / (calcAOV - calcProd - calcDeliv)) : "∞";
  const calcCPO = calcOrders > 0 ? (adBDT / calcOrders).toFixed(0) : "0";
  const calcCPOFinal = calcOrders > 0 ? (calcTotalCost / calcOrders).toFixed(0) : "0";
  const calcProfitPerOrder = calcOrders > 0 ? (calcProfitAmt / calcOrders).toFixed(0) : "0";

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const usd = parseFloat(fd.get("usd_spent") as string) || 0;
    const rate = parseFloat(fd.get("exchange_rate") as string) || 110;
    const g = (k: string) => parseFloat(fd.get(k) as string) || 0;
    const data = {
      campaign_name: fd.get("campaign_name") as string,
      month: fd.get("month") as string,
      status: fd.get("status") as string,
      usd_spent: usd,
      exchange_rate: rate,
      bdtSpent: usd * rate,
      predicted_orders: g("predicted_orders"),
      actual_orders: g("actual_orders"),
      avg_order_value: g("avg_order_value"),
      unit_production_cost: g("unit_production_cost"),
      delivery_cost_per_order: g("delivery_cost_per_order"),
      other_costs_bdt: g("other_costs_bdt"),
      notes: fd.get("notes") as string,
    };
    setSaving(true);
    try {
      if (editCampaign) {
        await fbCampaignsAPI.update(editCampaign.id, data);
      } else {
        await fbCampaignsAPI.create(data);
      }
      setShowModal(false);
      await loadCampaigns();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try { await fbCampaignsAPI.delete(id); await loadCampaigns(); } catch (e) { console.error(e); }
  };

  const statusColors: Record<string, string> = { active: "#27ae60", completed: "#1877f2", paused: "#e67e22" };

  const latestRate = campaigns[0]?.exchange_rate || 110;
  const latestUSD = campaigns[0]?.usd_spent || 0;
  const predictionRate = totalPredOrders > 0 ? Math.round((totalActualOrders / totalPredOrders) * 100) : 0;

  return (
    <AdminLayout title="Facebook Marketing" breadcrumb="Home / Facebook Ads">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--brand-navy)", margin: 0 }}>
            <i className="fab fa-facebook-square" style={{ color: "#1877f2", marginRight: 8 }} />
            Facebook Marketing Tracker
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--admin-muted)", margin: "2px 0 0" }}>
            Track ad spend in USD, predict orders & calculate true profit
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={loadCampaigns}>
            <i className="fas fa-sync-alt" /> Refresh
          </button>
          <button className="admin-btn admin-btn-primary" style={{ background: "linear-gradient(135deg,#1877f2,#42a5f5)", border: "none" }} onClick={() => { setEditCampaign(null); setShowModal(true); }}>
            <i className="fas fa-plus" /> New Campaign
          </button>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="fb-rate-banner">
          <div className="fb-rate-banner-icon">💱</div>
          <div className="fb-rate-badge">1 USD = ৳{latestRate}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1877f2" }}>Latest Exchange Rate (from newest campaign)</div>
            <div style={{ fontSize: 12, color: "var(--admin-muted)" }}>${latestUSD} USD = ৳{(latestUSD * latestRate).toLocaleString()} BDT</div>
          </div>
        </div>
      )}

      <div className="fb-kpi-grid">
        <div className="fb-kpi blue">
          <div className="fb-kpi-val">${totalUSD.toFixed(0)}</div>
          <div className="fb-kpi-lbl">Total USD Spent</div>
          <div className="fb-kpi-sub">৳{Math.round(totalBDT).toLocaleString()} BDT</div>
        </div>
        <div className="fb-kpi orange">
          <div className="fb-kpi-val">{totalPredOrders}</div>
          <div className="fb-kpi-lbl">Predicted Orders</div>
          <div className="fb-kpi-sub">Across all campaigns</div>
        </div>
        <div className="fb-kpi purple">
          <div className="fb-kpi-val">{totalActualOrders}</div>
          <div className="fb-kpi-lbl">Actual Orders</div>
          <div className="fb-kpi-sub">{predictionRate}% of prediction</div>
        </div>
        <div className={`fb-kpi ${totalRevenue > 0 ? "green" : "red"}`}>
          <div className="fb-kpi-val">৳{Math.round(totalRevenue).toLocaleString()}</div>
          <div className="fb-kpi-lbl">Total Revenue</div>
          <div className="fb-kpi-sub">From actual orders</div>
        </div>
        <div className={`fb-kpi ${totalProfit >= 0 ? "green" : "red"}`}>
          <div className="fb-kpi-val" style={{ color: totalProfit >= 0 ? "#27ae60" : "#e74c3c" }}>
            ৳{Math.round(totalProfit).toLocaleString()}
          </div>
          <div className="fb-kpi-lbl">Net Profit</div>
          <div className="fb-kpi-sub">After all costs</div>
        </div>
      </div>

      <div className="fb-tabs">
        {(["campaigns", "calculator", "analytics", "guide"] as FBTab[]).map((tab) => (
          <button
            key={tab}
            className={`fb-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "campaigns" && "📣 Campaigns"}
            {tab === "calculator" && "🧮 Live Calculator"}
            {tab === "analytics" && "📊 Analytics"}
            {tab === "guide" && "💡 Business Tips"}
          </button>
        ))}
      </div>

      {loading && <div className="empty-state"><div className="spinner" /><p>Loading…</p></div>}

      {!loading && activeTab === "campaigns" && (
        campaigns.length === 0 ? (
          <div className="admin-card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📣</div>
            <h3 style={{ color: "var(--brand-navy)", marginBottom: 8 }}>No Campaigns Yet</h3>
            <p style={{ color: "var(--admin-muted)", marginBottom: 20 }}>Add your first Facebook ad campaign to start tracking ROI & profit</p>
            <button className="admin-btn admin-btn-primary" style={{ background: "linear-gradient(135deg,#1877f2,#42a5f5)", border: "none" }} onClick={() => { setEditCampaign(null); setShowModal(true); }}>
              <i className="fas fa-plus" /> Add First Campaign
            </button>
          </div>
        ) : (
          campaigns.map((c) => {
            const { bdtSpent, orders, revenue, totalCost, profit } = calcProfit(c);
            const isActual = (c.actual_orders || 0) > 0;
            const roas = bdtSpent > 0 ? (revenue / bdtSpent).toFixed(2) : "0";
            const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";
            const cpo = orders > 0 ? (bdtSpent / orders).toFixed(0) : "0";
            const cpoTotal = orders > 0 ? (totalCost / orders).toFixed(0) : "0";
            const isOpen = expanded === c.id;

            return (
              <div key={c.id} className="fb-campaign-card">
                <div className="fb-campaign-header" onClick={() => setExpanded(isOpen ? null : c.id)}>
                  <div className="fb-campaign-icon"><i className="fab fa-facebook-f" /></div>
                  <div className="fb-campaign-meta">
                    <div className="fb-campaign-name">{c.campaign_name || "Unnamed Campaign"}</div>
                    <div className="fb-campaign-period">{c.month || "—"} &nbsp;·&nbsp; 1 USD = ৳{c.exchange_rate || 110}</div>
                  </div>
                  <div className="fb-campaign-pills">
                    <span className="fb-pill fb-pill-blue">${c.usd_spent || 0} → ৳{Math.round(bdtSpent).toLocaleString()}</span>
                    <span className={`fb-pill ${statusColors[c.status] ? `fb-pill-${statusColors[c.status] === "#27ae60" ? "green" : statusColors[c.status] === "#1877f2" ? "blue" : "orange"}` : "fb-pill-blue"}`}>
                      {c.status || "active"}
                    </span>
                    <span className={`fb-pill ${profit >= 0 ? "fb-pill-green" : "fb-pill-red"}`}>
                      {profit >= 0 ? "✅" : "❌"} {fp(Math.round(profit))}
                    </span>
                  </div>
                  <i className="fas fa-chevron-down fb-campaign-chevron" style={{ transform: isOpen ? "rotate(180deg)" : "" }} />
                </div>

                {isOpen && (
                  <div className="fb-campaign-body open">
                    <div className="fb-breakdown-grid">
                      <div className="fb-breakdown-item blue">
                        <div className="fbi-label">💵 FB Ad Spend</div>
                        <div className="fbi-value">${c.usd_spent || 0}</div>
                        <div style={{ fontSize: 12, color: "#1877f2", marginTop: 2 }}>= ৳{Math.round(bdtSpent).toLocaleString()}</div>
                      </div>
                      <div className="fb-breakdown-item">
                        <div className="fbi-label">📦 Predicted Orders</div>
                        <div className="fbi-value">{c.predicted_orders || 0}</div>
                      </div>
                      <div className={`fb-breakdown-item ${isActual ? "green" : "orange"}`}>
                        <div className="fbi-label">✅ Actual Orders</div>
                        <div className="fbi-value">{c.actual_orders || 0}</div>
                        <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 2 }}>{isActual ? "Real data" : "Not yet recorded"}</div>
                      </div>
                      <div className="fb-breakdown-item">
                        <div className="fbi-label">💰 Avg Order Value</div>
                        <div className="fbi-value">৳{(c.avg_order_value || 0).toLocaleString()}</div>
                      </div>
                      <div className="fb-breakdown-item">
                        <div className="fbi-label">🏭 Prod Cost/Unit</div>
                        <div className="fbi-value">৳{(c.unit_production_cost || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: "var(--admin-muted)" }}>Total: ৳{Math.round((c.unit_production_cost || 0) * orders).toLocaleString()}</div>
                      </div>
                      <div className="fb-breakdown-item">
                        <div className="fbi-label">🚚 Deliv Cost/Order</div>
                        <div className="fbi-value">৳{(c.delivery_cost_per_order || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: "var(--admin-muted)" }}>Total: ৳{Math.round((c.delivery_cost_per_order || 0) * orders).toLocaleString()}</div>
                      </div>
                      <div className="fb-breakdown-item">
                        <div className="fbi-label">➕ Other Costs</div>
                        <div className="fbi-value">৳{(c.other_costs_bdt || 0).toLocaleString()}</div>
                      </div>
                      <div className="fb-breakdown-item orange">
                        <div className="fbi-label">📊 ROAS</div>
                        <div className="fbi-value">{roas}x</div>
                        <div style={{ fontSize: 11, color: "var(--admin-muted)" }}>Return on Ad Spend</div>
                      </div>
                    </div>

                    <div className="fb-profit-result">
                      <h4><i className="fas fa-chart-pie" /> Full P&L ({isActual ? "Actual Orders" : "Predicted Orders"})</h4>
                      <div className="fb-profit-row">
                        <span className="fpr-label">📈 Revenue ({orders} × ৳{(c.avg_order_value || 0).toLocaleString()})</span>
                        <span className="fpr-value">৳{Math.round(revenue).toLocaleString()}</span>
                      </div>
                      <div className="fb-profit-row" style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 6, paddingTop: 10 }}>
                        <span className="fpr-label">📣 Facebook Ad Cost (BDT)</span>
                        <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round(bdtSpent).toLocaleString()}</span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">🏭 Production Cost ({orders} × ৳{(c.unit_production_cost || 0).toLocaleString()})</span>
                        <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round((c.unit_production_cost || 0) * orders).toLocaleString()}</span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">🚚 Delivery Cost ({orders} × ৳{(c.delivery_cost_per_order || 0).toLocaleString()})</span>
                        <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round((c.delivery_cost_per_order || 0) * orders).toLocaleString()}</span>
                      </div>
                      {(c.other_costs_bdt || 0) > 0 && (
                        <div className="fb-profit-row">
                          <span className="fpr-label">➕ Other Costs</span>
                          <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{(c.other_costs_bdt || 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="fb-profit-row total-row">
                        <span className="fpr-label" style={{ color: "rgba(255,255,255,.8)", fontSize: "0.95rem" }}>Total Costs</span>
                        <span className="fpr-value" style={{ color: "#e74c3c" }}>- ৳{Math.round(totalCost).toLocaleString()}</span>
                      </div>
                      <div className={`fb-profit-row ${profit >= 0 ? "win-row" : "loss-row"}`}>
                        <span className="fpr-label">Net Profit / Loss</span>
                        <span className="fpr-value" style={{ color: profit >= 0 ? "#27ae60" : "#e74c3c" }}>
                          {profit >= 0 ? "✅" : "❌"} ৳{Math.round(profit).toLocaleString()}
                        </span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">Profit Margin</span>
                        <span className="fpr-value">{margin}%</span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">Ad Cost Per Order</span>
                        <span className="fpr-value">৳{cpo}</span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">Total Cost Per Order</span>
                        <span className="fpr-value">৳{cpoTotal}</span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">ROAS (Revenue ÷ Ad Spend)</span>
                        <span className="fpr-value">{roas}x</span>
                      </div>
                      <div className="fb-profit-row">
                        <span className="fpr-label">Break-even Orders Needed</span>
                        <span className="fpr-value">{fbBreakEvenOrders(c)} orders</span>
                      </div>
                    </div>

                    {(c as FBCampaign & { notes?: string }).notes ? (
                      <div className="fb-notes">
                        <i className="fas fa-sticky-note" style={{ marginRight: 6, color: "#1877f2" }} />
                        {(c as FBCampaign & { notes?: string }).notes}
                      </div>
                    ) : null}

                    <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                      <button className="admin-btn admin-btn-primary admin-btn-sm" style={{ background: "linear-gradient(135deg,#1877f2,#42a5f5)", border: "none" }} onClick={() => { setEditCampaign(c); setShowModal(true); }}>
                        <i className="fas fa-edit" /> Edit
                      </button>
                      <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={async () => {
                        try { await fbCampaignsAPI.create({ ...c, campaign_name: `${c.campaign_name} (Copy)`, status: "paused", actual_orders: 0 }); await loadCampaigns(); } catch (e) { console.error(e); }
                      }}>
                        <i className="fas fa-copy" /> Duplicate
                      </button>
                      {!isActual && (
                        <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => {
                          const actual = prompt(`Enter actual orders for "${c.campaign_name}":`, String(c.predicted_orders || 0));
                          if (!actual) return;
                          fbCampaignsAPI.update(c.id, { actual_orders: parseInt(actual) || 0 }).then(loadCampaigns).catch(console.error);
                        }}>
                          <i className="fas fa-check-circle" /> Record Actual
                        </button>
                      )}
                      <button className="admin-btn admin-btn-danger admin-btn-sm" style={{ marginLeft: "auto" }} onClick={() => handleDelete(c.id)}>
                        <i className="fas fa-trash" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )
      )}

      {!loading && activeTab === "calculator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title" style={{ color: "#1877f2" }}>
                <i className="fab fa-facebook-square" /> Facebook Ad ROI Calculator
              </div>
              <small style={{ color: "var(--admin-muted)" }}>Fill in values — profit updates live</small>
            </div>
            <div className="admin-card-body">
              <div className="fb-calc-panel">
                <div style={{ marginBottom: 24 }}>
                  <div className="fb-calc-section-title"><i className="fab fa-facebook-square" /> Facebook Ad Spend</div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">💵 Ad Spend (USD)</label>
                      <input type="number" className="admin-input" value={calcUSD} onChange={(e) => setCalcUSD(Number(e.target.value))} min={0} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">💱 Exchange Rate (1 USD = ? BDT)</label>
                      <input type="number" className="admin-input" value={calcRate} onChange={(e) => setCalcRate(Number(e.target.value))} min={1} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">📦 Predicted Orders This Month</label>
                      <input type="number" className="admin-input" value={calcOrders} onChange={(e) => setCalcOrders(Number(e.target.value))} min={0} />
                    </div>
                  </div>
                  <div style={{ background: "linear-gradient(135deg,#e8f0fe,#f0f4ff)", border: "1.5px solid #b8d0fb", borderRadius: 10, padding: "12px 16px", marginTop: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontSize: "1.2rem" }}>💱</div>
                    <div>
                      <span style={{ fontSize: 13, color: "var(--admin-muted)" }}>Ad spend: </span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: "#1877f2" }}>৳{Math.round(adBDT).toLocaleString()}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 13, color: "var(--admin-muted)" }}>Ad cost per order: </span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#e67e22" }}>৳{calcCPO}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="fb-calc-section-title"><i className="fas fa-box-open" /> Per-Order Economics</div>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">💰 Avg Selling Price / Order (৳)</label>
                      <input type="number" className="admin-input" value={calcAOV} onChange={(e) => setCalcAOV(Number(e.target.value))} min={0} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">🏭 Production Cost / Unit (৳)</label>
                      <input type="number" className="admin-input" value={calcProd} onChange={(e) => setCalcProd(Number(e.target.value))} min={0} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">🚚 Delivery / Courier Cost / Order (৳)</label>
                      <input type="number" className="admin-input" value={calcDeliv} onChange={(e) => setCalcDeliv(Number(e.target.value))} min={0} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">➕ Other Monthly Costs (৳)</label>
                      <input type="number" className="admin-input" value={calcOther} onChange={(e) => setCalcOther(Number(e.target.value))} min={0} />
                    </div>
                  </div>
                </div>

                <button className="admin-btn admin-btn-primary" style={{ marginTop: 16, width: "100%", background: "linear-gradient(135deg,#1877f2,#42a5f5)", border: "none" }} onClick={async () => {
                  const data = {
                    campaign_name: `Calculator Preview`,
                    month: new Date().toISOString().slice(0, 7),
                    status: "active",
                    usd_spent: calcUSD,
                    exchange_rate: calcRate,
                    bdtSpent: calcUSD * calcRate,
                    predicted_orders: calcOrders,
                    actual_orders: 0,
                    avg_order_value: calcAOV,
                    unit_production_cost: calcProd,
                    delivery_cost_per_order: calcDeliv,
                    other_costs_bdt: calcOther,
                    notes: "Saved from ROI Calculator",
                  };
                  try {
                    await fbCampaignsAPI.create(data);
                    await loadCampaigns();
                    setActiveTab("campaigns");
                  } catch (e) { console.error(e); }
                }}>
                  <i className="fas fa-save" /> Save as Campaign
                </button>
              </div>
            </div>
          </div>

          <div className="fb-profit-result" style={{ height: "fit-content" }}>
            <h4><i className="fas fa-chart-pie" /> Live P&L Calculation</h4>
            <div className="fb-profit-row">
              <span className="fpr-label">📣 FB Ad Spend (BDT)</span>
              <span className="fpr-value">৳{Math.round(adBDT).toLocaleString()}</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">📦 Predicted Orders</span>
              <span className="fpr-value">{calcOrders} orders</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">📈 Total Revenue (Orders × AOV)</span>
              <span className="fpr-value">৳{Math.round(calcRevenue).toLocaleString()}</span>
            </div>
            <div className="fb-profit-row" style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 10 }}>
              <span className="fpr-label">🏭 Total Production Cost</span>
              <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round(calcProdTotal).toLocaleString()}</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">🚚 Total Delivery Cost</span>
              <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round(calcDelivTotal).toLocaleString()}</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">📣 Facebook Ad Cost</span>
              <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round(adBDT).toLocaleString()}</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">➕ Other Costs</span>
              <span className="fpr-value" style={{ color: "#f39c12" }}>- ৳{Math.round(calcOther).toLocaleString()}</span>
            </div>
            <div className="fb-profit-row total-row">
              <span className="fpr-label" style={{ color: "rgba(255,255,255,.8)" }}>Total Costs</span>
              <span className="fpr-value" style={{ color: "#e74c3c" }}>- ৳{Math.round(calcTotalCost).toLocaleString()}</span>
            </div>
            <div className={`fb-profit-row ${calcProfitAmt >= 0 ? "win-row" : "loss-row"}`}>
              <span className="fpr-label">Net Profit / Loss</span>
              <span className="fpr-value" style={{ color: calcProfitAmt >= 0 ? "#27ae60" : "#e74c3c" }}>
                {calcProfitAmt >= 0 ? "✅" : "❌"} ৳{Math.round(calcProfitAmt).toLocaleString()}
              </span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">Profit Margin</span>
              <span className="fpr-value">{calcMargin}%</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">ROAS (Revenue ÷ Ad Spend)</span>
              <span className="fpr-value">{calcROAS}x</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">Ad Cost Per Order</span>
              <span className="fpr-value">৳{calcCPO}</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">Total Cost Per Order</span>
              <span className="fpr-value">৳{calcCPOFinal}</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">Break-even Orders</span>
              <span className="fpr-value">{breakEven} orders</span>
            </div>
            <div className="fb-profit-row">
              <span className="fpr-label">Profit Per Order</span>
              <span className="fpr-value">৳{calcProfitPerOrder}</span>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === "analytics" && (
        campaigns.length === 0 ? (
          <div className="admin-card" style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>📊</div>
            <p style={{ color: "var(--admin-muted)" }}>No campaign data yet.</p>
          </div>
        ) : (
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title"><i className="fas fa-table" style={{ color: "#1877f2" }} /> All Campaigns — P&L Summary</div>
            </div>
            <div className="admin-card-body">
              <div className="fb-analytics-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Campaign</th><th>Month</th><th>USD</th><th>BDT</th>
                      <th>Orders</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th><th>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const rate = c.exchange_rate || 110;
                      const bdtSpent = (c.usd_spent || 0) * rate;
                      const orders = c.actual_orders || c.predicted_orders || 0;
                      const revenue = (c.avg_order_value || 0) * orders;
                      const totalCost = bdtSpent + (c.unit_production_cost || 0) * orders + (c.delivery_cost_per_order || 0) * orders + (c.other_costs_bdt || 0);
                      const profit = revenue - totalCost;
                      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";
                      const roas = bdtSpent > 0 ? (revenue / bdtSpent).toFixed(2) : "0";
                      return (
                        <tr key={c.id}>
                          <td className="cell-bold">{c.campaign_name || "—"}</td>
                          <td>{c.month || "—"}</td>
                          <td>${c.usd_spent || 0}</td>
                          <td>৳{Math.round(bdtSpent).toLocaleString()}</td>
                          <td>{orders}</td>
                          <td>৳{Math.round(revenue).toLocaleString()}</td>
                          <td>৳{Math.round(totalCost).toLocaleString()}</td>
                          <td className={profit >= 0 ? "text-success font-bold" : "text-danger font-bold"}>৳{Math.round(profit).toLocaleString()}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div className="fb-analytics-mini-bar">
                                <div className="fb-analytics-mini-bar-fill" style={{ width: `${Math.min(100, Math.max(0, parseFloat(margin)))}%`, background: profit >= 0 ? "#27ae60" : "#e74c3c" }} />
                              </div>
                              <span className={profit >= 0 ? "text-success font-bold" : "text-danger font-bold"}>{margin}%</span>
                            </div>
                          </td>
                          <td className="font-bold">{roas}x</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "linear-gradient(135deg,#e8f0fe,#f0f4ff)", fontWeight: 800 }}>
                      <td>TOTAL</td><td>—</td>
                      <td>${totalUSD.toFixed(0)}</td>
                      <td>৳{Math.round(totalBDT).toLocaleString()}</td>
                      <td>{totalActualOrders}</td>
                      <td>৳{Math.round(totalRevenue).toLocaleString()}</td>
                      <td>—</td>
                      <td className={totalProfit >= 0 ? "text-success font-bold" : "text-danger font-bold"}>৳{Math.round(totalProfit).toLocaleString()}</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {!loading && activeTab === "guide" && (
        <div className="fb-guide-grid">
          {[
            { icon: "🎯", title: "Set a Realistic Budget", desc: "Start with ৳5,000–10,000 BDT equivalent. Scale up only after you get your first 5 sales with positive ROAS.", metric: "≤ ৳2,000/order", metricLabel: "Target CPL" },
            { icon: "📸", title: "Use Real Product Photos", desc: "Always use real photos of YOUR actual luggage cover. No stock photos. Show it on an actual bag.", metric: "+40%", metricLabel: "Higher CTR" },
            { icon: "✂️", title: "Target the Right Audience", desc: "Bangladesh travelers, 20–40 age, interested in travel. Exclude already-buyers. Use Lookalike audiences.", metric: "18–35", metricLabel: "Best age range" },
            { icon: "🔁", title: "Test One Ad Per Campaign", desc: "One design per campaign. Don't test multiple designs — you won't know what works.", metric: "50+", metricLabel: "Min. reach needed" },
            { icon: "💰", title: "Record Actual Orders", desc: "Always come back and enter real orders after delivery. This is how you know your TRUE profit.", metric: "≥ 1.5x", metricLabel: "Target ROAS" },
            { icon: "📱", title: "Use Video Ads", desc: "A 15-sec video showing the cover on a bag at the airport gets 3x better results than image ads.", metric: "3x", metricLabel: "More engagement" },
            { icon: "📅", title: "Run 7-Day Campaigns", desc: "Start 7 days before weekends/holidays. Eid collection? Start 3 weeks before.", metric: "7 days", metricLabel: "Best campaign length" },
            { icon: "📊", title: "Know Your Break-Even", desc: "If you need 40 orders to break even and you only got 20, pause the campaign and try a new creative.", metric: "৳710", metricLabel: "Profit/order needed" },
          ].map((tip, i) => (
            <div key={i} className="fb-guide-card">
              <div className="fb-guide-icon">{tip.icon}</div>
              <div className="fb-guide-title">{tip.title}</div>
              <div className="fb-guide-desc">{tip.desc}</div>
              <div className="fb-guide-metric">
                <div className="fb-guide-metric-val">{tip.metric}</div>
                <div className="fb-guide-metric-lbl">{tip.metricLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <h3 style={{ fontWeight: 800, marginBottom: 20, color: "var(--brand-navy)" }}>
              {editCampaign ? `Edit: ${editCampaign.campaign_name}` : "New Facebook Campaign"}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Campaign Name *</label>
                  <input type="text" name="campaign_name" className="admin-input" required defaultValue={editCampaign?.campaign_name || ""} placeholder="e.g. Eid Collection Launch" />
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <input type="month" name="month" className="admin-input" defaultValue={editCampaign?.month || new Date().toISOString().slice(0, 7)} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">💵 USD Spent</label>
                  <input type="number" name="usd_spent" className="admin-input" defaultValue={editCampaign?.usd_spent ?? 100} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">💱 Exchange Rate (1 USD = X BDT)</label>
                  <input type="number" name="exchange_rate" className="admin-input" defaultValue={editCampaign?.exchange_rate ?? 110} min={1} />
                </div>
                <div className="form-group">
                  <label className="form-label">📦 Predicted Orders</label>
                  <input type="number" name="predicted_orders" className="admin-input" defaultValue={editCampaign?.predicted_orders ?? 80} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">✅ Actual Orders</label>
                  <input type="number" name="actual_orders" className="admin-input" defaultValue={editCampaign?.actual_orders ?? 0} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">💰 Avg Order Value (৳)</label>
                  <input type="number" name="avg_order_value" className="admin-input" defaultValue={editCampaign?.avg_order_value ?? 1190} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">🏭 Production Cost/Unit (৳)</label>
                  <input type="number" name="unit_production_cost" className="admin-input" defaultValue={editCampaign?.unit_production_cost ?? 400} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">🚚 Delivery Cost/Order (৳)</label>
                  <input type="number" name="delivery_cost_per_order" className="admin-input" defaultValue={editCampaign?.delivery_cost_per_order ?? 80} min={0} />
                </div>
                <div className="form-group">
                  <label className="form-label">➕ Other Costs (৳)</label>
                  <input type="number" name="other_costs_bdt" className="admin-input" defaultValue={editCampaign?.other_costs_bdt ?? 0} min={0} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="admin-input" defaultValue={editCampaign?.status || "active"}>
                  <option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="admin-input" rows={2} defaultValue={editCampaign?.notes || ""} />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ background: "linear-gradient(135deg,#1877f2,#42a5f5)", border: "none" }} disabled={saving}>
                  {saving ? "Saving…" : editCampaign ? "Update" : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}