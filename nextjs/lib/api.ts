// ============================================================
// LUGGAGE COVER BD — API Client (TypeScript)
// Migrated from js/api.js
// ============================================================

import type {
  Product,
  Order,
  Customer,
  Setting,
  User,
  AdminSession,
  ApiResponse,
  PaginatedResponse,
  DiscountInfo,
  ProductSize,
  OrderStatus,
  PaymentMethod,
} from "@/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

const ADMIN_TOKEN_KEY = "lcbd_admin_token";

// ============================================================
// BASE API FUNCTIONS
// ============================================================

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DEFAULT_TIMEOUT = 10000;

async function fetchWithRetry(url: string, options: RequestInit = {}, timeout = DEFAULT_TIMEOUT, retries = 2): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    if ((e as Error).name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    if (retries > 0 && (e as Error).name !== 'AbortError') {
      await new Promise(r => setTimeout(r, 500));
      return fetchWithRetry(url, options, timeout, retries - 1);
    }
    throw e;
  }
}

export async function apiGet<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const qs = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  const url = `${API_BASE}/${endpoint}${qs ? `?${qs}` : ""}`;
  const headers = await authHeaders();
  const res = await fetchWithRetry(url, { headers }, 15000);
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  const json = await res.json();
  if (json.data) {
    return deepCamelCase(json.data) as T;
  }
  return json as T;
}

export async function apiGetRaw<T>(
  endpoint: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const qs = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  const url = `${API_BASE}/${endpoint}${qs ? `?${qs}` : ""}`;
  const authHeader = await authHeaders();
  const res = await fetchWithRetry(url, { 
    headers: {
      ...authHeader,
      'Cache-Control': 'no-cache',
    },
  }, 15000);
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  const json = await res.json();
  if (json.data) {
    return json.data as T;
  }
  return json as T;
}

export async function apiGetOne<T>(endpoint: string, id: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${endpoint}/${id}`, { headers }, 15000);
  if (!res.ok) throw new Error(`GET ${endpoint}/${id} failed`);
  const json = await res.json();
  return deepCamelCase(json) as T;
}

export async function apiPost<T>(
  endpoint: string,
  data: Record<string, unknown>
): Promise<T> {
  const headers = await authHeaders();
  const snakeData = deepSnakeCase(data);
  const res = await fetchWithRetry(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(snakeData),
  }, 15000);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${endpoint} failed: ${err}`);
  }
  const json = await res.json();
  if (json.success && json.data !== undefined) {
    return deepCamelCase(json.data) as T;
  }
  return json as T;
}

export async function apiPatch<T>(
  endpoint: string,
  id: string,
  data: Record<string, unknown>
): Promise<T> {
  const headers = await authHeaders();
  const snakeData = deepSnakeCase(data);
  const res = await fetchWithRetry(`${API_BASE}/${endpoint}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(snakeData),
  }, 15000);
  if (!res.ok) throw new Error(`PATCH ${endpoint}/${id} failed`);
  const json = await res.json();
  if (json.success && json.data !== undefined) {
    return deepCamelCase(json.data) as T;
  }
  return json as T;
}

export async function apiDelete(
  endpoint: string,
  id: string
): Promise<boolean> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${endpoint}/${id}`, {
    method: "DELETE",
    headers,
  }, 15000);
  if (!res.ok) throw new Error(`DELETE ${endpoint}/${id} failed`);
  return true;
}

async function getAll<T>(
  table: string,
  extraParams: Record<string, string | number> = {}
): Promise<T[]> {
  const data = await apiGet<T[]>(table, {
    limit: 200,
    ...extraParams,
  });
  return Array.isArray(data) ? data : [];
  }

// ============================================================
// FIELD NAME MAPPING (snake_case <-> camelCase)
// ============================================================

