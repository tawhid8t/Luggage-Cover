'use client';
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";

interface Order {
  id: string;
  orderNumber?: string;
  customerName?: string;
  items?: { productCode?: string; productName?: string; qty?: number; price?: number; total?: number }[];
  orderStatus?: string;
  totalAmount: number;
  discountAmount?: number;
  createdAt?: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  packing: "Packing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return Requested",
  returned: "Returned",
  refunded: "Refunded",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3498db",
  confirmed: "#9b59b6",
  packing: "#e67e22",
  packed: "#f39c12",
  shipped: "#1abc9c",
  delivered: "#27ae60",
  cancelled: "#e74c3c",
  return_requested: "#c0392b",
  returned: "#7f8c8d",
  refunded: "#95a5a6",
};

export default function ReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { apiGet } = await import("@/lib/api");
      const [ordersData, productsData] = await Promise.all([
        apiGet<Order[]>("tables/lc_orders"),
        apiGet<Product[]>("tables/lc_products"),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (e) {
      console.error("Failed to load reports:", e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (type: string) => {
    let rows: string[][] = [];
    let filename = "";

    if (type === "orders") {
      filename = "orders.csv";
      rows = [
        ["Order #", "Customer", "Total", "Status", "Payment", "Date"],
        ...orders.map((o) => [
          o.order_number || o.id?.slice(0, 8) || "",
          o.customerName || "",
          String(o.totalAmount || 0),
          o.orderStatus || "",
          "",
          o.created_at ? new Date(o.created_at).toLocaleDateString() : "",
        ]),
      ];
    } else if (type === "sales") {
      filename = "sales-report.csv";
      const salesByDesign: Record<string, { name: string; code: string; qty: number; revenue: number }> = {};
      orders.forEach((o) => {
        (o.items || []).forEach((i) => {
          const code = i.productCode || "unknown";
          if (!salesByDesign[code]) {
            salesByDesign[code] = { name: i.productName || code, code, qty: 0, revenue: 0 };
          }
          salesByDesign[code].qty += i.qty || 0;
          salesByDesign[code].revenue += i.total || (i.price || 0) * (i.qty || 0);
        });
      });
      rows = [
        ["Design Code", "Design Name", "Quantity Sold", "Revenue"],
        ...Object.values(salesByDesign).map((d) => [d.code, d.name, String(d.qty), String(d.revenue)]),
      ];
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (n: number) => `৳${(n || 0).toLocaleString("en-BD")}`;

  const totalRevenue = orders.filter((o) => o.orderStatus === "delivered").reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const totalDiscount = orders.reduce((s, o) => s + (o.discount_amount || 0), 0);

  const salesByDesign: Record<string, { name: string; code: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    (o.items || []).forEach((i) => {
      const code = i.productCode || "unknown";
      if (!salesByDesign[code]) {
        salesByDesign[code] = { name: i.productName || code, code, qty: 0, revenue: 0 };
      }
      salesByDesign[code].qty += i.qty || 0;
      salesByDesign[code].revenue += i.total || (i.price || 0) * (i.qty || 0);
    });
  });
  const topDesigns = Object.values(salesByDesign).sort((a, b) => b.qty - a.qty);

  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    const status = o.orderStatus || "new";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const statusBars = Object.entries(STATUS_LABELS)
    .filter(([key]) => statusCounts[key] > 0)
    .map(([key, label]) => ({
      label,
      count: statusCounts[key] || 0,
      color: STATUS_COLORS[key] || "#999",
    }));

  const maxStatusCount = Math.max(...statusBars.map((s) => s.count), 1);

  return (
    <AdminLayout title="Reports" breadcrumb="Home / Reports">
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#4A90E2,#7B68EE)" }}>
            <i className="fas fa-coins" style={{ color: "white" }}></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#27ae60,#1abc9c)" }}>
            <i className="fas fa-shopping-cart" style={{ color: "white" }}></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{totalOrders}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#f39c12,#e67e22)" }}>
            <i className="fas fa-calculator" style={{ color: "white" }}></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Avg. Order Value</div>
            <div className="stat-value">{formatCurrency(avgOrderValue)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#e74c3c,#c0392b)" }}>
            <i className="fas fa-tag" style={{ color: "white" }}></i>
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Discounts</div>
            <div className="stat-value">{formatCurrency(totalDiscount)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <i className="fas fa-trophy"></i> Top Selling Designs
            </div>
          </div>
          <div className="admin-card-body">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Design</th>
                  <th>Code</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8">Loading...</td>
                  </tr>
                ) : topDesigns.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: 24 }}>
                        <p>No sales data yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  topDesigns.slice(0, 10).map((d, i) => (
                    <tr key={d.code}>
                      <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</td>
                      <td className="cell-bold">{d.name}</td>
                      <td className="cell-code">{d.code}</td>
                      <td className="cell-bold">{d.qty}</td>
                      <td className="cell-bold">{formatCurrency(d.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <i className="fas fa-chart-bar"></i> Orders by Status
            </div>
          </div>
          <div className="admin-card-body padded" style={{ height: 280, display: "flex", flexDirection: "column", gap: 12 }}>
            {loading ? (
              <div className="text-center p-8">Loading...</div>
            ) : statusBars.length === 0 ? (
              <div className="text-center p-8">No order data.</div>
            ) : (
              statusBars.map((s) => {
                const pct = (s.count / maxStatusCount) * 100;
                return (
                  <div key={s.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{s.label.replace("_", " ")}</span>
                      <span style={{ fontWeight: 600 }}>{s.count}</span>
                    </div>
                    <div style={{ background: "var(--color-bg-subtle)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: s.color,
                          borderRadius: 4,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <i className="fas fa-file-export"></i> Export Reports
          </div>
        </div>
        <div className="admin-card-body padded">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="admin-btn admin-btn-primary" onClick={() => exportCSV("orders")}>
              <i className="fas fa-download"></i> Export Orders CSV
            </button>
            <button className="admin-btn admin-btn-outline" onClick={() => exportCSV("sales")}>
              <i className="fas fa-download"></i> Export Sales Report
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}