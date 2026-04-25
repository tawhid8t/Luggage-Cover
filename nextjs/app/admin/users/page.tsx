'use client';
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/admin-layout";

interface User {
  id: string;
  username: string;
  full_name?: string;
  password_hash?: string;
  role: string;
  email?: string;
  status: string;
  last_login?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    password: "",
    role: "admin",
    email: "",
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const existing = sessionStorage.getItem("lcbd_admin_session");
      if (existing) {
        const session = JSON.parse(existing);
        setCurrentUserId(session.userId || null);
      }
    } catch (e) {
      console.error("Failed to get current user:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const { apiGet } = await import("@/lib/api");
      const data = await apiGet<User[]>("tables/lc_users");
      setUsers(data);
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setForm({ full_name: "", username: "", password: "", role: "admin", email: "", status: "active" });
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || "",
      username: user.username,
      password: "",
      role: user.role,
      email: user.email || "",
      status: user.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    try {
      const { apiDelete } = await import("@/lib/api");
      await apiDelete("tables/lc_users", user.id);
      await fetchUsers();
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.username) {
      alert("Name and username are required.");
      return;
    }
    if (!selectedUser && !form.password) {
      alert("Password is required for new users.");
      return;
    }
    setSaving(true);
    try {
      const { apiPost } = await import("@/lib/api");
      const payload: Partial<User> = {
        full_name: form.full_name,
        username: form.username,
        role: form.role,
        email: form.email,
        status: form.status,
      };
      if (form.password) {
        payload.password_hash = form.password;
      }
      if (selectedUser) {
        await apiPost("tables/lc_users", { ...payload, id: selectedUser.id });
      } else {
        await apiPost("tables/lc_users", { ...payload, id: `user_${Date.now()}` });
      }
      setShowModal(false);
      await fetchUsers();
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (ts?: string) => {
    if (!ts) return "Never";
    return new Date(ts).toLocaleString("en-BD");
  };

  return (
    <AdminLayout title="Admin Users" breadcrumb="Home / Admin Users">
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <i className="fas fa-user-shield"></i> Admin Users
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleAdd}>
            <i className="fas fa-plus"></i> Add User
          </button>
        </div>
        <div className="admin-card-body">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg,#4A90E2,#7B68EE)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {(u.full_name || "?")[0].toUpperCase()}
                          </div>
                          <strong>{u.full_name}</strong>
                        </div>
                      </td>
                      <td className="cell-code">{u.username}</td>
                      <td>
                        <span className="status-badge status-active">{u.role}</span>
                      </td>
                      <td>{u.email || "—"}</td>
                      <td>
                        <span className={`status-badge status-${u.status}`}>{u.status}</span>
                      </td>
                      <td>{formatDate(u.last_login)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            onClick={() => handleEdit(u)}
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          {u.id !== currentUserId && (
                            <button
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleDelete(u)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading text-xl font-bold mb-4">
              {selectedUser ? `Edit: ${selectedUser.username}` : "Add Admin User"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="admin-input"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!selectedUser}
                />
              </div>
              <div className="form-group">
                <label>Password {selectedUser ? "(leave blank to keep current)" : "*"}</label>
                <input
                  type="password"
                  className="admin-input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  className="admin-input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="support">Support</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="admin-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="admin-input"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button className="admin-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : selectedUser ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}