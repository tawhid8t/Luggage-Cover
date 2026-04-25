'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ordersAPI, productsAPI, customersAPI, adminAuthAPI,
  productionBatchesAPI, fbCampaignsAPI, contentBudgetAPI,
  type ProductionBatch, type FBCampaign, type ContentBudgetEntry,
} from "@/lib/api";
import { formatPrice as fp, formatDate } from "@/lib/utils";
import { Pie } from "recharts";
import AdminLayout from "@/components/admin/admin-layout";
import type { Order, Product, Customer } from "@/types";
import type { AdminSession } from "@/types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "#3498db" },
  confirmed: { label: "Confirmed", color: "#9b59b6" },
  packing: { label: "Packing", color: "#e67e22" },
  packed: { label: "Packed", color: "#f39c12" },
  shipped: { label: "Shipped", color: "#1abc9c" },
  delivered: { label: "Delivered", color: "#27ae60" },
  cancelled: { label: "Cancelled", color: "#e74c3c" },
  return_requested: { label: "Return Req.", color: "#e74c3c" },
  returned: { label: "Returned", color: "#c0392b" },
  refunded: { label: "Refunded", color: "#7f8c8d" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [fbCampaigns, setFbCampaigns] = useState<FBCampaign[]>([]);
  const [contentBudget, setContentBudget] = useState<ContentBudgetEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    const s = adminAuthAPI.getSession();
    if (!s) { router.replace("/admin/login"); return; }
    setSession(s);
    loadData();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [o, p, c, b, fb, cb] = await Promise.all([
        ordersAPI.getAll(true),
        productsAPI.getAll(true),
        customersAPI.getAll(),
        productionBatchesAPI.getAll(true),
        fbCampaignsAPI.getAll(true),
        contentBudgetAPI.getAll(true),
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
      setBatches(b);
      setFbCampaigns(fb);
      setContentBudget(cb);
    } catch (e) {
      console.error("Dashboard load error:", e);
      setLoadError("Failed to load dashboard data. The server may be unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const newOrders = orders.filter((o) => o.order_status === "new").length;
  const deliveredCount = orders.filter((o) => o.order_status === "delivered").length;
  const pendingOrders = orders.filter((o) =>
    ["new", "confirmed", "packing", "packed"].includes(o.order_status)
  ).length;
  const lowStock = products.filter(
    (p) =>
      p.status === "active" &&
      ((p.stock_small as number) < 5 ||
        (p.stock_medium as number) < 5 ||
        (p.stock_large as number) < 5)
  );

  // ── Profit Calculations ──
  let totalUnits = 0, totalCostAll = 0;
  batches.forEach((b) => {
    const qty = (b.qty_small||0)+(b.qty_medium||0)+(b.qty_large||0)+(b.qty_xl||0);
    const cost = (b.fabric_cost||0)+(b.garments_bill||0)+(b.print_bill||0)+(b.accessories_bill||0)+(b.transport_cost||0)+(b.packaging_cost||0)+(b.other_costs||0);
    totalUnits += qty;
    totalCostAll += cost;
  });
  const avgUnitCost = totalUnits > 0 ? totalCostAll / totalUnits : 0;

  const deliveredOrdersList = orders.filter((o) => o.order_status === "delivered");
  const deliveredRevenue = deliveredOrdersList.reduce((s, o) => s + (o.total_amount || 0), 0);
  let deliveredQty = 0;
  deliveredOrdersList.forEach((o) => { (o.items || []).forEach((i) => { deliveredQty += (i.qty || 1); }); });
  const estimatedCOGS = deliveredQty * avgUnitCost;
  const grossProfit = deliveredRevenue - estimatedCOGS;
  const grossMargin = deliveredRevenue > 0 ? ((grossProfit / deliveredRevenue) * 100).toFixed(1) : "0";
  const avgProfitPerCover = deliveredQty > 0 ? Math.round(grossProfit / deliveredQty) : 0;

  const sizePrices: Record<string, number[]> = { small: [], medium: [], large: [] };
  deliveredOrdersList.forEach((o) => {
    (o.items || []).forEach((i: { size?: string; price?: number }) => {
      if (sizePrices[i.size as keyof typeof sizePrices]) {
        sizePrices[i.size as keyof typeof sizePrices].push(i.price || 0);
      }
    });
  });
  const avgSell: Record<string, number> = {
    small: sizePrices.small.length ? Math.round(sizePrices.small.reduce((a, b) => a + b, 0) / sizePrices.small.length) : 990,
    medium: sizePrices.medium.length ? Math.round(sizePrices.medium.reduce((a, b) => a + b, 0) / sizePrices.medium.length) : 1190,
    large: sizePrices.large.length ? Math.round(sizePrices.large.reduce((a, b) => a + b, 0) / sizePrices.large.length) : 1490,
  };

  const hasBatchData = batches.length > 0 && avgUnitCost > 0;

  // FB Ad Spend (non-cancelled)
  const activeFB = fbCampaigns.filter((c) => c.status !== "cancelled");
  const totalFBAdSpendBDT = activeFB.reduce((s, c) => s + ((c.usd_spent || 0) * (c.exchange_rate || 110)), 0);

  // Content Budget (non-cancelled)
  const activeContent = contentBudget.filter((e) => e.status !== "cancelled");
  const totalContentSpend = activeContent.reduce((s, e) => {
    return s + ((e.amount_bdt && e.amount_bdt > 0) ? e.amount_bdt : (e.amount_usd || 0) * (e.exchange_rate || 110));
  }, 0);

  // Net Profit
  const netProfit = grossProfit - totalFBAdSpendBDT - totalContentSpend;
  const netMargin = deliveredRevenue > 0 ? ((netProfit / deliveredRevenue) * 100).toFixed(1) : "0";
  const profitColor = grossProfit >= 0 ? "#27ae60" : "#e74c3c";
  const netProfitColor = netProfit >= 0 ? "#27ae60" : "#e74c3c";

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
  });

  const chartData = Object.entries(STATUS_LABELS)
    .filter(([k]) => statusCounts[k] > 0)
    .map(([k, v]) => ({
      name: v.label,
      value: statusCounts[k] || 0,
      fill: v.color,
    }));

  const recentOrders = [...orders]
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 8);

  const recentOrdersKey = recentOrders.map(o => o.id || o.order_number).join(',');
  const stockKey = products.map(p => p.id).join(',');

  if (!mounted) {
    return (
      <AdminLayout title="Dashboard" breadcrumb="Home / Dashboard">
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (loading && !orders.length && !products.length) {
    return (
      <AdminLayout title="Dashboard" breadcrumb="Home / Dashboard">
        <div className="empty-state">
          <div className="spinner" />
          <p>Loading dashboard…</p>
        </div>
      </AdminLayout>
    );
  }

  if (loadError) {
    return (
      <AdminLayout title="Dashboard" breadcrumb="Home / Dashboard">
        <div className="admin-alert admin-alert-danger" style={{ marginBottom: 20 }}>
          <span><i className="fas fa-times-circle"></i></span> {loadError}
          <button onClick={handleRefresh} className="admin-btn admin-btn-sm" style={{ marginLeft: 12 }}>Retry</button>
        </div>
        <div className="admin-card">
          <div className="admin-card-body">
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <p>Unable to load dashboard data</p>
              <p style={{ fontSize: "0.85rem", marginTop: 8, color: "var(--admin-muted)" }}>
                Please check that the backend server is running on port 5000.
              </p>
              <button onClick={handleRefresh} className="admin-btn admin-btn-primary" style={{ marginTop: 16 }}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" breadcrumb="Home / Dashboard">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#4A90E2,#7B68EE)" }}>
            <span className="stat-icon-tk">৳</span>
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{fp(Math.round(deliveredRevenue))}</div>
            <div className="stat-change up">{deliveredCount} delivered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: `linear-gradient(135deg,${profitColor},#1abc9c)` }}>
            📊
          </div>
          <div className="stat-info">
            <div className="stat-label">Gross Profit</div>
            <div className="stat-value" style={{ color: profitColor }}>{fp(Math.round(grossProfit))}</div>
            <div className="stat-change up">{grossMargin}% margin{!hasBatchData ? " (add batches)" : ""}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#1877f2,#42a5f5)" }}>
            📣
          </div>
          <div className="stat-info">
            <div className="stat-label">FB Ad Spend</div>
            <div className="stat-value" style={{ color: "#1877f2" }}>{fp(Math.round(totalFBAdSpendBDT))}</div>
            <div className="stat-change up">{activeFB.length} campaign{activeFB.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#9b59b6,#7b68ee)" }}>
            🎬
          </div>
          <div className="stat-info">
            <div className="stat-label">Content Cost</div>
            <div className="stat-value" style={{ color: "#9b59b6" }}>{fp(Math.round(totalContentSpend))}</div>
            <div className="stat-change up">{activeContent.length} entry{activeContent.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div className="stat-card" style={{ border: `2px solid ${netProfitColor}`, boxShadow: `0 0 12px ${netProfitColor}22` }}>
          <div className="stat-icon" style={{ background: `linear-gradient(135deg,${netProfitColor},#c0392b)` }}>
            💰
          </div>
          <div className="stat-info">
            <div className="stat-label">Net Profit</div>
            <div className="stat-value" style={{ color: netProfitColor }}>{fp(Math.round(netProfit))}</div>
            <div className="stat-change up">{netMargin}% net margin</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#40E0D0,#4A90E2)" }}>
            🛒
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{orders.length}</div>
            <div className="stat-change up">{newOrders} new</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#7B68EE,#9B59B6)" }}>
            ✅
          </div>
          <div className="stat-info">
            <div className="stat-label">Delivered</div>
            <div className="stat-value">{deliveredCount}</div>
            <div className="stat-change up">{pendingOrders} pending</div>
          </div>
        </div>
      </div>

      {/* Net Profit Waterfall */}
      {hasBatchData || totalFBAdSpendBDT > 0 || totalContentSpend > 0 ? (
        <div className="waterfall-section">
          <div className="waterfall-header">
            <div className="waterfall-title">
              <span>💰</span>
              <span>Net Profit Waterfall</span>
            </div>
            <div className="waterfall-links">
              <a href="/admin/production" className="waterfall-link" style={{ color: "#4A90E2", border: "1px solid #4A90E2" }}>📦 Production</a>
              <a href="/admin/facebook" className="waterfall-link" style={{ color: "#1877f2", border: "1px solid #1877f2" }}>📣 Facebook Ads</a>
              <a href="/admin/content" className="waterfall-link" style={{ color: "#9b59b6", border: "1px solid #9b59b6" }}>🎬 Content</a>
            </div>
          </div>
          <div className="waterfall-bars">
            {(() => {
              const items = [
                { label: "Revenue", value: deliveredRevenue, color: "#27ae60" },
                { label: "COGS", value: -estimatedCOGS, color: "#e67e22" },
                { label: "Gross\nProfit", value: grossProfit, color: profitColor },
                { label: "FB Ads", value: -totalFBAdSpendBDT, color: "#1877f2" },
                { label: "Content", value: -totalContentSpend, color: "#9b59b6" },
                { label: "Net\nProfit", value: netProfit, color: netProfitColor },
              ];
              const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
              return items.map((item, idx) => {
                const height = Math.max(12, Math.abs(item.value) / max * 72);
                return (
                  <div key={idx} className="waterfall-bar-wrap">
                    <div className="waterfall-bar-label">{item.label}</div>
                    <div className="waterfall-bar" style={{ height: `${height}px`, background: item.color }}>
                      <span className="waterfall-bar-val">
                        {item.value < 0 ? "-" : ""}{fp(Math.abs(Math.round(item.value)))}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        <div className="admin-alert admin-alert-info mb-3">
          <span>ℹ</span>
          <div>Add <a href="/admin/production" style={{ color: "var(--brand-blue)", fontWeight: 600 }}>production batches</a> and <a href="/admin/facebook" style={{ color: "var(--brand-blue)", fontWeight: 600 }}>Facebook campaigns</a> to see the full profit waterfall.</div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        <a href="/admin/orders" className="quick-action-card">
          <div className="qa-icon" style={{ background: "linear-gradient(135deg,#f0f4ff,#f5f0ff)" }}>🛒</div>
          <div className="qa-label">Orders</div>
        </a>
        <a href="/admin/products" className="quick-action-card">
          <div className="qa-icon" style={{ background: "linear-gradient(135deg,#f0fff4,#f0f9ff)" }}>➕</div>
          <div className="qa-label">Add Design</div>
        </a>
        <a href="/admin/inventory" className="quick-action-card">
          <div className="qa-icon" style={{ background: "linear-gradient(135deg,#fff8f0,#fff0f0)" }}>🏭</div>
          <div className="qa-label">Inventory</div>
        </a>
        <a href="/admin/facebook" className="quick-action-card">
          <div className="qa-icon" style={{ background: "linear-gradient(135deg,#e8f0fe,#f0f4ff)" }}>📣</div>
          <div className="qa-label">FB Ads</div>
        </a>
        <a href="/admin/customers" className="quick-action-card">
          <div className="qa-icon" style={{ background: "linear-gradient(135deg,#f0fff4,#e8f8f5)" }}>👥</div>
          <div className="qa-label">Customers ({customers.length})</div>
        </a>
        <a href="/admin/reports" className="quick-action-card">
          <div className="qa-icon" style={{ background: "linear-gradient(135deg,#f5f0ff,#f0f4ff)" }}>📈</div>
          <div className="qa-label">Reports</div>
        </a>
      </div>

      <div className="charts-row">
        {/* Chart */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">📊 Orders by Status</div>
          </div>
          <div className="admin-card-body padded" style={{ height: 260 }}>
            {chartData.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>No orders yet</p>
              </div>
            ) : (
              <div suppressHydrationWarning className="chart-container" key={`chart-${chartData.length}`}>
                <div style={{ flex: 1, height: "100%" }}>
                  {mounted && <DoughnutChart data={chartData} />}
                </div>
                <div className="chart-legend">
                  {chartData.map((d) => (
                    <div key={`chart-${d.name}`} className="chart-legend-item">
                      <div className="chart-legend-dot" style={{ background: d.fill }} />
                      <span className="text-muted">{d.name}</span>
                      <span className="font-700" style={{ marginLeft: "auto", minWidth: 24, textAlign: "right" }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Overview */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">📦 Product Stock</div>
          </div>
          <div className="admin-card-body" style={{ maxHeight: 260, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Design</th>
                  <th>S</th>
                  <th>M</th>
                  <th>L</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter((p) => p.status === "active")
                  .map((p, idx) => (
                    <tr key={`${p.id}-${idx}`}>
                      <td>
                        <div className="cell-bold">{p.name}</div>
                        <div className="cell-code">{p.code}</div>
                      </td>
                      <td>
                        <span className={(p.stock_small as number) < 5 ? "low-stock-neg" : "low-stock-pos"}>
                          {(p.stock_small as number) || 0}
                        </span>
                      </td>
                      <td>
                        <span className={(p.stock_medium as number) < 5 ? "low-stock-neg" : "low-stock-pos"}>
                          {(p.stock_medium as number) || 0}
                        </span>
                      </td>
                      <td>
                        <span className={(p.stock_large as number) < 5 ? "low-stock-neg" : "low-stock-pos"}>
                          {(p.stock_large as number) || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">🕐 Recent Orders</div>
          <a href="/admin/orders" className="admin-btn admin-btn-outline admin-btn-sm">View All</a>
        </div>
        <div className="admin-card-body">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p>No orders yet</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.order_number || o.id}>
                      <td className="cell-bold">{o.order_number || o.id?.slice(0, 8)}</td>
                      <td>
                        {o.customer_name || "—"}
                        <br />
                        <small className="text-muted">{o.customer_phone}</small>
                      </td>
                      <td>{(o.items || []).length} item(s)</td>
                      <td className="cell-bold">{fp(o.total_amount || 0)}</td>
                      <td>
<span className={`status-badge status-${o.payment_method || "cod"}`}>
                          {o.payment_method?.toUpperCase() || "COD"}
                        </span>
                        <span className={`status-badge status-${o.order_status}`}>
                          {STATUS_LABELS[o.order_status]?.label || o.order_status}
                        </span>
                      </td>
                      <td>{formatDate(o.created_at)}</td>
                      <td>
                        <a href={`/admin/orders?view=${o.id}`} className="admin-btn admin-btn-outline admin-btn-sm">
                          👁
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function DoughnutChart({ data }: { data: Array<{ name: string; value: number; fill: string }> }) {
  return (
    <Pie
      data={data}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      innerRadius={50}
      outerRadius={90}
      paddingAngle={2}
      stroke="#fff"
      strokeWidth={2}
    />
  );
}