const SNAKE_TO_CAMEL: Record<string, string> = {
  _id: "id",
  // Product fields
  image_url: "imageUrl",
  gallery_1: "gallery1",
  gallery_2: "gallery2",
  gallery_3: "gallery3",
  gallery_4: "gallery4",
  gallery_5: "gallery5",
  price_small: "priceSmall",
  price_medium: "priceMedium",
  price_large: "priceLarge",
  stock_small: "stockSmall",
  stock_medium: "stockMedium",
  stock_large: "stockLarge",
  sort_order: "sortOrder",
  seo_title: "seoTitle",
  seo_description: "seoDescription",
  meta_title: "metaTitle",
  meta_description: "metaDescription",
  // Order fields
  order_number: "orderNumber",
  customer_name: "customerName",
  customer_phone: "customerPhone",
  customer_email: "customerEmail",
  shipping_address: "shippingAddress",
  discount_amount: "discountAmount",
  delivery_charge: "deliveryCharge",
  total_amount: "totalAmount",
  payment_method: "paymentMethod",
  payment_status: "paymentStatus",
  order_status: "orderStatus",
  courier_name: "courierName",
  tracking_number: "trackingNumber",
  order_notes: "orderNotes",
  status_history: "statusHistory",
  product_id: "productId",
  product_name: "productName",
  product_code: "productCode",
  // Customer fields
  total_orders: "totalOrders",
  total_spent: "totalSpent",
  last_order_at: "lastOrderAt",
  // Batch fields
  batch_name: "batchName",
  batch_date: "batchDate",
  design_codes: "designCodes",
  fabric_cost: "fabricCost",
  garments_bill: "garmentsBill",
  print_bill: "printBill",
  accessories_bill: "accessoriesBill",
  transport_cost: "transportCost",
  packaging_cost: "packagingCost",
  other_costs: "otherCosts",
  qty_small: "qtySmall",
  qty_medium: "qtyMedium",
  qty_large: "qtyLarge",
  qty_xl: "qtyXl",
  sell_price_small: "sellPriceSmall",
  sell_price_medium: "sellPriceMedium",
  sell_price_large: "sellPriceLarge",
  sell_price_xl: "sellPriceXl",
  // Content fields
  vendor_name: "vendorName",
  amount_bdt: "amountBdt",
  amount_usd: "amountUsd",
  exchange_rate: "exchangeRate",
  effective_bdt: "effectiveBdt",
  // FB Campaign fields
  campaign_name: "campaignName",
  usd_spent: "usdSpent",
  bdt_spent: "bdtSpent",
  predicted_orders: "predictedOrders",
  actual_orders: "actualOrders",
  avg_order_value: "avgOrderValue",
  unit_production_cost: "unitProductionCost",
  delivery_cost_per_order: "deliveryCostPerOrder",
  other_costs_bdt: "otherCostsBdt",
  // Mongoose timestamps (preserve as-is)
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  created_at: "createdAt",
  updated_at: "updatedAt",
};

function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

const CAMEL_TO_SNAKE: Record<string, string> = Object.fromEntries(
  Object.entries(SNAKE_TO_CAMEL).map(([k, v]) => [v, k])
);

function toCamelCase(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[SNAKE_TO_CAMEL[key] ?? key] = value;
  }
  return result;
}

function toSnakeCase(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    result[CAMEL_TO_SNAKE[key] ?? camelToSnakeCase(key)] = value;
  }
  return result;
}

function deepSnakeCase(data: unknown): unknown {
  if (Array.isArray(data)) return data.map((item) => deepSnakeCase(item));
  if (data !== null && typeof data === "object" && !Buffer.isBuffer(data) && !(data instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[CAMEL_TO_SNAKE[key] ?? camelToSnakeCase(key)] = deepSnakeCase(value);
    }
    return result;
  }
  return data;
}

