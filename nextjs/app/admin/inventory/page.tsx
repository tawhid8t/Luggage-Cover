'use client';
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";

interface Product {
  id: string;
  name: string;
  code: string;
  status: string;
  stock_small: number;
  stock_medium: number;
  stock_large: number;
}

interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  size: string;
  transaction_type: string;
  quantity: number;
  notes: string;
  reference: string;
  created_at: string;
}

const TX_TYPES = ["restock", "sale", "adjustment", "damaged", "return"];

function formatDate(ts?: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestock, setShowRestock] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [saving, setSaving] = useState(false);

  const [restockForm, setRestockForm] = useState({ productId: "", small: 0, medium: 0, large: 0, notes: "" });
  const [adjustForm, setAdjustForm] = useState({ productId: "", size: "small", type: "restock", qty: 1, notes: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { apiGet } = await import("@/lib/api");
      const [productsData, logsData] = await Promise.all([
        apiGet<Product[]>("tables/lc_products"),
        apiGet<InventoryLog[]>("tables/lc_inventory"),
      ]);
      productsData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      logsData.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
      setProducts(productsData);
      setLogs(logsData);
    } catch (e) {
      console.error("Failed to load inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  const activeProducts = products.filter((p) => p.status === "active");

  const handleRestock = async () => {
    if (!restockForm.productId) return;
    setSaving(true);
    try {
      const { apiPost, apiPatch } = await import("@/lib/api");
      const product = products.find((p) => p.id === restockForm.productId);
      
      await apiPatch("tables/lc_products", restockForm.productId, {
        stock_small: restockForm.small,
        stock_medium: restockForm.medium,
        stock_large: restockForm.large,
      });

      for (const [size, qty] of [["small", restockForm.small], ["medium", restockForm.medium], ["large", restockForm.large]] as [string, number][]) {
        if (qty > 0) {
          await apiPost("tables/lc_inventory", {
            product_id: restockForm.productId,
            product_name: product?.name,
            product_code: product?.code,
            size,
            transaction_type: "restock",
            quantity: qty,
            notes: restockForm.notes,
          });
        }
      }

      setShowRestock(false);
      setRestockForm({ productId: "", small: 0, medium: 0, large: 0, notes: "" });
      await fetchData();
    } catch (e) {
      console.error("Restock failed:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustForm.productId) return;
    setSaving(true);
    try {
      const { apiPost, apiPatch, apiGet } = await import("@/lib/api");
      const product = products.find((p) => p.id === adjustForm.productId);
      const stockKey = `stock_${adjustForm.size}` as keyof Product;
      const currentStock = (product?.[stockKey] as number) || 0;

      let newStock = currentStock;
      if (adjustForm.type === "restock" || adjustForm.type === "return") {
        newStock = currentStock + adjustForm.qty;
      } else if (adjustForm.type === "damaged") {
        newStock = Math.max(0, currentStock - adjustForm.qty);
      } else {
        newStock = adjustForm.qty;
      }

      await apiPatch("tables/lc_products", adjustForm.productId, {
        [stockKey]: newStock,
      });

      await apiPost("tables/lc_inventory", {
        product_id: adjustForm.productId,
        product_name: product?.name,
        product_code: product?.code,
        size: adjustForm.size,
        transaction_type: adjustForm.type,
        quantity: adjustForm.type === "damaged" ? -adjustForm.qty : adjustForm.qty,
        notes: adjustForm.notes,
      });

      setShowAdjust(false);
      setAdjustForm({ productId: "", size: "small", type: "restock", qty: 1, notes: "" });
      await fetchData();
    } catch (e) {
      console.error("Adjustment failed:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Inventory" breadcrumb="Home / Inventory">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Current Stock */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title"><i className="fas fa-warehouse"></i> Current Stock</div>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setShowRestock(true)}>
              <i className="fas fa-plus"></i> Restock
            </button>
          </div>
          <div className="admin-card-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Design</th><th>Code</th><th>S</th><th>M</th><th>L</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center p-8">Loading...</td></tr>
                  ) : activeProducts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-8">No products found</td></tr>
                  ) : (
                    activeProducts.map((p) => {
                      const total = Number(p.stock_small || 0) + Number(p.stock_medium || 0) + Number(p.stock_large || 0);
                      return (
                        <tr key={p.id}>
                          <td className="cell-bold">{p.name}</td>
                          <td className="cell-code">{p.code}</td>
                          <td>
                            <span className={Number(p.stock_small || 0) < 5 ? "text-danger font-bold" : ""}>{p.stock_small || 0}</span>
                            {Number(p.stock_small || 0) < 5 && <span className="status-badge status-cancelled" style={{ marginLeft: 4 }}>Low</span>}
                          </td>
                          <td>
                            <span className={Number(p.stock_medium || 0) < 5 ? "text-danger font-bold" : ""}>{p.stock_medium || 0}</span>
                            {Number(p.stock_medium || 0) < 5 && <span className="status-badge status-cancelled" style={{ marginLeft: 4 }}>Low</span>}
                          </td>
                          <td>
                            <span className={Number(p.stock_large || 0) < 5 ? "text-danger font-bold" : ""}>{p.stock_large || 0}</span>
                            {Number(p.stock_large || 0) < 5 && <span className="status-badge status-cancelled" style={{ marginLeft: 4 }}>Low</span>}
                          </td>
                          <td className="cell-bold">{total}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Adjustment */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title"><i className="fas fa-sliders-h"></i> Quick Adjustment</div>
          </div>
          <div className="admin-card-body padded">
            <div className="admin-form-group">
              <label className="admin-form-label">Select Product</label>
              <select
                className="admin-input"
                value={adjustForm.productId}
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
              >
                <option value="">— Select design —</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Size</label>
                <select
                  className="admin-input"
                  value={adjustForm.size}
                  onChange={(e) => setAdjustForm({ ...adjustForm, size: e.target.value })}
                >
                  <option value="small">Small (18"-20")</option>
                  <option value="medium">Medium (20"-24")</option>
                  <option value="large">Large (24"-28")</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Type</label>
                <select
                  className="admin-input"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                >
                  <option value="restock">Restock (+)</option>
                  <option value="adjustment">Adjustment (±)</option>
                  <option value="damaged">Damaged (−)</option>
                  <option value="return">Return (+)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Quantity</label>
                <input
                  type="number"
                  className="admin-input"
                  value={adjustForm.qty}
                  onChange={(e) => setAdjustForm({ ...adjustForm, qty: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Notes</label>
                <input
                  type="text"
                  className="admin-input"
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  placeholder="Reason..."
                />
              </div>
            </div>
            <button
              className="admin-btn admin-btn-primary w-full"
              onClick={handleAdjustment}
              disabled={saving || !adjustForm.productId}
            >
              {saving ? "Saving..." : "Save Adjustment"}
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Log */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title"><i className="fas fa-history"></i> Inventory Log</div>
        </div>
        <div className="admin-card-body">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Product</th><th>Code</th><th>Size</th><th>Type</th><th>Qty</th><th>Notes</th><th>Reference</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center p-8">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-8">No inventory transactions yet.</td></tr>
                ) : (
                  logs.slice(0, 50).map((t) => (
                    <tr key={t.id}>
                      <td>{formatDate(t.created_at)}</td>
                      <td className="cell-bold">{t.product_name || "—"}</td>
                      <td className="cell-code">{t.product_code || "—"}</td>
                      <td style={{ textTransform: "capitalize" }}>{t.size || "—"}</td>
                      <td>
                        <span className={`status-badge status-${t.transaction_type === "restock" || t.transaction_type === "return" ? "active" : "inactive"}`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className={(t.quantity || 0) > 0 ? "text-success font-bold" : "text-danger font-bold"}>
                        {(t.quantity || 0) > 0 ? "+" : ""}{t.quantity}
                      </td>
                      <td>{t.notes || "—"}</td>
                      <td>{t.reference || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      {showRestock && (
        <div className="modal-overlay" onClick={() => setShowRestock(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold mb-4">Restock Products</h3>
            <div className="admin-alert admin-alert-info" style={{ marginBottom: 16 }}>
              <i className="fas fa-info-circle"></i> Enter new stock levels for each size. Current stock will be replaced.
            </div>
            <div className="admin-form-group">
              <label>Select Design</label>
              <select
                className="admin-input"
                value={restockForm.productId}
                onChange={(e) => setRestockForm({ ...restockForm, productId: e.target.value })}
              >
                <option value="">— Select design —</option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div className="admin-form-group">
                <label>Small Stock</label>
                <input
                  type="number"
                  className="admin-input"
                  value={restockForm.small}
                  onChange={(e) => setRestockForm({ ...restockForm, small: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="admin-form-group">
                <label>Medium Stock</label>
                <input
                  type="number"
                  className="admin-input"
                  value={restockForm.medium}
                  onChange={(e) => setRestockForm({ ...restockForm, medium: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="admin-form-group">
                <label>Large Stock</label>
                <input
                  type="number"
                  className="admin-input"
                  value={restockForm.large}
                  onChange={(e) => setRestockForm({ ...restockForm, large: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Notes</label>
              <input
                type="text"
                className="admin-input"
                value={restockForm.notes}
                onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                placeholder="Supplier, batch info..."
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="admin-btn" onClick={() => setShowRestock(false)}>Cancel</button>
              <button
                className="admin-btn admin-btn-success"
                onClick={handleRestock}
                disabled={saving || !restockForm.productId}
              >
                {saving ? "Saving..." : "Save Restock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}