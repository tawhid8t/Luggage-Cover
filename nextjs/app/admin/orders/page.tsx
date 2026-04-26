'use client';

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminAuthAPI } from "@/lib/api";
import AdminLayout from "@/components/admin/admin-layout";
import type { AdminSession } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

interface OrderItem {
  productId?: string;
  productName?: string;
  productCode?: string;
  imageUrl?: string;
  size?: string;
  qty?: number;
  price?: number;
  total?: number;
}

interface StatusHistoryEntry {
  status: string;
  note?: string;
  changedBy?: string;
  timestamp?: string;
}

interface Order {
  _id?: string;
  id?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  district?: string;
  items?: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  deliveryCharge?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  courierName?: string;
  trackingNumber?: string;
  orderNotes?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt?: string;
}

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

const ALL_STATUSES = Object.keys(STATUS_LABELS);

const HARDCODED_COURIERS = [
  { _id: "c1", name: "SA Paribahan", logo_emoji: "🚚", dhaka_charge: 60, outside_charge: 120, is_active: true },
  { _id: "c2", name: "RedX", logo_emoji: "📦", dhaka_charge: 60, outside_charge: 120, is_active: true },
  { _id: "c3", name: "Pathao", logo_emoji: "🛵", dhaka_charge: 60, outside_charge: 120, is_active: true },
  { _id: "c4", name: "Paperfly", logo_emoji: "📦", dhaka_charge: 60, outside_charge: 120, is_active: true },
  { _id: "c5", name: "e-Quant", logo_emoji: "🚛", dhaka_charge: 60, outside_charge: 120, is_active: true },
  { _id: "c6", name: "steadfast", logo_emoji: "🏃", dhaka_charge: 60, outside_charge: 120, is_active: true },
  { _id: "c7", name: "DHL Express", logo_emoji: "🌍", dhaka_charge: 200, outside_charge: 400, is_active: false },
];

function formatCurrency(amount?: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;
}

