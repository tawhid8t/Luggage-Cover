'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAuthAPI, setAdminToken } from "@/lib/api";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminAuthAPI.isLoggedIn()) {
      router.replace("/admin");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await adminAuthAPI.loginWithCookie(username.trim(), password);
      if (result.success) {
        const sessionVal = result.user?.userId || "1";
        document.cookie = `lcbd_admin_session=${sessionVal}; path=/; max-age=86400; SameSite=Lax`;
        window.location.href = "/admin";
      } else {
        setError(result.message || "Login failed.");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-logo"><img src="/bg-removed.png" alt="" style={{width:40,height:40,objectFit:"contain"}}/></div>
        <div className="login-brand">LUGGAGE COVER</div>
        <div className="login-sub">Admin Panel</div>

        {error && <div className="login-error">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div className="login-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <Link href="/" style={{ color: "var(--brand-blue)" }}>
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
