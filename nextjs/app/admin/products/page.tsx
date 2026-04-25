'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAuthAPI } from "@/lib/api";
import AdminLayout from "@/components/admin/admin-layout";
import type { AdminSession } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

interface Product {
  _id?: string;
  id?: string;
  name?: string;
  code?: string;
  slug?: string;
  description?: string;
  material?: string;
  imageUrl?: string;
  gallery?: string[];
  gallery_1?: string;
  gallery_2?: string;
  gallery_3?: string;
  gallery_4?: string;
  gallery_5?: string;
  priceSmall?: number;
  priceMedium?: number;
  priceLarge?: number;
  stockSmall?: number;
  stockMedium?: number;
  stockLarge?: number;
  status?: string;
  featured?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  totalSold?: number;
  totalViews?: number;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem("lcbd_admin_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function getProductId(p: Product): string {
  return p._id || p.id || "";
}

function getGallery(p: Product): string[] {
    const gallery = p.gallery || [];
    return [
      p.imageUrl || p.gallery_1 || "",
      gallery[0] || p.gallery_1 || "",
      gallery[1] || p.gallery_2 || "",
      gallery[2] || p.gallery_3 || "",
      gallery[3] || p.gallery_4 || "",
      gallery[4] || p.gallery_5 || "",
    ].filter(Boolean);
  }

