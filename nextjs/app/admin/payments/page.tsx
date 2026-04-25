'use client';
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";

interface Order {
  id: string;
  _id?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
  createdAt?: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({ status: "paid", reference: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { ordersAPI } = await import("@/lib/api");
      const data = await ordersAPI.getAll();
      const ordersList = Array.isArray(data) ? data : [];
      setOrders(ordersList as unknown as Order[]);
    } catch (e) {
      console.error("Failed to load orders:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPayment = (order: Order) => {
    setSelectedOrder(order);
    setForm({ status: order.paymentStatus || "pending", reference: order.paymentReference || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const token = sessionStorage.getItem("lcbd_admin_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
      const orderId = selectedOrder.id || (selectedOrder as any)._id;
      
      const res = await fetch(`${API_BASE}/orders/${orderId}/payment`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          paymentStatus: form.status,
          paymentReference: form.reference,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        showToast("error", data.message || "Failed to update payment status.");
        return;
      }
      
      showToast("success", "Payment status updated!");
      setShowModal(false);
      await fetchOrders();
    } catch (e) {
      console.error("Failed to update:", e);
      showToast("error", "Failed to update payment status.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (methodFilter !== "all" && o.paymentMethod !== methodFilter) return false;
    if (statusFilter !== "all" && o.paymentStatus !== statusFilter) return false;
    return true;
  });

  const codOrders = orders.filter((o) => o.paymentMethod === "cod");
  const onlineOrders = orders.filter((o) => o.paymentMethod !== "cod");
  const totalCOD = codOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalOnline = onlineOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const pendingCount = orders.filter((o) => o.paymentStatus === "pending").length;

  const formatCurrency = (n: number) => `৳${(n || 0).toLocaleString("en-BD")}`;
  const formatDate = (ts?: string) => ts ? new Date(ts).toLocaleDateString("en-BD") : "—";

  return (
    <AdminLayout title="Payments" breadcrumb="Home / Payments">
      <>
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <i className="fas fa-check"></i> : toast.type === "error" ? <i className="fas fa-times"></i> : <i className="fas fa-info-circle"></i>} {toast.message}
          </div>
        )}

        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#27ae60,#1abc9c)" }}>
              <i className="fas fa-money-bill-wave" style={{ color: "white" }}></i>
            </div>
            <div className="stat-info">
              <div className="stat-label">COD Orders</div>
              <div className="stat-value">{codOrders.length}</div>
              <div className="stat-change">{formatCurrency(totalCOD)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#4A90E2,#7B68EE)" }}>
              <i className="fas fa-mobile-alt" style={{ color: "white" }}></i>
            </div>
            <div className="stat-info">
              <div className="stat-label">Online Payments</div>
              <div className="stat-value">{onlineOrders.length}</div>
              <div className="stat-change">{formatCurrency(totalOnline)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#f39c12,#e67e22)" }}>
              <i className="fas fa-clock" style={{ color: "white" }}></i>
            </div>
            <div className="stat-info">
              <div className="stat-label">Pending Payment</div>
              <div className="stat-value">{pendingCount}</div>
              <div className="stat-change">Awaiting confirmation</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: "linear-gradient(135deg,#2ecc71,#27ae60)" }}>
              <i className="fas fa-check-double" style={{ color: "white" }}></i>
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(totalCOD + totalOnline)}</div>
              <div className="stat-change">All time</div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <i className="fas fa-credit-card"></i> Payment Records
            </div>
            <div className="admin-card-actions">
              <select
                className="admin-select"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="all">All Methods</option>
                <option value="cod">COD</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
              </select>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Payment Status</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <div className="spinner"></div>
                          <p style={{ marginTop: 12 }}>Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📦</div>
                          <p>No orders found</p>
                          {orders.length === 0 && (
                            <p style={{ fontSize: "0.85rem", marginTop: 8, color: "var(--admin-muted)" }}>
                              No orders in database yet.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr key={o.id || (o as any)._id}>
                        <td className="cell-bold">{o.orderNumber || (o as any)._id?.slice(0, 8)}</td>
                        <td>
                          {o.customerName || "—"}
                          <br />
                          <small style={{ color: "var(--admin-muted)" }}>{o.customerPhone || ""}</small>
                        </td>
                        <td className="cell-bold">{formatCurrency(o.totalAmount || 0)}</td>
                        <td>
                          <span className={`status-badge status-${o.paymentMethod || "cod"}`}>
                            {PAYMENT_LABELS[o.paymentMethod || "cod"] || o.paymentMethod || "COD"}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${o.paymentStatus || "pending"}`}>
                            {STATUS_LABELS[o.paymentStatus || "pending"] || o.paymentStatus || "pending"}
                          </span>
                        </td>
                        <td>{o.paymentReference || "—"}</td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => handleMarkPayment(o)}
                          >
                            <i className="fas fa-check"></i> Mark Paid
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <div className="admin-modal-title">Update Payment Status</div>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Payment Status</label>
                  <select
                    id="mpStatus"
                    className="admin-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Payment Reference (Transaction ID)</label>
                  <input
                    type="text"
                    id="mpRef"
                    className="admin-input"
                    placeholder="bKash TrxID, etc."
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="admin-btn admin-btn-success" onClick={handleSave} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </AdminLayout>
  );
}