function formatDate(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getOrderDate(order: Order): string {
  return (order as any).createdAt || (order as any).createdAt || "—";
}

function formatDatetime(ts?: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("lcbd_admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  console.log("API call:", `${API_BASE}${endpoint}`);
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("API error:", res.status, text);
    throw new Error(`HTTP ${res.status}`);
  }
  
  const data = await res.json();
  console.log("API response:", data);
  return data;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = adminAuthAPI.getSession();
    if (!s) {
      router.replace("/admin/login");
      return;
    }
    setSession(s);
    setMounted(true);
    loadOrders();
  }, [router]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback((type: string, message: string) => {
    setToast({ type, message });
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { ordersAPI } = await import("@/lib/api");
      const data = await ordersAPI.getAll();
      const ordersData = Array.isArray(data) ? data : [];
      ordersData.sort((a: Order, b: Order) => {
        const aTime = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 
                     (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const bTime = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 
                     (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setOrders(ordersData as Order[]);
    } catch (e) {
      console.error("Failed to load orders:", e);
      setError("Failed to load orders: " + String(e));
      showToast("error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getOrderId = (order: Order): string => {
    return order._id || order.id || "";
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.orderStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (o.orderNumber || "").toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q) ||
        (o.customerPhone || "").includes(q)
      );
    }
    return true;
  });

  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.orderStatus === s).length;
    return acc;
  }, {} as Record<string, number>);

  const showConfirm = (title: string, msg: string, onConfirm: () => void) => {
    setConfirmMessage(msg);
    setConfirmCallback(() => onConfirm);
    setConfirmOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    
    const orderId = getOrderId(selectedOrder);
    const newStatus = (document.getElementById("newStatusSelect") as HTMLSelectElement)?.value;
    const note = (document.getElementById("statusNoteInput") as HTMLInputElement)?.value || "";
    let courier = (document.getElementById("courierNameInput") as HTMLSelectElement)?.value || "";
    if (courier === "__custom__") {
      courier = (document.getElementById("courierCustomInput") as HTMLInputElement)?.value || "";
    }
    const tracking = (document.getElementById("trackingInput") as HTMLInputElement)?.value || "";
    const orderDateInput = (document.getElementById("orderDateInput") as HTMLInputElement)?.value;

    if (!newStatus) {
      showToast("error", "Please select a status");
      return;
    }

    setUpdating(true);
    try {
      const { ordersAPI } = await import("@/lib/api");
      const result = await ordersAPI.updateStatus(orderId, newStatus as any, note, courier, tracking, undefined, orderDateInput);

      showToast("success", "Order status updated!");
      setStatusModalOpen(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (order: Order) => {
    const orderId = getOrderId(order);
    showConfirm("Delete Order", "Are you sure you want to delete this order? This action cannot be undone.", async () => {
      setUpdating(true);
      try {
        const { apiDelete } = await import("@/lib/api");
        await apiDelete("orders", orderId);
        showToast("success", "Order deleted successfully");
        await loadOrders();
      } catch (e) {
        console.error(e);
        showToast("error", "Failed to delete order");
      } finally {
        setUpdating(false);
      }
    });
  };

  const viewOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const changeOrderStatus = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalOpen(true);
  };

  const downloadInvoice = (order: Order) => {
    const invoiceNum = `INV-${(order.orderNumber || order._id || "").replace("LC-", "").replace(/-/g, "").slice(0, 10)}`;
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString();
    
    const itemsHtml = (order.items || []).map((i: OrderItem, idx: number) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${idx + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px"><strong>${i.productName || "Luggage Cover"}</strong><div style="font-size:11px;color:#888">Code: ${i.productCode || "—"}</div></td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-transform:capitalize">${i.size || "—"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">${i.qty || 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right">৳ ${Number(i.price || 0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:700">৳ ${Number((i.total || (i.price || 0) * (i.qty || 1)) || 0).toLocaleString()}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNum} — Luggage Cover BD</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;font-size:14px}
.page{max-width:794px;margin:0 auto;padding:40px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:3px solid #4A90E2}
.brand{display:flex;align-items:center;gap:12px}.brand-icon{font-size:2.5rem}.brand-name{font-size:1.6rem;font-weight:900;color:#1a1f3a}
.brand-sub{font-size:.7rem;color:#4A90E2;letter-spacing:3px;font-weight:600;text-transform:uppercase}
.invoice-meta{text-align:right}.invoice-title{font-size:2rem;font-weight:900;color:#4A90E2;letter-spacing:2px;text-transform:uppercase}
.invoice-num{font-size:.9rem;color:#666;margin-top:4px}.invoice-date{font-size:.85rem;color:#666}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
.info-box{background:#f8f9fc;border-radius:10px;padding:18px;border-left:4px solid #4A90E2}
.info-box h4{font-size:.75rem;font-weight:700;color:#4A90E2;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.info-box p{font-size:.88rem;line-height:1.7;color:#333}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
thead tr{background:linear-gradient(135deg,#4A90E2,#7B68EE)}
thead th{padding:12px 12px;font-size:.8rem;font-weight:700;color:white;text-align:left;text-transform:uppercase}
thead th:last-child,thead th:nth-child(5){text-align:right}thead th:nth-child(4){text-align:center}
tbody tr:hover{background:#f8f9fc}
.totals{display:flex;justify-content:flex-end;margin-bottom:32px}.totals-box{min-width:280px}
.total-row{display:flex;justify-content:space-between;padding:7px 0;font-size:.9rem;border-bottom:1px solid #f0f0f0}
.total-row.grand{font-size:1.15rem;font-weight:900;border-bottom:none;border-top:2px solid #4A90E2;margin-top:6px;padding-top:10px;color:#4A90E2}
.total-row.discount{color:#27ae60}
.footer{border-top:2px solid #f0f0f0;padding-top:20px;display:flex;justify-content:space-between}
.footer-brand{font-size:.8rem;color:#888}.footer-note{font-size:.75rem;color:#aaa;text-align:right;max-width:300px}
.thank-you{text-align:center;margin-bottom:28px;background:linear-gradient(135deg,#f0f4ff,#f5f0ff);border-radius:10px;padding:20px}
.thank-you h2{font-size:1.2rem;color:#4A90E2;font-weight:800;margin-bottom:4px}
.thank-you p{font-size:.85rem;color:#666}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.no-print{display:none!important}}
</style>
</head>
<body>
<div class="page">
<div class="no-print" style="text-align:right;margin-bottom:20px">
<button onclick="window.print()" style="background:#4A90E2;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;margin-right:8px">Print Invoice</button>
<button onclick="window.close()" style="background:#f0f0f0;color:#333;border:none;padding:10px 20px;border-radius:8px;font-size:.9rem;cursor:pointer">Close</button>
</div>
<div class="header">
<div class="brand"><div class="brand-icon"><img src="/bg-removed.png" style="width:40px;height:40px;object-fit:contain"/></div>
<div><div class="brand-name">LUGGAGE COVER BD</div><div class="brand-sub">Your Travel Buddy</div>
<div style="font-size:.75rem;color:#888;margin-top:6px">+01328-152066 · Dhaka, Bangladesh</div></div></div>
<div class="invoice-meta"><div class="invoice-title">INVOICE</div><div class="invoice-num"># ${invoiceNum}</div><div class="invoice-date">Date: ${orderDate}</div><div class="invoice-date">Order: ${order.orderNumber || "—"}</div></div>
</div>
<div class="info-grid">
<div class="info-box"><h4>Bill To</h4><p><strong>${order.customerName || "—"}</strong><br/>${order.customerPhone || ""}<br/>${order.customerEmail ? order.customerEmail + "<br/>" : ""}${order.shippingAddress || ""}<br/>${order.district ? "<strong>" + order.district + "</strong>" : ""}</p></div>
<div class="info-box"><h4>Order Details</h4><p><strong>Order #:</strong> ${order.orderNumber || "—"}<br/><strong>Date:</strong> ${orderDate}<br/><strong>Payment:</strong> ${order.paymentMethod?.toUpperCase() || "COD"}<br/>${order.courierName ? "<strong>Courier:</strong> " + order.courierName + "<br/>" : ""}${order.trackingNumber ? "<strong>Tracking:</strong> " + order.trackingNumber : ""}</p></div>
</div>
<table><thead><tr><th>#</th><th>Product</th><th>Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<div class="totals"><div class="totals-box">
<div class="total-row"><span>Subtotal</span><strong>৳ ${Number(order.subtotal || 0).toLocaleString()}</strong></div>
${Number(order.discountAmount || 0) > 0 ? `<div class="total-row discount"><span>Discount</span><strong>− ৳ ${Number(order.discountAmount).toLocaleString()}</strong></div>` : ""}
<div class="total-row"><span>Delivery</span><strong>৳ ${Number(order.deliveryCharge || 0).toLocaleString()}</strong></div>
<div class="total-row grand"><span>Grand Total</span><span>৳ ${Number(order.totalAmount || 0).toLocaleString()}</span></div>
</div></div>
<div class="thank-you"><h2>Thank You for Your Order!</h2><p>luggagecover24@gmail.com · +01328-152066</p></div>
<div class="footer"><div class="footer-brand"><strong>LUGGAGE COVER BD</strong><br/>luggagecover24@gmail.com · +01328-152066<br/>Dhaka, Bangladesh</div>
<div class="footer-note">7-day return policy. Computer-generated invoice.</div></div>
</div></body></html>`;

    const win = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  if (!mounted || !session) return null;

  return (
    <AdminLayout title="Orders" breadcrumb="Home / Orders Management">
      <>
        {/* Toast Notification */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <i className="fas fa-check"></i> : toast.type === "error" ? <i className="fas fa-times"></i> : <i className="fas fa-info-circle"></i>} {toast.message}
          </div>
        )}

        {/* Confirm Dialog */}
        <div className={`confirm-overlay ${confirmOpen ? "" : "hidden"}`}>
          <div className="confirm-box">
            <div className="admin-modal-header">
              <div className="admin-modal-title"><i className="fas fa-exclamation-triangle"></i> Confirm Action</div>
              <button className="admin-modal-close" onClick={() => { setConfirmOpen(false); setConfirmCallback(null); }}><i className="fas fa-times"></i></button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: "var(--admin-muted)" }}>{confirmMessage}</p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => { setConfirmOpen(false); setConfirmCallback(null); }}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={() => { if (confirmCallback) confirmCallback(); setConfirmOpen(false); }} disabled={updating}>Confirm</button>
            </div>
          </div>
        </div>

        {/* Order Detail Modal */}
        {detailModalOpen && selectedOrder && (
          <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setDetailModalOpen(false); setSelectedOrder(null); } }}>
            <div className="admin-modal admin-modal-lg">
              <div className="admin-modal-header">
                <div className="admin-modal-title">Order: {selectedOrder.orderNumber}</div>
                <button className="admin-modal-close" onClick={() => { setDetailModalOpen(false); setSelectedOrder(null); }}><i className="fas fa-times"></i></button>
              </div>
              <div className="admin-modal-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  <div>
                    <h4 style={{ marginBottom: 10, fontSize: ".85rem", color: "var(--admin-muted)", textTransform: "uppercase", fontWeight: 700 }}>Customer</h4>
                    <p><strong>{selectedOrder.customerName || "—"}</strong></p>
                    <p>{selectedOrder.customerPhone}</p>
                    <p>{selectedOrder.customerEmail}</p>
                    <p>{selectedOrder.shippingAddress}, {selectedOrder.district}</p>
                    {selectedOrder.orderNotes && <p style={{ color: "var(--admin-muted)", fontStyle: "italic" }}>📝 {selectedOrder.orderNotes}</p>}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: 10, fontSize: ".85rem", color: "var(--admin-muted)", textTransform: "uppercase", fontWeight: 700 }}>Order Info</h4>
                    <p>Status: <span className={`status-badge status-${selectedOrder.orderStatus}`}>{STATUS_LABELS[selectedOrder.orderStatus || "new"]?.label || selectedOrder.orderStatus}</span></p>
                    <p>Payment: <span className={`status-badge status-${selectedOrder.paymentMethod || "cod"}`}>{selectedOrder.paymentMethod?.toUpperCase() || "COD"}</span></p>
                    <p>Payment Status: <span className={`status-badge status-${selectedOrder.paymentStatus || "pending"}`}>{selectedOrder.paymentStatus || "pending"}</span></p>
                    <p>Courier: <strong>{selectedOrder.courierName || "—"}</strong></p>
                    <p>Tracking: {selectedOrder.trackingNumber || "—"}</p>
                  </div>
                </div>

                <table className="data-table" style={{ marginBottom: 20 }}>
                  <thead><tr><th>Product</th><th>Code</th><th>Size</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead>
                  <tbody>
                    {(selectedOrder.items || []).map((i: OrderItem, idx: number) => (
                      <tr key={idx}>
                        <td className="cell-bold">{i.productName || "—"}</td>
                        <td><span className="cell-code">{i.productCode || "—"}</span></td>
                        <td style={{ textTransform: "capitalize" }}>{i.size || "—"}</td>
                        <td>{i.qty || 1}</td>
                        <td>৳ {Number(i.price || 0).toLocaleString()}</td>
                        <td className="cell-bold">৳ {Number((i.total || (i.price || 0) * (i.qty || 1))).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                  <div style={{ minWidth: 240, background: "#f8f9fc", borderRadius: 10, padding: 16, border: "1px solid #e8ecf5" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".9rem" }}><span>Subtotal</span><strong>৳ {Number(selectedOrder.subtotal || 0).toLocaleString()}</strong></div>
                    {Number(selectedOrder.discountAmount || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".9rem", color: "#27ae60" }}><span>Discount</span><strong>− ৳ {Number(selectedOrder.discountAmount).toLocaleString()}</strong></div>}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: ".9rem" }}><span>Delivery</span><strong>৳ {Number(selectedOrder.deliveryCharge || 0).toLocaleString()}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", fontSize: "1.15rem", fontWeight: 900, borderTop: "2px solid #e8ecf5", marginTop: 6, color: "#4A90E2" }}><span>Grand Total</span><span>৳ {Number(selectedOrder.totalAmount || 0).toLocaleString()}</span></div>
                  </div>
                </div>

                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <>
                    <h4 style={{ marginBottom: 10, fontSize: ".9rem" }}>📋 Status Timeline</h4>
                    {selectedOrder.statusHistory.map((h: StatusHistoryEntry, idx: number) => (
                      <div key={idx} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <span className={`status-badge status-${h.status}`}>{STATUS_LABELS[h.status]?.label || h.status}</span>
                        <span style={{ fontSize: ".8rem", color: "var(--admin-muted)" }}>{h.timestamp ? formatDatetime(h.timestamp) : ""}</span>
                        {h.note && <span style={{ fontSize: ".8rem" }}>{h.note}</span>}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-outline" onClick={() => handleDelete(selectedOrder)}><i className="fas fa-trash"></i> Delete</button>
                <button className="admin-btn admin-btn-outline" onClick={() => downloadInvoice(selectedOrder)}><i className="fas fa-print"></i> Invoice</button>
                <button className="admin-btn admin-btn-primary" onClick={() => { setDetailModalOpen(false); changeOrderStatus(selectedOrder); }}><i className="fas fa-edit"></i> Update Status</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {statusModalOpen && selectedOrder && (
          <div className="admin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setStatusModalOpen(false); } }}>
            <div className="admin-modal">
              <div className="admin-modal-header">
                <div className="admin-modal-title">Update Order: {selectedOrder.orderNumber}</div>
                <button className="admin-modal-close" onClick={() => setStatusModalOpen(false)}><i className="fas fa-times"></i></button>
              </div>
              <div className="admin-modal-body">
                <div style={{ marginBottom: 16, padding: 12, background: "#f8f9fc", borderRadius: 8 }}>
                  <div style={{ fontSize: ".85rem", color: "var(--admin-muted)", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.customerName || "—"}</div>
                  <div>{selectedOrder.customerPhone}</div>
                  <div style={{ fontSize: ".85rem", marginTop: 4 }}>{selectedOrder.shippingAddress}, {selectedOrder.district}</div>
                </div>

                <div style={{ marginBottom: 16, padding: 12, background: "#f8f9fc", borderRadius: 8 }}>
                  <div style={{ fontSize: ".85rem", color: "var(--admin-muted)", marginBottom: 4 }}>Order Value</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>৳ {Number(selectedOrder.totalAmount || 0).toLocaleString()}</div>
                  <div style={{ fontSize: ".85rem", color: "var(--admin-muted)" }}>{selectedOrder.paymentMethod?.toUpperCase() || "COD"} · {selectedOrder.orderStatus}</div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">New Status</label>
                  <select id="newStatusSelect" className="admin-select" style={{ width: "100%" }} defaultValue={selectedOrder.orderStatus || "new"}>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Courier Service</label>
                  <select id="courierNameInput" className="admin-select" style={{ width: "100%" }} defaultValue={selectedOrder.courierName || ""}>
                    <option value="">— Select Courier —</option>
                    {HARDCODED_COURIERS.filter((c) => c.is_active).map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.logo_emoji || "📦"} {c.name} (Dhaka ৳{c.dhaka_charge} / Outside ৳{c.outside_charge})
                      </option>
                    ))}
                    <option value="__custom__">✏️ Enter manually…</option>
                  </select>
                </div>

                <div className="admin-form-group" id="courierCustomWrap" style={{ display: selectedOrder.courierName && !HARDCODED_COURIERS.find(c => c.name === selectedOrder.courierName) ? "block" : "none" }}>
                  <label className="admin-form-label">Custom Courier Name</label>
                  <input type="text" id="courierCustomInput" className="admin-input" placeholder="e.g. SA Paribahan" defaultValue={selectedOrder.courierName && !HARDCODED_COURIERS.find(c => c.name === selectedOrder.courierName) ? selectedOrder.courierName : ""} />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Order Date</label>
                  <input type="date" id="orderDateInput" className="admin-input" defaultValue={getOrderDate(selectedOrder)?.slice(0, 10) || ""} />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Tracking Number</label>
                  <input type="text" id="trackingInput" className="admin-input" placeholder="Courier tracking #" defaultValue={selectedOrder.trackingNumber || ""} />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Note</label>
                  <input type="text" id="statusNoteInput" className="admin-input" placeholder="Internal note (optional)" />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-outline" onClick={() => setStatusModalOpen(false)}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={handleSaveStatus} disabled={updating}>
                  {updating ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="admin-alert admin-alert-danger" style={{ marginBottom: 20 }}>
            <span><i className="fas fa-times-circle"></i></span> {error}
            <button onClick={loadOrders} className="admin-btn admin-btn-sm" style={{ marginLeft: 12 }}>Retry</button>
          </div>
        )}

        {/* Main Orders Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              🛒 Orders Management
              <span className="status-badge status-active" style={{ marginLeft: 8 }}>{filtered.length}</span>
            </div>
            <div className="admin-card-actions">
              <div className="admin-search">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search order / customer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status ({orders.length})</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s].label} ({statusCounts[s]})</option>
                ))}
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
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Courier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="spinner" />
                          <p style={{ marginTop: 12 }}>Loading orders...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📦</div>
                          <p>No orders found</p>
                          {search && <p style={{ fontSize: "0.8rem", marginTop: 8 }}>Try adjusting your search or filter</p>}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => (
                      <tr key={getOrderId(o)}>
                        <td className="cell-bold">{o.orderNumber || getOrderId(o).slice(0, 8)}</td>
                        <td>
                          {o.customerName || "—"}
                          <br />
                          <small style={{ color: "var(--admin-muted)" }}>{o.customerPhone}</small>
                        </td>
                        <td>{(o.items || []).length} item(s)</td>
                        <td className="cell-bold">{formatCurrency(o.totalAmount)}</td>
                        <td>
                          <span className={`status-badge status-${o.paymentMethod || "cod"}`}>{o.paymentMethod?.toUpperCase() || "COD"}</span>
                          <br />
                          <span className={`status-badge status-${o.paymentStatus || "pending"}`}>{o.paymentStatus || "pending"}</span>
                        </td>
                        <td><span className={`status-badge status-${o.orderStatus || "new"}`}>{STATUS_LABELS[o.orderStatus || "new"]?.label || o.orderStatus}</span></td>
                        <td>{formatDate(getOrderDate(o))}</td>
                        <td>
                          {o.courierName || "—"}
                          <br />
                          <small style={{ color: "var(--admin-muted)" }}>{o.trackingNumber || ""}</small>
                        </td>
                        <td>
                          <div className="cell-actions">
                            <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => viewOrderDetail(o)} title="View Details"><i className="fas fa-eye"></i></button>
                            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => changeOrderStatus(o)} title="Update Status"><i className="fas fa-edit"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    </AdminLayout>
  );
}
