# 🔐 Luggage Cover BD — Admin Panel: Full System Design Document

> **Version:** 2.0 | **Last Updated:** April 2025  
> **Scope:** Admin panel features, logic, data, permissions, automations, and security.  
> **Audience:** System designer / developer reference. No frontend UI code included.

---

## PHASE 1 — SYSTEM OVERVIEW

### What is the Admin Panel?

The Admin Panel is a **single-page web application (SPA)** that provides complete business management for the Luggage Cover BD e-commerce store. It is accessible at `/admin.html`, gated behind authentication, and communicates exclusively with a **RESTful Table API** (`tables/{table_name}`) for all data operations.

### Architectural Model

```
Browser (SPA)
    │
    ├── api.js           → Central HTTP layer (GET/POST/PUT/PATCH/DELETE)
    ├── admin-sections.js → All section renderers + business logic
    └── admin.html       → Shell: sidebar, header, modal, auth check

         ↕ REST API ↕

RESTful Table API (tables/)
    ├── lc_orders
    ├── lc_products
    ├── lc_customers
    ├── lc_inventory
    ├── lc_production_batches
    ├── lc_fb_campaigns
    ├── lc_content_budget
    ├── lc_couriers
    ├── lc_payments
    ├── lc_reviews
    ├── lc_settings
    └── lc_users
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend Runtime | Vanilla JavaScript (ES2020+) |
| Data API | RESTful JSON Tables API |
| Charts | Chart.js 4 (via CDN) |
| Icons | Font Awesome 6 (via CDN) |
| Session Storage | Browser `sessionStorage` |
| Cart/Local State | Browser `localStorage` |
| Authentication | Table-based (lc_users) + sessionStorage token |

---

## PHASE 2 — AUTHENTICATION & ACCESS CONTROL

### 2.1 Login Flow

**Trigger:** Every page load of `admin.html` calls `AdminAuth.requireAuth()` immediately.

**Step-by-step login process:**
1. User visits `/admin-login.html` and submits username + password
2. System calls `API.getAll('lc_users')` — fetches all users from DB
3. Finds user matching `username` + `password_hash` + `status === 'active'`
4. If match found:
   - Creates a session object: `{ userId, username, fullName, role, loginTime }`
   - Stores it in `sessionStorage` under key `lcbd_admin_session`
   - Writes `last_login` timestamp back to the user record via `PATCH`
   - Redirects to `/admin.html`
5. If no match: Returns error message, no session created

**Session validation on every page:**
```
admin.html loads → AdminAuth.requireAuth()
    → reads sessionStorage → if null → redirect to admin-login.html
    → if found → allow access, show user info in sidebar
