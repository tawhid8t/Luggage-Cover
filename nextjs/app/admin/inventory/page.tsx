'use client';
import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/admin/admin-layout";

interface ProductVariant {
  size: string;
  stock: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  code: string;
  status: string;
  stockSmall: number;
  stockMedium: number;
  stockLarge: number;
  variants?: ProductVariant[];
}

interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  size: string;
  transactionType: string;
  quantity: number;
  notes: string;
  reference: string;
  createdAt: string;
}

const TX_TYPES = ["restock", "sale", "adjustment", "damaged", "return"];

function getStockForSize(product: Product, size: string): number {
  const sizeLower = size.toLowerCase();
  if (product.variants && product.variants.length > 0) {
    const variant = product.variants.find(v => v.size.toLowerCase() === sizeLower);
    if (variant) return variant.stock || 0;
  }
  if (sizeLower === "small") return product.stockSmall || 0;
  if (sizeLower === "medium") return product.stockMedium || 0;
  if (sizeLower === "large") return product.stockLarge || 0;
  return 0;
}

function formatDate(ts?: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(ts?: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-BD", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [saving, setSaving] = useState(false);

  const [restockForm, setRestockForm] = useState({ productId: "", small: 0, medium: 0, large: 0, notes: "" });
  const [adjustForm, setAdjustForm] = useState({ productId: "", size: "small", type: "restock", qty: 1, notes: "" });
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const logTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!logTableRef.current || loadingLogs || !hasMore) return;
      const { scrollTop, scrollHeight, clientHeight } = logTableRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreLogs();
      }
    };
    const tableEl = logTableRef.current;
    if (tableEl) {
      tableEl.addEventListener("scroll", handleScroll);
      return () => tableEl.removeEventListener("scroll", handleScroll);
    }
  }, [loadingLogs, hasMore]);

  const fetchData = async () => {
    try {
      const { apiGet } = await import("@/lib/api");
      const productsData = await apiGet<Product[]>("products");
      console.log("Products raw:", productsData);
      if (productsData.length > 0) console.log("First product:", productsData[0]);
      productsData.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      setProducts(productsData);
      await fetchLogs(1);
    } catch (e) {
      console.error("Failed to load inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page: number) => {
    setLoadingLogs(true);
    try {
      const { apiGet } = await import("@/lib/api");
      const response = await apiGet<InventoryLog[]>("inventory", { page, limit: 20 });
      const newLogs = Array.isArray(response) ? response : [];
      if (page === 1) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
      setCurrentPage(page);
      setHasMore(newLogs.length === 20);
    } catch (e) {
      console.error("Failed to load logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadMoreLogs = () => {
    if (!loadingLogs && hasMore) {
      fetchLogs(currentPage + 1);
    }
  };

  const activeProducts = products.filter((p) => (p.status || "active") === "active");

  const handleRestock = async () => {
    if (!restockForm.productId) return;
    setSaving(true);
    try {
      const { apiPost } = await import("@/lib/api");
      const product = products.find((p) => p.id === restockForm.productId);

      await apiPost("inventory/restock", {
        productId: restockForm.productId,
        stockSmall: restockForm.small,
        stockMedium: restockForm.medium,
        stockLarge: restockForm.large,
        notes: restockForm.notes,
      });

      showToast("success", `${product?.name || "Product"} restocked!`);
      setShowRestock(false);
      setRestockForm({ productId: "", small: 0, medium: 0, large: 0, notes: "" });
      await fetchData();
    } catch (e) {
      console.error("Restock failed:", e);
      showToast("error", "Restock failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustment = async () => {
    if (!adjustForm.productId) return;
    setSaving(true);
    try {
      const { apiPost } = await import("@/lib/api");
      const product = products.find((p) => p.id === adjustForm.productId);

      await apiPost("inventory/adjust", {
        productId: adjustForm.productId,
        size: adjustForm.size,
        transactionType: adjustForm.type,
        quantity: adjustForm.qty,
        notes: adjustForm.notes,
      });

      showToast("success", "Inventory updated!");
      setShowAdjust(false);
      setAdjustForm({ productId: "", size: "small", type: "restock", qty: 1, notes: "" });
      await fetchData();
    } catch (e) {
      console.error("Adjustment failed:", e);
      showToast("error", "Adjustment failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Inventory" breadcrumb="Home / Inventory">
      {/* Toast Notifications */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          {toast.type === "success" ? "✓" : "✕"} {toast.message}
        </div>
      )}

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
            <div className="table-wrap" style={{ maxHeight: "400px", overflowY: "auto" }}>
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
                      const stockS = getStockForSize(p, "small");
                      const stockM = getStockForSize(p, "medium");
                      const stockL = getStockForSize(p, "large");
                      const total = stockS + stockM + stockL;
                      return (
                        <tr key={p.id}>
                          <td className="cell-bold">{p.name}</td>
                          <td className="cell-code">{p.code}</td>
                          <td className={stockS < 5 ? "text-danger font-bold" : ""}>{stockS}</td>
                          <td className={stockM < 5 ? "text-danger font-bold" : ""}>{stockM}</td>
                          <td className={stockL < 5 ? "text-danger font-bold" : ""}>{stockL}</td>
                          <td className="cell-bold">{total}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Adjustment */}
        </div>
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
                  <option value="small">Small (18&quot;-20&quot;)</option>
                  <option value="medium">Medium (20&quot;-24&quot;)</option>
                  <option value="large">Large (24&quot;-28&quot;)</option>
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
                  <>
                    {logs.map((t) => (
                      <tr key={t.id}>
                        <td>{formatDate(t.createdAt)}</td>
                        <td className="cell-bold">{t.productName || "—"}</td>
                        <td className="cell-code">{t.productCode || "—"}</td>
                        <td style={{ textTransform: "capitalize" }}>{t.size || "—"}</td>
                        <td>
                          <span className={`status-badge status-${t.transactionType === "restock" || t.transactionType === "return" ? "active" : "inactive"}`}>
                            {t.transactionType}
                          </span>
                        </td>
                        <td className={(t.quantity || 0) > 0 ? "text-success font-bold" : "text-danger font-bold"}>
                          {(t.quantity || 0) > 0 ? "+" : ""}{t.quantity}
                        </td>
                        <td>{t.notes || "—"}</td>
                        <td>{t.reference || "—"}</td>
                      </tr>
                    ))}
                    {hasMore && (
                      <tr>
                        <td colSpan={8} className="text-center p-4">
                          <button
                            className="admin-btn admin-btn-outline"
                            onClick={loadMoreLogs}
                            disabled={loadingLogs}
                          >
                            {loadingLogs ? "Loading..." : "Load More"}
                          </button>
                        </td>
                      </tr>
                    )}
                  </>
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