  function getGalleryCount(p: Product): number {
    return getGallery(p).filter(Boolean).length;
  }

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [session, setSession] = useState<AdminSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    const s = adminAuthAPI.getSession();
    if (!s) {
      router.replace("/admin/login");
      return;
    }
    setSession(s);
    setMounted(true);
    loadProducts();
  }, [router]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI("/products?limit=200");
      const productsData = data.data || [];
      productsData.sort((a: Product, b: Product) => (a.sortOrder || 99) - (b.sortOrder || 99));
      setProducts(productsData);
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.name || "").toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q);
  });

  const openForm = (product: Product | null) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const nameEl = document.getElementById("pf_name") as HTMLInputElement;
    const codeEl = document.getElementById("pf_code") as HTMLInputElement;
    const descEl = document.getElementById("pf_desc") as HTMLTextAreaElement;
    const imgEl = document.getElementById("pf_img") as HTMLInputElement;
    const g1El = document.getElementById("pf_g1") as HTMLInputElement;
    const g2El = document.getElementById("pf_g2") as HTMLInputElement;
    const g3El = document.getElementById("pf_g3") as HTMLInputElement;
    const g4El = document.getElementById("pf_g4") as HTMLInputElement;
    const g5El = document.getElementById("pf_g5") as HTMLInputElement;
    const psEl = document.getElementById("pf_ps") as HTMLInputElement;
    const pmEl = document.getElementById("pf_pm") as HTMLInputElement;
    const plEl = document.getElementById("pf_pl") as HTMLInputElement;
    const ssEl = document.getElementById("pf_ss") as HTMLInputElement;
    const smEl = document.getElementById("pf_sm") as HTMLInputElement;
    const slEl = document.getElementById("pf_sl") as HTMLInputElement;
    const sortEl = document.getElementById("pf_sort") as HTMLInputElement;
    const seoTEl = document.getElementById("pf_seo_t") as HTMLInputElement;
    const seoDEl = document.getElementById("pf_seo_d") as HTMLInputElement;
    const activeEl = document.getElementById("pf_active") as HTMLInputElement;
    const featEl = document.getElementById("pf_featured") as HTMLInputElement;

    const name = nameEl?.value.trim();
    const code = codeEl?.value.trim();
    const description = descEl?.value.trim() || "";
    const imageUrl = imgEl?.value.trim() || "";
    const gallery_1 = g1El?.value.trim() || "";
    const gallery_2 = g2El?.value.trim() || "";
    const gallery_3 = g3El?.value.trim() || "";
    const gallery_4 = g4El?.value.trim() || "";
    const gallery_5 = g5El?.value.trim() || "";
    const priceSmall = parseFloat(psEl?.value) || 990;
    const priceMedium = parseFloat(pmEl?.value) || 1190;
    const priceLarge = parseFloat(plEl?.value) || 1490;
    const stockSmall = parseInt(ssEl?.value) || 0;
    const stockMedium = parseInt(smEl?.value) || 0;
    const stockLarge = parseInt(slEl?.value) || 0;
    const sortOrder = parseInt(sortEl?.value) || 99;
    const seoTitle = seoTEl?.value.trim() || "";
    const seoDescription = seoDEl?.value.trim() || "";
    const status = activeEl?.checked ? "active" : "inactive";
    const featured = featEl?.checked;

    if (!name || !code) {
      showToast("error", "Name and code are required");
      return;
    }

    setSaving(true);
    try {
      const gallery = [gallery_1, gallery_2, gallery_3, gallery_4, gallery_5].filter(Boolean);

      const data: Record<string, unknown> = {
        name,
        code,
        description,
        imageUrl: imageUrl || undefined,
        gallery,
        priceSmall,
        priceMedium,
        priceLarge,
        stockSmall,
        stockMedium,
        stockLarge,
        sortOrder,
        status,
        featured,
        material: "High-Quality Polyester + Spandex Blend",
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
      };

      const productId = getProductId(editProduct!);
      if (productId) {
        await fetchAPI(`/products/${productId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
        showToast("success", `${name} updated!`);
      } else {
        await fetchAPI("/products", {
          method: "POST",
          body: JSON.stringify(data),
        });
        showToast("success", `${name} created!`);
      }

      setModalOpen(false);
      setEditProduct(null);
      await loadProducts();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await fetchAPI(`/products/${deleteTarget.id}`, { method: "DELETE" });
      showToast("success", `${deleteTarget.name} deleted`);
      setConfirmOpen(false);
      setDeleteTarget(null);
      await loadProducts();
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  const gallery = editProduct ? getGallery(editProduct) : ["", "", "", "", "", ""];

  if (!mounted || !session) return null;

  return (
    <AdminLayout title="Products & Designs" breadcrumb="Home / Products">
      <>
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}{" "}
            {toast.message}
          </div>
        )}

        {confirmOpen && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <div className="admin-modal-header">
                <div className="admin-modal-title">⚠️ Delete Design</div>
                <button
                  className="admin-modal-close"
                  onClick={() => {
                    setConfirmOpen(false);
                    setDeleteTarget(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-body">
                <p style={{ color: "var(--admin-muted)" }}>
                  Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="admin-modal-footer">
                <button
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setConfirmOpen(false);
                    setDeleteTarget(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="admin-modal-overlay">
            <div className="admin-modal admin-modal-lg" style={{ maxWidth: 720 }}>
              <div className="admin-modal-header">
                <div className="admin-modal-title">
                  {editProduct ? `Edit: ${editProduct.name}` : <><i className="fas fa-plus"></i> Add New Design</>}
                </div>
                <button
                  className="admin-modal-close"
                  onClick={() => {
                    setModalOpen(false);
                    setEditProduct(null);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Design Name *</label>
                    <input
                      id="pf_name"
                      className="admin-input"
                      defaultValue={editProduct?.name || ""}
                      placeholder="e.g. World Travel"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Design Code *</label>
                    <input
                      id="pf_code"
                      className="admin-input"
                      defaultValue={editProduct?.code || ""}
                      placeholder="e.g. a1b23"
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea
                    id="pf_desc"
                    className="admin-input admin-textarea"
                    defaultValue={editProduct?.description || ""}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Main Image URL (Image 1 of 6)</label>
                  <input
                    id="pf_img"
                    className="admin-input"
                    defaultValue={gallery[0] || ""}
                    placeholder="https://…"
                  />
                </div>

                <div
                  style={{
                    background: "#f8f9ff",
                    border: "1px solid #e1e5f5",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#4A90E2",
                      marginBottom: 10,
                      textTransform: "uppercase",
                    }}
                  >
                    Gallery Images (Images 2–6)
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label" style={{ fontSize: 11 }}>
                        Image 2 URL
                      </label>
                      <input
                        id="pf_g1"
                        className="admin-input"
                        defaultValue={gallery[1] || ""}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label" style={{ fontSize: 11 }}>
                        Image 3 URL
                      </label>
                      <input
                        id="pf_g2"
                        className="admin-input"
                        defaultValue={gallery[2] || ""}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label" style={{ fontSize: 11 }}>
                        Image 4 URL
                      </label>
                      <input
                        id="pf_g3"
                        className="admin-input"
                        defaultValue={gallery[3] || ""}
                        placeholder="https://…"
                      />
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label className="admin-form-label" style={{ fontSize: 11 }}>
                        Image 5 URL
                      </label>
                      <input
                        id="pf_g4"
                        className="admin-input"
                        defaultValue={gallery[4] || ""}
                        placeholder="https://…"
                      />
                    </div>
                    <div
                      className="admin-form-group"
                      style={{ marginBottom: 0, gridColumn: "span 2" }}
                    >
                      <label className="admin-form-label" style={{ fontSize: 11 }}>
                        Image 6 URL
                      </label>
                      <input
                        id="pf_g5"
                        className="admin-input"
                        defaultValue={gallery[5] || ""}
                        placeholder="https://…"
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-form-row admin-form-row-3">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Price — Small (৳)</label>
                    <input
                      id="pf_ps"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.priceSmall || 990}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Price — Medium (৳)</label>
                    <input
                      id="pf_pm"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.priceMedium || 1190}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Price — Large (৳)</label>
                    <input
                      id="pf_pl"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.priceLarge || 1490}
                    />
                  </div>
                </div>

                <div className="admin-form-row admin-form-row-3">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Stock — Small</label>
                    <input
                      id="pf_ss"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.stockSmall || 0}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Stock — Medium</label>
                    <input
                      id="pf_sm"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.stockMedium || 0}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Stock — Large</label>
                    <input
                      id="pf_sl"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.stockLarge || 0}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Sort Order</label>
                    <input
                      id="pf_sort"
                      type="number"
                      className="admin-input"
                      defaultValue={editProduct?.sortOrder || 99}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">SEO Title</label>
                    <input
                      id="pf_seo_t"
                      className="admin-input"
                      defaultValue={editProduct?.seoTitle || ""}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">SEO Description</label>
                  <input
                    id="pf_seo_d"
                    className="admin-input"
                    defaultValue={editProduct?.seoDescription || ""}
                  />
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      id="pf_active"
                      defaultChecked={editProduct?.status !== "inactive"}
                    />
                    Active (visible in store)
                  </label>
                  <label className="admin-toggle">
                    <input
                      type="checkbox"
                      id="pf_featured"
                      defaultChecked={!!editProduct?.featured}
                    />
                    Featured on Homepage
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => {
                    setModalOpen(false);
                    setEditProduct(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : editProduct ? <><i className="fas fa-save"></i> Save Changes</> : <><i className="fas fa-plus"></i> Create Design</>}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <i className="fas fa-box-open"></i> Products & Designs ({filtered.length})
            </div>
            <div className="admin-card-actions">
              <div className="admin-search">
                <span className="admin-search-icon"><i className="fas fa-search"></i></span>
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => openForm(null)}
              >
                <i className="fas fa-plus"></i> Add Design
              </button>
            </div>
          </div>
          <div className="admin-card-body">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name / Code</th>
                    <th>S ৳</th>
                    <th>M ৳</th>
                    <th>L ৳</th>
                    <th>Stock S/M/L</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="spinner" />
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-state-icon">📦</div>
                          <p>No products found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const productId = getProductId(p);
                      const images = getGallery(p);
                      const isLowS = (p.stockSmall ?? 0) < 5;
                      const isLowM = (p.stockMedium ?? 0) < 5;
                      const isLowL = (p.stockLarge ?? 0) < 5;

                      return (
                        <tr key={productId}>
                          <td>
                            <div style={{ position: "relative", display: "inline-block" }}>
                              <div
                                style={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 8,
                                  overflow: "hidden",
                                  background: "#f0f3ff",
                                }}
                              >
                                {images[0] ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={images[0]}
                                    alt={p.name}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "1.8rem",
                                    }}
                                  >
                                    🧳
                                  </div>
                                )}
                              </div>
                              {getGalleryCount(p) > 1 && (
                                <span style={{
                                  position: "absolute",
                                  bottom: -4,
                                  right: -4,
                                  background: "#4A90E2",
                                  color: "white",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: "2px 5px",
                                  borderRadius: 8,
                                }}>
                                  {getGalleryCount(p)} imgs
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="cell-bold">{p.name}</div>
                            <div className="cell-code" style={{ marginTop: 4 }}>
                              {p.code}
                            </div>
                          </td>
                          <td>৳{(p.priceSmall || 990).toLocaleString()}</td>
                          <td>৳{(p.priceMedium || 1190).toLocaleString()}</td>
                          <td>৳{(p.priceLarge || 1490).toLocaleString()}</td>
                          <td>
                            <span
                              className={isLowS ? "text-danger" : ""}
                              style={{ fontWeight: 700 }}
                            >
                              {p.stockSmall || 0}
                            </span>
                            {" / "}
                            <span
                              className={isLowM ? "text-danger" : ""}
                              style={{ fontWeight: 700 }}
                            >
                              {p.stockMedium || 0}
                            </span>
                            {" / "}
                            <span
                              className={isLowL ? "text-danger" : ""}
                              style={{ fontWeight: 700 }}
                            >
                              {p.stockLarge || 0}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${
                                p.status === "active" ? "active" : "inactive"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`status-badge status-${
                                p.featured ? "active" : "inactive"
                              }`}
                            >
                              {p.featured ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            <div className="cell-actions">
                              <button
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                onClick={() => openForm(p)}
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="admin-btn admin-btn-danger admin-btn-sm"
                                onClick={() => {
                                  setDeleteTarget({
                                    id: productId,
                                    name: p.name || "",
                                  });
                                  setConfirmOpen(true);
                                }}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
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
      </>
    </AdminLayout>
  );
}