```

### 2.2 Logout

- Calls `sessionStorage.removeItem('lcbd_admin_session')`
- Immediately redirects to `/admin-login.html`
- No server-side session invalidation (stateless client)

### 2.3 Role System

| Role | Stored In | Current Usage |
|---|---|---|
| `admin` | `lc_users.role` | Full access to all sections |
| `manager` | `lc_users.role` | Intended for limited access (UI-level check) |
| `viewer` | `lc_users.role` | Read-only intention (not enforced at API level) |

> **Note:** Role enforcement is currently UI-level only. The API does not enforce per-role permissions (all authenticated sessions can call any endpoint).

### 2.4 User Data Model (`lc_users`)

| Field | Type | Purpose |
|---|---|---|
| `id` | text | Unique identifier |
| `username` | text | Login username |
| `password_hash` | text | Plain-text password (no hashing currently) |
| `full_name` | text | Display name in sidebar |
| `role` | text | admin / manager / viewer |
| `email` | text | Contact email |
| `status` | text | active / inactive |
| `last_login` | datetime | Auto-updated on login |

---

## PHASE 3 — CORE FEATURES LIST

The admin panel has **13 distinct modules**:

| # | Module | Table(s) Used | Key Functions |
|---|---|---|---|
| 1 | Dashboard | All tables | KPI aggregation, profit calculation |
| 2 | Orders | lc_orders | CRUD, status management, tracking |
| 3 | Products & Designs | lc_products | CRUD, gallery, pricing, SEO |
| 4 | Inventory | lc_inventory | Stock adjustment log |
| 5 | Customers CRM | lc_customers, lc_orders | Customer profiles, order history |
| 6 | Couriers | lc_couriers | Rates, API integration, defaults |
| 7 | Production & Costs | lc_production_batches | Cost tracking, profit calculator |
| 8 | Facebook Marketing | lc_fb_campaigns | USD→BDT, ROI, campaign P&L |
| 9 | Content Budget | lc_content_budget | Content expense tracking |
| 10 | Payments | lc_payments | Payment record management |
| 11 | Reports | lc_orders + others | Analytics, charts |
| 12 | Settings / CMS | lc_settings | Site-wide config, prices |
| 13 | Admin Users | lc_users | User management |

---

## PHASE 4 — FEATURE LOGIC BREAKDOWN

---

### MODULE 1: DASHBOARD

#### Purpose
Central command center showing real-time business health with proper profit waterfall.

#### Data Sources Loaded (parallel fetch)
```
Promise.all([
  lc_orders,
  lc_products,
  lc_customers,
  lc_production_batches,
  lc_fb_campaigns,
  lc_content_budget
])
```

#### Profit Calculation Engine

**Step 1 — Revenue**
```
Total Revenue = SUM(total_amount) WHERE order_status = 'delivered'
```

**Step 2 — COGS (Production Cost)**
```
Avg Unit Cost = SUM(all batch costs) / SUM(all units produced)
Delivered Qty = SUM(item.qty) FROM delivered orders
Production COGS = Delivered Qty × Avg Unit Cost
```

**Step 3 — Gross Profit**
```
Gross Profit = Revenue - Production COGS
Gross Margin % = (Gross Profit / Revenue) × 100
```

**Step 4 — Marketing Cost (Facebook Ads)**
```
Total FB BDT = SUM(usd_spent × exchange_rate) FROM all lc_fb_campaigns
```

**Step 5 — Content Budget**
```
Total Content BDT = SUM(amount_bdt) WHERE status != 'cancelled'
                  + SUM(amount_usd × exchange_rate) WHERE amount_bdt = 0
```

**Step 6 — Net / Operating Profit**
```
Operating Profit = Gross Profit - Total FB BDT - Total Content BDT - Delivery Cost
Net Margin % = (Operating Profit / Revenue) × 100
```

#### KPI Cards Displayed (6 cards)
1. Total Revenue (from delivered orders)
2. Gross Profit + Gross Margin %
3. Net Profit + Net Margin %
4. Total Orders (new count sub-label)
5. Facebook Ad Spend (BDT)
6. Content Budget (BDT)

#### Alerts Logic
- **Missing Production Data:** if `batches.length === 0` → show info alert
- **Missing FB Data:** if `fbCampaigns.length === 0` → show info alert
- **Missing Content Data:** if `contentBudgets.filter(active).length === 0` → show info alert
- **Low Stock:** if any product has `stock_small/medium/large < 5` → show warning alert

#### Charts
1. **P&L Bar Chart** — 6 bars: Revenue, Prod COGS, FB Ads, Content, Gross Profit, Net Profit
2. **Orders Doughnut** — by status (10 possible statuses)

---

### MODULE 2: ORDERS MANAGEMENT

#### Order Lifecycle (Status Flow)
```
new → confirmed → packing → packed → shipped → delivered
                                              ↘ cancelled
                                              ↘ return_requested → returned → refunded