function deepCamelCase(data: unknown): unknown {
  if (Array.isArray(data)) return data.map((item) => deepCamelCase(item));
  if (data !== null && typeof data === "object" && !Buffer.isBuffer(data) && !(data instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[SNAKE_TO_CAMEL[key] ?? snakeToCamel(key)] = deepCamelCase(value);
    }
    return result;
  }
  return data;
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

// ============================================================
// PRODUCTS
// ============================================================

const PRODUCT_EMOJI_MAP: Record<string, string> = {
  a1b23: "🌍",
  a2b34: "🌸",
  a3b45: "💼",
  b1c23: "🏰",
  b2c34: "✨",
  b3c45: "⚽",
  c1d23: "🎡",
  c2d34: "⏰",
  c3d45: "🗺️",
  d1e23: "🎨",
  d1e34: "🐱",
  d3e45: "🏯",
  e1f23: "🏖️",
  e2f34: "😎",
};

class ProductsAPI {
  private cache: Product[] | null = null;

  private mapFromBackend(raw: Record<string, unknown>): Product {
    const galleryArr = (raw.gallery as string[]) || [];
    const p: Record<string, unknown> = {
      id: raw._id ?? raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      status: raw.status,
      featured: raw.featured,
      sort_order: raw.sortOrder ?? raw.sort_order,
      price_small: (raw.priceSmall ?? raw.price_small) as number,
      price_medium: (raw.priceMedium ?? raw.price_medium) as number,
      price_large: (raw.priceLarge ?? raw.price_large) as number,
      stock_small: (raw.stockSmall ?? raw.stock_small) as number,
      stock_medium: (raw.stockMedium ?? raw.stock_medium) as number,
      stock_large: (raw.stockLarge ?? raw.stock_large) as number,
      image_url: raw.imageUrl ?? raw.image_url ?? raw.image ?? '',
      gallery_1: galleryArr[0] ?? raw.gallery_1 ?? raw.gallery1 ?? '',
      gallery_2: galleryArr[1] ?? raw.gallery_2 ?? raw.gallery2 ?? '',
      gallery_3: galleryArr[2] ?? raw.gallery_3 ?? raw.gallery3 ?? '',
      gallery_4: galleryArr[3] ?? raw.gallery_4 ?? raw.gallery4 ?? '',
      gallery_5: galleryArr[4] ?? raw.gallery_5 ?? raw.gallery5 ?? '',
      seo_title: raw.seoTitle ?? raw.seo_title,
      seo_description: raw.seoDescription ?? raw.seo_description,
      meta_title: raw.metaTitle ?? raw.meta_title,
      meta_description: raw.metaDescription ?? raw.meta_description,
      created_at: (raw.createdAt ?? raw.created_at) as string,
      updated_at: (raw.updatedAt ?? raw.updated_at) as string,
    };
    return p as unknown as Product;
  }

  async getAll(forceRefresh = false): Promise<Product[]> {
    if (this.cache && !forceRefresh) return this.cache;
    try {
      const rows = await getAll<Record<string, unknown>>("products", { sort: "sortOrder" });
      const mapped = rows.map((r) => this.mapFromBackend(r));
      this.cache = mapped.filter((p) => p.status === "active");
      return this.cache;
    } catch (e) {
      console.warn("Products load failed", e);
      return [];
    }
  }

  async getById(id: string): Promise<Product | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) || null;
  }

  async getByCode(code: string): Promise<Product | null> {
    const all = await this.getAll();
    return all.find((p) => p.code === code) || null;
  }

  getPriceForSize(product: Product, size: ProductSize): number {
    const map: Record<ProductSize, keyof Product> = {
      small: "priceSmall",
      medium: "priceMedium",
      large: "priceLarge",
    };
    return (product[map[size]] as number) || product.priceSmall || 990;
  }

  getEmoji(product: Product): string {
    return PRODUCT_EMOJI_MAP[product.code] || "🧳";
  }

  getStockForSize(product: Product, size: ProductSize): number {
    const map: Record<ProductSize, keyof Product> = {
      small: "stockSmall",
      medium: "stockMedium",
      large: "stockLarge",
    };
    return (product[map[size]] as number) || 0;
  }

  getAllImages(product: Product): string[] {
    const images: string[] = [];
    if (product.imageUrl) images.push(product.imageUrl);
    if (product.gallery1) images.push(product.gallery1);
    if (product.gallery2) images.push(product.gallery2);
    if (product.gallery3) images.push(product.gallery3);
    if (product.gallery4) images.push(product.gallery4);
    if (product.gallery5) images.push(product.gallery5);
    
    // If only one image exists, duplicate it for gallery effect
    if (images.length === 1 && product.imageUrl) {
      for (let i = 0; i < 5; i++) {
        images.push(product.imageUrl);
      }
    }
    
    return images;
  }

  invalidate(): void {
    this.cache = null;
  }
}

