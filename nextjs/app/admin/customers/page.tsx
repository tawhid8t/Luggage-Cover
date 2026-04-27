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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [pageLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // For customer stats, we'll fetch orders for each customer when modal opens
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    const s = adminAuthAPI.getSession();
    if (!s) { router.replace("/admin/login"); return; }
    setSession(s);
    loadData(1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadData(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const result = await customersAPI.getPaginated({
        page,
        limit: pageLimit,
        search: search.trim() || undefined,
      });
      setCustomers(result.customers);
      setTotalCustomers(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      loadData(newPage);
    }
  };

  const getCustomerStats = (customer: Customer) => {
    const orderCount = (customer as any).totalOrders || 0;
    const totalSpent = (customer as any).totalSpent || 0;
    return { orderCount, totalSpent };
  };

  const fetchCustomerOrders = async (phone: string) => {
    try {
      const result = await ordersAPI.getPaginated({ page: 1, limit: 100, search: phone });
      setCustomerOrders(result.orders);
    } catch (e) {
      console.error("Failed to fetch customer orders:", e);
      setCustomerOrders([]);
    }
  };

  return (
    <AdminLayout title="Customers CRM" breadcrumb="Home / Customers CRM">
      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <div className="admin-modal-title">👤 {selectedCustomer.name || "—"}</div>
              <button className="admin-modal-close" onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <h4 style={{ marginBottom: 8, fontSize: ".8rem", color: "var(--admin-muted)", textTransform: "uppercase", fontWeight: 700 }}>Contact</h4>
                  <p><strong>{selectedCustomer.name || "—"}</strong></p>
                  <p>{selectedCustomer.phone}</p>
                  <p>{selectedCustomer.email}</p>
                  <p>Since: {formatDate(selectedCustomer.createdAt)}</p>
                </div>
                <div>
                  <h4 style={{ marginBottom: 8, fontSize: ".8rem", color: "var(--admin-muted)", textTransform: "uppercase", fontWeight: 700 }}>Stats</h4>
                  {(() => {
                    const stats = getCustomerStats(selectedCustomer);
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
                  {customerOrders.length === 0 ? (
                    <tr><td colSpan={4}><div className="empty-state"><p>Loading orders...</p></div></td></tr>
                  ) : (
                    customerOrders
                      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      .map((o) => (
                        <tr key={o.id}>
                          <td className="cell-bold">{o.orderNumber || o.id?.slice(0, 8)}</td>
                          <td>{formatDate(o.createdAt)}</td>
                          <td className="cell-bold">{formatPrice(o.totalAmount || 0)}</td>
                          <td><span className={`status-badge status-${o.orderStatus}`}>{o.orderStatus}</span></td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => { setSelectedCustomer(null); setCustomerOrders([]); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            👥 Customers ({totalCustomers})
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
                ) : customers.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👥</div><p>No customers found</p></div></td></tr>
                ) : (
                  customers.map((c) => {
                    const stats = getCustomerStats(c);
                    return (
                      <tr key={c.id}>
                        <td className="cell-bold">{c.name || "—"}</td>
                        <td>{c.phone}</td>
                        <td>{c.email || "—"}</td>
                        <td>{stats.orderCount}</td>
                        <td className="cell-bold">{formatPrice(stats.totalSpent)}</td>
                        <td>{formatDate(c.createdAt)}</td>
                        <td>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => {
                              setSelectedCustomer(c);
                              fetchCustomerOrders(c.phone || "");
                            }}
                          >👁</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
</table>
            </div>
            
            {!loading && totalPages > 0 && (
              <div className="pagination" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginTop: "8px", borderTop: "1px solid #eee" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
                  Showing {((currentPage - 1) * pageLimit) + 1} - {Math.min(currentPage * pageLimit, totalCustomers)} of {totalCustomers} customers
                </div>
                <div className="pagination-controls" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  ).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`admin-btn admin-btn-sm ${pageNum === currentPage ? "admin-btn-primary" : "admin-btn-outline"}`}
                      onClick={() => handlePageChange(pageNum)}
                      style={{ minWidth: "36px" }}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </AdminLayout>
  );
}