```

#### Features
- **List view** with search (order number, customer name, phone)
- **Status filter** dropdown (all statuses)
- **Order detail modal** — full line items, status history timeline, tracking info
- **Status update** — dropdown to move order to next status, add note
- **Tracking assignment** — input courier name + tracking number
- **Status history** — each status change logged with timestamp + note as JSON array

#### Order Number Generation
```
format: LC-{base36 timestamp}-{4 random chars uppercase}
example: LC-LX3A9F-K7M2
```

#### Data Model (`lc_orders`)
| Field | Type | Notes |
|---|---|---|
| `order_number` | text | Auto-generated |
| `customer_name` | text | |
| `customer_phone` | text | |
| `customer_address` | text | |
| `district` | text | Used for delivery charge calculation |
| `items` | array | [{productId, name, size, price, qty}] |
| `subtotal` | number | Before discount |
| `discount_amount` | number | |
| `delivery_charge` | number | |
| `total_amount` | number | Final paid/payable |
| `payment_method` | text | cod / bkash / nagad |
| `payment_status` | text | pending / paid / failed |
| `order_status` | text | 10-state enum |
| `courier_name` | text | |
| `tracking_number` | text | |
| `status_history` | array | [{status, timestamp, note}] |

---

### MODULE 3: PRODUCTS & DESIGNS

#### Features
- **CRUD** — Add/Edit/Delete products
- **Gallery images** — 1 main + 5 extra image URLs (6 total)
- **Per-size pricing** — Small / Medium / Large / XL prices
- **Per-size stock** — Small / Medium / Large stock levels
- **Featured toggle** — marks product to appear on homepage
- **Status** — active / inactive
- **SEO fields** — meta title, meta description
- **Sort order** — numeric sort for display sequence
- **Design code** — short unique identifier (e.g. A1, B2)

#### Data Model (`lc_products`)
Key fields: `name`, `code`, `status`, `price_small/medium/large`, `stock_small/medium/large`, `image_url`, `gallery_1..5`, `is_featured`, `sort_order`, `meta_title`, `meta_description`

---

### MODULE 4: INVENTORY

#### Features
- **Stock overview table** — all products × all sizes
- **Quick adjust** — add or subtract stock per size
- **Adjustment log** — every change recorded in `lc_inventory` with reason + quantity + before/after
- **Low stock warning** — threshold < 5 units

#### Data Model (`lc_inventory`)
Fields: `product_id`, `product_name`, `size`, `adjustment_type` (add/remove/set), `quantity_change`, `stock_before`, `stock_after`, `reason`, `adjusted_by`

---

### MODULE 5: CUSTOMERS CRM

#### Features
- **Customer list** with search
- **Customer profile** — name, phone, email, address
- **Order history per customer** — linked by `customer_phone` or `customer_id`
- **Total spent** — aggregated from all their delivered orders
- **Customer status** — active / blacklisted

---

### MODULE 6: COURIER MANAGEMENT

#### Sub-Tabs
1. **Couriers** — Visual cards for each courier
2. **API Integration** — Per-courier API config
3. **Rate Reference** — Comparison table
4. **Integration Guide** — Step-by-step per courier

#### Core Features
- Add / Edit / Delete couriers
- Set active/inactive per courier
- Set ONE default courier (auto-applied to new orders)
- Dhaka vs Outside Dhaka rate + ETA
- Tracking URL prefix (e.g. `https://pathao.com/tracking/{number}`)

#### API Integration Fields (per courier)
| Field | Purpose |
|---|---|
| `api_type` | pathao / steadfast / redx / paperfly / manual |
| `api_base_url` | Base endpoint URL |
| `api_key` | Client ID or API Key |
| `api_secret` | Client Secret |
| `api_username` | Merchant username |
| `api_password` | Merchant password |
| `api_store_id` | Merchant store/outlet ID |
| `webhook_url` | Inbound URL for delivery events |
| `api_enabled` | Boolean toggle |

#### API Integration Logic
- **Save**: PATCH courier record with API fields
- **Test**: HEAD request to `api_base_url` (no-cors mode) — confirms reachability
- **Guide tab**: Step-by-step for Pathao, Steadfast, RedX, Paperfly with correct URLs

#### Supported Bangladesh Couriers (pre-configured guides)
| Courier | Auth Type | Base URL |
|---|---|---|
| Pathao | OAuth (Client ID + Secret) | `https://hermes.p-omc.com/` |
| Steadfast | API Key + Secret | `https://portal.steadfast.com.bd/api/v1` |
| RedX | Bearer Token | `https://openapi.redx.com.bd/v1.0.0-beta` |
| Paperfly | Basic Auth | `https://app.paperfly.com.bd/api` |

