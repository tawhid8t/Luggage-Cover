'use client';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAuthAPI } from "@/lib/api";
import AdminLayout from "@/components/admin/admin-layout";

export default function PlaceholderPage({ title, breadcrumb, icon }: { title: string; breadcrumb: string; icon: string }) {
  const router = useRouter();
  useEffect(() => {
    if (!adminAuthAPI.getSession()) router.replace("/admin/login");
  }, []);
  return (
    <AdminLayout title={title} breadcrumb={breadcrumb}>
      <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <h3>{title}</h3>
        <p>This section is coming soon in the Next.js admin panel.</p>
        <div className="admin-alert admin-alert-info" style={{ maxWidth: 480, margin: "0 auto", textAlign: "left", marginTop: 24 }}>
          <span>💡</span>
          <div>Use the original admin panel at <strong>admin.html</strong> for full functionality of this section.</div>
        </div>
      </div>
    </AdminLayout>
  );
}