export const productsAPI = new ProductsAPI();

// ============================================================
// SETTINGS
// ============================================================

class SettingsAPI {
  private cache: Record<string, string> | null = null;
  private allCache: { key: string; value: string }[] | null = null;

async load(): Promise<Record<string, string>> {
    if (this.cache) return this.cache;
    try {
      const res = await apiGetRaw<{ success: boolean; data: Record<string, string> }>("settings");
      this.cache = res.data || {};
      return this.cache;
    } catch (e) {
      console.error("Failed to load settings:", e);
      return {};
    }
  }

async loadAll(): Promise<{ key: string; value: string }[]> {
    try {
      // Force fresh fetch each time - don't use stale cache
      const data = await apiGetRaw<{ key: string; value: string }[]>("settings/all");
      this.allCache = data || [];
      return this.allCache;
    } catch (e) {
      console.error("Failed to load all settings:", e);
      return [];
    }
  }

  invalidateCache(): void {
    this.allCache = null;
  }

  getFbReviews(): { name: string; location: string; avatar: string; avatarColor: string; text: string; screenshot: string; product: string; date: string; likes: string; comments: string; content: string }[] {
    const DEFAULT_FB_REVIEWS = [
      { name: "Mahir Rahman", location: "Dhaka", avatar: "MR", avatarColor: "linear-gradient(135deg, #4A90E2, #7B68EE)", text: "Amazing quality! Best luggage cover I've ever used.", screenshot: "", product: "World Travel Cover", date: "2 days ago", likes: "24", comments: "5", content: "Amazing quality! Best luggage cover I've ever used." },
      { name: "Sara Islam", location: "Chittagong", avatar: "SI", avatarColor: "linear-gradient(135deg, #40E0D0, #4A90E2)", text: "Love it! Got so many compliments at the airport.", screenshot: "", product: "Beach Breeze Cover", date: "1 week ago", likes: "18", comments: "3", content: "Love it! Got so many compliments at the airport." },
      { name: "Ahmed Khan", location: "Sylhet", avatar: "AK", avatarColor: "linear-gradient(135deg, #7B68EE, #9B59B6)", text: "Great product! Fast delivery and excellent packaging.", screenshot: "", product: "Tokyo Nights Cover", date: "3 days ago", likes: "31", comments: "8", content: "Great product! Fast delivery and excellent packaging." },
    ];

    if (!this.allCache || this.allCache.length === 0) {
      return DEFAULT_FB_REVIEWS;
    }

    const reviews: { name: string; location: string; avatar: string; avatarColor: string; text: string; screenshot: string; product: string; date: string; likes: string; comments: string; content: string }[] = [];

    for (let i = 1; i <= 6; i++) {
      const nameKey = `fb_review${i}_name`;
      const item = this.allCache.find(s => s.key === nameKey);
      if (item?.value && item.value.trim()) {
        reviews.push({
          name: item.value,
          location: this.allCache.find(s => s.key === `fb_review${i}_location`)?.value || "",
          avatar: this.allCache.find(s => s.key === `fb_review${i}_avatar`)?.value || item.value.substring(0, 2).toUpperCase(),
          avatarColor: this.allCache.find(s => s.key === `fb_review${i}_avatar_color`)?.value || "linear-gradient(135deg, #4A90E2, #7B68EE)",
          text: this.allCache.find(s => s.key === `fb_review${i}_text`)?.value || "",
          screenshot: this.allCache.find(s => s.key === `fb_review${i}_screenshot`)?.value || "",
          product: this.allCache.find(s => s.key === `fb_review${i}_product`)?.value || "",
          date: this.allCache.find(s => s.key === `fb_review${i}_date`)?.value || "",
          likes: this.allCache.find(s => s.key === `fb_review${i}_likes`)?.value || "0",
          comments: this.allCache.find(s => s.key === `fb_review${i}_comments`)?.value || "0",
          content: this.allCache.find(s => s.key === `fb_review${i}_content`)?.value || "",
        });
      }
    }
    
    return reviews.length > 0 ? reviews : DEFAULT_FB_REVIEWS;
  }