---

### MODULE 7: PRODUCTION & COST TRACKER

#### Sub-Tabs
1. **Batches** — Production batch cards (expandable)
2. **Calculator** — Live cost/profit calculator (no save)
3. **Analytics** — Summary table + profit bar chart

#### Batch Data Model (`lc_production_batches`)
**Cost inputs:** fabric_cost, garments_bill, print_bill, accessories_bill, transport_cost, packaging_cost, other_costs  
**Quantity inputs:** qty_small, qty_medium, qty_large, qty_xl  
**Price inputs:** sell_price_small, sell_price_medium, sell_price_large, sell_price_xl  
**Meta:** batch_name, batch_date, design_codes, status (planning/in_production/completed), notes

#### Auto-Calculated Metrics (per batch)
```
Total Batch Cost = sum of all 7 cost fields
Total Units = qty_small + qty_medium + qty_large + qty_xl
Avg Unit Cost = Total Cost / Total Units
Revenue per size = qty × sell_price
Total Revenue = sum of all size revenues
Gross Profit = Revenue - Cost
Profit Margin = (Gross Profit / Revenue) × 100
Profit per unit = Gross Profit / Total Units
```

#### Quick Calculator
- Same formula as batch but without saving
- Real-time updates on every keystroke (oninput)
- "Save as Batch" button creates a real batch record

---

### MODULE 8: FACEBOOK MARKETING TRACKER

#### Sub-Tabs
1. **Campaigns** — List of all campaigns (expandable cards)
2. **Live Calculator** — Real-time ROI calculator
3. **Analytics** — P&L table + Revenue/Cost/Profit bar chart + ROAS chart
4. **Business Tips** — Benchmarks, tips, cost formula guide

#### Campaign Data Model (`lc_fb_campaigns`)
| Field | Purpose |
|---|---|
| `campaign_name` | Label |
| `month` | YYYY-MM period |
| `usd_spent` | Ad spend in dollars |
| `exchange_rate` | 1 USD = X BDT (set by user) |
| `bdt_spent` | Auto-calculated: usd × rate |
| `predicted_orders` | Expected orders from campaign |
| `actual_orders` | Real orders (updated after campaign) |
| `avg_order_value` | Expected revenue per order (BDT) |
| `unit_production_cost` | Production cost per unit |
| `delivery_cost_per_order` | Courier cost per order |
| `other_costs_bdt` | Any extra costs |
| `status` | active / completed / paused |

#### P&L Calculation Per Campaign
```
Revenue = avg_order_value × (actual_orders OR predicted_orders)
Ad Cost BDT = usd_spent × exchange_rate
Production Cost = unit_production_cost × orders
Delivery Cost = delivery_cost_per_order × orders
Total Cost = Ad Cost + Production + Delivery + other_costs

Net Profit = Revenue - Total Cost
Net Margin = (Net Profit / Revenue) × 100
ROAS = Revenue / Ad Cost BDT
CPO (ad only) = Ad Cost BDT / orders
Total CPO = Total Cost / orders
Break-even = CEIL(Ad Cost BDT / (selling_price - prod_cost - delivery_cost))
```

#### Exchange Rate Logic
- Each campaign stores its OWN exchange rate
- Rate changes month-to-month (user enters it per campaign)
- "Update Rate" button pre-fills the Live Calculator with a new rate
- Historical campaigns are NOT retroactively changed

---

### MODULE 9: CONTENT BUDGET TRACKER

#### Purpose
Track all content creation costs (video, photo, graphics, copywriting, model fees) so they are included in net profit calculation on the dashboard.

