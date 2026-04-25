# Luggage Cover BD — E-Commerce Website

Premium luggage cover store for Bangladesh. Polyester + Spandex elastic covers in 14 designs, 3 sizes (S/M/L). COD + bKash + Nagad.

---

## 🌐 Live URLs

| Page | Path |
|------|------|
| Homepage | `/index.html` |
| Shop | `/shop.html` |
| Product Detail | `/product.html?id=PRODUCT_ID` |
| Cart | `/cart.html` |
| Checkout | `/checkout.html` |
| Admin Login | `/admin-login.html` |
| Admin Panel | `/admin.html` |
| About | `/about.html` |
| FAQ | `/faq.html` |
| Contact | `/contact.html` |
| Deploy Guide | `/DEPLOY.md` |

---

## ✅ Completed Features

### 🛍️ Frontend Store
- [x] Hero section with animated orbs, card-stack visual, stats
- [x] Pricing strip (S ৳990 / M ৳1190 / L ৳1490)
- [x] Featured products grid (dynamic, from admin)
- [x] Value propositions (6 cards)
- [x] **How-to-Use section** — 4 steps with real photos loaded from Admin → Settings → CMS (falls back to emoji placeholders until images are set)
- [x] Material section with size guide table
- [x] **Facebook Reviews Carousel** — 6 review cards, auto-rotate, dot indicators, dark navy theme
- [x] CTA banner (buy 4 = 15% off)
- [x] Footer with social, contact, payment icons (COD/bKash/Nagad)
- [x] Sticky glassmorphism navbar
- [x] Cart badge (live count)
- [x] Mobile responsive (hamburger menu)

### 📦 Product Page
- [x] **5–6 Image Gallery** — main image + up to 5 extras
- [x] Thumbnail strip (click to switch)
- [x] Prev/Next navigation arrows (hover to reveal)
- [x] Image counter pill ("1 / 6")
- [x] Zoom / fullscreen lightbox (keyboard navigation)
- [x] Dynamic size-based pricing (S/M/L)
- [x] Stock display per size
- [x] Quantity selector
- [x] Add to Cart + Buy Now buttons
- [x] Bulk discount reminder
- [x] Product details tabs (Details / How to Use / Size Guide / Shipping)
- [x] Related products grid
- [x] Breadcrumb navigation

### 🛒 Cart & Checkout
- [x] Cart with localStorage persistence
- [x] Quantity update / remove
- [x] Auto-apply 15% discount for 4+ items
- [x] Checkout form (name, phone, address, district)
- [x] COD / bKash / Nagad payment options
- [x] Order creation via API

### 🔧 Admin Panel
- [x] Secure login (localStorage-based auth)
- [x] **Dashboard** — Revenue, Orders, Delivered, Customers KPIs + chart
- [x] **Orders** — List, filter, search, view detail, update status, add tracking
- [x] **Products & Designs** — Add/Edit/Delete, **gallery image fields (6 images)**, featured toggle, SEO fields
- [x] **Inventory** — Stock tracking, adjustment logs
- [x] **Customers CRM** — Customer list, order history
- [x] ~~Reviews (removed from frontend & admin sidebar)~~
- [x] **Production & Costs** — Full production batch management
- [x] **Payments** — Payment records
- [x] **Reports** — Sales analytics with charts
- [x] **Settings / CMS** — Hero text, promo bar, prices, delivery charges
- [x] **Admin Users** — Manage admin accounts

### 📣 Facebook Marketing Tracker (Admin → Facebook Ads) — NEW
- [x] **Campaign management** — Add, edit, duplicate, delete Facebook campaigns
- [x] **USD → BDT converter** — Input exchange rate yourself (rate is editable per campaign)
- [x] **Live BDT preview** — Instantly shows BDT equivalent while entering USD + rate
- [x] **Full P&L per campaign**:
  - Facebook ad spend (USD → BDT converted)
  - Production cost per unit × orders
  - Delivery / courier cost per order
  - Other miscellaneous costs
  - Total revenue (avg order value × orders)
  - **Net profit / loss**
  - Profit margin %
  - ROAS (Return on Ad Spend)
  - Ad cost per order (CPO)
  - Total cost per order
  - Break-even order count
