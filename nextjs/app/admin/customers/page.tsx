'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { customersAPI, ordersAPI, adminAuthAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import AdminLayout from "@/components/admin/admin-layout";
import type { Customer, Order } from "@/types";
import type { AdminSession } from "@/types";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    const s = adminAuthAPI.getSession();
    if (!s) { router.replace("/admin/login"); return; }
    setSession(s);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, o] = await Promise.all([customersAPI.getAll(), ordersAPI.getAll()]);
      c.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      setCustomers(c);
      setOrders(o);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const getCustomerStats = (customerId: string) => {
    const custOrders = orders.filter((o) => o.customer_phone === customers.find((c) => c.id === customerId)?.phone);
    const totalSpent = custOrders.reduce((s, o) => s + (o.total_amount || 0), 0);
    return { orderCount: custOrders.length, totalSpent };
  };

  return (
    <AdminLayout title="Customers CRM" breadcrumb="Home / Customers CRM">
      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <div className="admin-modal-title">👤 {selectedCustomer.name || "—"}</div>
              <button className="admin-modal-close" onClick={() => setSelectedCustomer(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <h4 style={{ marginBottom: 8, fontSize: ".8rem", color: "var(--admin-muted)", textTransform: "uppercase", fontWeight: 700 }}>Contact</h4>
                  <p><strong>{selectedCustomer.name || "—"}</strong></p>
                  <p>{selectedCustomer.phone}</p>
                  <p>{selectedCustomer.email}</p>
                  <p>Since: {formatDate(selectedCustomer.created_at)}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: 8, fontSize: ".8rem", color: "var(--admin-muted)", textTransform: "uppercase", fontWeight: 700 }}>Stats</h4>
                  {(() => {
                    const stats = getCustomerStats(selectedCustomer.id || "");
                    return (
                      <>
                        <p>Total Orders: <strong>{stats.orderCount}</strong></p>
                        <p>Total Spent: <strong>{formatPrice(stats.totalSpent)}</strong></p>
                      </>
                    );
                  })()}
                </div>
              </div>
              <h4 style={{ marginBottom: 10, fontSize: ".9rem" }}>📦 Orders</h4>
              <table className="data-table">
                <thead><tr><th>Order #</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
                <tbody>
                  {orders
                    .filter((o) => o.customer_phone === selectedCustomer.phone)
                    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                    .map((o) => (
                      <tr key={o.id}>
                        <td className="cell-bold">{o.order_number || o.id?.slice(0, 8)}</td>
                        <td>{formatDate(o.created_at)}</td>
                        <td className="cell-bold">{formatPrice(o.total_amount || 0)}</td>
                        <td><span className={`status-badge status-${o.order_status}`}>{o.order_status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setSelectedCustomer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            👥 Customers ({filtered.length})
          </div>
          <div className="admin-card-actions">
            <div className="admin-search">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search name / phone / email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="admin-card-body">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Since</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="spinner" /></div></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👥</div><p>No customers found</p></div></td></tr>
                ) : (
                  filtered.map((c) => {
                    const stats = getCustomerStats(c.id || "");
                    return (
                      <tr key={c.id}>
                        <td className="cell-bold">{c.name || "—"}</td>
                        <td>{c.phone}</td>
                        <td>{c.email || "—"}</td>
                        <td>{stats.orderCount}</td>
                        <td className="cell-bold">{formatPrice(stats.totalSpent)}</td>
                        <td>{formatDate(c.created_at)}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => setSelectedCustomer(c)}
                          >👁</button>
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
    </AdminLayout>
  );
}