#### Data Model (`lc_content_budget`)
| Field | Type | Values |
|---|---|---|
| `title` | text | Description of content |
| `category` | text | video / photo / graphic / copywriting / model / other |
| `month` | text | YYYY-MM |
| `vendor_name` | text | Freelancer or agency |
| `platform` | text | facebook / instagram / youtube / website / all |
| `amount_bdt` | number | Primary cost in BDT |
| `amount_usd` | number | Cost in USD (if paid in USD) |
| `exchange_rate` | number | Rate to convert USD to BDT |
| `status` | text | paid / pending / cancelled |
| `notes` | text | |

#### Cost Resolution Logic
```
Effective Cost BDT =
    IF amount_bdt > 0 → use amount_bdt
    ELSE → amount_usd × exchange_rate
```

Cancelled records are excluded from dashboard totals.

#### Features
- Add / Edit / Delete content entries
- Filter by category and by month
- Live BDT preview while entering USD + rate
- KPI bar: total spend + breakdown by category

---

### MODULE 10: PAYMENTS

#### Purpose
Record and track payment transactions for COD collections, bKash confirmations, and bank transfers.

#### Features
- Payment record list with search
- Add payment manually (amount, method, order reference)
- Payment status tracking (pending / confirmed / failed / refunded)
- Link payment to order ID

---

### MODULE 11: REPORTS

#### Features
- **Sales by period** — daily / monthly totals
- **Top products** — by revenue and quantity sold
- **Revenue chart** — line/bar chart over time
- **Order status breakdown** — counts per status
- **Customer acquisition** — new customers per month
- **Production analytics** — cost vs revenue per batch (from batch data)

---

### MODULE 12: SETTINGS / CMS

#### Purpose
Control site-wide content and configuration without code changes.

#### Setting Categories

| Key | Purpose |
|---|---|
| `site_name` | Store name |
| `promo_bar_text` | Announcement bar message |
| `promo_bar_enabled` | Toggle promo bar |
| `promo_bulk_enabled` | Toggle bulk discount |
| `promo_bulk_qty` | Minimum qty for discount (default: 4) |
| `promo_bulk_percent` | Discount percentage (default: 15%) |
| `delivery_charge_dhaka` | Dhaka delivery fee (default: ৳60) |
| `delivery_charge_outside` | Outside Dhaka fee (default: ৳120) |
| `price_small` | Default small size price |
| `price_medium` | Default medium size price |
| `price_large` | Default large size price |
| `hero_title` | Homepage hero heading |
| `hero_subtitle` | Homepage hero subtext |
| `howto_step_1_img` | How-to section image URLs |
| `contact_phone` | Store phone |
| `contact_email` | Store email |

#### Storage Mechanism
Each setting = one row in `lc_settings`: `{ setting_key, setting_value }`  
Settings are cached client-side in `Settings._cache` to avoid repeated API calls.  
Cache invalidated on save via `Settings.invalidate()`.

---

### MODULE 13: ADMIN USERS

#### Features
- List all admin users
- Add new admin user
- Edit user (name, email, role, password, status)
- Deactivate user (sets `status = 'inactive'`)
- Delete user (with confirmation)
- Cannot delete yourself (session user ID check)

---

## PHASE 5 — DATA & PERMISSIONS MAPPING

### Table Access Matrix

| Table | Dashboard | Orders | Products | Inventory | Customers | Production | FB Ads | Content | Couriers | Payments | Reports | Settings | Users |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| lc_orders | R | RW | — | — | R | — | — | — | — | R | R | — | — |
| lc_products | R | — | RW | R | — | — | — | — | — | — | R | — | — |
| lc_customers | R | R | — | — | RW | — | — | — | — | — | R | — | — |
| lc_production_batches | R | — | — | — | — | RW | — | — | — | — | — | — | — |
| lc_fb_campaigns | R | — | — | — | — | — | RW | — | — | — | — | — | — |
| lc_content_budget | R | — | — | — | — | — | — | RW | — | — | — | — | — |
| lc_couriers | — | R | — | — | — | — | — | — | RW | — | — | — | — |
| lc_inventory | — | — | — | RW | — | — | — | — | — | — | — | — | — |
| lc_payments | — | — | — | — | — | — | — | — | — | RW | R | — | — |
| lc_settings | — | — | — | — | — | — | — | — | — | — | — | RW | — |
| lc_users | — | — | — | — | — | — | — | — | — | — | — | — | RW |