  getHowToSteps(): { step: number; title: string; desc: string; img: string }[] {
    const DEFAULT_HOWTO = [
      { step: 1, title: "Place on Top", desc: "Lay the cover over the top of your suitcase, handle-hole aligned.", img: "" },
      { step: 2, title: "Pull Down", desc: "Gently stretch and pull the cover down all four sides.", img: "" },
      { step: 3, title: "Adjust Fit", desc: "Align openings for handles and wheels. Spandex ensures a snug fit.", img: "" },
      { step: 4, title: "Done!", desc: "Secure the bottom closure. Your luggage is protected and ready to fly!", img: "" },
    ];

    if (!this.allCache || this.allCache.length === 0) {
      return DEFAULT_HOWTO;
    }

    const steps: { step: number; title: string; desc: string; img: string }[] = [];

    for (let i = 1; i <= 4; i++) {
      const customTitle = this.allCache.find(s => s.key === `howto_step${i}_title`)?.value || "";
      const customDesc = this.allCache.find(s => s.key === `howto_step${i}_desc`)?.value || "";
      const customImg = this.allCache.find(s => s.key === `howto_step${i}_img`)?.value || "";
      
      steps.push({
        step: i,
        title: customTitle || DEFAULT_HOWTO[i-1].title,
        desc: customDesc || DEFAULT_HOWTO[i-1].desc,
        img: customImg || DEFAULT_HOWTO[i-1].img,
      });
    }

    return steps;
  }

  private findSetting(key: string): string | undefined {
    if (!this.allCache) return undefined;
    const s = this.allCache.find((s) => s.key === key);
    return s?.value;
  }

  get(key: string, fallback = ""): string {
    if (!this.cache) return fallback;
    return this.cache[key] !== undefined ? this.cache[key] : fallback;
  }

  getBool(key: string, fallback = false): boolean {
    const v = this.get(key, String(fallback));
    return v === "true" || v === "1";
  }

  getNumber(key: string, fallback = 0): number {
    return parseFloat(this.get(key, String(fallback))) || fallback;
  }

  invalidate(): void {
    this.cache = null;
    this.allCache = null;
  }
}

export const settingsAPI = new SettingsAPI();
export { SettingsAPI };

// ============================================================
// ORDERS
// ============================================================

const STATUS_LABELS: Record<
  OrderStatus,
  { label: string; color: string }
> = {
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

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
};

