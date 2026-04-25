/* ============================================================
   LUGGAGE COVER BD — API Layer
   Handles all communication with the REST API
   ============================================================ */

const API = {
  base: 'api',

  async get(table, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${this.base}/${table}${qs ? '?' + qs : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
    return res.json();
  },

  async getOne(table, id) {
    const res = await fetch(`${this.base}/${table}/${id}`);
    if (!res.ok) throw new Error(`GET ${table}/${id} failed`);
    return res.json();
  },

  async post(table, data) {
    const res = await fetch(`${this.base}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`POST ${table} failed: ${err}`);
    }
    return res.json();
  },

  async put(table, id, data) {
    const res = await fetch(`${this.base}/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PUT ${table}/${id} failed`);
    return res.json();
  },

  async patch(table, id, data) {
    const res = await fetch(`${this.base}/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PATCH ${table}/${id} failed`);
    return res.json();
  },

  async delete(table, id) {
    const res = await fetch(`${this.base}/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${table}/${id} failed`);
    return true;
  },

  // Convenience: get all records from a table
  async getAll(table, extraParams = {}) {
    const data = await this.get(table, { limit: 200, ...extraParams });
    return data.data || [];
  }
};

/* ============================================================
   SETTINGS HELPER
   ============================================================ */
const Settings = {
  _cache: null,

  async load() {
    if (this._cache) return this._cache;
    try {
      const res = await API.get('settings');
      const map = res.data || {};
      this._cache = map;
      return map;
    } catch (e) {
      console.warn('Settings load failed', e);
      return {};
    }
  },

  get(key, fallback = '') {
    if (!this._cache) return fallback;
    return this._cache[key] !== undefined ? this._cache[key] : fallback;
  },

  getBool(key, fallback = false) {
    const v = this.get(key, String(fallback));
    return v === 'true' || v === '1';
  },

  getNumber(key, fallback = 0) {
    return parseFloat(this.get(key, String(fallback))) || fallback;
  },

  invalidate() { this._cache = null; }
};

/* ============================================================
   PRODUCTS HELPER
   ============================================================ */
const Products = {
  _cache: null,

  async getAll() {
    if (this._cache) return this._cache;
    try {
      const rows = await API.getAll('lc_products', { sort: 'sort_order' });
      this._cache = rows.filter(p => p.status === 'active');
      return this._cache;
    } catch (e) {
      console.warn('Products load failed', e);
      return [];
    }
  },

  async getById(id) {
    const all = await this.getAll();
    return all.find(p => p.id === id) || null;
  },

  async getByCode(code) {
    const all = await this.getAll();
    return all.find(p => p.code === code) || null;
  },

  getPriceForSize(product, size) {
    const map = { small: 'price_small', medium: 'price_medium', large: 'price_large' };
    return product[map[size]] || product.price_small || 990;
  },

  getEmoji(product) {
    const emojiMap = {
      'a1b23': '🌍', 'a2b34': '🌸', 'a3b45': '💼',
      'b1c23': '🏰', 'b2c34': '✨', 'b3c45': '⚽',
      'c1d23': '🎡', 'c2d34': '⏰', 'c3d45': '🗺️',
      'd1e23': '🎨', 'd1e34': '🐱', 'd3e45': '🏯',
      'e1f23': '🏖️', 'e2f34': '😎'
    };
    return emojiMap[product.code] || '🧳';
  },

  getStockForSize(product, size) {
    const map = { small: 'stock_small', medium: 'stock_medium', large: 'stock_large' };
    return product[map[size]] || 0;
  },

  invalidate() { this._cache = null; }
};

/* ============================================================
   CART LOGIC
   ============================================================ */
const Cart = {
  STORAGE_KEY: 'lcbd_cart',

  get() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
    } catch { return []; }
  },

  save(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this._updateBadge();
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: items }));
  },

  add(product, size, qty = 1) {
    const items = this.get();
    const key = `${product.id}_${size}`;
    const price = Products.getPriceForSize(product, size);
    const idx = items.findIndex(i => i.key === key);
    if (idx >= 0) {
      items[idx].qty += qty;
    } else {
      items.push({
        key,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        emoji: Products.getEmoji(product),
        size,
        price,
        qty
      });
    }
    this.save(items);
    Toast.success(`${product.name} (${size.charAt(0).toUpperCase() + size.slice(1)}) added to cart!`);
  },

  remove(key) {
    const items = this.get().filter(i => i.key !== key);
    this.save(items);
  },

  updateQty(key, qty) {
    const items = this.get();
    const idx = items.findIndex(i => i.key === key);
    if (idx >= 0) {
      if (qty <= 0) { this.remove(key); return; }
      items[idx].qty = qty;
      this.save(items);
    }
  },

  clear() { this.save([]); },

  getCount() { return this.get().reduce((s, i) => s + i.qty, 0); },

  getSubtotal() { return this.get().reduce((s, i) => s + (i.price * i.qty), 0); },

  getTotalQty() { return this.getCount(); },

  async getDiscount() {
    await Settings.load();
    const enabled = Settings.getBool('promo_bulk_enabled', true);
    const minQty = Settings.getNumber('promo_bulk_qty', 4);
    const pct = Settings.getNumber('promo_bulk_percent', 15);
    if (!enabled) return { amount: 0, percent: 0, applied: false };
    const totalQty = this.getTotalQty();
    if (totalQty >= minQty) {
      const amount = Math.round(this.getSubtotal() * pct / 100);
      return { amount, percent: pct, applied: true, minQty };
    }
    return { amount: 0, percent: pct, applied: false, minQty };
  },

  async getDeliveryCharge(district) {
    await Settings.load();
    const dhakaCharge = Settings.getNumber('delivery_charge_dhaka', 60);
    const outsideCharge = Settings.getNumber('delivery_charge_outside', 120);
    const isDhaka = (district || '').toLowerCase().includes('dhaka');
    return isDhaka ? dhakaCharge : outsideCharge;
  },

  _updateBadge() {
    const count = this.getCount();
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

/* ============================================================
   TOAST NOTIFICATION SYSTEM
   ============================================================ */
const Toast = {
  container: null,

  _getContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  },

  show(message, type = 'info', duration = 3500) {
    const c = this._getContainer();
    const icon = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type] || 'ℹ️';
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'fadeOut 0.4s ease forwards';
      setTimeout(() => t.remove(), 400);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); },
  warning(msg) { this.show(msg, 'warning'); }
};

/* ============================================================
   ADMIN AUTH
   ============================================================ */
const AdminAuth = {
  SESSION_KEY: 'lcbd_admin_session',

  async login(username, password) {
    try {
      const users = await API.getAll('lc_users');
      const user = users.find(u =>
        u.username === username &&
        u.password_hash === password &&
        u.status === 'active'
      );
      if (user) {
        const session = {
          userId: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
          loginTime: Date.now()
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        // Update last_login
        try { await API.patch('lc_users', user.id, { last_login: new Date().toISOString() }); } catch {}
        return { success: true, user: session };
      }
      return { success: false, message: 'Invalid username or password.' };
    } catch (e) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'admin-login.html';
  },

  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  }
};

/* ============================================================
   ORDER UTILITIES
   ============================================================ */
const Orders = {
  STATUS_LABELS: {
    new: { label: 'New', color: '#3498db' },
    confirmed: { label: 'Confirmed', color: '#9b59b6' },
    packing: { label: 'Packing', color: '#e67e22' },
    packed: { label: 'Packed', color: '#f39c12' },
    shipped: { label: 'Shipped', color: '#1abc9c' },
    delivered: { label: 'Delivered', color: '#27ae60' },
    cancelled: { label: 'Cancelled', color: '#e74c3c' },
    return_requested: { label: 'Return Req.', color: '#e74c3c' },
    returned: { label: 'Returned', color: '#c0392b' },
    refunded: { label: 'Refunded', color: '#7f8c8d' }
  },

  PAYMENT_LABELS: {
    cod: 'Cash on Delivery',
    bkash: 'bKash',
    nagad: 'Nagad',
    card: 'Card'
  },

  getStatusBadge(status) {
    const s = this.STATUS_LABELS[status] || { label: status, color: '#999' };
    return `<span class="badge" style="background:${s.color}22;color:${s.color}">${s.label}</span>`;
  },

  generateOrderNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LC-${ts}-${rand}`;
  },

  async create(orderData) {
    const orderNumber = this.generateOrderNumber();
    const statusHistory = [{
      status: 'new',
      timestamp: new Date().toISOString(),
      note: 'Order placed by customer'
    }];
    return API.post('lc_orders', {
      ...orderData,
      order_number: orderNumber,
      order_status: 'new',
      payment_status: orderData.payment_method === 'cod' ? 'pending' : 'pending',
      status_history: statusHistory
    });
  },

  async updateStatus(orderId, newStatus, note = '') {
    const order = await API.getOne('lc_orders', orderId);
    const history = order.status_history || [];
    history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note
    });
    return API.patch('lc_orders', orderId, {
      order_status: newStatus,
      status_history: history
    });
  }
};

/* ============================================================
   FORMAT HELPERS
   ============================================================ */
const Format = {
  currency(amount) {
    return `৳ ${Number(amount).toLocaleString('en-BD')}`;
  },
  date(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('en-BD', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  },
  datetime(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },
  phone(phone) {
    return phone ? `<a href="tel:${phone}" style="color:var(--brand-blue)">${phone}</a>` : '—';
  }
};

/* Init cart badge on load */
document.addEventListener('DOMContentLoaded', () => {
  Cart._updateBadge();
});