> R = Read, W = Write

### Cross-Module Data Flows

```
lc_production_batches
    └──→ Dashboard (avgUnitCost → COGS → Gross Profit)
    └──→ Production analytics tab

lc_fb_campaigns
    └──→ Dashboard (totalFbBDT → Net Profit)
    └──→ Facebook Ads section

lc_content_budget
    └──→ Dashboard (totalContentBDT → Net Profit)
    └──→ Content Budget section

lc_orders
    └──→ Dashboard (revenue, counts, recent orders)
    └──→ Orders section (full management)
    └──→ Customers (order history)
    └──→ Reports (analytics)
    └──→ Payments (payment records)

lc_couriers
    └──→ Orders (courier assignment, tracking)
    └──→ Checkout (delivery rate selection)

lc_settings
    └──→ Checkout (delivery charges, discount rules)
    └──→ Frontend store (prices, hero text, promo bar)
```

---

## PHASE 6 — AUTOMATION & SYSTEM ACTIONS

### Automatic Triggers

| Action | Trigger | Automated Behavior |
|---|---|---|
| Order number generation | New order created | `LC-{base36ts}-{4random}` assigned automatically |
| Status history log | Status changed | New entry appended to `status_history` array |
| Last login timestamp | Successful login | `last_login` field PATCH'd on `lc_users` |
| BDT conversion | FB campaign saved | `bdt_spent = usd_spent × exchange_rate` stored |
| Content cost preview | USD input changes | Live BDT preview updates via `oninput` |
| Cart badge | Any cart change | All `.cart-badge` elements updated |
| Settings cache | Settings loaded | Stored in `Settings._cache`, reused until `invalidate()` |
| Orders badge | Sidebar loads | New orders count fetched, badge shown/hidden |

### Calculated Fields (Never Stored, Always Computed)

| Metric | Formula | Where |
|---|---|---|
| Gross Profit | Revenue - COGS | Dashboard |
| Gross Margin % | Gross Profit / Revenue × 100 | Dashboard |
| Net Profit | Gross Profit - FB BDT - Content BDT | Dashboard |
| Net Margin % | Net Profit / Revenue × 100 | Dashboard |
| ROAS | Revenue / Ad Spend BDT | FB Campaigns |
| CPO | Ad Spend / Orders | FB Campaigns |
| Break-even Orders | Ad Cost / Profit per Order | FB Campaigns |
| Avg Unit Cost | Total Batch Cost / Total Units | Production |
| Profit Margin per Batch | (Revenue - Cost) / Revenue × 100 | Production |

---

## PHASE 7 — SECURITY FEATURES

### Current Security Mechanisms

| Layer | Mechanism | Strength |
|---|---|---|
| Page access | sessionStorage check on every load | Medium |
| Login | Username + password match in DB | Low (plain text) |
| Session lifetime | Lives until browser tab/session closes | Medium |
| Role separation | UI-level checks only | Low |
| Data isolation | API is shared (no per-project isolation shown) | Medium |
| Self-deletion protection | Cannot delete own user account | Medium |

### Known Vulnerabilities & Recommended Fixes

| Issue | Risk | Fix |
|---|---|---|
| Plain-text passwords | **HIGH** | Implement bcrypt hashing server-side |
| No session expiry | Medium | Add `loginTime` check (e.g. 8h expiry) |
| API not role-gated | Medium | Server-side role middleware |
| No CSRF protection | Medium | Add CSRF tokens on mutations |
| Passwords visible in API response | **HIGH** | Server should never return `password_hash` |

---

## PHASE 8 — ADVANCED FEATURES

### 8.1 Content Budget → Dashboard Integration
Every content entry with `status !== 'cancelled'` is summed and deducted from gross profit to produce net profit. Exchange rate per entry is respected individually.