- [x] **Predicted vs Actual orders** — Enter predicted orders upfront, record actual orders after campaign
- [x] **Overall KPI bar** — Total USD spent, total BDT, predicted orders, actual orders, total revenue, net profit
- [x] **Live ROI Calculator** tab — Real-time calculations without saving
- [x] **Analytics tab** — P&L summary table + Revenue/Cost/Profit bar chart + ROAS chart per campaign
- [x] **Business Tips tab** — ROAS benchmarks, CPO targets, profit margin goals, pro tips
- [x] **Product Cost Formula** — Visual breakdown of total cost = Ad Cost + Production + Delivery + Overheads
- [x] **Exchange Rate Quick-Update** button — Update default rate for new campaigns

### 🏭 Production Management (Admin → Production & Costs)
- [x] **New Production Batch** form — batch name, date, design codes, status
- [x] **Cost inputs**: Fabric, Garments/Sewing, Print, Accessories, Transport, Packaging, Other
- [x] **Quantity inputs**: S / M / L / XL units produced
- [x] **Selling prices**: Per size
- [x] **Auto-calculations**:
  - Total cost per batch
  - Unit cost per size
  - Revenue per size
  - Gross profit per size
  - Profit margin %
  - Summary P&L
- [x] **Quick Calculator** — Real-time cost/profit calculator without saving
- [x] **Analytics tab** — Summary table + bar chart (Cost vs Revenue vs Profit per batch)
- [x] KPI bar — Total batches, units made, total expenses, gross profit, avg margin

---

## 📦 Deployment

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step guide covering:
- Hostinger Shared Hosting (drag & drop, FTP)
- Vercel (free, recommended)
- Hostinger VPS (for Next.js version)
- DNS configuration, SSL, domain setup

---

## 🗄️ Data Tables (API)

| Table | Description |
|-------|-------------|
| `lc_products` | Products with 6 image fields (image_url + gallery_1..5), prices, stock |
| `lc_orders` | Customer orders with items, payment, status |
| `lc_customers` | Customer CRM data |
| `lc_inventory` | Stock adjustment log |
| `lc_settings` | Site CMS settings |
| `lc_users` | Admin user accounts |
| `lc_reviews` | Customer reviews |
| `lc_production_batches` | Production cost batches |
| `lc_fb_campaigns` | Facebook ad campaigns with USD spend, exchange rate, orders, P&L |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Brand Blue | `#4A90E2` |
| Brand Purple | `#7B68EE` |
| Brand Teal | `#40E0D0` |
| Brand Navy | `#1a1f3a` |
| Brand Dark | `#0f1224` |
| Font Heading | Poppins |
| Font Body | Inter |
| Gradient | `135deg, #4A90E2, #7B68EE` |

---

## 📸 Adding Product Images

1. Upload photo to [imgbb.com](https://imgbb.com) (free)
2. Copy the "Direct link" URL
3. Admin → Products → Edit Product
4. Paste in "Main Image URL" (Image 1)
5. Add up to 5 more URLs in Gallery Images 2–6
6. Save → product page shows full gallery with thumbnails

---

## 📞 Contact Info in Site

- Phone: +01328-152066 / +01788-039222
- Email: luggagecover24@gmail.com
- Location: Dhaka, Bangladesh

---

## ⏳ Pending / Future Features

- [ ] Real email notifications for new orders
- [ ] SMS notification integration (bKash API)
- [ ] Cloudinary image upload (currently URL-only)
- [ ] Custom Facebook review screenshot uploads
- [ ] CI/CD pipeline
- [ ] Google Analytics integration

---

*Luggage Cover BD © 2025 | Made in Bangladesh 🇧🇩*
