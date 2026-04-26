'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { adminAuthAPI } from "@/lib/api";
import type { AdminSession } from "@/types";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊", section: "Main" },
  { href: "/admin/orders", label: "Orders", icon: "🛒", section: "Main", badge: true },
  { href: "/admin/products", label: "Products & Designs", icon: "📦", section: "Catalog" },
  { href: "/admin/inventory", label: "Inventory", icon: "🏭", section: "Catalog" },
  { href: "/admin/customers", label: "Customers CRM", icon: "👥", section: "Customers" },
  { href: "/admin/couriers", label: "Courier Management", icon: "🚚", section: "Delivery" },
  { href: "/admin/production", label: "Production & Costs", icon: "🏭", section: "Production" },
  { href: "/admin/facebook", label: "Facebook Ads", icon: "📣", section: "Marketing", iconColor: "#1877f2" },
  { href: "/admin/content", label: "Content Budget", icon: "🎬", section: "Marketing", iconColor: "#9b59b6" },
  { href: "/admin/payments", label: "Payments", icon: "💳", section: "Finance" },
  { href: "/admin/reports", label: "Reports", icon: "📈", section: "Finance" },
  { href: "/admin/settings", label: "Settings / CMS", icon: "⚙️", section: "System" },
  { href: "/admin/users", label: "Admin Users", icon: "🛡️", section: "System" },
];

const SECTIONS = ["Main", "Catalog", "Customers", "Delivery", "Production", "Marketing", "Finance", "System"];

interface Props {
  children: React.ReactNode;
  title: string;
  breadcrumb?: string;
  headerActions?: React.ReactNode;
}

export function AdminSidebar({ session, newOrdersCount }: { session: AdminSession; newOrdersCount: number }) {
  const pathname = usePathname();

  const handleLogout = () => {
    adminAuthAPI.logout();
  };

  const initials = session.fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  let lastSection = "";

  return (
    <aside className="admin-sidebar" id="adminSidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><img src="/bg-removed.png" alt="" style={{width:32,height:32,objectFit:"contain"}}/></div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-main">LUGGAGE COVER</span>
          <span className="sidebar-logo-sub">ADMIN PANEL</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{session.fullName}</div>
          <div className="sidebar-user-role">{session.role.charAt(0).toUpperCase() + session.role.slice(1)}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const showSection = item.section !== lastSection;
          if (showSection) lastSection = item.section;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <div key={item.href}>
              {showSection && (
                <span className="sidebar-section-label">{item.section}</span>
              )}
              <Link
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <span style={{ fontSize: "0.9rem", color: (item as { iconColor?: string }).iconColor }}>{item.icon}</span>
                {item.label}
                {item.badge && newOrdersCount > 0 && (
                  <span className="sidebar-badge">{newOrdersCount}</span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <a href="/" target="_blank" className="sidebar-link">
          <span>🔗</span> View Store
        </a>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children, title, breadcrumb, headerActions }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = adminAuthAPI.getSession();
    if (!s) {
      router.replace("/admin/login");
      return;
    }
    setSession(s);
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("lcbd_new_orders_count");
      if (cached) setNewOrdersCount(parseInt(cached) || 0);
    }
    fetchNewOrders();
  }, []);

  const fetchNewOrders = async () => {
    try {
      const { ordersAPI } = await import("@/lib/api");
      const orders = await ordersAPI.getAll();
      const count = orders.filter((o: { orderStatus: string }) => o.orderStatus === "new").length;
      setNewOrdersCount(count);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("lcbd_new_orders_count", String(count));
      }
    } catch {}
  };

  if (!mounted) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <AdminSidebar session={session} newOrdersCount={newOrdersCount} />

      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <div>
              <div className="admin-page-title">{title}</div>
              <div className="admin-page-breadcrumb">{breadcrumb || "Home"}</div>
            </div>
          </div>
          <div className="admin-header-right">
            <button
              className="admin-header-btn"
              onClick={() => window.location.reload()}
              title="Refresh"
            >
              🔄
            </button>
            {headerActions}
            <a href="/" target="_blank" className="admin-store-btn">
              🏪 View Store
            </a>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