### 8.2 Facebook Campaign Dual-Order Mode
Each campaign supports both `predicted_orders` (planning) and `actual_orders` (real). The P&L automatically uses actual if > 0, otherwise falls back to predicted. "Record Actual Orders" button allows updating after campaign ends.

### 8.3 Multi-Courier API Configuration
Each courier in the system has its own independent API configuration block. Type, credentials, store ID, and webhook URL are stored per courier. A test connection feature pings the API base URL. An integration guide provides step-by-step instructions for the 4 major Bangladesh couriers.

### 8.4 Exchange Rate Per Record
Both `lc_fb_campaigns` and `lc_content_budget` store their own exchange rate. This is intentional — rates fluctuate monthly. Historical records retain the rate that was current when the record was created.

### 8.5 Profit Waterfall Architecture
The dashboard computes a proper 4-level profit waterfall:
```
Level 1: Revenue (gross sales from delivered orders)
Level 2: Gross Profit = Revenue - Production COGS
Level 3: Operating Profit = Gross Profit - Marketing (FB) - Content
Level 4: Net Profit ≈ Operating Profit (delivery costs factored if available)
```

### 8.6 Missing Data Guards
If any cost category (production, FB, content) has no data, the dashboard shows a contextual info alert with a direct link to add the missing data. Margin percentages display as 0% rather than crashing.

### 8.7 Persistent Settings Cache
`Settings._cache` stores loaded settings in memory for the duration of the session. This prevents repeated API calls for frequently-read values like delivery charges and pricing. Cache is explicitly invalidated after any settings save.

### 8.8 Live Calculator (Non-Persisting)
Both Production and Facebook Marketing sections have a "Live Calculator" that performs full P&L calculations in real time without creating any database records. This is used for planning before committing to a batch or campaign.

---

## PHASE 9 — SECTION-BY-SECTION NAVIGATION MAP

```
admin.html
├── #dashboard     → AdminSections.dashboard()
├── #orders        → AdminSections.orders()
├── #products      → AdminSections.products()
├── #inventory     → AdminSections.inventory()
├── #customers     → AdminSections.customers()
├── #couriers      → AdminSections.couriers()
│       ├── Tab: list
│       ├── Tab: api
│       ├── Tab: rates
│       └── Tab: guide
├── #production    → AdminSections.production()
│       ├── Tab: batches
│       ├── Tab: calculator
│       └── Tab: analytics
├── #facebook      → AdminSections.facebook()
│       ├── Tab: campaigns
│       ├── Tab: calculator
│       ├── Tab: analytics
│       └── Tab: guide
├── #content       → AdminSections.content()
├── #payments      → AdminSections.payments()
├── #reports       → AdminSections.reports()
├── #settings      → AdminSections.settings()
└── #users         → AdminSections.users()
```

### URL Hash Navigation
Section changes update `window.location.hash` → allows browser back/forward  
On page load: reads hash and navigates to that section automatically

---

## PHASE 10 — GLOBAL UI HELPERS

### Modal System
```
openModal(title, bodyHtml, footerHtml)  → shows #globalModal
closeModal()                             → hides #globalModal
```
One global modal instance. Re-used for all add/edit forms.

### Confirm Dialog
```
showConfirm(title, message, callback)   → shows confirm box
closeConfirm()                           → hides it
```
Used for all destructive actions (delete operations).

### Toast Notifications
```
Toast.success(msg)   → green ✅
Toast.error(msg)     → red ❌
Toast.info(msg)      → blue ℹ️
Toast.warning(msg)   → yellow ⚠️
```
Auto-dismiss after 3.5 seconds. Stack in top-right corner.

### Format Helpers
```
Format.currency(n)   → "৳ 1,190"
Format.date(ts)      → "12 Apr 2025"
Format.datetime(ts)  → "12 Apr 2025, 10:30 AM"
Format.phone(p)      → <a href="tel:...">...</a>
```

---

*End of Admin Panel System Design Document*  
*Luggage Cover BD © 2025 | Designed for Bangladesh E-Commerce Operations*