class OrdersAPI {
  generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LC-${ts}-${rand}`;
  }

  async create(orderData: Record<string, unknown>) {
    return apiPost("orders", orderData);
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    note = "",
    courierName?: string,
    trackingNumber?: string,
    staffNotes?: string,
    orderDate?: string
  ) {
    const token = getAdminToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const updateData: Record<string, unknown> = { orderStatus: newStatus, note, courierName, trackingNumber, staffNotes };
    if (orderDate) {
      updateData.orderDate = orderDate;
    }
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updateData),
    });
    if (!res.ok) throw new Error(`Update status failed: ${res.status}`);
    return res.json();
  }

  async getAll(_forceRefresh?: boolean) {
    return getAll<Order>("orders");
  }

  async getById(id: string) {
    return apiGetOne<Order>("orders", id);
  }

  getStatusLabel(status: OrderStatus) {
    return STATUS_LABELS[status] || { label: status, color: "#999" };
  }

  getPaymentLabel(method: PaymentMethod) {
    return PAYMENT_LABELS[method] || method;
  }
}

export const ordersAPI = new OrdersAPI();

// ============================================================
// ADMIN AUTH
// ============================================================

const ADMIN_SESSION_KEY = "lcbd_admin_session";

class AdminAuthAPI {
  async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminSession; message?: string }> {
    try {
      const users = await getAll<User>("users");
      const user = users.find(
        (u) =>
          u.username === username &&
          (u as unknown as { password_hash?: string }).password_hash ===
            password &&
          u.status === "active"
      );
      if (user) {
        const session: AdminSession = {
          userId: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          loginTime: Date.now(),
        };
        if (typeof window !== "undefined") {
          sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        }
        try {
          await apiPatch("users", user.id, {
            last_login: new Date().toISOString(),
          });
        } catch {}
        return { success: true, user: session };
      }
      return { success: false, message: "Invalid username or password." };
    } catch (e) {
      return { success: false, message: "Login failed. Please try again." };
    }
  }

  async loginWithCookie(
    username: string,
    password: string
  ): Promise<{ success: boolean; user?: AdminSession; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || "Invalid username or password." };
      }
      if (data.token) {
        setAdminToken(data.token);
      }
      const session: AdminSession = {
        userId: data.user.id,
        username: data.user.username,
        fullName: data.user.fullName,
        role: data.user.role,
        loginTime: Date.now(),
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
      }
      return { success: true, user: session };
    } catch {
      return { success: false, message: "Login failed. Please try again." };
    }
  }

  logout(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.href = "/admin/login";
    }
  }

  getSession(): AdminSession | null {
    if (typeof window === "undefined") return null;
    try {
      const s = sessionStorage.getItem(ADMIN_SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getSession();
  }
}

export const adminAuthAPI = new AdminAuthAPI();

// ============================================================
// CUSTOMERS
// ============================================================

export const customersAPI = {
  async getAll(params?: Record<string, string | number>) {
    return getAll<Customer>("customers", params);
  },
  async getById(id: string) {
    return apiGetOne<Customer>("customers", id);
  },
};

// ============================================================
// INVENTORY
// ============================================================

export const inventoryAPI = {
  async getAll(params?: Record<string, string | number>) {
    return getAll("inventory", params);
  },
};

// ============================================================
// HELPERS
// ============================================================

export function formatCurrency(amount: number): string {
  return `৳ ${Number(amount).toLocaleString("en-BD")}`;
}

export function formatDate(ts?: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDatetime(ts?: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// COURIERS
// ============================================================

export interface Courier {
  id: string;
  name: string;
  short_name: string;
  logo_emoji: string;
  phone: string;
  dhaka_charge: number;
  outside_charge: number;
  estimated_days_dhaka: string;
  estimated_days_outside: string;
  tracking_url: string;
  notes: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

class CouriersAPI {
  private cache: Courier[] | null = null;

  async getAll(forceRefresh = false): Promise<Courier[]> {
    if (this.cache && !forceRefresh) return this.cache;
    try {
      this.cache = await getAll<Courier>("couriers");
      return this.cache;
    } catch { return []; }
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPost("couriers", data);
  }

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPatch("couriers", id, data);
  }

  async delete(id: string): Promise<boolean> {
    this.cache = null;
    return apiDelete("couriers", id);
  }

  invalidate(): void { this.cache = null; }
}

export const couriersAPI = new CouriersAPI();

// ============================================================
// PRODUCTION BATCHES
// ============================================================

export interface ProductionBatch {
  id: string;
  batchName: string;
  batchDate: string;
  designCodes: string;
  status: "planning" | "in_production" | "completed";
  fabricCost: number;
  garmentsBill: number;
  printBill: number;
  accessoriesBill: number;
  transportCost: number;
  packagingCost: number;
  otherCosts: number;
  qtySmall: number;
  qtyMedium: number;
  qtyLarge: number;
  qtyXl: number;
  sellPriceSmall: number;
  sellPriceMedium: number;
  sellPriceLarge: number;
  sellPriceXl: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

class ProductionBatchesAPI {
  private cache: ProductionBatch[] | null = null;

  async getAll(forceRefresh = false): Promise<ProductionBatch[]> {
    if (this.cache && !forceRefresh) return this.cache;
    try {
      this.cache = await getAll<ProductionBatch>("production_batches");
      return this.cache;
    } catch { return []; }
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPost("production_batches", data);
  }

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPatch("production_batches", id, data);
  }

  async delete(id: string): Promise<boolean> {
    this.cache = null;
    return apiDelete("production_batches", id);
  }

  sumCosts(b: ProductionBatch): number {
    return (b.fabricCost||0)+(b.garmentsBill||0)+(b.printBill||0)+(b.accessoriesBill||0)+(b.transportCost||0)+(b.packagingCost||0)+(b.otherCosts||0);
  }

  calcRevenue(b: ProductionBatch): number {
    return (b.qtySmall||0)*(b.sellPriceSmall||990)+(b.qtyMedium||0)*(b.sellPriceMedium||1190)+(b.qtyLarge||0)*(b.sellPriceLarge||1490)+(b.qtyXl||0)*(b.sellPriceXl||1690);
  }

  invalidate(): void { this.cache = null; }
}

export const productionBatchesAPI = new ProductionBatchesAPI();

// ============================================================
// FACEBOOK CAMPAIGNS
// ============================================================

export interface FBCampaign {
  id: string;
  campaignName: string;
  month: string;
  status: "active" | "completed" | "paused" | "cancelled";
  usdSpent: number;
  exchangeRate: number;
  bdtSpent: number;
  predictedOrders: number;
  actualOrders: number;
  avgOrderValue: number;
  unitProductionCost: number;
  deliveryCostPerOrder: number;
  otherCostsBdt: number;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

class FBCampaignsAPI {
  private cache: FBCampaign[] | null = null;

  async getAll(forceRefresh = false): Promise<FBCampaign[]> {
    if (this.cache && !forceRefresh) return this.cache;
    try {
      this.cache = await getAll<FBCampaign>("fb_campaigns");
      return this.cache;
    } catch { return []; }
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPost("fb_campaigns", data);
  }

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPatch("fb_campaigns", id, data);
  }

  async delete(id: string): Promise<boolean> {
    this.cache = null;
    return apiDelete("fb_campaigns", id);
  }

  invalidate(): void { this.cache = null; }
}

export const fbCampaignsAPI = new FBCampaignsAPI();

// ============================================================
// CONTENT BUDGET
// ============================================================

export interface ContentBudgetEntry {
  id: string;
  title: string;
  category: "video" | "photo" | "graphic" | "copywriting" | "model" | "other";
  month: string;
  vendorName: string;
  platform: "facebook" | "instagram" | "youtube" | "website" | "all";
  amountBdt: number | null;
  amountUsd: number | null;
  exchangeRate: number;
  effectiveBdt: number;
  status: "paid" | "pending" | "cancelled";
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

class ContentBudgetAPI {
  private cache: ContentBudgetEntry[] | null = null;

  async getAll(forceRefresh = false): Promise<ContentBudgetEntry[]> {
    if (this.cache && !forceRefresh) return this.cache;
    try {
      this.cache = await getAll<ContentBudgetEntry>("content_budget");
      return this.cache;
    } catch { return []; }
  }

  async create(data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPost("content_budget", data);
  }

  async update(id: string, data: Record<string, unknown>): Promise<unknown> {
    this.cache = null;
    return apiPatch("content_budget", id, data);
  }

  async delete(id: string): Promise<boolean> {
    this.cache = null;
    return apiDelete("content_budget", id);
  }

  invalidate(): void { this.cache = null; }
}

export const contentBudgetAPI = new ContentBudgetAPI();
