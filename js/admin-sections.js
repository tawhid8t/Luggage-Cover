/* ============================================================
   LUGGAGE COVER BD — Admin Panel Sections
   All CMS sections: Dashboard, Orders, Products, Inventory,
   Customers, Payments, Reports, Settings, Users
   ============================================================ */

const AdminSections = {};

// ============================================================
// DASHBOARD
// ============================================================
AdminSections.dashboard = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const [orders, products, customers, batches, fbCampaigns, contentBudget] = await Promise.all([
      API.getAll('lc_orders'),
      API.getAll('lc_products'),
      API.getAll('lc_customers'),
      API.getAll('lc_production_batches'),
      API.getAll('lc_fb_campaigns'),
      API.getAll('lc_content_budget')
    ]);

    const totalSales = orders.filter(o => o.order_status === 'delivered')
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.order_status === 'new').length;
    const deliveredOrders = orders.filter(o => o.order_status === 'delivered').length;
    const pendingOrders = orders.filter(o => ['new','confirmed','packing','packed'].includes(o.order_status)).length;
    const totalCustomers = customers.length;

    // ── Profit Calculation from production batches ─────────────
    // Aggregate unit costs across all completed batches
    let totalUnits = 0, totalCostAll = 0;
    batches.forEach(b => {
      const qty = (b.qty_small||0)+(b.qty_medium||0)+(b.qty_large||0)+(b.qty_xl||0);
      const cost = (b.fabric_cost||0)+(b.garments_bill||0)+(b.print_bill||0)+
                   (b.accessories_bill||0)+(b.transport_cost||0)+(b.packaging_cost||0)+(b.other_costs||0);
      totalUnits += qty;
      totalCostAll += cost;
    });
    const avgUnitCost = totalUnits > 0 ? totalCostAll / totalUnits : 0;

    // Revenue from delivered orders
    const deliveredRevenue = orders.filter(o => o.order_status === 'delivered')
      .reduce((s, o) => s + (o.total_amount || 0), 0);
    // Estimate COGS for delivered orders: sum items qty × avgUnitCost
    let deliveredQty = 0;
    orders.filter(o => o.order_status === 'delivered').forEach(o => {
      (o.items||[]).forEach(i => { deliveredQty += (i.qty||1); });
    });
    const estimatedCOGS = deliveredQty * avgUnitCost;
    const grossProfit = deliveredRevenue - estimatedCOGS;
    const profitMargin = deliveredRevenue > 0 ? ((grossProfit / deliveredRevenue) * 100).toFixed(1) : 0;

    // Avg profit per cover sold
    const avgProfitPerCover = deliveredQty > 0 ? Math.round(grossProfit / deliveredQty) : 0;

    // ── Facebook Ad Spend (active / non-cancelled campaigns) ──
    const activeFB = fbCampaigns.filter(c => c.status !== 'cancelled');
    const totalFBAdSpendBDT = activeFB.reduce((s, c) => {
      return s + ((c.usd_spent || 0) * (c.exchange_rate || 110));
    }, 0);

    // ── Content Budget (non-cancelled) ──
    const activeContent = contentBudget.filter(e => e.status !== 'cancelled');
    const totalContentSpend = activeContent.reduce((s, e) => {
      return s + ((e.amount_bdt > 0) ? e.amount_bdt : (e.amount_usd || 0) * (e.exchange_rate || 110));
    }, 0);

    // ── Net Profit (Gross − FB Ads − Content) ──
    const netProfit = grossProfit - totalFBAdSpendBDT - totalContentSpend;
    const netMargin = deliveredRevenue > 0 ? ((netProfit / deliveredRevenue) * 100).toFixed(1) : 0;

    // Per-size avg selling price
    const sizePrices = { small: [], medium: [], large: [] };
    orders.filter(o => o.order_status === 'delivered').forEach(o => {
      (o.items||[]).forEach(i => {
        if (sizePrices[i.size]) sizePrices[i.size].push(i.price||0);
      });
    });
    const avgSell = {
      small: sizePrices.small.length ? Math.round(sizePrices.small.reduce((a,b)=>a+b,0)/sizePrices.small.length) : 990,
      medium: sizePrices.medium.length ? Math.round(sizePrices.medium.reduce((a,b)=>a+b,0)/sizePrices.medium.length) : 1190,
      large: sizePrices.large.length ? Math.round(sizePrices.large.reduce((a,b)=>a+b,0)/sizePrices.large.length) : 1490
    };

    // Status counts for chart
    const statusCounts = {};
    orders.forEach(o => { statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1; });

    // Recent orders
    const recentOrders = [...orders]
      .sort((a,b) => (b.created_at||0) - (a.created_at||0))
      .slice(0, 8);

    // Low stock
    const lowStockProducts = products.filter(p =>
      p.status === 'active' && (p.stock_small < 5 || p.stock_medium < 5 || p.stock_large < 5)
    );

    const profitColor = grossProfit >= 0 ? '#27ae60' : '#e74c3c';
    const hasBatchData = batches.length > 0 && avgUnitCost > 0;

    el.innerHTML = `
      <!-- Stats Grid: 7 cards -->
      <div class="stats-grid" style="grid-template-columns:repeat(7,1fr)">
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#4A90E2,#7B68EE)">
            <span style="color:white;font-size:1.2rem;font-weight:900">৳</span>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">${Format.currency(totalSales)}</div>
            <div class="stat-change up">Delivered orders</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#27ae60,#1abc9c)">
            <i class="fas fa-chart-line" style="color:white"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Gross Profit</div>
            <div class="stat-value" style="color:${profitColor}">${Format.currency(Math.round(grossProfit))}</div>
            <div class="stat-change up">${profitMargin}% margin${!hasBatchData?' <span style=\'font-size:10px\'>(add batches)</span>':''}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#1877f2,#42a5f5)">
            <i class="fab fa-facebook" style="color:white;font-size:1.1rem"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">FB Ad Spend</div>
            <div class="stat-value" style="color:#1877f2">${Format.currency(Math.round(totalFBAdSpendBDT))}</div>
            <div class="stat-change up">${activeFB.length} campaign${activeFB.length!==1?'s':''}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#9b59b6,#7b68ee)">
            <i class="fas fa-photo-video" style="color:white"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Content Cost</div>
            <div class="stat-value" style="color:#9b59b6">${Format.currency(Math.round(totalContentSpend))}</div>
            <div class="stat-change up">${activeContent.length} entry${activeContent.length!==1?'s':''}</div>
          </div>
        </div>
        <div class="stat-card" style="border:2px solid ${netProfit>=0?'#27ae60':'#e74c3c'};box-shadow:0 0 12px rgba(${netProfit>=0?'39,174,96':'231,76,60'},.15)">
          <div class="stat-icon" style="background:linear-gradient(135deg,${netProfit>=0?'#27ae60,#1abc9c':'#e74c3c,#c0392b'})">
            <i class="fas fa-coins" style="color:white"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Net Profit</div>
            <div class="stat-value" style="color:${netProfit>=0?'#27ae60':'#e74c3c'}">${Format.currency(Math.round(netProfit))}</div>
            <div class="stat-change ${netProfit>=0?'up':'down'}">${netMargin}% net margin</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#40E0D0,#4A90E2)">
            <i class="fas fa-shopping-cart" style="color:white"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${totalOrders}</div>
            <div class="stat-change up">${newOrders} new</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:linear-gradient(135deg,#7B68EE,#9B59B6)">
            <i class="fas fa-check-double" style="color:white"></i>
          </div>
          <div class="stat-info">
            <div class="stat-label">Delivered</div>
            <div class="stat-value">${deliveredOrders}</div>
            <div class="stat-change up">${pendingOrders} pending</div>
          </div>
        </div>
      </div>

      <!-- Net Profit Waterfall Banner -->
      ${hasBatchData || totalFBAdSpendBDT > 0 || totalContentSpend > 0 ? `
      <div style="background:linear-gradient(135deg,#0f1224,#1a1f3a);border-radius:14px;padding:18px 24px;margin-bottom:20px;color:#fff">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.3rem">💰</span>
            <span style="font-weight:800;font-size:.95rem;letter-spacing:.5px;text-transform:uppercase">Net Profit Waterfall</span>
          </div>
          <a onclick="showSection('production')" style="color:#4A90E2;cursor:pointer;font-size:.8rem;font-weight:600;text-decoration:none;padding:4px 10px;border:1px solid #4A90E2;border-radius:6px">📦 Production</a>
          <a onclick="showSection('facebook')" style="color:#1877f2;cursor:pointer;font-size:.8rem;font-weight:600;text-decoration:none;padding:4px 10px;border:1px solid #1877f2;border-radius:6px">📣 Facebook Ads</a>
          <a onclick="showSection('content')" style="color:#9b59b6;cursor:pointer;font-size:.8rem;font-weight:600;text-decoration:none;padding:4px 10px;border:1px solid #9b59b6;border-radius:6px">🎬 Content</a>
        </div>
        <div style="display:flex;gap:6px;align-items:flex-end;flex-wrap:wrap">
          ${(() => {
            const items = [
              { label: 'Revenue', value: deliveredRevenue, color: '#27ae60', pos: true },
              { label: 'Production\nCOGS', value: -estimatedCOGS, color: '#e67e22', pos: false },
              { label: 'Gross\nProfit', value: grossProfit, color: profitColor, pos: grossProfit >= 0 },
              { label: 'FB Ad\nSpend', value: -totalFBAdSpendBDT, color: '#1877f2', pos: false },
              { label: 'Content\nCost', value: -totalContentSpend, color: '#9b59b6', pos: false },
              { label: 'Net\nProfit', value: netProfit, color: netProfit >= 0 ? '#27ae60' : '#e74c3c', pos: netProfit >= 0 }
            ];
            const max = Math.max(...items.map(i => Math.abs(i.value)), 1);
            return items.map(item => {
              const height = Math.max(12, Math.abs(item.value) / max * 80);
              const isNeg = item.value < 0;
              return `
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;min-width:80px">
                <div style="font-size:.75rem;color:rgba(255,255,255,.7);text-align:center;white-space:pre-line">${item.label}</div>
                <div style="width:52px;height:${height}px;background:${item.color};border-radius:6px 6px 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;opacity:.9;min-height:24px">
                  <span style="font-size:.68rem;font-weight:700;color:white;white-space:nowrap">${isNeg?'':'+'}${Format.currency(Math.round(item.value))}</span>
                </div>
              </div>`;
            }).join('');
          })()}
        </div>
      </div>` : `
      <div class="admin-alert admin-alert-info" style="margin-bottom:16px">
        <i class="fas fa-info-circle"></i>
        <div>No data yet. Add <a onclick="showSection('production')" style="color:var(--brand-blue);cursor:pointer;font-weight:600">production batches</a> and <a onclick="showSection('facebook')" style="color:var(--brand-blue);cursor:pointer;font-weight:600">Facebook campaigns</a> to see the full profit waterfall.</div>
      </div>`}

      <!-- Profit Breakdown Banner (per-size detail) -->
      ${hasBatchData ? `
      <div style="background:linear-gradient(135deg,#f0fff4,#e8f8f0);border:1px solid #b7e4c7;border-radius:12px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
        <div style="font-size:1.3rem">📊</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:.9rem;color:#155724;margin-bottom:4px">Profit Per Cover (Based on Production Data)</div>
          <div style="display:flex;gap:20px;flex-wrap:wrap;font-size:.82rem">
            <span>Avg Unit Cost: <strong style="color:#856404">৳${Math.round(avgUnitCost)}</strong></span>
            <span>|</span>
            <span>S (৳${avgSell.small}): <strong style="color:#27ae60">≈ ৳${avgSell.small - Math.round(avgUnitCost)} profit</strong></span>
            <span>M (৳${avgSell.medium}): <strong style="color:#27ae60">≈ ৳${avgSell.medium - Math.round(avgUnitCost)} profit</strong></span>
            <span>L (৳${avgSell.large}): <strong style="color:#27ae60">≈ ৳${avgSell.large - Math.round(avgUnitCost)} profit</strong></span>
          </div>
        </div>
        <div style="text-align:right;min-width:130px">
          <div style="font-size:.72rem;color:#6c757d">Avg profit / cover</div>
          <div style="font-size:1.5rem;font-weight:900;color:#27ae60">৳${avgProfitPerCover}</div>
        </div>
      </div>` : ''}

      <!-- Low Stock Alert -->
      ${lowStockProducts.length > 0 ? `
      <div class="admin-alert admin-alert-warning">
        <i class="fas fa-exclamation-triangle"></i>
        <div>
          <strong>Low Stock Alert!</strong>
          ${lowStockProducts.map(p => `${p.name} (${[p.stock_small<5?'S':'',p.stock_medium<5?'M':'',p.stock_large<5?'L':''].filter(Boolean).join(',')}) has low stock`).join(' · ')}
          <a onclick="showSection('inventory')" style="color:var(--brand-blue);cursor:pointer;margin-left:8px">Manage Inventory</a>
        </div>
      </div>
      ` : ''}

      <!-- Quick Actions -->
      <div class="quick-actions-grid" style="grid-template-columns:repeat(6,1fr)">
        <a class="quick-action-card" onclick="showSection('orders')">
          <div class="qa-icon" style="background:linear-gradient(135deg,#f0f4ff,#f5f0ff)"><i class="fas fa-shopping-cart" style="color:var(--brand-blue)"></i></div>
          <div class="qa-label">Orders</div>
        </a>
        <a class="quick-action-card" onclick="showSection('products');setTimeout(()=>document.getElementById('addProductBtn')?.click(),200)">
          <div class="qa-icon" style="background:linear-gradient(135deg,#f0fff4,#f0f9ff)"><i class="fas fa-plus-circle" style="color:var(--success)"></i></div>
          <div class="qa-label">Add Design</div>
        </a>
        <a class="quick-action-card" onclick="showSection('inventory')">
          <div class="qa-icon" style="background:linear-gradient(135deg,#fff8f0,#fff0f0)"><i class="fas fa-warehouse" style="color:#e67e22"></i></div>
          <div class="qa-label">Inventory</div>
        </a>
        <a class="quick-action-card" onclick="showSection('customers')">
          <div class="qa-icon" style="background:linear-gradient(135deg,#fff5f5,#fff0f0)"><i class="fas fa-users" style="color:#e74c3c"></i></div>
          <div class="qa-label">Customers (${totalCustomers})</div>
        </a>
        <a class="quick-action-card" onclick="showSection('facebook')">
          <div class="qa-icon" style="background:linear-gradient(135deg,#e8f0fe,#f0f4ff)"><i class="fab fa-facebook" style="color:#1877f2"></i></div>
          <div class="qa-label">FB Ads</div>
        </a>
        <a class="quick-action-card" onclick="showSection('reports')">
          <div class="qa-icon" style="background:linear-gradient(135deg,#f5f0ff,#f0f4ff)"><i class="fas fa-chart-bar" style="color:var(--brand-purple)"></i></div>
          <div class="qa-label">Reports</div>
        </a>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
        <!-- Order Status Chart -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title"><i class="fas fa-chart-pie"></i> Orders by Status</div>
          </div>
          <div class="admin-card-body padded" style="height:240px">
            <canvas id="statusChart"></canvas>
          </div>
        </div>

        <!-- Product Stock Overview -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title"><i class="fas fa-boxes"></i> Product Stock Overview</div>
          </div>
          <div class="admin-card-body" style="max-height:260px;overflow-y:auto">
            <table class="data-table">
              <thead><tr><th>Design</th><th>S</th><th>M</th><th>L</th></tr></thead>
              <tbody>
                ${products.filter(p=>p.status==='active').map(p=>`
                <tr>
                  <td><span class="cell-bold">${p.name}</span><br/><span class="cell-code">${p.code}</span></td>
                  <td><span class="${p.stock_small<5?'text-danger':'text-success'}">${p.stock_small||0}</span></td>
                  <td><span class="${p.stock_medium<5?'text-danger':'text-success'}">${p.stock_medium||0}</span></td>
                  <td><span class="${p.stock_large<5?'text-danger':'text-success'}">${p.stock_large||0}</span></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-clock"></i> Recent Orders</div>
          <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="showSection('orders')">View All</button>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                ${recentOrders.length === 0 ? `<tr><td colspan="8"><div class="empty-state" style="padding:32px"><div class="empty-state-icon">📦</div><p>No orders yet</p></div></td></tr>` :
                recentOrders.map(o => `
                <tr>
                  <td class="cell-bold">${o.order_number||o.id?.slice(0,8)}</td>
                  <td>${o.customer_name||'—'}<br/><small style="color:var(--admin-muted)">${o.customer_phone||''}</small></td>
                  <td>${(o.items||[]).length} item(s)</td>
                  <td class="cell-bold">${Format.currency(o.total_amount)}</td>
                  <td><span class="status-badge status-${o.payment_method||'cod'}">${Orders.PAYMENT_LABELS[o.payment_method]||o.payment_method}</span></td>
                  <td><span class="status-badge status-${o.order_status}">${Orders.STATUS_LABELS[o.order_status]?.label||o.order_status}</span></td>
                  <td>${Format.date(o.created_at)}</td>
                  <td><button class="admin-btn admin-btn-outline admin-btn-sm" onclick="viewOrderDetail('${o.id}')"><i class="fas fa-eye"></i></button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Draw chart
    const statusLabels = Object.keys(Orders.STATUS_LABELS);
    const statusData = statusLabels.map(s => statusCounts[s] || 0);
    const statusColors = ['#3498db','#9b59b6','#e67e22','#f39c12','#1abc9c','#27ae60','#e74c3c','#c0392b','#7f8c8d','#bdc3c7'];

    new Chart(document.getElementById('statusChart'), {
      type: 'doughnut',
      data: {
        labels: statusLabels.map(s => Orders.STATUS_LABELS[s].label),
        datasets: [{ data: statusData, backgroundColor: statusColors, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } } }
      }
    });

  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger"><i class="fas fa-times-circle"></i> Failed to load dashboard: ${e.message}</div>`;
  }
};

// ============================================================
// ORDERS MANAGEMENT
// ============================================================
AdminSections.orders = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const orders = await API.getAll('lc_orders');
    orders.sort((a,b) => (b.created_at||0) - (a.created_at||0));

    let filtered = [...orders];
    let statusFilter = 'all', searchVal = '';

    const render = () => {
      let rows = filtered;
      if (statusFilter !== 'all') rows = rows.filter(o => o.order_status === statusFilter);
      if (searchVal) rows = rows.filter(o =>
        (o.order_number||'').toLowerCase().includes(searchVal) ||
        (o.customer_name||'').toLowerCase().includes(searchVal) ||
        (o.customer_phone||'').includes(searchVal)
      );

      const tbody = document.getElementById('ordersTableBody');
      if (!tbody) return;
      tbody.innerHTML = rows.length === 0
        ? `<tr><td colspan="9"><div class="empty-state" style="padding:32px"><div class="empty-state-icon">📦</div><p>No orders found</p></div></td></tr>`
        : rows.map(o => `
          <tr>
            <td class="cell-bold">${o.order_number||o.id?.slice(0,8)}</td>
            <td>${o.customer_name||'—'}<br/><small style="color:var(--admin-muted)">${o.customer_phone||''}</small></td>
            <td>${(o.items||[]).length} item(s)<br/><small>${(o.items||[]).map(i=>i.productCode||'').slice(0,2).join(', ')}</small></td>
            <td class="cell-bold">${Format.currency(o.total_amount)}</td>
            <td><span class="status-badge status-${o.payment_method||'cod'}">${Orders.PAYMENT_LABELS[o.payment_method]||o.payment_method}</span><br/><span class="status-badge status-${o.payment_status}">${o.payment_status||'pending'}</span></td>
            <td><span class="status-badge status-${o.order_status}">${Orders.STATUS_LABELS[o.order_status]?.label||o.order_status}</span></td>
            <td>${Format.date(o.created_at)}</td>
            <td>${o.courier_name||'—'}<br/><small>${o.tracking_number||''}</small></td>
            <td>
              <div class="cell-actions">
                <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="viewOrderDetail('${o.id}')"><i class="fas fa-eye"></i></button>
                <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="changeOrderStatus('${o.id}','${o.order_status}')"><i class="fas fa-edit"></i></button>
              </div>
            </td>
          </tr>`).join('');
      document.getElementById('ordersCount').textContent = `${rows.length} order(s)`;
    };

    el.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-shopping-cart"></i> Orders Management <span id="ordersCount" class="status-badge status-active" style="margin-left:8px">${orders.length}</span></div>
          <div class="admin-card-actions">
            <div class="admin-search"><i class="fas fa-search"></i><input id="orderSearch" placeholder="Search order/customer…" oninput="document.querySelector('.orders-status-select').dispatchEvent(new Event('change'))"/></div>
            <select class="admin-select orders-status-select" onchange="document.getElementById('ordersTableBody')&&renderOrdersFilter()">
              <option value="all">All Status</option>
              ${Object.entries(Orders.STATUS_LABELS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Courier</th><th>Actions</th></tr></thead>
              <tbody id="ordersTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Store for filter
    window._ordersData = orders;

    window.renderOrdersFilter = () => {
      statusFilter = document.querySelector('.orders-status-select').value;
      searchVal = (document.getElementById('orderSearch').value||'').toLowerCase();
      render();
    };

    document.getElementById('orderSearch').addEventListener('input', window.renderOrdersFilter);
    document.querySelector('.orders-status-select').addEventListener('change', window.renderOrdersFilter);
    render();

  } catch(e) {
    document.getElementById('adminContent').innerHTML = `<div class="admin-alert admin-alert-danger">Error loading orders: ${e.message}</div>`;
  }
};

// View Order Detail
window.viewOrderDetail = async function(orderId) {
  try {
    const order = await API.getOne('lc_orders', orderId);
    const itemsHtml = (order.items||[]).map(i => `
      <tr>
        <td>${i.productName}</td>
        <td><span class="cell-code">${i.productCode}</span></td>
        <td>${i.size}</td>
        <td>${i.qty}</td>
        <td>${Format.currency(i.price)}</td>
        <td class="cell-bold">${Format.currency(i.total||i.price*i.qty)}</td>
      </tr>`).join('');

    const historyHtml = (order.status_history||[]).map(h => `
      <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--card-border)">
        <span class="status-badge status-${h.status}">${Orders.STATUS_LABELS[h.status]?.label||h.status}</span>
        <span style="font-size:.8rem;color:var(--admin-muted)">${Format.datetime(new Date(h.timestamp).getTime())}</span>
        ${h.note?`<span style="font-size:.8rem">${h.note}</span>`:''}
      </div>`).join('');

    openModal(`Order: ${order.order_number}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <div>
          <h4 style="margin-bottom:10px;font-size:.85rem;color:var(--admin-muted);text-transform:uppercase">Customer</h4>
          <p><strong>${order.customer_name}</strong></p>
          <p>${order.customer_phone}</p>
          <p>${order.customer_email||''}</p>
          <p>${order.shipping_address||''}, ${order.district||''}</p>
        </div>
        <div>
          <h4 style="margin-bottom:10px;font-size:.85rem;color:var(--admin-muted);text-transform:uppercase">Order Info</h4>
          <p>Status: <span class="status-badge status-${order.order_status}">${Orders.STATUS_LABELS[order.order_status]?.label||order.order_status}</span></p>
          <p>Payment: <span class="status-badge status-${order.payment_method}">${Orders.PAYMENT_LABELS[order.payment_method]||order.payment_method}</span></p>
          <p>Payment Status: <span class="status-badge status-${order.payment_status}">${order.payment_status}</span></p>
          <p>Courier: <strong>${order.courier_name||'—'}</strong></p>
          <p>Tracking: ${order.tracking_number ? `<a href="#" style="color:var(--brand-blue)">${order.tracking_number}</a>` : '—'}</p>
          ${order.order_notes?`<p style="color:var(--admin-muted);font-style:italic">📝 ${order.order_notes}</p>`:''}
        </div>
      </div>
      <table class="data-table" style="margin-bottom:20px">
        <thead><tr><th>Product</th><th>Code</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-bottom:20px">
        <div style="min-width:240px;background:#f8f9fc;border-radius:10px;padding:16px;border:1px solid #e8ecf5">
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.9rem"><span>Subtotal</span><strong>${Format.currency(order.subtotal)}</strong></div>
          ${order.discount_amount>0?`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.9rem;color:var(--success)"><span>Discount (15%)</span><strong>− ${Format.currency(order.discount_amount)}</strong></div>`:''}
          <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:.9rem"><span>Delivery Charge</span><strong>${Format.currency(order.delivery_charge)}</strong></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0 0;font-size:1.15rem;font-weight:900;border-top:2px solid #e8ecf5;margin-top:6px"><span>Grand Total</span><span style="color:var(--brand-blue)">${Format.currency(order.total_amount)}</span></div>
        </div>
      </div>
      <h4 style="margin-bottom:10px;font-size:.9rem">📋 Status Timeline</h4>
      ${historyHtml}
    `, `
      <button class="admin-btn admin-btn-outline" onclick="closeModal()">Close</button>
      <button class="admin-btn admin-btn-success" onclick="downloadInvoice('${orderId}')"><i class="fas fa-file-invoice"></i> Download Invoice</button>
      <button class="admin-btn admin-btn-primary" onclick="closeModal();changeOrderStatus('${orderId}','${order.order_status}')"><i class="fas fa-edit"></i> Update Status</button>
    `);
  } catch(e) { Toast.error('Failed to load order: ' + e.message); }
};

// Change Order Status
window.changeOrderStatus = async function(orderId, currentStatus) {
  const statuses = Object.keys(Orders.STATUS_LABELS);
  let couriers = [];
  try { couriers = await API.getAll('lc_couriers'); } catch {}
  const activeCouriers = couriers.filter(c => c.is_active);

  openModal('Update Order Status', `
    <div class="admin-form-group">
      <label class="admin-form-label">New Status</label>
      <select id="newStatusSelect" class="admin-input">
        ${statuses.map(s => `<option value="${s}" ${s===currentStatus?'selected':''}>${Orders.STATUS_LABELS[s].label}</option>`).join('')}
      </select>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label">Courier Service</label>
      <select id="courierNameInput" class="admin-input" onchange="document.getElementById('courierTrackHint').textContent=this.options[this.selectedIndex].dataset.track||''">
        <option value="">— Select Courier —</option>
        ${activeCouriers.map(c => `<option value="${c.name}" data-track="${c.tracking_url||''}">${c.logo_emoji||'📦'} ${c.name} (Dhaka ৳${c.dhaka_charge} / Outside ৳${c.outside_charge})</option>`).join('')}
        <option value="__custom__">✏️ Enter manually…</option>
      </select>
      <div id="courierTrackHint" style="font-size:11px;color:var(--admin-muted);margin-top:4px"></div>
    </div>
    <div class="admin-form-group" id="courierCustomWrap" style="display:none">
      <label class="admin-form-label">Custom Courier Name</label>
      <input type="text" id="courierCustomInput" class="admin-input" placeholder="e.g. SA Paribahan"/>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label">Tracking Number</label>
      <input type="text" id="trackingInput" class="admin-input" placeholder="Courier tracking #"/>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label">Note</label>
      <input type="text" id="statusNoteInput" class="admin-input" placeholder="Internal note (optional)"/>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" onclick="saveOrderStatus('${orderId}')"><i class="fas fa-save"></i> Save</button>
  `);

  // Wire custom courier toggle
  setTimeout(() => {
    const sel = document.getElementById('courierNameInput');
    if (sel) sel.addEventListener('change', () => {
      const wrap = document.getElementById('courierCustomWrap');
      if (wrap) wrap.style.display = sel.value === '__custom__' ? 'block' : 'none';
    });
  }, 100);
};

window.saveOrderStatus = async function(orderId) {
  const newStatus = document.getElementById('newStatusSelect').value;
  const note = document.getElementById('statusNoteInput').value;
  let courier = document.getElementById('courierNameInput').value;
  if (courier === '__custom__') courier = document.getElementById('courierCustomInput')?.value || '';
  const tracking = document.getElementById('trackingInput').value;
  try {
    await Orders.updateStatus(orderId, newStatus, note);
    if (courier || tracking) {
      await API.patch('lc_orders', orderId, { courier_name: courier, tracking_number: tracking });
    }
    Toast.success('Order status updated!');
    closeModal();
    AdminSections.orders();
    updateOrdersBadge();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

// ============================================================
// INVOICE GENERATOR — Professional Print/Download
// ============================================================
window.downloadInvoice = async function(orderId) {
  try {
    const order = await API.getOne('lc_orders', orderId);
    const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-BD', { year:'numeric', month:'long', day:'numeric' }) : new Date().toLocaleDateString();

    const itemRows = (order.items||[]).map((i,idx) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${idx+1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">
          <strong>${i.productName||'Luggage Cover'}</strong>
          <div style="font-size:11px;color:#888;margin-top:2px">Code: ${i.productCode||'—'}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-transform:capitalize">${i.size||'—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center">${i.qty||1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right">৳ ${Number(i.price||0).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:700">৳ ${Number((i.total||i.price*i.qty)||0).toLocaleString()}</td>
      </tr>`).join('');

    const statusLabel = Orders.STATUS_LABELS[order.order_status]?.label || order.order_status;
    const payLabel = Orders.PAYMENT_LABELS[order.payment_method] || order.payment_method;
    const invoiceNum = `INV-${(order.order_number||order.id||'').replace('LC-','').replace(/-/g,'').slice(0,10)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Invoice ${invoiceNum} — Luggage Cover BD</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a2e; font-size:14px; }
  .page { max-width:794px; margin:0 auto; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:36px; padding-bottom:24px; border-bottom:3px solid #4A90E2; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand-icon { font-size:2.5rem; }
  .brand-name { font-size:1.6rem; font-weight:900; color:#1a1f3a; letter-spacing:1px; line-height:1; }
  .brand-sub { font-size:.7rem; color:#4A90E2; letter-spacing:3px; font-weight:600; text-transform:uppercase; }
  .invoice-meta { text-align:right; }
  .invoice-title { font-size:2rem; font-weight:900; color:#4A90E2; letter-spacing:2px; text-transform:uppercase; }
  .invoice-num { font-size:.9rem; color:#666; margin-top:4px; }
  .invoice-date { font-size:.85rem; color:#666; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px; }
  .info-box { background:#f8f9fc; border-radius:10px; padding:18px; border-left:4px solid #4A90E2; }
  .info-box h4 { font-size:.75rem; font-weight:700; color:#4A90E2; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; }
  .info-box p { font-size:.88rem; line-height:1.7; color:#333; }
  .info-box strong { color:#1a1f3a; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead tr { background:linear-gradient(135deg,#4A90E2,#7B68EE); }
  thead th { padding:12px 12px; font-size:.8rem; font-weight:700; color:white; text-align:left; text-transform:uppercase; letter-spacing:.5px; }
  thead th:last-child, thead th:nth-child(5) { text-align:right; }
  thead th:nth-child(4) { text-align:center; }
  tbody tr:hover { background:#f8f9fc; }
  .totals { display:flex; justify-content:flex-end; margin-bottom:32px; }
  .totals-box { min-width:280px; }
  .total-row { display:flex; justify-content:space-between; padding:7px 0; font-size:.9rem; border-bottom:1px solid #f0f0f0; }
  .total-row.grand { font-size:1.15rem; font-weight:900; border-bottom:none; border-top:2px solid #4A90E2; margin-top:6px; padding-top:10px; color:#4A90E2; }
  .total-row.discount { color:#27ae60; }
  .status-row { display:flex; gap:12px; margin-bottom:28px; flex-wrap:wrap; }
  .status-pill { padding:5px 14px; border-radius:20px; font-size:.78rem; font-weight:700; letter-spacing:.3px; }
  .pill-blue { background:#e8f0fe; color:#4A90E2; }
  .pill-green { background:#e8f8f0; color:#27ae60; }
  .pill-orange { background:#fff3cd; color:#856404; }
  .footer { border-top:2px solid #f0f0f0; padding-top:20px; display:flex; justify-content:space-between; align-items:center; }
  .footer-brand { font-size:.8rem; color:#888; }
  .footer-note { font-size:.75rem; color:#aaa; text-align:right; max-width:300px; }
  .thank-you { text-align:center; margin-bottom:28px; background:linear-gradient(135deg,#f0f4ff,#f5f0ff); border-radius:10px; padding:20px; }
  .thank-you h2 { font-size:1.2rem; color:#4A90E2; font-weight:800; margin-bottom:4px; }
  .thank-you p { font-size:.85rem; color:#666; }
  .watermark { display:none; }
  @media print {
    body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
    .no-print { display:none !important; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Print / Download Button (hidden when printing) -->
  <div class="no-print" style="text-align:right;margin-bottom:20px">
    <button onclick="window.print()" style="background:linear-gradient(135deg,#4A90E2,#7B68EE);color:white;border:none;padding:10px 24px;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;margin-right:8px">
      🖨️ Print Invoice
    </button>
    <button onclick="window.close()" style="background:#f0f0f0;color:#333;border:none;padding:10px 20px;border-radius:8px;font-size:.9rem;cursor:pointer">
      ✕ Close
    </button>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <div class="brand-icon"><img src="/bg-removed.png" style="width:40px;height:40px;object-fit:contain"/></div>
      <div>
        <div class="brand-name">LUGGAGE COVER BD</div>
        <div class="brand-sub">Your Travel Buddy</div>
        <div style="font-size:.75rem;color:#888;margin-top:6px">
          📞 +01328-152066 / +01788-039222<br/>
          📧 luggagecover24@gmail.com<br/>
          📍 Dhaka, Bangladesh
        </div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-num"># ${invoiceNum}</div>
      <div class="invoice-date">Date: ${orderDate}</div>
      <div class="invoice-date">Order: ${order.order_number||'—'}</div>
    </div>
  </div>

  <!-- Customer & Order Info -->
  <div class="info-grid">
    <div class="info-box">
      <h4>Bill To</h4>
      <p>
        <strong>${order.customer_name||'—'}</strong><br/>
        ${order.customer_phone||''}<br/>
        ${order.customer_email ? order.customer_email+'<br/>' : ''}
        ${order.shipping_address||''}<br/>
        ${order.district ? '<strong>'+order.district+'</strong>' : ''}
      </p>
    </div>
    <div class="info-box">
      <h4>Order Details</h4>
      <p>
        <strong>Order #:</strong> ${order.order_number||'—'}<br/>
        <strong>Invoice #:</strong> ${invoiceNum}<br/>
        <strong>Date:</strong> ${orderDate}<br/>
        <strong>Payment:</strong> ${payLabel}<br/>
        ${order.courier_name ? '<strong>Courier:</strong> '+order.courier_name+'<br/>' : ''}
        ${order.tracking_number ? '<strong>Tracking:</strong> '+order.tracking_number : ''}
      </p>
    </div>
  </div>

  <!-- Order Status Pills -->
  <div class="status-row">
    <span class="status-pill pill-blue">📦 ${statusLabel}</span>
    <span class="status-pill pill-${order.payment_status==='paid'?'green':'orange'}">${order.payment_status==='paid'?'✅':'⏳'} Payment: ${order.payment_status||'pending'}</span>
    ${order.courier_name ? `<span class="status-pill pill-blue">🚚 ${order.courier_name}</span>` : ''}
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>Product</th>
        <th>Size</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><strong>৳ ${Number(order.subtotal||0).toLocaleString()}</strong></div>
      ${Number(order.discount_amount)>0 ? `<div class="total-row discount"><span>Discount (Bulk 15%)</span><strong>− ৳ ${Number(order.discount_amount).toLocaleString()}</strong></div>` : ''}
      <div class="total-row"><span>Delivery Charge</span><strong>৳ ${Number(order.delivery_charge||0).toLocaleString()}</strong></div>
      <div class="total-row grand"><span>Grand Total</span><span>৳ ${Number(order.total_amount||0).toLocaleString()}</span></div>
    </div>
  </div>

  <!-- Thank You -->
  <div class="thank-you">
    <h2>Thank You for Your Order!</h2>
    <p>We appreciate your business. For any questions, contact us at luggagecover24@gmail.com or +01328-152066.</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">
      <strong>LUGGAGE COVER BD</strong><br/>
      luggagecover24@gmail.com · +01328-152066<br/>
      Dhaka, Bangladesh
    </div>
    <div class="footer-note">
      This is a computer-generated invoice.<br/>
      7-day return policy applies. COD orders are final on delivery acceptance.<br/>
      © 2025 Luggage Cover BD
    </div>
  </div>

</div>
</body>
</html>`;

    // Open in new window and trigger print/save as PDF
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    win.document.write(html);
    win.document.close();
    win.focus();
    Toast.success('Invoice opened — use Print → Save as PDF to download!');
  } catch(e) { Toast.error('Invoice failed: ' + e.message); }
};

// ============================================================
// PRODUCTS & DESIGNS CMS
// ============================================================
AdminSections.products = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const products = await API.getAll('lc_products', { limit: 200 });
    products.sort((a,b) => (a.sort_order||99) - (b.sort_order||99));

    const render = (items) => {
      const tbody = document.getElementById('productsTableBody');
      if (!tbody) return;
      tbody.innerHTML = items.map(p => {
        const galleryCount = [p.image_url, p.gallery_1, p.gallery_2, p.gallery_3, p.gallery_4, p.gallery_5].filter(Boolean).length;
        return `
        <tr>
          <td>
            <div style="position:relative;display:inline-block">
              ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;display:block"/>` : `<div style="font-size:2.5rem;text-align:center">${Products.getEmoji(p)}</div>`}
              ${galleryCount > 1 ? `<span style="position:absolute;bottom:-4px;right:-4px;background:#4A90E2;color:white;font-size:9px;font-weight:700;padding:2px 5px;border-radius:8px">${galleryCount} imgs</span>` : ''}
            </div>
          </td>
          <td><div class="cell-bold">${p.name}</div><div class="cell-code" style="margin-top:4px">${p.code}</div></td>
          <td>৳${(p.price_small||990).toLocaleString()}</td>
          <td>৳${(p.price_medium||1190).toLocaleString()}</td>
          <td>৳${(p.price_large||1490).toLocaleString()}</td>
          <td>${p.stock_small||0} / ${p.stock_medium||0} / ${p.stock_large||0}</td>
          <td><span class="status-badge status-${p.status}">${p.status}</span></td>
          <td><span class="status-badge status-${p.featured?'active':'inactive'}">${p.featured?'Yes':'No'}</span></td>
          <td>
            <div class="cell-actions">
              <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
              <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteProduct('${p.id}','${p.name}')"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
      }).join('');
    };

    el.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-box-open"></i> Products & Designs (${products.length})</div>
          <div class="admin-card-actions">
            <div class="admin-search"><i class="fas fa-search"></i><input id="productSearch" placeholder="Search…" oninput="filterProducts()"/></div>
            <button id="addProductBtn" class="admin-btn admin-btn-primary" onclick="openProductForm(null)"><i class="fas fa-plus"></i> Add Design</button>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Image</th><th>Name / Code</th><th>S Price</th><th>M Price</th><th>L Price</th><th>Stock S/M/L</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead>
              <tbody id="productsTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    window._productsData = products;
    window.filterProducts = () => {
      const q = (document.getElementById('productSearch').value||'').toLowerCase();
      render(products.filter(p => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)));
    };
    render(products);

  } catch(e) {
    document.getElementById('adminContent').innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.openProductForm = function(productId) {
  const p = productId ? (window._productsData||[]).find(x => x.id === productId) : null;
  openModal(p ? `Edit: ${p.name}` : 'Add New Design', `
    <div class="admin-form-group"><label class="admin-form-label">Design Name *</label><input id="pf_name" class="admin-input" value="${p?.name||''}" placeholder="e.g. World Travel"/></div>
    <div class="admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Design Code *</label><input id="pf_code" class="admin-input" value="${p?.code||''}" placeholder="e.g. a1b23"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Sort Order</label><input type="number" id="pf_sort" class="admin-input" value="${p?.sort_order||1}"/></div>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Description</label><textarea id="pf_desc" class="admin-input admin-textarea">${p?.description||''}</textarea></div>
    <div class="admin-form-group"><label class="admin-form-label">Main Image URL (Image 1 of 6)</label><input id="pf_img" class="admin-input" value="${p?.image_url||''}" placeholder="https://…"/></div>
    <div style="background:#f8f9ff;border:1px solid #e1e5f5;border-radius:10px;padding:14px;margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:#4A90E2;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px"><i class="fas fa-images"></i> Gallery Images (Images 2–6)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="admin-form-group" style="margin-bottom:0"><label class="admin-form-label" style="font-size:11px">Image 2 URL</label><input id="pf_g1" class="admin-input" value="${p?.gallery_1||''}" placeholder="https://…"/></div>
        <div class="admin-form-group" style="margin-bottom:0"><label class="admin-form-label" style="font-size:11px">Image 3 URL</label><input id="pf_g2" class="admin-input" value="${p?.gallery_2||''}" placeholder="https://…"/></div>
        <div class="admin-form-group" style="margin-bottom:0"><label class="admin-form-label" style="font-size:11px">Image 4 URL</label><input id="pf_g3" class="admin-input" value="${p?.gallery_3||''}" placeholder="https://…"/></div>
        <div class="admin-form-group" style="margin-bottom:0"><label class="admin-form-label" style="font-size:11px">Image 5 URL</label><input id="pf_g4" class="admin-input" value="${p?.gallery_4||''}" placeholder="https://…"/></div>
        <div class="admin-form-group" style="margin-bottom:0;grid-column:span 2"><label class="admin-form-label" style="font-size:11px">Image 6 URL</label><input id="pf_g5" class="admin-input" value="${p?.gallery_5||''}" placeholder="https://…"/></div>
      </div>
      <div style="font-size:11px;color:#9fa8c7;margin-top:8px"><i class="fas fa-info-circle"></i> Paste direct image URLs (Cloudinary, Imgbb, Google Drive, etc.). Up to 6 total images per product.</div>
    </div>
    <div class="admin-form-row-3 admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Price — Small (tk)</label><input type="number" id="pf_ps" class="admin-input" value="${p?.price_small||990}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Price — Medium (tk)</label><input type="number" id="pf_pm" class="admin-input" value="${p?.price_medium||1190}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Price — Large (tk)</label><input type="number" id="pf_pl" class="admin-input" value="${p?.price_large||1490}"/></div>
    </div>
    <div class="admin-form-row-3 admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Stock — Small</label><input type="number" id="pf_ss" class="admin-input" value="${p?.stock_small||0}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Stock — Medium</label><input type="number" id="pf_sm" class="admin-input" value="${p?.stock_medium||0}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Stock — Large</label><input type="number" id="pf_sl" class="admin-input" value="${p?.stock_large||0}"/></div>
    </div>
    <div class="admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">SEO Title</label><input id="pf_seo_t" class="admin-input" value="${p?.seo_title||''}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">SEO Description</label><input id="pf_seo_d" class="admin-input" value="${p?.seo_description||''}"/></div>
    </div>
    <div style="display:flex;gap:20px">
      <label class="admin-toggle"><input type="checkbox" id="pf_active" ${p?.status==='active'||!p?'checked':''}/> Active (visible in store)</label>
      <label class="admin-toggle"><input type="checkbox" id="pf_featured" ${p?.featured?'checked':''}/> Featured on Homepage</label>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" onclick="saveProduct('${productId||''}')">
      <i class="fas fa-save"></i> ${p ? 'Save Changes' : 'Create Design'}
    </button>
  `);
};

window.saveProduct = async function(productId) {
  const data = {
    name: document.getElementById('pf_name').value.trim(),
    code: document.getElementById('pf_code').value.trim(),
    description: document.getElementById('pf_desc').value.trim(),
    image_url: document.getElementById('pf_img').value.trim(),
    gallery_1: document.getElementById('pf_g1').value.trim(),
    gallery_2: document.getElementById('pf_g2').value.trim(),
    gallery_3: document.getElementById('pf_g3').value.trim(),
    gallery_4: document.getElementById('pf_g4').value.trim(),
    gallery_5: document.getElementById('pf_g5').value.trim(),
    price_small: parseFloat(document.getElementById('pf_ps').value)||990,
    price_medium: parseFloat(document.getElementById('pf_pm').value)||1190,
    price_large: parseFloat(document.getElementById('pf_pl').value)||1490,
    stock_small: parseInt(document.getElementById('pf_ss').value)||0,
    stock_medium: parseInt(document.getElementById('pf_sm').value)||0,
    stock_large: parseInt(document.getElementById('pf_sl').value)||0,
    sort_order: parseInt(document.getElementById('pf_sort').value)||99,
    status: document.getElementById('pf_active').checked ? 'active' : 'inactive',
    featured: document.getElementById('pf_featured').checked,
    material: 'High-Quality Polyester + Spandex Blend',
    seo_title: document.getElementById('pf_seo_t').value.trim(),
    seo_description: document.getElementById('pf_seo_d').value.trim()
  };
  if (!data.name || !data.code) { Toast.error('Name and code are required.'); return; }
  try {
    if (productId) {
      await API.put('lc_products', productId, data);
      Toast.success(`${data.name} updated!`);
    } else {
      data.id = 'prod_' + data.code;
      await API.post('lc_products', data);
      Toast.success(`${data.name} created!`);
    }
    Products.invalidate();
    closeModal();
    AdminSections.products();
  } catch(e) { Toast.error('Save failed: ' + e.message); }
};

window.deleteProduct = function(id, name) {
  showConfirm('Delete Design', `Are you sure you want to delete <strong>${name}</strong>? This cannot be undone.`, async () => {
    try {
      await API.delete('lc_products', id);
      Products.invalidate();
      Toast.success(`${name} deleted.`);
      AdminSections.products();
    } catch(e) { Toast.error('Delete failed: ' + e.message); }
  });
};

window.editProduct = function(id) { openProductForm(id); };

// ============================================================
// INVENTORY MANAGEMENT
// ============================================================
AdminSections.inventory = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const [products, inventory] = await Promise.all([
      API.getAll('lc_products', { limit: 200 }),
      API.getAll('lc_inventory')
    ]);

    inventory.sort((a,b) => (b.created_at||0) - (a.created_at||0));

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
        <!-- Stock Overview -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title"><i class="fas fa-warehouse"></i> Current Stock</div>
            <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="openRestockForm()"><i class="fas fa-plus"></i> Restock</button>
          </div>
          <div class="admin-card-body">
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>Design</th><th>Code</th><th>Small</th><th>Medium</th><th>Large</th><th>Total</th></tr></thead>
                <tbody>
                  ${products.filter(p=>p.status==='active').map(p=>{
                    const total = (p.stock_small||0)+(p.stock_medium||0)+(p.stock_large||0);
                    return `<tr>
                      <td class="cell-bold">${p.name}</td>
                      <td class="cell-code">${p.code}</td>
                      <td><span class="${(p.stock_small||0)<5?'text-danger font-bold':''}">${p.stock_small||0}</span>${(p.stock_small||0)<5?'<span class="status-badge status-cancelled" style="margin-left:4px">Low</span>':''}</td>
                      <td><span class="${(p.stock_medium||0)<5?'text-danger font-bold':''}">${p.stock_medium||0}</span>${(p.stock_medium||0)<5?'<span class="status-badge status-cancelled" style="margin-left:4px">Low</span>':''}</td>
                      <td><span class="${(p.stock_large||0)<5?'text-danger font-bold':''}">${p.stock_large||0}</span>${(p.stock_large||0)<5?'<span class="status-badge status-cancelled" style="margin-left:4px">Low</span>':''}</td>
                      <td class="cell-bold">${total}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Stock Adjustment -->
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title"><i class="fas fa-sliders-h"></i> Quick Adjustment</div>
          </div>
          <div class="admin-card-body padded">
            <div class="admin-form-group">
              <label class="admin-form-label">Select Product</label>
              <select id="adjProduct" class="admin-input">
                <option value="">— Select design —</option>
                ${products.filter(p=>p.status==='active').map(p=>`<option value="${p.id}">${p.name} (${p.code})</option>`).join('')}
              </select>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Size</label>
                <select id="adjSize" class="admin-input">
                  <option value="small">Small (18"–20")</option>
                  <option value="medium">Medium (20"–24")</option>
                  <option value="large">Large (24"–28")</option>
                </select>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Type</label>
                <select id="adjType" class="admin-input">
                  <option value="restock">Restock (+)</option>
                  <option value="adjustment">Adjustment (±)</option>
                  <option value="damaged">Damaged (−)</option>
                  <option value="return">Return (+)</option>
                </select>
              </div>
            </div>
            <div class="admin-form-row">
              <div class="admin-form-group">
                <label class="admin-form-label">Quantity</label>
                <input type="number" id="adjQty" class="admin-input" value="1" min="1"/>
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Notes</label>
                <input type="text" id="adjNotes" class="admin-input" placeholder="Reason…"/>
              </div>
            </div>
            <button class="admin-btn admin-btn-primary w-full" onclick="saveAdjustment()">
              <i class="fas fa-save"></i> Save Adjustment
            </button>
          </div>
        </div>
      </div>

      <!-- Inventory Log -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-history"></i> Inventory Log</div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Date</th><th>Product</th><th>Code</th><th>Size</th><th>Type</th><th>Qty</th><th>Notes</th><th>Reference</th></tr></thead>
              <tbody>
                ${inventory.length === 0
                  ? `<tr><td colspan="8"><div class="empty-state" style="padding:32px"><p>No inventory transactions yet.</p></div></td></tr>`
                  : inventory.slice(0,50).map(t => `
                  <tr>
                    <td>${Format.date(t.created_at)}</td>
                    <td class="cell-bold">${t.product_name||'—'}</td>
                    <td class="cell-code">${t.product_code||'—'}</td>
                    <td style="text-transform:capitalize">${t.size||'—'}</td>
                    <td><span class="status-badge status-${t.transaction_type==='restock'||t.transaction_type==='return'?'active':'inactive'}">${t.transaction_type}</span></td>
                    <td class="${t.quantity>0?'text-success':'text-danger'} cell-bold">${t.quantity>0?'+':''}${t.quantity}</td>
                    <td>${t.notes||'—'}</td>
                    <td>${t.reference||'—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    window._invProducts = products;

  } catch(e) {
    document.getElementById('adminContent').innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.openRestockForm = function() {
  const products = window._invProducts || [];
  openModal('Restock Products', `
    <div class="admin-alert admin-alert-info"><i class="fas fa-info-circle"></i> Enter new stock levels for each size. Current stock will be replaced.</div>
    <div class="admin-form-group"><label class="admin-form-label">Select Design</label>
      <select id="rs_product" class="admin-input">
        ${products.filter(p=>p.status==='active').map(p=>`<option value="${p.id}" data-name="${p.name}" data-code="${p.code}">${p.name} (${p.code})</option>`).join('')}
      </select>
    </div>
    <div class="admin-form-row-3 admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Small Stock</label><input type="number" id="rs_small" class="admin-input" value="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Medium Stock</label><input type="number" id="rs_medium" class="admin-input" value="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Large Stock</label><input type="number" id="rs_large" class="admin-input" value="0"/></div>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Notes</label><input id="rs_notes" class="admin-input" placeholder="Supplier, batch info…"/></div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-success" onclick="saveRestock()"><i class="fas fa-save"></i> Save Restock</button>
  `);
};

window.saveRestock = async function() {
  const sel = document.getElementById('rs_product');
  const productId = sel.value;
  const productName = sel.options[sel.selectedIndex].dataset.name;
  const productCode = sel.options[sel.selectedIndex].dataset.code;
  const small = parseInt(document.getElementById('rs_small').value)||0;
  const medium = parseInt(document.getElementById('rs_medium').value)||0;
  const large = parseInt(document.getElementById('rs_large').value)||0;
  const notes = document.getElementById('rs_notes').value;
  try {
    await API.put('lc_products', productId, { stock_small: small, stock_medium: medium, stock_large: large });
    for (const [size, qty] of [['small',small],['medium',medium],['large',large]]) {
      if (qty > 0) {
        await API.post('lc_inventory', { product_id: productId, product_name: productName, product_code: productCode, size, transaction_type: 'restock', quantity: qty, notes });
      }
    }
    Products.invalidate();
    Toast.success(`${productName} restocked!`);
    closeModal();
    AdminSections.inventory();
  } catch(e) { Toast.error('Restock failed: ' + e.message); }
};

window.saveAdjustment = async function() {
  const productId = document.getElementById('adjProduct').value;
  if (!productId) { Toast.error('Please select a product.'); return; }
  const product = (window._invProducts||[]).find(p => p.id === productId);
  const size = document.getElementById('adjSize').value;
  const type = document.getElementById('adjType').value;
  const qty = parseInt(document.getElementById('adjQty').value)||1;
  const notes = document.getElementById('adjNotes').value;
  const isNeg = (type === 'damaged' || type === 'adjustment');
  const finalQty = isNeg ? -qty : qty;
  const stockKey = `stock_${size}`;
  const newStock = Math.max(0, (product[stockKey]||0) + finalQty);
  try {
    await API.patch('lc_products', productId, { [stockKey]: newStock });
    await API.post('lc_inventory', { product_id: productId, product_name: product.name, product_code: product.code, size, transaction_type: type, quantity: finalQty, notes });
    Products.invalidate();
    Toast.success('Inventory updated!');
    AdminSections.inventory();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

// ============================================================
// CUSTOMERS CRM
// ============================================================
AdminSections.customers = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const customers = await API.getAll('lc_customers');
    customers.sort((a,b) => (b.total_spent||0) - (a.total_spent||0));

    let filtered = [...customers];

    const render = () => {
      const q = (document.getElementById('custSearch')?.value||'').toLowerCase();
      const rows = q ? filtered.filter(c =>
        (c.name||'').toLowerCase().includes(q) ||
        (c.phone||'').includes(q) ||
        (c.email||'').toLowerCase().includes(q)
      ) : filtered;
      const tbody = document.getElementById('customersTableBody');
      if (!tbody) return;
      tbody.innerHTML = rows.length === 0
        ? `<tr><td colspan="8"><div class="empty-state" style="padding:32px"><div class="empty-state-icon">👤</div><p>No customers found.</p></div></td></tr>`
        : rows.map(c => `
          <tr>
            <td><div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:.8rem">${(c.name||'?')[0].toUpperCase()}</div></td>
            <td class="cell-bold">${c.name||'—'}</td>
            <td>${c.phone||'—'}</td>
            <td>${c.email||'—'}</td>
            <td>${c.district||'—'}</td>
            <td class="cell-bold">${c.total_orders||0}</td>
            <td class="cell-bold">${Format.currency(c.total_spent||0)}</td>
            <td>
              <div class="cell-actions">
                <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="viewCustomer('${c.id}')"><i class="fas fa-eye"></i></button>
                <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="editCustomer('${c.id}')"><i class="fas fa-edit"></i></button>
              </div>
            </td>
          </tr>`).join('');
    };

    el.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-users"></i> Customers CRM (${customers.length})</div>
          <div class="admin-card-actions">
            <div class="admin-search"><i class="fas fa-search"></i><input id="custSearch" placeholder="Search customer…" oninput="renderCustomers()"/></div>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th></th><th>Name</th><th>Phone</th><th>Email</th><th>District</th><th>Orders</th><th>Total Spent</th><th>Actions</th></tr></thead>
              <tbody id="customersTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    window._customersData = customers;
    window.renderCustomers = render;
    render();

  } catch(e) {
    document.getElementById('adminContent').innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.viewCustomer = async function(customerId) {
  const customer = (window._customersData||[]).find(c => c.id === customerId);
  if (!customer) return;
  let ordersHtml = 'Loading…';
  try {
    const allOrders = await API.getAll('lc_orders');
    const custOrders = allOrders.filter(o => o.customer_phone === customer.phone);
    ordersHtml = custOrders.length === 0 ? '<p>No orders found.</p>' : `
      <table class="data-table">
        <thead><tr><th>Order #</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          ${custOrders.map(o=>`<tr>
            <td class="cell-bold">${o.order_number||o.id?.slice(0,8)}</td>
            <td>${Format.currency(o.total_amount)}</td>
            <td><span class="status-badge status-${o.order_status}">${Orders.STATUS_LABELS[o.order_status]?.label||o.order_status}</span></td>
            <td>${Format.date(o.created_at)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`;
  } catch {}

  openModal(`Customer: ${customer.name}`, `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div>
        <h4 style="margin-bottom:12px">Contact Info</h4>
        <p><strong>Phone:</strong> ${customer.phone}</p>
        <p><strong>Email:</strong> ${customer.email||'—'}</p>
        <p><strong>Address:</strong> ${customer.address||'—'}</p>
        <p><strong>District:</strong> ${customer.district||'—'}</p>
      </div>
      <div>
        <h4 style="margin-bottom:12px">Summary</h4>
        <p><strong>Total Orders:</strong> ${customer.total_orders||0}</p>
        <p><strong>Total Spent:</strong> ${Format.currency(customer.total_spent||0)}</p>
        ${customer.tags&&customer.tags.length>0?`<p><strong>Tags:</strong> ${customer.tags.join(', ')}</p>`:''}
        ${customer.notes?`<p><strong>Notes:</strong> ${customer.notes}</p>`:''}
      </div>
    </div>
    <h4 style="margin-bottom:12px">Order History</h4>
    ${ordersHtml}
  `, `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Close</button>`);
};

window.editCustomer = function(customerId) {
  const c = (window._customersData||[]).find(x => x.id === customerId);
  if (!c) return;
  openModal(`Edit: ${c.name}`, `
    <div class="admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Name</label><input id="ec_name" class="admin-input" value="${c.name||''}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Phone</label><input id="ec_phone" class="admin-input" value="${c.phone||''}"/></div>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Email</label><input id="ec_email" class="admin-input" value="${c.email||''}"/></div>
    <div class="admin-form-group"><label class="admin-form-label">Address</label><textarea id="ec_address" class="admin-input admin-textarea">${c.address||''}</textarea></div>
    <div class="admin-form-group"><label class="admin-form-label">Notes (internal)</label><textarea id="ec_notes" class="admin-input admin-textarea">${c.notes||''}</textarea></div>
    <div class="admin-form-group"><label class="admin-form-label">Status</label>
      <select id="ec_status" class="admin-input"><option value="active" ${c.status==='active'?'selected':''}>Active</option><option value="blocked" ${c.status==='blocked'?'selected':''}>Blocked</option></select>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" onclick="saveCustomerEdit('${c.id}')">Save</button>
  `);
};

window.saveCustomerEdit = async function(id) {
  const data = {
    name: document.getElementById('ec_name').value.trim(),
    phone: document.getElementById('ec_phone').value.trim(),
    email: document.getElementById('ec_email').value.trim(),
    address: document.getElementById('ec_address').value.trim(),
    notes: document.getElementById('ec_notes').value.trim(),
    status: document.getElementById('ec_status').value
  };
  try {
    await API.patch('lc_customers', id, data);
    Toast.success('Customer updated!');
    closeModal();
    AdminSections.customers();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

// ============================================================
// PAYMENTS
// ============================================================
AdminSections.payments = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  try {
    const orders = await API.getAll('lc_orders');
    const codOrders = orders.filter(o => o.payment_method === 'cod');
    const onlineOrders = orders.filter(o => o.payment_method !== 'cod');
    const totalCOD = codOrders.reduce((s,o) => s + (o.total_amount||0), 0);
    const totalOnline = onlineOrders.reduce((s,o) => s + (o.total_amount||0), 0);
    const pendingPayment = orders.filter(o => o.payment_status === 'pending').length;

    el.innerHTML = `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#27ae60,#1abc9c)"><i class="fas fa-money-bill-wave" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">COD Orders</div><div class="stat-value">${codOrders.length}</div><div class="stat-change">${Format.currency(totalCOD)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#4A90E2,#7B68EE)"><i class="fas fa-mobile-alt" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Online Payments</div><div class="stat-value">${onlineOrders.length}</div><div class="stat-change">${Format.currency(totalOnline)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f39c12,#e67e22)"><i class="fas fa-clock" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Pending Payment</div><div class="stat-value">${pendingPayment}</div><div class="stat-change">Awaiting confirmation</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#2ecc71,#27ae60)"><i class="fas fa-check-double" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Total Revenue</div><div class="stat-value">${Format.currency(totalCOD+totalOnline)}</div><div class="stat-change">All time</div></div></div>
      </div>

      <div class="admin-card">
        <div class="admin-card-header"><div class="admin-card-title"><i class="fas fa-credit-card"></i> Payment Records</div>
          <div class="admin-card-actions">
            <select class="admin-select" id="paymentFilter" onchange="filterPayments()">
              <option value="all">All Methods</option><option value="cod">COD</option><option value="bkash">bKash</option><option value="nagad">Nagad</option>
            </select>
            <select class="admin-select" id="payStatusFilter" onchange="filterPayments()">
              <option value="all">All Payment Status</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Amount</th><th>Method</th><th>Payment Status</th><th>Reference</th><th>Date</th><th>Action</th></tr></thead>
              <tbody id="paymentsTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    window._paymentsOrders = orders;
    window.filterPayments = () => {
      const mf = document.getElementById('paymentFilter').value;
      const sf = document.getElementById('payStatusFilter').value;
      let rows = orders;
      if (mf !== 'all') rows = rows.filter(o => o.payment_method === mf);
      if (sf !== 'all') rows = rows.filter(o => o.payment_status === sf);
      const tbody = document.getElementById('paymentsTableBody');
      tbody.innerHTML = rows.map(o => `
        <tr>
          <td class="cell-bold">${o.order_number||o.id?.slice(0,8)}</td>
          <td>${o.customer_name||'—'}<br/><small>${o.customer_phone||''}</small></td>
          <td class="cell-bold">${Format.currency(o.total_amount)}</td>
          <td><span class="status-badge status-${o.payment_method}">${Orders.PAYMENT_LABELS[o.payment_method]||o.payment_method}</span></td>
          <td><span class="status-badge status-${o.payment_status||'pending'}">${o.payment_status||'pending'}</span></td>
          <td>${o.payment_reference||'—'}</td>
          <td>${Format.date(o.created_at)}</td>
          <td><button class="admin-btn admin-btn-outline admin-btn-sm" onclick="markPayment('${o.id}')"><i class="fas fa-check"></i> Mark Paid</button></td>
        </tr>`).join('');
    };
    window.filterPayments();
  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.markPayment = async function(orderId) {
  openModal('Update Payment Status', `
    <div class="admin-form-group"><label class="admin-form-label">Payment Status</label>
      <select id="mpStatus" class="admin-input"><option value="paid">Paid ✓</option><option value="pending">Pending</option><option value="refunded">Refunded</option><option value="failed">Failed</option></select>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Payment Reference (Transaction ID)</label>
      <input id="mpRef" class="admin-input" placeholder="bKash TrxID, etc."/>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-success" onclick="savePaymentStatus('${orderId}')">Save</button>
  `);
};

window.savePaymentStatus = async function(orderId) {
  const status = document.getElementById('mpStatus').value;
  const ref = document.getElementById('mpRef').value;
  try {
    await API.patch('lc_orders', orderId, { payment_status: status, payment_reference: ref });
    Toast.success('Payment status updated!');
    closeModal();
    AdminSections.payments();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

// ============================================================
// REPORTS
// ============================================================
AdminSections.reports = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const [orders, products] = await Promise.all([
      API.getAll('lc_orders'),
      API.getAll('lc_products', { limit: 200 })
    ]);

    // Sales by design code
    const salesByDesign = {};
    orders.forEach(o => {
      (o.items||[]).forEach(i => {
        if (!salesByDesign[i.productCode]) salesByDesign[i.productCode] = { name: i.productName, code: i.productCode, qty: 0, revenue: 0 };
        salesByDesign[i.productCode].qty += i.qty || 0;
        salesByDesign[i.productCode].revenue += i.total || (i.price * i.qty) || 0;
      });
    });
    const topDesigns = Object.values(salesByDesign).sort((a,b) => b.qty - a.qty);

    // Revenue overview
    const totalRevenue = orders.filter(o=>o.order_status==='delivered').reduce((s,o)=>s+(o.total_amount||0),0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscount = orders.reduce((s,o)=>s+(o.discount_amount||0),0);

    el.innerHTML = `
      <div class="stats-grid" style="margin-bottom:20px">
        <div class="stat-card"><div class="stat-icon" style="background:var(--gradient-primary)"><i class="fas fa-coins" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Total Revenue</div><div class="stat-value">${Format.currency(totalRevenue)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#27ae60,#1abc9c)"><i class="fas fa-shopping-cart" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Total Orders</div><div class="stat-value">${totalOrders}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#f39c12,#e67e22)"><i class="fas fa-calculator" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Avg. Order Value</div><div class="stat-value">${Format.currency(avgOrderValue)}</div></div></div>
        <div class="stat-card"><div class="stat-icon" style="background:linear-gradient(135deg,#e74c3c,#c0392b)"><i class="fas fa-tag" style="color:white"></i></div>
          <div class="stat-info"><div class="stat-label">Total Discounts</div><div class="stat-value">${Format.currency(totalDiscount)}</div></div></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="admin-card">
          <div class="admin-card-header"><div class="admin-card-title"><i class="fas fa-trophy"></i> Top Selling Designs</div></div>
          <div class="admin-card-body">
            <table class="data-table">
              <thead><tr><th>Rank</th><th>Design</th><th>Code</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                ${topDesigns.length === 0
                  ? `<tr><td colspan="5"><div class="empty-state" style="padding:24px"><p>No sales data yet.</p></div></td></tr>`
                  : topDesigns.map((d,i) => `
                  <tr>
                    <td>${i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}</td>
                    <td class="cell-bold">${d.name}</td>
                    <td class="cell-code">${d.code}</td>
                    <td class="cell-bold">${d.qty}</td>
                    <td class="cell-bold">${Format.currency(d.revenue)}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="admin-card">
          <div class="admin-card-header"><div class="admin-card-title"><i class="fas fa-chart-bar"></i> Orders by Status</div></div>
          <div class="admin-card-body padded" style="height:280px">
            <canvas id="reportsChart"></canvas>
          </div>
        </div>
      </div>

      <div class="admin-card" style="margin-top:20px">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-file-export"></i> Export Reports</div>
        </div>
        <div class="admin-card-body padded">
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="admin-btn admin-btn-primary" onclick="exportCSV('orders')"><i class="fas fa-download"></i> Export Orders CSV</button>
            <button class="admin-btn admin-btn-outline" onclick="exportCSV('customers')"><i class="fas fa-download"></i> Export Customers CSV</button>
            <button class="admin-btn admin-btn-outline" onclick="exportCSV('sales')"><i class="fas fa-download"></i> Export Sales Report</button>
          </div>
        </div>
      </div>
    `;

    // Chart
    const statusData = Object.entries(Orders.STATUS_LABELS).map(([k,v]) => ({
      label: v.label, count: orders.filter(o=>o.order_status===k).length
    })).filter(d => d.count > 0);
    const colors = ['#3498db','#9b59b6','#e67e22','#f39c12','#1abc9c','#27ae60','#e74c3c','#c0392b','#7f8c8d'];
    if (statusData.length > 0) {
      new Chart(document.getElementById('reportsChart'), {
        type: 'bar',
        data: {
          labels: statusData.map(d=>d.label),
          datasets: [{ label: 'Orders', data: statusData.map(d=>d.count), backgroundColor: colors.slice(0,statusData.length), borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
      });
    }

  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.exportCSV = async function(type) {
  Toast.info(`Preparing ${type} export…`);
  try {
    let rows = [], headers = [];
    if (type === 'orders') {
      const orders = await API.getAll('lc_orders');
      headers = ['Order #','Customer','Phone','Address','Items','Total','Discount','Delivery','Payment Method','Payment Status','Order Status','Date'];
      rows = orders.map(o => [
        o.order_number, o.customer_name, o.customer_phone, o.shipping_address,
        (o.items||[]).length, o.total_amount, o.discount_amount||0, o.delivery_charge||0,
        o.payment_method, o.payment_status, o.order_status, Format.date(o.created_at)
      ]);
    } else if (type === 'customers') {
      const customers = await API.getAll('lc_customers');
      headers = ['Name','Phone','Email','District','Address','Total Orders','Total Spent','Status'];
      rows = customers.map(c => [c.name,c.phone,c.email,c.district,c.address,c.total_orders||0,c.total_spent||0,c.status]);
    } else {
      Toast.info('Sales report export coming soon!'); return;
    }
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `${type}-${Date.now()}.csv`;
    a.click();
    Toast.success(`${type} exported!`);
  } catch(e) { Toast.error('Export failed: ' + e.message); }
};

// ============================================================
// SETTINGS CMS
// ============================================================
AdminSections.settings = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const res = await fetch('api/settings/all');
    const json = await res.json();
    const settings = json.data || [];
    const sm = {};
    settings.forEach(s => sm[s.key] = s);

    const groups = {
      store: { label: '🏪 Store Information', icon: 'fas fa-store' },
      promotion: { label: '🎁 Promotions & Discounts', icon: 'fas fa-tag' },
      shipping: { label: '🚚 Shipping & Delivery', icon: 'fas fa-truck' },
      payment: { label: '💳 Payment Methods', icon: 'fas fa-credit-card' },
      social: { label: '📱 Social Media', icon: 'fab fa-facebook' },
      seo: { label: '🔍 SEO & Meta', icon: 'fas fa-search' }
    };

    const groupedSettings = {};
    settings.forEach(s => {
      const grp = s.group || 'store';
      if (!groupedSettings[grp]) groupedSettings[grp] = [];
      groupedSettings[grp].push(s);
    });

    let groupHtml = '';
    for (const [gKey, gInfo] of Object.entries(groups)) {
      const gSettings = groupedSettings[gKey] || [];
      if (gSettings.length === 0) continue;
      groupHtml += `
        <div class="admin-card" style="margin-bottom:20px">
          <div class="admin-card-header">
            <div class="admin-card-title"><i class="${gInfo.icon}"></i> ${gInfo.label}</div>
            <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="saveSettingsGroup('${gKey}')"><i class="fas fa-save"></i> Save</button>
          </div>
          <div class="admin-card-body padded">
            <div class="admin-form-row">
              ${gSettings.map(s => `
                <div class="admin-form-group">
                  <label class="admin-form-label">${s.label || s.key}</label>
                  ${s.type === 'bool'
                    ? `<label class="admin-toggle"><input type="checkbox" id="setting_${s.key}" ${s.value===true||s.value==='true'?'checked':''}/> Enabled</label>`
                    : `<input type="${s.type==='number'?'number':'text'}" id="setting_${s.key}" class="admin-input" value="${s.value||''}"/>`
                  }
                  <div class="admin-form-hint">Key: <code>${s.key}</code></div>
                </div>`).join('')}
            </div>
          </div>
        </div>`;
    }

    // Homepage CMS section
    groupHtml += `
      <div class="admin-card" style="margin-bottom:20px">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-home"></i> 🏠 Homepage Content CMS</div>
          <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="saveSettingsGroup('homepage_cms')"><i class="fas fa-save"></i> Save All</button>
        </div>
        <div class="admin-card-body padded">
          <div class="admin-form-group"><label class="admin-form-label">Hero Headline</label><input id="setting_hero_headline" class="admin-input" value="${sm['hero_headline']?.setting_value||'Your Travel Buddy'}"/></div>
          <div class="admin-form-group"><label class="admin-form-label">Hero Subheadline</label><input id="setting_hero_subheadline" class="admin-input" value="${sm['hero_subheadline']?.setting_value||''}"/></div>

          <div style="border-top:1px solid var(--border-light);margin:20px 0;padding-top:20px">
            <div style="font-size:13px;font-weight:700;color:var(--brand-blue);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px">
              <i class="fas fa-camera"></i> How-to-Use Section — Step Images
            </div>
            <div style="background:#f0f4ff;border:1px solid #dde4f5;border-radius:10px;padding:14px;margin-bottom:14px;font-size:12px;color:#5a6080">
              <i class="fas fa-info-circle" style="color:#4A90E2"></i>
              <strong>How to add images:</strong> Upload your step photos to <a href="https://imgbb.com" target="_blank" style="color:#4A90E2">imgbb.com</a> (free), copy the "Direct link" URL, paste below.
              Recommended: 4:3 ratio, min 600×450px, showing the luggage cover being put on.
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="admin-form-group">
                <label class="admin-form-label">Step 1 — "Place on Top" Image URL</label>
                <input id="setting_howto_step1_img" class="admin-input" value="${sm['howto_step1_img']?.value||''}" placeholder="https://i.ibb.co/…/step1.jpg"/>
                ${sm['howto_step1_img']?.value ? `<div style="margin-top:8px"><img src="${sm['howto_step1_img'].value}" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #e1e5f5" onerror="this.style.display='none'"/></div>` : ''}
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Step 2 — "Pull Down" Image URL</label>
                <input id="setting_howto_step2_img" class="admin-input" value="${sm['howto_step2_img']?.value||''}" placeholder="https://i.ibb.co/…/step2.jpg"/>
                ${sm['howto_step2_img']?.value ? `<div style="margin-top:8px"><img src="${sm['howto_step2_img'].value}" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #e1e5f5" onerror="this.style.display='none'"/></div>` : ''}
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Step 3 — "Adjust Fit" Image URL</label>
                <input id="setting_howto_step3_img" class="admin-input" value="${sm['howto_step3_img']?.value||''}" placeholder="https://i.ibb.co/…/step3.jpg"/>
                ${sm['howto_step3_img']?.value ? `<div style="margin-top:8px"><img src="${sm['howto_step3_img'].value}" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #e1e5f5" onerror="this.style.display='none'"/></div>` : ''}
              </div>
              <div class="admin-form-group">
                <label class="admin-form-label">Step 4 — "Done!" Image URL</label>
                <input id="setting_howto_step4_img" class="admin-input" value="${sm['howto_step4_img']?.value||''}" placeholder="https://i.ibb.co/…/step4.jpg"/>
                ${sm['howto_step4_img']?.value ? `<div style="margin-top:8px"><img src="${sm['howto_step4_img'].value}" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;border:1px solid #e1e5f5" onerror="this.style.display='none'"/></div>` : ''}
              </div>
            </div>
            
            <div style="border-top:1px solid var(--border-light);margin:20px 0;padding-top:20px">
              <div style="font-size:13px;font-weight:700;color:var(--brand-blue);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px">
                <i class="fas fa-pencil-alt"></i> How-to-Use — Step Titles & Descriptions
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 1 Title</label>
                  <input id="setting_howto_step1_title" class="admin-input" value="${sm['howto_step1_title']?.value||'Place on Top'}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 1 Description</label>
                  <input id="setting_howto_step1_desc" class="admin-input" value="${sm['howto_step1_desc']?.value||''}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 2 Title</label>
                  <input id="setting_howto_step2_title" class="admin-input" value="${sm['howto_step2_title']?.value||'Pull Down'}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 2 Description</label>
                  <input id="setting_howto_step2_desc" class="admin-input" value="${sm['howto_step2_desc']?.value||''}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 3 Title</label>
                  <input id="setting_howto_step3_title" class="admin-input" value="${sm['howto_step3_title']?.value||'Adjust Fit'}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 3 Description</label>
                  <input id="setting_howto_step3_desc" class="admin-input" value="${sm['howto_step3_desc']?.value||''}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 4 Title</label>
                  <input id="setting_howto_step4_title" class="admin-input" value="${sm['howto_step4_title']?.value||'Done!'}"/>
                </div>
                <div class="admin-form-group">
                  <label class="admin-form-label">Step 4 Description</label>
                  <input id="setting_howto_step4_desc" class="admin-input" value="${sm['howto_step4_desc']?.value||''}"/>
                </div>
              </div>
            </div>

          </div>

          <div style="border-top:1px solid var(--border-light);margin:20px 0;padding-top:20px">
            <div style="font-size:13px;font-weight:700;color:var(--brand-blue);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.5px">
              <i class="fab fa-facebook"></i> Facebook Reviews Section
            </div>
            <div class="admin-form-group" style="margin-bottom:16px">
              <label class="admin-form-label">Total Reviews Count (e.g., "500+")</label>
              <input id="setting_fb_review_count" class="admin-input" value="${sm['fb_review_count']?.value||'500+'}"/>
            </div>
            <div class="admin-form-group" style="margin-bottom:16px">
              <label class="admin-form-label">Average Rating (e.g., "4.9")</label>
              <input id="setting_fb_rating" class="admin-input" value="${sm['fb_rating']?.value||'4.9'}"/>
            </div>
            
            ${[1,2,3,4,5,6].map(i => `
            <div style="background:#f8f9fc;border:1px solid #e9ecf2;border-radius:8px;padding:14px;margin-bottom:16px">
              <div style="font-weight:600;color:var(--brand-dark);margin-bottom:12px">Review ${i}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="admin-form-group"><label class="admin-form-label">Name</label><input id="setting_fb_review${i}_name" class="admin-input" value="${sm['fb_review'+i+'_name']?.value||''}"/></div>
                <div class="admin-form-group"><label class="admin-form-label">Location</label><input id="setting_fb_review${i}_location" class="admin-input" value="${sm['fb_review'+i+'_location']?.value||''}"/></div>
                <div class="admin-form-group"><label class="admin-form-label">Avatar Initials</label><input id="setting_fb_review${i}_avatar" class="admin-input" value="${sm['fb_review'+i+'_avatar']?.value||''}"/></div>
                <div class="admin-form-group"><label class="admin-form-label">Avatar Color</label><input id="setting_fb_review${i}_avatar_color" class="admin-input" value="${sm['fb_review'+i+'_avatar_color']?.value||''}"/></div>
                <div class="admin-form-group" style="grid-column:span 2"><label class="admin-form-label">Review Text</label><input id="setting_fb_review${i}_text" class="admin-input" value="${sm['fb_review'+i+'_text']?.value||''}"/></div>
                <div class="admin-form-group" style="grid-column:span 2"><label class="admin-form-label">Screenshot Image URL</label><input id="setting_fb_review${i}_screenshot" class="admin-input" value="${sm['fb_review'+i+'_screenshot']?.value||''}" placeholder="https://i.ibb.co/.../review${i}.jpg"/>
                  ${sm['fb_review'+i+'_screenshot']?.value ? `<div style="margin-top:6px"><img src="${sm['fb_review'+i+'_screenshot'].value}" style="height:60px;border-radius:4px;border:1px solid #ddd" onerror="this.style.display='none'"/></div>` : ''}
                </div>
                <div class="admin-form-group"><label class="admin-form-label">Product Tag</label><input id="setting_fb_review${i}_product" class="admin-input" value="${sm['fb_review'+i+'_product']?.value||''}"/></div>
                <div class="admin-form-group"><label class="admin-form-label">Date</label><input id="setting_fb_review${i}_date" class="admin-input" value="${sm['fb_review'+i+'_date']?.value||''}"/></div>
                <div class="admin-form-group"><label class="admin-form-label">Likes</label><input id="setting_fb_review${i}_likes" class="admin-input" value="${sm['fb_review'+i+'_likes']?.value||''}"/></div>
                <div class="admin-form-group"><label class="admin-form-label">Comments</label><input id="setting_fb_review${i}_comments" class="admin-input" value="${sm['fb_review'+i+'_comments']?.value||''}"/></div>
                <div class="admin-form-group" style="grid-column:span 2"><label class="admin-form-label">Facebook Post Content</label><input id="setting_fb_review${i}_content" class="admin-input" value="${sm['fb_review'+i+'_content']?.value||''}"/></div>
              </div>
            </div>
            `).join('')}
          </div>

          <div class="admin-alert admin-alert-info" style="margin-top:8px"><i class="fas fa-info-circle"></i> After saving, refresh the store homepage to see changes.</div>
        </div>
      </div>
    `;

    el.innerHTML = `
      <div class="admin-alert admin-alert-info"><i class="fas fa-info-circle"></i> All settings are saved to the database and reflect on the store immediately.</div>
      ${groupHtml}
    `;

    window._settingsData = settings;

  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.saveSettingsGroup = async function(group) {
  const settings = window._settingsData || [];
  // For homepage_cms, include all settings that have a matching input on screen
  const groupSettings = group === 'homepage_cms'
    ? settings  // we'll check by input element presence
    : settings.filter(s => (s.setting_group || s.group || 'store') === group);

  let saved = 0;
  try {
    // Get admin session for auth header
    const sessionStr = sessionStorage.getItem('lcbd_admin_session');
    const session = sessionStr ? JSON.parse(sessionStr) : null;
    const authHeader = session ? { 'Authorization': `Bearer ${session.userId}` } : {};

    for (const s of groupSettings) {
      const input = document.getElementById(`setting_${s.key}`);
      if (!input) continue;
      const newValue = input.type === 'checkbox' ? String(input.checked) : input.value.trim();
      if (newValue !== (String(s.value) || '')) {
        await fetch(`api/settings/${s.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ value: newValue })
        });
        s.value = newValue;
        saved++;
      }
    }
    // Also handle keys that might not exist yet (upsert for howto images)
    if (group === 'homepage_cms') {
      const extraKeys = [
        'howto_step1_img','howto_step2_img','howto_step3_img','howto_step4_img',
        'howto_step1_title','howto_step2_title','howto_step3_title','howto_step4_title',
        'howto_step1_desc','howto_step2_desc','howto_step3_desc','howto_step4_desc',
        'hero_headline','hero_subheadline',
        'fb_review_count','fb_rating'
      ];
      for (let i = 1; i <= 6; i++) {
        extraKeys.push(
          `fb_review${i}_name`,`fb_review${i}_location`,`fb_review${i}_avatar`,
          `fb_review${i}_avatar_color`,`fb_review${i}_text`,`fb_review${i}_screenshot`,
          `fb_review${i}_product`,`fb_review${i}_date`,`fb_review${i}_likes`,
          `fb_review${i}_comments`,`fb_review${i}_content`
        );
      }
      for (const key of extraKeys) {
        const input = document.getElementById(`setting_${key}`);
        if (!input) continue;
        const existing = settings.find(s => s.key === key);
        const newValue = input.value.trim();
        if (!existing) {
          // Create new setting row
          if (newValue) {
            await fetch(`api/settings/${key}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', ...authHeader },
              body: JSON.stringify({ value: newValue, label: key, group: 'store', type: 'text' })
            });
            saved++;
          }
        } else if (newValue !== (String(existing.value) || '')) {
          await fetch(`api/settings/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({ value: newValue })
          });
          existing.value = newValue;
          saved++;
        }
      }
    }
    Settings.invalidate();
    Toast.success(saved > 0 ? `${saved} setting(s) saved!` : 'No changes to save.');
  } catch(e) { Toast.error('Save failed: ' + e.message); }
};

// ============================================================
// COURIER MANAGEMENT — Bangladesh Local Couriers
// ============================================================
AdminSections.couriers = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const couriers = await API.getAll('lc_couriers');
    couriers.sort((a,b) => (a.is_default?0:1) - (b.is_default?0:1) || a.name.localeCompare(b.name));

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--brand-navy);margin-bottom:4px">
            <i class="fas fa-truck" style="color:var(--brand-blue)"></i> Courier Management
          </h2>
          <p style="font-size:13px;color:var(--admin-muted)">Manage Bangladesh courier services — rates, tracking, defaults</p>
        </div>
        <button class="admin-btn admin-btn-primary" onclick="openCourierForm(null)">
          <i class="fas fa-plus"></i> Add Courier
        </button>
      </div>

      <!-- Courier Cards Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;margin-bottom:24px" id="courierGrid">
        ${couriers.length === 0 ? `
          <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--admin-muted)">
            <div style="font-size:3rem;margin-bottom:12px">🚚</div>
            <h3>No couriers added yet</h3>
            <p>Click "Add Courier" to set up your delivery partners.</p>
          </div>` :
        couriers.map(c => `
          <div class="admin-card" style="border-top:4px solid ${c.is_active?'#27ae60':'#ccc'};position:relative">
            ${c.is_default ? `<div style="position:absolute;top:10px;right:10px;background:var(--gradient-primary);color:white;font-size:10px;font-weight:700;padding:3px 10px;border-radius:12px">DEFAULT</div>` : ''}
            <div class="admin-card-body padded">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <div style="font-size:2.2rem">${c.logo_emoji||'📦'}</div>
                <div>
                  <div style="font-weight:800;font-size:1rem;color:var(--brand-navy)">${c.name}</div>
                  <div style="font-size:.75rem;color:var(--admin-muted)">${c.phone||''}</div>
                </div>
                <div style="margin-left:auto">
                  <span style="background:${c.is_active?'#e8f8f0':'#f5f5f5'};color:${c.is_active?'#27ae60':'#999'};padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:700">
                    ${c.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
                <div style="background:#f8f9fc;border-radius:8px;padding:10px;text-align:center">
                  <div style="font-size:.7rem;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Dhaka</div>
                  <div style="font-weight:800;color:var(--brand-blue);font-size:1rem">৳ ${c.dhaka_charge||60}</div>
                  <div style="font-size:.7rem;color:var(--admin-muted)">${c.estimated_days_dhaka||'1-2 days'}</div>
                </div>
                <div style="background:#f8f9fc;border-radius:8px;padding:10px;text-align:center">
                  <div style="font-size:.7rem;color:var(--admin-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Outside Dhaka</div>
                  <div style="font-weight:800;color:var(--brand-blue);font-size:1rem">৳ ${c.outside_charge||120}</div>
                  <div style="font-size:.7rem;color:var(--admin-muted)">${c.estimated_days_outside||'3-5 days'}</div>
                </div>
              </div>

              ${c.tracking_url ? `<div style="font-size:.78rem;color:var(--admin-muted);margin-bottom:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><i class="fas fa-map-marker-alt" style="color:var(--brand-blue)"></i> <a href="${c.tracking_url}" target="_blank" style="color:var(--brand-blue)">${c.tracking_url}</a></div>` : ''}
              ${c.notes ? `<div style="font-size:.78rem;color:var(--admin-muted);margin-bottom:12px;font-style:italic">📝 ${c.notes}</div>` : ''}

              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="openCourierForm('${c.id}')"><i class="fas fa-edit"></i> Edit</button>
                ${!c.is_default ? `<button class="admin-btn admin-btn-success admin-btn-sm" onclick="setCourierDefault('${c.id}','${c.name}')"><i class="fas fa-star"></i> Set Default</button>` : ''}
                <button class="admin-btn admin-btn-sm" style="background:${c.is_active?'#fff3cd':'#e8f8f0'};color:${c.is_active?'#856404':'#27ae60'};border:1px solid ${c.is_active?'#ffc107':'#27ae60'}" onclick="toggleCourierStatus('${c.id}','${c.is_active}')">
                  ${c.is_active ? '<i class="fas fa-pause-circle"></i> Deactivate' : '<i class="fas fa-play-circle"></i> Activate'}
                </button>
                <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteCourier('${c.id}','${c.name}')"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>`).join('')}
      </div>

      <!-- Quick Reference Table -->
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-table"></i> Quick Rate Reference</div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Courier</th><th>Dhaka Rate</th><th>Outside Rate</th><th>Dhaka ETA</th><th>Outside ETA</th><th>Tracking</th><th>Status</th></tr></thead>
              <tbody>
                ${couriers.map(c => `
                <tr>
                  <td><strong>${c.logo_emoji||'📦'} ${c.name}</strong>${c.is_default?'<span style="background:var(--gradient-primary);color:white;font-size:9px;padding:2px 8px;border-radius:8px;margin-left:6px">DEFAULT</span>':''}</td>
                  <td><strong style="color:var(--brand-blue)">৳ ${c.dhaka_charge||60}</strong></td>
                  <td><strong style="color:var(--brand-blue)">৳ ${c.outside_charge||120}</strong></td>
                  <td>${c.estimated_days_dhaka||'—'}</td>
                  <td>${c.estimated_days_outside||'—'}</td>
                  <td>${c.tracking_url ? `<a href="${c.tracking_url}" target="_blank" style="color:var(--brand-blue);font-size:.8rem"><i class="fas fa-external-link-alt"></i> Track</a>` : '—'}</td>
                  <td><span class="status-badge status-${c.is_active?'active':'inactive'}">${c.is_active?'Active':'Inactive'}</span></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.openCourierForm = function(courierId) {
  const c = courierId ? null : null; // we'll fetch from a reload if needed
  const couriers = window._couriersData || [];
  const existing = courierId ? couriers.find(x => x.id === courierId) : null;

  openModal(existing ? `Edit: ${existing.name}` : 'Add New Courier', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="admin-form-group"><label class="admin-form-label">Courier Name *</label><input id="cf_name" class="admin-input" value="${existing?.name||''}" placeholder="e.g. Pathao Courier"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Short Code *</label><input id="cf_short" class="admin-input" value="${existing?.short_name||''}" placeholder="e.g. pathao"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Emoji Icon</label><input id="cf_emoji" class="admin-input" value="${existing?.logo_emoji||'📦'}" placeholder="📦"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Contact Phone</label><input id="cf_phone" class="admin-input" value="${existing?.phone||''}" placeholder="e.g. 16723"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Dhaka Charge (৳)</label><input type="number" id="cf_dhaka" class="admin-input" value="${existing?.dhaka_charge||60}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Outside Dhaka (৳)</label><input type="number" id="cf_outside" class="admin-input" value="${existing?.outside_charge||120}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">ETA — Dhaka</label><input id="cf_eta_d" class="admin-input" value="${existing?.estimated_days_dhaka||'1-2 days'}" placeholder="1-2 days"/></div>
      <div class="admin-form-group"><label class="admin-form-label">ETA — Outside</label><input id="cf_eta_o" class="admin-input" value="${existing?.estimated_days_outside||'3-5 days'}" placeholder="3-5 days"/></div>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Tracking URL (prefix)</label><input id="cf_track" class="admin-input" value="${existing?.tracking_url||''}" placeholder="https://courier.com/track/"/></div>
    <div class="admin-form-group"><label class="admin-form-label">Notes</label><input id="cf_notes" class="admin-input" value="${existing?.notes||''}" placeholder="Internal notes…"/></div>
    <div style="display:flex;gap:20px">
      <label class="admin-toggle"><input type="checkbox" id="cf_active" ${existing===null||existing?.is_active?'checked':''}/> Active</label>
      <label class="admin-toggle"><input type="checkbox" id="cf_default" ${existing?.is_default?'checked':''}/> Set as Default</label>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" onclick="saveCourier('${courierId||''}')"><i class="fas fa-save"></i> ${existing ? 'Save Changes' : 'Add Courier'}</button>
  `);
  // Store for the save function
  window._editingCourier = existing;
};

window.saveCourier = async function(courierId) {
  const name = document.getElementById('cf_name').value.trim();
  const short = document.getElementById('cf_short').value.trim().toLowerCase().replace(/\s+/g,'_');
  if (!name || !short) { Toast.error('Name and short code are required.'); return; }
  const data = {
    name, short_name: short,
    logo_emoji: document.getElementById('cf_emoji').value.trim() || '📦',
    phone: document.getElementById('cf_phone').value.trim(),
    dhaka_charge: parseFloat(document.getElementById('cf_dhaka').value)||60,
    outside_charge: parseFloat(document.getElementById('cf_outside').value)||120,
    estimated_days_dhaka: document.getElementById('cf_eta_d').value.trim(),
    estimated_days_outside: document.getElementById('cf_eta_o').value.trim(),
    tracking_url: document.getElementById('cf_track').value.trim(),
    notes: document.getElementById('cf_notes').value.trim(),
    is_active: document.getElementById('cf_active').checked,
    is_default: document.getElementById('cf_default').checked
  };
  try {
    if (courierId) {
      await API.put('lc_couriers', courierId, data);
      Toast.success(`${name} updated!`);
    } else {
      data.id = short;
      await API.post('lc_couriers', data);
      Toast.success(`${name} added!`);
    }
    closeModal();
    AdminSections.couriers();
  } catch(e) { Toast.error('Save failed: ' + e.message); }
};

window.setCourierDefault = async function(id, name) {
  try {
    // Unset all defaults first
    const all = await API.getAll('lc_couriers');
    for (const c of all) {
      if (c.is_default) await API.patch('lc_couriers', c.id, { is_default: false });
    }
    await API.patch('lc_couriers', id, { is_default: true });
    Toast.success(`${name} set as default courier!`);
    AdminSections.couriers();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

window.toggleCourierStatus = async function(id, currentActive) {
  const isActive = currentActive === 'true' || currentActive === true;
  try {
    await API.patch('lc_couriers', id, { is_active: !isActive });
    Toast.success(`Courier ${isActive ? 'deactivated' : 'activated'}!`);
    AdminSections.couriers();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

window.deleteCourier = function(id, name) {
  showConfirm('Delete Courier', `Remove <strong>${name}</strong> from your courier list?`, async () => {
    try {
      await API.delete('lc_couriers', id);
      Toast.success(`${name} removed!`);
      AdminSections.couriers();
    } catch(e) { Toast.error('Delete failed: ' + e.message); }
  });
};

// ============================================================
// ADMIN USERS
// ============================================================
AdminSections.users = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const users = await API.getAll('lc_users');
    const session = AdminAuth.getSession();

    el.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-user-shield"></i> Admin Users</div>
          <button class="admin-btn admin-btn-primary" onclick="openUserForm(null)"><i class="fas fa-plus"></i> Add User</button>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>User</th><th>Username</th><th>Role</th><th>Email</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                ${users.map(u => `
                <tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:.8rem">${(u.full_name||'?')[0].toUpperCase()}</div>
                    <strong>${u.full_name}</strong>
                  </div></td>
                  <td class="cell-code">${u.username}</td>
                  <td><span class="status-badge status-active">${u.role}</span></td>
                  <td>${u.email||'—'}</td>
                  <td><span class="status-badge status-${u.status}">${u.status}</span></td>
                  <td>${u.last_login?Format.datetime(new Date(u.last_login).getTime()):'Never'}</td>
                  <td>
                    <div class="cell-actions">
                      <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="openUserForm('${u.id}')"><i class="fas fa-edit"></i></button>
                      ${u.id !== session?.userId ? `<button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteUser('${u.id}','${u.username}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    window._usersData = users;

  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.openUserForm = function(userId) {
  const u = userId ? (window._usersData||[]).find(x => x.id === userId) : null;
  openModal(u ? `Edit: ${u.username}` : 'Add Admin User', `
    <div class="admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Full Name</label><input id="uf_name" class="admin-input" value="${u?.full_name||''}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Username</label><input id="uf_uname" class="admin-input" value="${u?.username||''}"/></div>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Password ${u?'(leave blank to keep current)':''}</label><input type="password" id="uf_pass" class="admin-input" placeholder="Password"/></div>
    <div class="admin-form-row">
      <div class="admin-form-group"><label class="admin-form-label">Role</label>
        <select id="uf_role" class="admin-input">
          ${['admin','manager','support','accountant'].map(r=>`<option value="${r}" ${u?.role===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div class="admin-form-group"><label class="admin-form-label">Email</label><input id="uf_email" class="admin-input" value="${u?.email||''}"/></div>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Status</label>
      <select id="uf_status" class="admin-input"><option value="active" ${u?.status==='active'||!u?'selected':''}>Active</option><option value="inactive" ${u?.status==='inactive'?'selected':''}>Inactive</option></select>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" onclick="saveUser('${userId||''}')"><i class="fas fa-save"></i> ${u?'Save Changes':'Create User'}</button>
  `);
};

window.saveUser = async function(userId) {
  const pass = document.getElementById('uf_pass').value;
  const data = {
    full_name: document.getElementById('uf_name').value.trim(),
    username: document.getElementById('uf_uname').value.trim(),
    role: document.getElementById('uf_role').value,
    email: document.getElementById('uf_email').value.trim(),
    status: document.getElementById('uf_status').value
  };
  if (pass) data.password_hash = pass;
  if (!data.full_name || !data.username) { Toast.error('Name and username are required.'); return; }
  try {
    if (userId) {
      await API.patch('lc_users', userId, data);
      Toast.success('User updated!');
    } else {
      if (!pass) { Toast.error('Password is required for new users.'); return; }
      await API.post('lc_users', { ...data, id: `user_${Date.now()}` });
      Toast.success('User created!');
    }
    closeModal();
    AdminSections.users();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

window.deleteUser = function(id, username) {
  showConfirm('Delete User', `Delete user <strong>${username}</strong>? This cannot be undone.`, async () => {
    try {
      await API.delete('lc_users', id);
      Toast.success(`User ${username} deleted.`);
      AdminSections.users();
    } catch(e) { Toast.error('Failed: ' + e.message); }
  });
};

// ============================================================
// CONTENT BUDGET TRACKER
// ============================================================
AdminSections.content = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const entries = await API.getAll('lc_content_budget');
    entries.sort((a,b) => (b.created_at||0) - (a.created_at||0));

    const categories = ['video','photo','graphic','copywriting','model','other'];
    const categoryLabels = {
      video: '🎬 Video', photo: '📷 Photo', graphic: '🎨 Graphic',
      copywriting: '✍️ Copywriting', model: '👤 Model', other: '📦 Other'
    };
    const platformLabels = {
      facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube',
      website: 'Website', all: 'All Platforms'
    };

    // Resolve effective BDT cost per entry
    const resolveCost = e => (e.amount_bdt > 0)
      ? e.amount_bdt
      : (e.amount_usd || 0) * (e.exchange_rate || 110);

    // Aggregate KPIs
    const activeEntries = entries.filter(e => e.status !== 'cancelled');
    const totalBDT = activeEntries.reduce((s,e) => s + resolveCost(e), 0);
    const byCategory = {};
    categories.forEach(c => {
      byCategory[c] = activeEntries
        .filter(e => e.category === c)
        .reduce((s,e) => s + resolveCost(e), 0);
    });
    const byStatus = {
      paid: activeEntries.filter(e => e.status === 'paid').reduce((s,e) => s + resolveCost(e), 0),
      pending: activeEntries.filter(e => e.status === 'pending').reduce((s,e) => s + resolveCost(e), 0)
    };

    let filtered = [...entries];
    let catFilter = 'all', monthFilter = '', statusFilter = 'all', searchVal = '';

    const allMonths = [...new Set(entries.map(e => e.month).filter(Boolean))].sort().reverse();

    const render = () => {
      let rows = filtered;
      if (catFilter !== 'all') rows = rows.filter(e => e.category === catFilter);
      if (monthFilter) rows = rows.filter(e => e.month === monthFilter);
      if (statusFilter !== 'all') rows = rows.filter(e => e.status === statusFilter);
      if (searchVal) rows = rows.filter(e =>
        (e.title||'').toLowerCase().includes(searchVal) ||
        (e.vendor_name||'').toLowerCase().includes(searchVal)
      );

      const tbody = document.getElementById('contentTableBody');
      if (!tbody) return;
      tbody.innerHTML = rows.length === 0
        ? `<tr><td colspan="8"><div class="empty-state" style="padding:32px"><div class="empty-state-icon">🎬</div><p>No content budget entries found</p></div></td></tr>`
        : rows.map(e => {
          const cost = resolveCost(e);
          const statusClass = e.status === 'paid' ? 'status-paid' : e.status === 'cancelled' ? 'status-cancelled' : 'status-pending';
          return `
          <tr>
            <td><span class="status-badge ${statusClass}">${e.status||'pending'}</span></td>
            <td class="cell-bold">${e.title||'—'}</td>
            <td><span class="status-badge" style="background:rgba(155,89,182,0.1);color:#9b59b6">${categoryLabels[e.category]||e.category||'—'}</span></td>
            <td>${e.month||'—'}</td>
            <td><span class="cell-code" style="background:rgba(74,144,226,0.08);color:var(--brand-blue)">${platformLabels[e.platform]||e.platform||'—'}</span></td>
            <td>${e.vendor_name||'—'}</td>
            <td class="cell-bold" style="color:var(--brand-blue)">${Format.currency(cost)}</td>
            <td>
              <div class="cell-actions">
                <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="editContentBudget('${e.id}')"><i class="fas fa-edit"></i></button>
                <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteContentBudget('${e.id}','${e.title}')"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
        }).join('');
      document.getElementById('contentCount').textContent = `${rows.length} entry(s)`;
      document.getElementById('contentTotal').textContent = Format.currency(rows.filter(e=>e.status!=='cancelled').reduce((s,e)=>s+resolveCost(e),0));
    };

    el.innerHTML = `
      <!-- Page Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--brand-navy);margin-bottom:4px">
            <i class="fas fa-photo-video" style="color:#9b59b6"></i> Content Budget Tracker
          </h2>
          <p style="font-size:13px;color:var(--admin-muted)">Track all content creation costs for net profit accuracy</p>
        </div>
        <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#9b59b6,#7b68ee);border-color:#9b59b6" onclick="openContentBudgetForm(null)">
          <i class="fas fa-plus"></i> Add Content Entry
        </button>
      </div>

      <!-- KPI Summary -->
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:24px">
        <div class="stat-card" style="padding:16px">
          <div style="font-size:1.8rem;font-weight:900;color:#9b59b6;text-align:center">${Format.currency(totalBDT)}</div>
          <div style="font-size:.72rem;color:var(--admin-muted);text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">Total Spend</div>
        </div>
        <div class="stat-card" style="padding:16px">
          <div style="font-size:1.8rem;font-weight:900;color:#9b59b6;text-align:center">${Format.currency(byCategory.video||0)}</div>
          <div style="font-size:.72rem;color:var(--admin-muted);text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">🎬 Video</div>
        </div>
        <div class="stat-card" style="padding:16px">
          <div style="font-size:1.8rem;font-weight:900;color:#9b59b6;text-align:center">${Format.currency(byCategory.photo||0)}</div>
          <div style="font-size:.72rem;color:var(--admin-muted);text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">📷 Photo</div>
        </div>
        <div class="stat-card" style="padding:16px">
          <div style="font-size:1.8rem;font-weight:900;color:#9b59b6;text-align:center">${Format.currency(byCategory.graphic||0)}</div>
          <div style="font-size:.72rem;color:var(--admin-muted);text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">🎨 Graphic</div>
        </div>
        <div class="stat-card" style="padding:16px">
          <div style="font-size:1.8rem;font-weight:900;color:#9b59b6;text-align:center">${Format.currency(byCategory.copywriting||0)}</div>
          <div style="font-size:.72rem;color:var(--admin-muted);text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">✍️ Copywriting</div>
        </div>
        <div class="stat-card" style="padding:16px">
          <div style="font-size:1.8rem;font-weight:900;color:#9b59b6;text-align:center">${Format.currency(byCategory.model||0)}</div>
          <div style="font-size:.72rem;color:var(--admin-muted);text-align:center;text-transform:uppercase;letter-spacing:.5px;margin-top:4px">👤 Model</div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="admin-card" style="margin-bottom:20px">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-filter" style="color:#9b59b6"></i> Content Entries <span id="contentCount" class="status-badge status-active" style="margin-left:8px">${entries.length}</span></div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div class="admin-search"><i class="fas fa-search"></i><input id="contentSearch" placeholder="Search title/vendor…" oninput="renderContentFilter()"/></div>
            <select class="admin-select" id="contentCatFilter" onchange="renderContentFilter()">
              <option value="all">All Categories</option>
              ${categories.map(c => `<option value="${c}">${categoryLabels[c]}</option>`).join('')}
            </select>
            <select class="admin-select" id="contentMonthFilter" onchange="renderContentFilter()">
              <option value="">All Months</option>
              ${allMonths.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
            <select class="admin-select" id="contentStatusFilter" onchange="renderContentFilter()">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div style="font-size:.85rem;color:var(--admin-muted);padding:0 8px">
              Total: <strong id="contentTotal" style="color:var(--brand-blue)">${Format.currency(totalBDT)}</strong>
            </div>
          </div>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Status</th><th>Title / Description</th><th>Category</th><th>Month</th><th>Platform</th><th>Vendor</th><th>Amount (BDT)</th><th>Actions</th></tr></thead>
              <tbody id="contentTableBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    window._contentData = entries;
    window.renderContentFilter = () => {
      catFilter = document.getElementById('contentCatFilter').value;
      monthFilter = document.getElementById('contentMonthFilter').value;
      statusFilter = document.getElementById('contentStatusFilter').value;
      searchVal = (document.getElementById('contentSearch').value||'').toLowerCase();
      render();
    };

    document.getElementById('contentSearch')?.addEventListener('input', window.renderContentFilter);
    render();

  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.openContentBudgetForm = function(entryId) {
  const e = entryId ? (window._contentData||[]).find(x => x.id === entryId) : null;
  const today = new Date().toISOString().slice(0,7);

  openModal(e ? `Edit: ${e.title}` : 'Add Content Budget Entry', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="admin-form-group" style="grid-column:1/-1">
        <label class="admin-form-label">Content Title / Description *</label>
        <input id="cb_title" class="admin-input" value="${e?.title||''}" placeholder="e.g. Eid campaign product video"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">Category</label>
        <select id="cb_category" class="admin-input">
          ${['video','photo','graphic','copywriting','model','other'].map(c =>
            `<option value="${c}" ${e?.category===c?'selected':''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">Month / Period</label>
        <input id="cb_month" type="month" class="admin-input" value="${e?.month||today}"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">Vendor / Freelancer Name</label>
        <input id="cb_vendor" class="admin-input" value="${e?.vendor_name||''}" placeholder="e.g. Studio XYZ"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">Platform</label>
        <select id="cb_platform" class="admin-input">
          ${['facebook','instagram','youtube','website','all'].map(p =>
            `<option value="${p}" ${e?.platform===p?'selected':''}>${p.charAt(0).toUpperCase()+p.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <hr style="margin:16px 0;border-color:#e1e5f5"/>

    <!-- Currency Section -->
    <div style="background:#f8f9ff;border:1.5px dashed #b8c4e8;border-radius:12px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:#9b59b6;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
        <i class="fas fa-money-bill-alt"></i> Cost Amount — Enter BDT or USD
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
        <div class="admin-form-group" style="margin-bottom:0">
          <label class="admin-form-label">Amount (BDT) — Primary</label>
          <input type="number" id="cb_bdt" class="admin-input" value="${e?.amount_bdt||''}" placeholder="e.g. 5000" min="0"/>
          <div class="admin-form-hint">Leave blank if paying in USD</div>
        </div>
        <div class="admin-form-group" style="margin-bottom:0">
          <label class="admin-form-label">OR Amount (USD)</label>
          <input type="number" id="cb_usd" class="admin-input" value="${e?.amount_usd||''}" placeholder="e.g. 50" min="0"/>
          <div class="admin-form-hint">Used if BDT is blank</div>
        </div>
      </div>
      <div class="admin-form-group" style="margin-bottom:0;max-width:300px">
        <label class="admin-form-label">Exchange Rate (if USD)</label>
        <input type="number" id="cb_rate" class="admin-input" value="${e?.exchange_rate||110}" placeholder="e.g. 110"/>
        <div class="admin-form-hint">1 USD = X BDT</div>
      </div>
      <div id="cb_preview" style="margin-top:10px;background:linear-gradient(135deg,#9b59b6,#7b68ee);color:white;border-radius:8px;padding:10px 14px;font-weight:700;font-size:.9rem;display:none">
        Effective Cost: <span id="cb_preview_val">৳0</span>
      </div>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">Payment Status</label>
      <select id="cb_status" class="admin-input">
        ${['paid','pending','cancelled'].map(s =>
          `<option value="${s}" ${e?.status===s||(!e&&s==='pending')?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
        ).join('')}
      </select>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label">Notes</label>
      <textarea id="cb_notes" class="admin-input admin-textarea" rows="2" placeholder="Additional notes…">${e?.notes||''}</textarea>
    </div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#9b59b6,#7b68ee);border-color:#9b59b6" onclick="saveContentBudget('${entryId||''}')">
      <i class="fas fa-save"></i> ${e?'Save Changes':'Add Entry'}
    </button>
  `);

  setTimeout(() => {
    const bdtEl = document.getElementById('cb_bdt');
    const usdEl = document.getElementById('cb_usd');
    const rateEl = document.getElementById('cb_rate');
    const preview = document.getElementById('cb_preview');
    const previewVal = document.getElementById('cb_preview_val');
    const calcPreview = () => {
      const bdt = parseFloat(bdtEl?.value) || 0;
      const usd = parseFloat(usdEl?.value) || 0;
      const rate = parseFloat(rateEl?.value) || 110;
      const effective = bdt > 0 ? bdt : usd * rate;
      if (effective > 0) {
        preview.style.display = 'block';
        previewVal.textContent = `৳${Math.round(effective).toLocaleString()}`;
      } else {
        preview.style.display = 'none';
      }
    };
    bdtEl?.addEventListener('input', calcPreview);
    usdEl?.addEventListener('input', calcPreview);
    rateEl?.addEventListener('input', calcPreview);
    calcPreview();
  }, 100);
};

window.saveContentBudget = async function(entryId) {
  const title = document.getElementById('cb_title').value.trim();
  if (!title) { Toast.error('Title is required.'); return; }
  const bdt = parseFloat(document.getElementById('cb_bdt').value) || 0;
  const usd = parseFloat(document.getElementById('cb_usd').value) || 0;
  const rate = parseFloat(document.getElementById('cb_rate').value) || 110;
  const effective = bdt > 0 ? bdt : usd * rate;

  const data = {
    title,
    category: document.getElementById('cb_category').value,
    month: document.getElementById('cb_month').value,
    vendor_name: document.getElementById('cb_vendor').value.trim(),
    platform: document.getElementById('cb_platform').value,
    amount_bdt: bdt || null,
    amount_usd: usd || null,
    exchange_rate: rate,
    effective_bdt: effective,
    status: document.getElementById('cb_status').value,
    notes: document.getElementById('cb_notes').value.trim()
  };

  try {
    if (entryId) {
      await API.put('lc_content_budget', entryId, data);
      Toast.success('Entry updated!');
    } else {
      data.id = 'cb_' + Date.now();
      await API.post('lc_content_budget', data);
      Toast.success('Entry added!');
    }
    closeModal();
    AdminSections.content();
  } catch(err) { Toast.error('Save failed: ' + err.message); }
};

window.editContentBudget = function(id) { openContentBudgetForm(id); };

window.deleteContentBudget = function(id, title) {
  showConfirm('Delete Entry', `Delete <strong>${title||'this entry'}</strong>?`, async () => {
    try {
      await API.delete('lc_content_budget', id);
      Toast.success('Entry deleted.');
      AdminSections.content();
    } catch(e) { Toast.error('Delete failed: ' + e.message); }
  });
};

// ============================================================
// REVIEWS
// ============================================================
AdminSections.reviews = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';
  try {
    const reviews = await API.getAll('lc_reviews');
    el.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title"><i class="fas fa-star"></i> Customer Reviews (${reviews.length})</div>
          <button class="admin-btn admin-btn-primary" onclick="openAddReviewForm()"><i class="fas fa-plus"></i> Add Review</button>
        </div>
        <div class="admin-card-body">
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>Customer</th><th>Rating</th><th>Review</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                ${reviews.length === 0
                  ? `<tr><td colspan="6"><div class="empty-state" style="padding:32px"><div class="empty-state-icon">⭐</div><p>No reviews yet.</p></div></td></tr>`
                  : reviews.map(r=>`
                  <tr>
                    <td class="cell-bold">${r.customer_name||'—'}</td>
                    <td>${'★'.repeat(r.rating||5)}${'☆'.repeat(5-(r.rating||5))}</td>
                    <td style="max-width:280px">${r.review_text||'—'}</td>
                    <td><span class="status-badge status-${r.status}">${r.status}</span></td>
                    <td>${Format.date(r.created_at)}</td>
                    <td>
                      <div class="cell-actions">
                        <button class="admin-btn admin-btn-success admin-btn-sm" onclick="approveReview('${r.id}')">Approve</button>
                        <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="deleteReview('${r.id}')"><i class="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  } catch(e) {
    el.innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

window.openAddReviewForm = function() {
  openModal('Add Customer Review', `
    <div class="admin-form-group"><label class="admin-form-label">Customer Name</label><input id="rv_name" class="admin-input" placeholder="Customer name"/></div>
    <div class="admin-form-group"><label class="admin-form-label">Rating (1–5)</label>
      <select id="rv_rating" class="admin-input"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select>
    </div>
    <div class="admin-form-group"><label class="admin-form-label">Review Text</label><textarea id="rv_text" class="admin-input admin-textarea" placeholder="Customer review…"></textarea></div>
  `, `
    <button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
    <button class="admin-btn admin-btn-primary" onclick="saveReview()">Add Review</button>
  `);
};

window.saveReview = async function() {
  const name = document.getElementById('rv_name').value.trim();
  const text = document.getElementById('rv_text').value.trim();
  if (!name || !text) { Toast.error('Name and review are required.'); return; }
  try {
    await API.post('lc_reviews', { customer_name: name, rating: parseInt(document.getElementById('rv_rating').value), review_text: text, status: 'approved' });
    Toast.success('Review added!');
    closeModal();
    AdminSections.reviews();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

window.approveReview = async function(id) {
  try { await API.patch('lc_reviews', id, { status: 'approved' }); Toast.success('Approved!'); AdminSections.reviews(); }
  catch(e) { Toast.error('Failed'); }
};

window.deleteReview = function(id) {
  showConfirm('Delete Review', 'Delete this review permanently?', async () => {
    try { await API.delete('lc_reviews', id); Toast.success('Deleted!'); AdminSections.reviews(); }
    catch(e) { Toast.error('Failed'); }
  });
};

// Helper styles
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .text-success { color: var(--success) !important; }
    .text-danger { color: var(--danger) !important; }
    .text-warning { color: var(--warning) !important; }
    .font-bold { font-weight: 700; }
    .w-full { width: 100%; }

    /* ── PRODUCTION MODULE STYLES ─────────────────────────────────────── */
    .prod-tabs { display:flex; gap:8px; margin-bottom:24px; border-bottom:2px solid #e1e5f5; padding-bottom:0; }
    .prod-tab  { padding:10px 20px; border:none; background:none; font-family:var(--font-main); font-size:14px; font-weight:600; color:var(--admin-muted); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:var(--transition); border-radius:6px 6px 0 0; }
    .prod-tab:hover { color:var(--brand-blue); background:rgba(74,144,226,0.05); }
    .prod-tab.active { color:var(--brand-blue); border-bottom-color:var(--brand-blue); background:rgba(74,144,226,0.06); }

    .prod-batch-card { background:#fff; border:1.5px solid #e1e5f5; border-radius:14px; overflow:hidden; margin-bottom:20px; transition:var(--transition); }
    .prod-batch-card:hover { border-color:var(--brand-blue); box-shadow:0 4px 20px rgba(74,144,226,0.12); }
    .prod-batch-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:linear-gradient(135deg,#f0f4ff,#f5f0ff); cursor:pointer; gap:12px; }
    .prod-batch-title { font-weight:700; font-size:15px; color:var(--brand-navy); }
    .prod-batch-date  { font-size:12px; color:var(--admin-muted); }
    .prod-batch-summary { display:flex; gap:20px; align-items:center; flex-wrap:wrap; }
    .prod-batch-kpi { text-align:center; }
    .prod-batch-kpi .kpi-val { font-weight:700; font-size:16px; color:var(--brand-blue); }
    .prod-batch-kpi .kpi-lbl { font-size:11px; color:var(--admin-muted); }
    .prod-batch-body { padding:20px; display:none; }
    .prod-batch-body.open { display:block; }

    .cost-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:12px; margin-bottom:20px; }
    .cost-item { background:#f8f9ff; border:1px solid #e1e5f5; border-radius:10px; padding:12px 14px; }
    .cost-item .ci-label { font-size:11px; color:var(--admin-muted); font-weight:600; text-transform:uppercase; letter-spacing:.03em; margin-bottom:4px; }
    .cost-item .ci-value { font-size:17px; font-weight:700; color:var(--brand-navy); }
    .cost-item.highlight { background:linear-gradient(135deg,#f0f4ff,#f5f0ff); border-color:var(--brand-blue); }
    .cost-item.highlight .ci-value { color:var(--brand-blue); }
    .cost-item.profit { background:linear-gradient(135deg,#f0fff4,#f0f9ff); border-color:var(--success); }
    .cost-item.profit .ci-value { color:var(--success); }
    .cost-item.danger  { background:linear-gradient(135deg,#fff5f5,#fff0f0); border-color:var(--danger); }
    .cost-item.danger  .ci-value { color:var(--danger); }

    .size-breakdown { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin:16px 0; }
    .size-card { background:#fff; border:1.5px solid #e1e5f5; border-radius:12px; padding:14px; text-align:center; }
    .size-card .sc-size { display:inline-flex; width:36px; height:36px; align-items:center; justify-content:center; border-radius:8px; font-weight:800; font-size:15px; color:#fff; background:var(--gradient-primary); margin-bottom:8px; }
    .size-card .sc-qty { font-size:22px; font-weight:700; color:var(--brand-navy); }
    .size-card .sc-label { font-size:11px; color:var(--admin-muted); margin-bottom:6px; }
    .size-card .sc-unit-cost { font-size:13px; font-weight:600; color:var(--brand-blue); }
    .size-card .sc-sell  { font-size:12px; color:var(--success); font-weight:600; }
    .size-card .sc-profit { font-size:12px; font-weight:600; }

    .profit-bar { height:8px; border-radius:4px; margin-top:8px; overflow:hidden; background:#e1e5f5; }
    .profit-bar-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#27ae60,#1abc9c); transition:width .6s ease; }

    .prod-calc-form { background:#f8f9ff; border:1.5px dashed #b8c4e8; border-radius:14px; padding:24px; margin-bottom:20px; }
    .prod-form-section { margin-bottom:20px; }
    .prod-form-section-title { font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:.05em; color:var(--brand-blue); margin-bottom:12px; display:flex; align-items:center; gap:6px; }
    .prod-form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
    .prod-form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .prod-input-group { display:flex; flex-direction:column; gap:4px; }
    .prod-input-group label { font-size:12px; font-weight:600; color:#4a5568; }
    .prod-input-group input, .prod-input-group textarea, .prod-input-group select { padding:9px 12px; border:1.5px solid #d1d9f0; border-radius:8px; font-size:14px; font-family:var(--font-main); background:#fff; transition:border-color .2s; outline:none; }
    .prod-input-group input:focus, .prod-input-group textarea:focus { border-color:var(--brand-blue); box-shadow:0 0 0 3px rgba(74,144,226,0.1); }
    .prod-input-group .taka { position:relative; }
    .prod-input-group .taka::before { content:'৳'; position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--admin-muted); font-size:14px; }
    .prod-input-group .taka input { padding-left:24px; }

    .live-calc-panel { background:linear-gradient(135deg,#0f1224,#1a1f3a); border-radius:14px; padding:20px; color:#fff; margin-top:20px; }
    .live-calc-panel h4 { color:#fff; font-weight:700; margin-bottom:16px; font-size:14px; letter-spacing:.05em; text-transform:uppercase; }
    .live-calc-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.08); font-size:13px; }
    .live-calc-row:last-child { border-bottom:none; }
    .live-calc-row .lcr-label { color:rgba(255,255,255,.6); }
    .live-calc-row .lcr-value { font-weight:700; color:#fff; }
    .live-calc-row.profit-row .lcr-value { color:#27ae60; }
    .live-calc-row.total-row { border-top:2px solid rgba(255,255,255,.2); margin-top:8px; padding-top:12px; }
    .live-calc-row.total-row .lcr-label { color:#fff; font-weight:700; font-size:14px; }
    .live-calc-row.total-row .lcr-value { color:#4A90E2; font-size:18px; }

    .prod-summary-bar { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:28px; }
    .prod-summary-stat { background:#fff; border:1.5px solid #e1e5f5; border-radius:14px; padding:18px 16px; text-align:center; }
    .prod-summary-stat .pss-value { font-size:22px; font-weight:800; color:var(--brand-blue); }
    .prod-summary-stat .pss-label { font-size:11px; color:var(--admin-muted); font-weight:600; text-transform:uppercase; margin-top:4px; }
    .prod-summary-stat.green .pss-value { color:var(--success); }
    .prod-summary-stat.orange .pss-value { color:#e67e22; }

    @media (max-width:768px) {
      .size-breakdown { grid-template-columns:repeat(2,1fr); }
      .prod-summary-bar { grid-template-columns:repeat(2,1fr); }
      .prod-form-grid { grid-template-columns:1fr 1fr; }
    }
  </style>
`);

// ============================================================
// PRODUCTION — Cost Tracking & Profit Calculator
// ============================================================
AdminSections.production = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const batches = await API.getAll('lc_production_batches');
    batches.sort((a,b) => (b.created_at||0) - (a.created_at||0));

    // ── aggregate totals across all batches ─────────────────────
    const allTotals = batches.reduce((acc, b) => {
      const totalCost = sumCosts(b);
      const totalQty  = (b.qty_small||0) + (b.qty_medium||0) + (b.qty_large||0) + (b.qty_xl||0);
      const revenue   = calcRevenue(b);
      acc.totalCost    += totalCost;
      acc.totalQty     += totalQty;
      acc.totalRevenue += revenue;
      return acc;
    }, { totalCost:0, totalQty:0, totalRevenue:0 });

    allTotals.grossProfit  = allTotals.totalRevenue - allTotals.totalCost;
    allTotals.margin       = allTotals.totalRevenue > 0
      ? ((allTotals.grossProfit / allTotals.totalRevenue) * 100).toFixed(1)
      : 0;
    allTotals.avgUnitCost  = allTotals.totalQty > 0
      ? (allTotals.totalCost / allTotals.totalQty).toFixed(0)
      : 0;

    el.innerHTML = `
      <!-- Page header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--brand-navy);margin-bottom:4px">
            <i class="fas fa-industry" style="color:var(--brand-blue)"></i> Production Management
          </h2>
          <p style="font-size:13px;color:var(--admin-muted)">Track production batches, material costs, unit cost & profit per batch</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="AdminSections.production()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button class="admin-btn admin-btn-primary" onclick="openNewBatchForm()">
            <i class="fas fa-plus"></i> New Production Batch
          </button>
        </div>
      </div>

      <!-- Summary KPI bar -->
      <div class="prod-summary-bar">
        <div class="prod-summary-stat">
          <div class="pss-value">${batches.length}</div>
          <div class="pss-label">Total Batches</div>
        </div>
        <div class="prod-summary-stat">
          <div class="pss-value">${allTotals.totalQty}</div>
          <div class="pss-label">Total Units Made</div>
        </div>
        <div class="prod-summary-stat orange">
          <div class="pss-value">${Format.currency(allTotals.totalCost)}</div>
          <div class="pss-label">Total Expenses</div>
        </div>
        <div class="prod-summary-stat green">
          <div class="pss-value">${Format.currency(allTotals.grossProfit)}</div>
          <div class="pss-label">Gross Profit</div>
        </div>
        <div class="prod-summary-stat">
          <div class="pss-value">${allTotals.margin}%</div>
          <div class="pss-label">Avg Margin</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="prod-tabs">
        <button class="prod-tab active" onclick="switchProdTab('batches',this)">
          <i class="fas fa-boxes"></i> Production Batches
        </button>
        <button class="prod-tab" onclick="switchProdTab('calculator',this)">
          <i class="fas fa-calculator"></i> Quick Calculator
        </button>
        <button class="prod-tab" onclick="switchProdTab('analytics',this)">
          <i class="fas fa-chart-bar"></i> Analytics
        </button>
      </div>

      <!-- TAB: Batches -->
      <div id="prodTab-batches">
        ${batches.length === 0 ? `
          <div class="admin-card" style="text-align:center;padding:60px 40px">
            <div style="font-size:56px;margin-bottom:16px">🏭</div>
            <h3 style="color:var(--brand-navy);margin-bottom:8px">No production batches yet</h3>
            <p style="color:var(--admin-muted);margin-bottom:24px">Record your first production batch to start tracking costs and profits.</p>
            <button class="admin-btn admin-btn-primary" onclick="openNewBatchForm()">
              <i class="fas fa-plus"></i> Record First Batch
            </button>
          </div>
        ` : batches.map(b => renderBatchCard(b)).join('')}
      </div>

      <!-- TAB: Quick Calculator (hidden) -->
      <div id="prodTab-calculator" style="display:none">
        ${renderQuickCalculator()}
      </div>

      <!-- TAB: Analytics (hidden) -->
      <div id="prodTab-analytics" style="display:none">
        ${renderAnalytics(batches)}
      </div>
    `;

    // Wire up quick calculator live update
    wireCalculator();

  } catch(e) {
    document.getElementById('adminContent').innerHTML = `
      <div class="admin-alert admin-alert-danger">
        <i class="fas fa-times-circle"></i> Error loading production data: ${e.message}
      </div>`;
  }
};

/* ── helpers ──────────────────────────────────────────────────────────── */
function sumCosts(b) {
  return (b.fabric_cost||0) + (b.garments_bill||0) + (b.print_bill||0)
       + (b.accessories_bill||0) + (b.transport_cost||0)
       + (b.packaging_cost||0) + (b.other_costs||0);
}

function calcRevenue(b) {
  return (b.qty_small||0)  * (b.sell_price_small||990)
       + (b.qty_medium||0) * (b.sell_price_medium||1190)
       + (b.qty_large||0)  * (b.sell_price_large||1490)
       + (b.qty_xl||0)     * (b.sell_price_xl||1690);
}

function calcUnitCost(totalCost, totalQty) {
  return totalQty > 0 ? totalCost / totalQty : 0;
}

/* ── Batch Card renderer ─────────────────────────────────────────────── */
function renderBatchCard(b) {
  const totalCost   = sumCosts(b);
  const totalQty    = (b.qty_small||0) + (b.qty_medium||0) + (b.qty_large||0) + (b.qty_xl||0);
  const unitCost    = calcUnitCost(totalCost, totalQty);
  const revenue     = calcRevenue(b);
  const grossProfit = revenue - totalCost;
  const margin      = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
  const statusMap   = { planning:'#f39c12', in_production:'#3498db', completed:'#27ae60' };
  const statusColor = statusMap[b.status] || '#9fa8c7';
  const bDate       = b.batch_date ? new Date(b.batch_date).toLocaleDateString('en-BD',{year:'numeric',month:'short',day:'numeric'}) : '—';

  // Per-size unit costs (proportional allocation)
  const sizeData = [
    { key:'small', label:'S', qty:b.qty_small||0, price:b.sell_price_small||990 },
    { key:'medium',label:'M', qty:b.qty_medium||0,price:b.sell_price_medium||1190 },
    { key:'large', label:'L', qty:b.qty_large||0, price:b.sell_price_large||1490 },
    { key:'xl',    label:'XL',qty:b.qty_xl||0,    price:b.sell_price_xl||1690 },
  ].filter(s => s.qty > 0);

  return `
  <div class="prod-batch-card">
    <!-- Header (click to expand) -->
    <div class="prod-batch-header" onclick="toggleBatch('batch-${b.id}')">
      <div style="flex:1">
        <div class="prod-batch-title">
          <i class="fas fa-layer-group" style="color:var(--brand-blue);margin-right:8px"></i>
          ${b.batch_name}
          <span style="font-size:11px;font-weight:600;color:${statusColor};background:${statusColor}22;padding:2px 8px;border-radius:20px;margin-left:8px;text-transform:uppercase">
            ${b.status||'—'}
          </span>
        </div>
        <div class="prod-batch-date">
          <i class="fas fa-calendar-alt" style="margin-right:4px"></i>${bDate}
          ${b.design_codes ? `&nbsp;·&nbsp;<i class="fas fa-palette" style="margin-right:4px"></i>${b.design_codes}` : ''}
        </div>
      </div>
      <div class="prod-batch-summary">
        <div class="prod-batch-kpi">
          <div class="kpi-val">${totalQty}</div>
          <div class="kpi-lbl">Units</div>
        </div>
        <div class="prod-batch-kpi">
          <div class="kpi-val">${Format.currency(totalCost)}</div>
          <div class="kpi-lbl">Total Cost</div>
        </div>
        <div class="prod-batch-kpi" style="color:var(--success)">
          <div class="kpi-val" style="color:var(--success)">${Format.currency(grossProfit)}</div>
          <div class="kpi-lbl">Gross Profit</div>
        </div>
        <div class="prod-batch-kpi">
          <div class="kpi-val">${margin}%</div>
          <div class="kpi-lbl">Margin</div>
        </div>
        <i class="fas fa-chevron-down" id="chevron-${b.id}" style="color:var(--admin-muted);transition:.3s"></i>
      </div>
    </div>

    <!-- Expanded Body -->
    <div class="prod-batch-body" id="batch-${b.id}">

      <!-- Cost Breakdown -->
      <h4 style="font-size:13px;font-weight:700;color:var(--brand-navy);margin-bottom:12px;text-transform:uppercase;letter-spacing:.04em">
        <i class="fas fa-receipt" style="color:var(--brand-blue)"></i> Expense Breakdown
      </h4>
      <div class="cost-grid">
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-cloth"></i> Fabric</div>
          <div class="ci-value">${Format.currency(b.fabric_cost||0)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-sewing"></i> Garments/Sewing</div>
          <div class="ci-value">${Format.currency(b.garments_bill||0)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-print"></i> Print Bill</div>
          <div class="ci-value">${Format.currency(b.print_bill||0)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-tools"></i> Accessories</div>
          <div class="ci-value">${Format.currency(b.accessories_bill||0)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-truck"></i> Transport</div>
          <div class="ci-value">${Format.currency(b.transport_cost||0)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-box"></i> Packaging/Box</div>
          <div class="ci-value">${Format.currency(b.packaging_cost||0)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label"><i class="fas fa-ellipsis-h"></i> Other</div>
          <div class="ci-value">${Format.currency(b.other_costs||0)}</div>
        </div>
        <div class="cost-item highlight">
          <div class="ci-label">TOTAL EXPENSES</div>
          <div class="ci-value">${Format.currency(totalCost)}</div>
        </div>
      </div>

      <!-- Size-wise Breakdown -->
      <h4 style="font-size:13px;font-weight:700;color:var(--brand-navy);margin:16px 0 12px;text-transform:uppercase;letter-spacing:.04em">
        <i class="fas fa-ruler-combined" style="color:var(--brand-blue)"></i> Units Produced & Per-Size Economics
      </h4>
      <div class="size-breakdown">
        ${sizeData.map(s => {
          const unitC  = calcUnitCost(totalCost, totalQty);
          const profit = s.price - unitC;
          const pct    = s.price > 0 ? Math.min(100, (profit / s.price) * 100) : 0;
          const pctDisp = pct.toFixed(1);
          return `
          <div class="size-card">
            <div><span class="sc-size">${s.label}</span></div>
            <div class="sc-qty">${s.qty}</div>
            <div class="sc-label">units</div>
            <div style="font-size:11px;color:var(--admin-muted);margin-bottom:4px">${((s.qty/totalQty)*100).toFixed(0)}% of batch</div>
            <div class="sc-unit-cost">Cost/unit: ${Format.currency(unitC.toFixed(0))}</div>
            <div class="sc-sell">Sell: ${Format.currency(s.price)}</div>
            <div class="sc-profit" style="color:${profit>0?'var(--success)':'var(--danger)'}">
              Profit: ${Format.currency(profit.toFixed(0))} (${pctDisp}%)
            </div>
            <div class="profit-bar">
              <div class="profit-bar-fill" style="width:${Math.max(0,pct)}%;background:${profit>0?'linear-gradient(90deg,#27ae60,#1abc9c)':'linear-gradient(90deg,#e74c3c,#c0392b)'}"></div>
            </div>
          </div>`;
        }).join('')}
      </div>

      <!-- P&L Summary -->
      <h4 style="font-size:13px;font-weight:700;color:var(--brand-navy);margin:16px 0 12px;text-transform:uppercase;letter-spacing:.04em">
        <i class="fas fa-balance-scale" style="color:var(--brand-blue)"></i> Profit & Loss Summary
      </h4>
      <div class="cost-grid">
        <div class="cost-item">
          <div class="ci-label">Total Units Produced</div>
          <div class="ci-value">${totalQty} pcs</div>
        </div>
        <div class="cost-item">
          <div class="ci-label">Avg Unit Cost</div>
          <div class="ci-value">${Format.currency(unitCost.toFixed(0))}</div>
        </div>
        <div class="cost-item highlight">
          <div class="ci-label">Total Cost of Goods</div>
          <div class="ci-value">${Format.currency(totalCost)}</div>
        </div>
        <div class="cost-item">
          <div class="ci-label">Expected Revenue</div>
          <div class="ci-value">${Format.currency(revenue)}</div>
        </div>
        <div class="cost-item ${grossProfit >= 0 ? 'profit' : 'danger'}">
          <div class="ci-label">Gross Profit</div>
          <div class="ci-value">${Format.currency(grossProfit)}</div>
        </div>
        <div class="cost-item ${grossProfit >= 0 ? 'profit' : 'danger'}">
          <div class="ci-label">Profit Margin</div>
          <div class="ci-value">${margin}%</div>
        </div>
      </div>

      ${b.notes ? `<div style="background:#f8f9ff;border:1px solid #e1e5f5;border-radius:8px;padding:12px;margin-top:8px;font-size:13px;color:var(--admin-muted)"><i class="fas fa-sticky-note" style="margin-right:6px;color:var(--brand-blue)"></i>${b.notes}</div>` : ''}

      <!-- Action buttons -->
      <div style="display:flex;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid #e1e5f5">
        <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="editBatch('${b.id}')">
          <i class="fas fa-edit"></i> Edit Batch
        </button>
        <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="duplicateBatch('${b.id}')">
          <i class="fas fa-copy"></i> Duplicate
        </button>
        <button class="admin-btn admin-btn-danger admin-btn-sm" style="margin-left:auto" onclick="deleteBatch('${b.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  </div>`;
}

/* ── Quick Calculator (standalone, no save) ──────────────────────────── */
function renderQuickCalculator() {
  return `
  <div class="admin-card">
    <div class="admin-card-header">
      <div class="admin-card-title"><i class="fas fa-calculator"></i> Quick Production Cost Calculator</div>
      <small style="color:var(--admin-muted)">Fill in your costs below — profit/loss updates live</small>
    </div>
    <div class="admin-card-body padded">

      <div class="prod-calc-form">

        <!-- Cost Inputs -->
        <div class="prod-form-section">
          <div class="prod-form-section-title"><i class="fas fa-receipt"></i> Production Expenses</div>
          <div class="prod-form-grid">
            <div class="prod-input-group">
              <label>🧵 Fabric Cost (৳)</label>
              <div class="taka"><input type="number" id="calc_fabric" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 12000"/></div>
            </div>
            <div class="prod-input-group">
              <label>🪡 Garments / Sewing Bill (৳)</label>
              <div class="taka"><input type="number" id="calc_garments" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 8500"/></div>
            </div>
            <div class="prod-input-group">
              <label>🖨️ Print Bill (৳)</label>
              <div class="taka"><input type="number" id="calc_print" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 4500"/></div>
            </div>
            <div class="prod-input-group">
              <label>🔩 Accessories (chin, lockbox…) (৳)</label>
              <div class="taka"><input type="number" id="calc_accessories" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 3200"/></div>
            </div>
            <div class="prod-input-group">
              <label>🚛 Transport Cost (৳)</label>
              <div class="taka"><input type="number" id="calc_transport" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 800"/></div>
            </div>
            <div class="prod-input-group">
              <label>📦 Delivery Box / Packaging (৳)</label>
              <div class="taka"><input type="number" id="calc_packaging" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 1500"/></div>
            </div>
            <div class="prod-input-group">
              <label>➕ Other Costs (৳)</label>
              <div class="taka"><input type="number" id="calc_other" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 500"/></div>
            </div>
          </div>
        </div>

        <!-- Units produced -->
        <div class="prod-form-section">
          <div class="prod-form-section-title"><i class="fas fa-ruler-combined"></i> Units Produced</div>
          <div class="prod-form-grid">
            <div class="prod-input-group">
              <label>S — Small units</label>
              <input type="number" id="calc_qty_s" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 40"/>
            </div>
            <div class="prod-input-group">
              <label>M — Medium units</label>
              <input type="number" id="calc_qty_m" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 35"/>
            </div>
            <div class="prod-input-group">
              <label>L — Large units</label>
              <input type="number" id="calc_qty_l" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 25"/>
            </div>
            <div class="prod-input-group">
              <label>XL — Extra Large units</label>
              <input type="number" id="calc_qty_xl" value="0" min="0" oninput="liveCalc()" placeholder="e.g. 0"/>
            </div>
          </div>
        </div>

        <!-- Selling prices -->
        <div class="prod-form-section">
          <div class="prod-form-section-title"><i class="fas fa-tag"></i> Selling Prices Per Unit</div>
          <div class="prod-form-grid">
            <div class="prod-input-group">
              <label>S — Selling Price (৳)</label>
              <div class="taka"><input type="number" id="calc_price_s" value="990" min="0" oninput="liveCalc()"/></div>
            </div>
            <div class="prod-input-group">
              <label>M — Selling Price (৳)</label>
              <div class="taka"><input type="number" id="calc_price_m" value="1190" min="0" oninput="liveCalc()"/></div>
            </div>
            <div class="prod-input-group">
              <label>L — Selling Price (৳)</label>
              <div class="taka"><input type="number" id="calc_price_l" value="1490" min="0" oninput="liveCalc()"/></div>
            </div>
            <div class="prod-input-group">
              <label>XL — Selling Price (৳)</label>
              <div class="taka"><input type="number" id="calc_price_xl" value="1690" min="0" oninput="liveCalc()"/></div>
            </div>
          </div>
        </div>

        <!-- Live Result Panel -->
        <div class="live-calc-panel" id="liveCalcPanel">
          <h4><i class="fas fa-chart-pie" style="margin-right:8px"></i>Live Calculation Results</h4>
          <div class="live-calc-row"><span class="lcr-label">Total Expenses</span><span class="lcr-value" id="lc_total_cost">৳0</span></div>
          <div class="live-calc-row"><span class="lcr-label">Total Units Produced</span><span class="lcr-value" id="lc_total_qty">0 pcs</span></div>
          <div class="live-calc-row"><span class="lcr-label">Avg Unit Cost</span><span class="lcr-value" id="lc_unit_cost">৳0</span></div>
          <div class="live-calc-row" style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:8px">
            <span class="lcr-label">S — Expected Revenue (${0} × ৳990)</span>
            <span class="lcr-value" id="lc_rev_s">৳0</span>
          </div>
          <div class="live-calc-row"><span class="lcr-label">M — Expected Revenue</span><span class="lcr-value" id="lc_rev_m">৳0</span></div>
          <div class="live-calc-row"><span class="lcr-label">L — Expected Revenue</span><span class="lcr-value" id="lc_rev_l">৳0</span></div>
          <div class="live-calc-row"><span class="lcr-label">XL — Expected Revenue</span><span class="lcr-value" id="lc_rev_xl">৳0</span></div>
          <div class="live-calc-row total-row"><span class="lcr-label">Total Revenue (if all sold)</span><span class="lcr-value" id="lc_total_rev">৳0</span></div>
          <div class="live-calc-row profit-row"><span class="lcr-label">Gross Profit</span><span class="lcr-value" id="lc_gross_profit">৳0</span></div>
          <div class="live-calc-row profit-row"><span class="lcr-label">Profit Margin</span><span class="lcr-value" id="lc_margin">0%</span></div>
          <div class="live-calc-row"><span class="lcr-label">Profit per Unit (avg)</span><span class="lcr-value" id="lc_profit_unit">৳0</span></div>
        </div>

        <button class="admin-btn admin-btn-primary" style="margin-top:16px;width:100%" onclick="saveCalcAsBatch()">
          <i class="fas fa-save"></i> Save as Production Batch
        </button>
      </div>
    </div>
  </div>`;
}

/* ── Analytics Tab ───────────────────────────────────────────────────── */
function renderAnalytics(batches) {
  if (batches.length === 0) return `<div class="admin-card" style="text-align:center;padding:60px"><div style="font-size:48px;margin-bottom:16px">📊</div><p style="color:var(--admin-muted)">No batch data yet to analyse.</p></div>`;

  const rows = batches.map(b => {
    const cost   = sumCosts(b);
    const qty    = (b.qty_small||0)+(b.qty_medium||0)+(b.qty_large||0)+(b.qty_xl||0);
    const rev    = calcRevenue(b);
    const profit = rev - cost;
    const margin = rev > 0 ? ((profit/rev)*100).toFixed(1) : 0;
    return { name: b.batch_name||'Batch', cost, qty, rev, profit, margin };
  });

  return `
  <div class="admin-card" style="margin-bottom:20px">
    <div class="admin-card-header">
      <div class="admin-card-title"><i class="fas fa-table"></i> All Batches — Summary Table</div>
    </div>
    <div class="admin-card-body">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Units</th>
              <th>Total Expenses</th>
              <th>Avg Unit Cost</th>
              <th>Expected Revenue</th>
              <th>Gross Profit</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
            <tr>
              <td class="cell-bold">${r.name}</td>
              <td>${r.qty} pcs</td>
              <td>${Format.currency(r.cost)}</td>
              <td>${Format.currency(r.qty > 0 ? (r.cost/r.qty).toFixed(0) : 0)}</td>
              <td>${Format.currency(r.rev)}</td>
              <td class="${r.profit >= 0 ? 'text-success' : 'text-danger'} font-bold">${Format.currency(r.profit)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;height:6px;background:#e1e5f5;border-radius:3px;min-width:60px">
                    <div style="height:100%;border-radius:3px;width:${Math.max(0,r.margin)}%;background:${r.profit>=0?'var(--success)':'var(--danger)'}"></div>
                  </div>
                  <span class="${r.profit>=0?'text-success':'text-danger'} font-bold">${r.margin}%</span>
                </div>
              </td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr style="background:linear-gradient(135deg,#f0f4ff,#f5f0ff);font-weight:800">
              <td>TOTAL</td>
              <td>${rows.reduce((s,r)=>s+r.qty,0)} pcs</td>
              <td>${Format.currency(rows.reduce((s,r)=>s+r.cost,0))}</td>
              <td>${Format.currency(rows.reduce((s,r)=>s+r.qty,0) > 0 ? (rows.reduce((s,r)=>s+r.cost,0)/rows.reduce((s,r)=>s+r.qty,0)).toFixed(0) : 0)}</td>
              <td>${Format.currency(rows.reduce((s,r)=>s+r.rev,0))}</td>
              <td class="text-success">${Format.currency(rows.reduce((s,r)=>s+r.profit,0))}</td>
              <td class="text-success">${rows.reduce((s,r)=>s+r.rev,0) > 0 ? ((rows.reduce((s,r)=>s+r.profit,0)/rows.reduce((s,r)=>s+r.rev,0))*100).toFixed(1) : 0}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
  <div class="admin-card">
    <div class="admin-card-header">
      <div class="admin-card-title"><i class="fas fa-chart-bar"></i> Profit per Batch</div>
    </div>
    <div class="admin-card-body padded" style="height:280px">
      <canvas id="profitChart"></canvas>
    </div>
  </div>
  `;
}

/* ── Tab switch ──────────────────────────────────────────────────────── */
window.switchProdTab = function(tab, btn) {
  ['batches','calculator','analytics'].forEach(t => {
    const el = document.getElementById(`prodTab-${t}`);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.prod-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Draw chart when analytics tab opens
  if (tab === 'analytics') {
    setTimeout(async () => {
      const batches = await API.getAll('lc_production_batches');
      const labels  = batches.map(b => b.batch_name||'Batch');
      const costs   = batches.map(b => sumCosts(b));
      const revs    = batches.map(b => calcRevenue(b));
      const profits = batches.map(b => calcRevenue(b) - sumCosts(b));
      const ctx = document.getElementById('profitChart');
      if (!ctx) return;
      if (window._prodChart) window._prodChart.destroy();
      window._prodChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Total Expenses', data: costs,   backgroundColor: 'rgba(74,144,226,0.7)',  borderRadius: 6 },
            { label: 'Revenue',        data: revs,    backgroundColor: 'rgba(27,188,156,0.7)', borderRadius: 6 },
            { label: 'Gross Profit',   data: profits, backgroundColor: 'rgba(39,174,96,0.9)',  borderRadius: 6 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { ticks: { callback: v => '৳' + v.toLocaleString() } } }
        }
      });
    }, 100);
  }
};

/* ── Toggle batch expand ─────────────────────────────────────────────── */
window.toggleBatch = function(id) {
  const body    = document.getElementById(id);
  const batchId = id.replace('batch-', '');
  const chevron = document.getElementById(`chevron-${batchId}`);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
};

/* ── Live Calculator ─────────────────────────────────────────────────── */
function wireCalculator() {
  // nothing extra needed — oninput fires liveCalc
  setTimeout(liveCalc, 200);
}

window.liveCalc = function() {
  const g = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
  const totalCost = g('calc_fabric')+g('calc_garments')+g('calc_print')+g('calc_accessories')+g('calc_transport')+g('calc_packaging')+g('calc_other');
  const qS = g('calc_qty_s'), qM = g('calc_qty_m'), qL = g('calc_qty_l'), qXL = g('calc_qty_xl');
  const pS = g('calc_price_s'), pM = g('calc_price_m'), pL = g('calc_price_l'), pXL = g('calc_price_xl');
  const totalQty = qS + qM + qL + qXL;
  const unitCost = totalQty > 0 ? totalCost / totalQty : 0;
  const revS = qS * pS, revM = qM * pM, revL = qL * pL, revXL = qXL * pXL;
  const totalRev = revS + revM + revL + revXL;
  const grossProfit = totalRev - totalCost;
  const margin = totalRev > 0 ? ((grossProfit / totalRev) * 100).toFixed(1) : 0;
  const profitPerUnit = totalQty > 0 ? (grossProfit / totalQty).toFixed(0) : 0;

  const fc = v => '৳' + parseInt(v).toLocaleString('en-IN');
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };

  set('lc_total_cost',   fc(totalCost));
  set('lc_total_qty',    totalQty + ' pcs');
  set('lc_unit_cost',    fc(unitCost.toFixed(0)));
  set('lc_rev_s',        fc(revS));
  set('lc_rev_m',        fc(revM));
  set('lc_rev_l',        fc(revL));
  set('lc_rev_xl',       fc(revXL));
  set('lc_total_rev',    fc(totalRev));
  set('lc_gross_profit', fc(grossProfit));
  set('lc_margin',       margin + '%');
  set('lc_profit_unit',  fc(profitPerUnit));

  // Colour profit green/red
  const profEl = document.getElementById('lc_gross_profit');
  if (profEl) profEl.style.color = grossProfit >= 0 ? '#27ae60' : '#e74c3c';
};

/* ── Save Calculator as Batch ────────────────────────────────────────── */
window.saveCalcAsBatch = function() {
  const g  = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
  const batchName = `Batch-${String(Date.now()).slice(-5)}`;
  openModal('Save as Production Batch',
    `<div class="admin-form-group"><label class="admin-form-label">Batch Name</label>
     <input id="save_batch_name" class="admin-input" value="${batchName}"/></div>
     <div class="admin-form-group"><label class="admin-form-label">Design Codes</label>
     <input id="save_batch_designs" class="admin-input" placeholder="A1, B2, C3"/></div>
     <div class="admin-form-group"><label class="admin-form-label">Notes</label>
     <textarea id="save_batch_notes" class="admin-input admin-textarea" rows="3" placeholder="Any notes..."></textarea></div>`,
    `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
     <button class="admin-btn admin-btn-primary" onclick="confirmSaveBatch()">Save Batch</button>`
  );
  window._calcSnapshot = {
    fabric_cost:       g('calc_fabric'),
    garments_bill:     g('calc_garments'),
    print_bill:        g('calc_print'),
    accessories_bill:  g('calc_accessories'),
    transport_cost:    g('calc_transport'),
    packaging_cost:    g('calc_packaging'),
    other_costs:       g('calc_other'),
    qty_small:         g('calc_qty_s'),
    qty_medium:        g('calc_qty_m'),
    qty_large:         g('calc_qty_l'),
    qty_xl:            g('calc_qty_xl'),
    sell_price_small:  g('calc_price_s'),
    sell_price_medium: g('calc_price_m'),
    sell_price_large:  g('calc_price_l'),
    sell_price_xl:     g('calc_price_xl'),
    status: 'planning',
    batch_date: new Date().toISOString(),
  };
};

window.confirmSaveBatch = async function() {
  const name = document.getElementById('save_batch_name')?.value?.trim();
  if (!name) { Toast.error('Please enter a batch name.'); return; }
  try {
    await API.post('lc_production_batches', {
      ...window._calcSnapshot,
      batch_name:   name,
      design_codes: document.getElementById('save_batch_designs')?.value || '',
      notes:        document.getElementById('save_batch_notes')?.value || '',
    });
    Toast.success('Batch saved! ✓');
    closeModal();
    showSection('production');
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

/* ── New Batch Form ──────────────────────────────────────────────────── */
window.openNewBatchForm = function() {
  const formHtml = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="admin-form-group"><label class="admin-form-label">Batch Name *</label><input id="nb_name" class="admin-input" placeholder="e.g. Batch-003 Summer Collection"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Date</label><input id="nb_date" type="date" class="admin-input" value="${new Date().toISOString().slice(0,10)}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Design Codes</label><input id="nb_designs" class="admin-input" placeholder="A1, B2, C3"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Status</label><select id="nb_status" class="admin-input"><option value="planning">Planning</option><option value="in_production">In Production</option><option value="completed">Completed</option></select></div>
    </div>
    <hr style="margin:16px 0;border-color:#e1e5f5"/>
    <div style="font-weight:700;color:var(--brand-blue);font-size:13px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px"><i class="fas fa-receipt"></i> Expenses</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      <div class="admin-form-group"><label class="admin-form-label">🧵 Fabric Cost (৳)</label><input id="nb_fabric" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">🪡 Garments/Sewing (৳)</label><input id="nb_garments" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">🖨️ Print Bill (৳)</label><input id="nb_print" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">🔩 Accessories (৳)</label><input id="nb_accessories" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">🚛 Transport (৳)</label><input id="nb_transport" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">📦 Packaging/Box (৳)</label><input id="nb_packaging" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">➕ Other Costs (৳)</label><input id="nb_other" type="number" class="admin-input" value="0" min="0"/></div>
    </div>
    <hr style="margin:16px 0;border-color:#e1e5f5"/>
    <div style="font-weight:700;color:var(--brand-blue);font-size:13px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px"><i class="fas fa-ruler-combined"></i> Units Produced & Selling Prices</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      <div class="admin-form-group"><label class="admin-form-label">S — Qty</label><input id="nb_qty_s" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">M — Qty</label><input id="nb_qty_m" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">L — Qty</label><input id="nb_qty_l" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">XL — Qty</label><input id="nb_qty_xl" type="number" class="admin-input" value="0" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">S — Price (৳)</label><input id="nb_price_s" type="number" class="admin-input" value="990" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">M — Price (৳)</label><input id="nb_price_m" type="number" class="admin-input" value="1190" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">L — Price (৳)</label><input id="nb_price_l" type="number" class="admin-input" value="1490" min="0"/></div>
      <div class="admin-form-group"><label class="admin-form-label">XL — Price (৳)</label><input id="nb_price_xl" type="number" class="admin-input" value="1690" min="0"/></div>
    </div>
    <div class="admin-form-group" style="margin-top:12px"><label class="admin-form-label">Notes</label><textarea id="nb_notes" class="admin-input admin-textarea" rows="2" placeholder="Any additional notes…"></textarea></div>
  `;
  openModal('New Production Batch', formHtml,
    `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
     <button class="admin-btn admin-btn-primary" onclick="saveNewBatch()"><i class="fas fa-save"></i> Save Batch</button>`
  );
};

window.saveNewBatch = async function() {
  const name = document.getElementById('nb_name')?.value?.trim();
  if (!name) { Toast.error('Batch name is required.'); return; }
  const g = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
  try {
    await API.post('lc_production_batches', {
      batch_name:        name,
      batch_date:        document.getElementById('nb_date')?.value ? new Date(document.getElementById('nb_date').value).toISOString() : new Date().toISOString(),
      design_codes:      document.getElementById('nb_designs')?.value || '',
      status:            document.getElementById('nb_status')?.value || 'planning',
      fabric_cost:       g('nb_fabric'),
      garments_bill:     g('nb_garments'),
      print_bill:        g('nb_print'),
      accessories_bill:  g('nb_accessories'),
      transport_cost:    g('nb_transport'),
      packaging_cost:    g('nb_packaging'),
      other_costs:       g('nb_other'),
      qty_small:         g('nb_qty_s'),
      qty_medium:        g('nb_qty_m'),
      qty_large:         g('nb_qty_l'),
      qty_xl:            g('nb_qty_xl'),
      sell_price_small:  g('nb_price_s'),
      sell_price_medium: g('nb_price_m'),
      sell_price_large:  g('nb_price_l'),
      sell_price_xl:     g('nb_price_xl'),
      notes:             document.getElementById('nb_notes')?.value || '',
    });
    Toast.success('Production batch saved! ✓');
    closeModal();
    showSection('production');
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

/* ── Edit Batch ──────────────────────────────────────────────────────── */
window.editBatch = async function(id) {
  const b = await API.getOne('lc_production_batches', id);
  const dateVal = b.batch_date ? new Date(b.batch_date).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
  const formHtml = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="admin-form-group"><label class="admin-form-label">Batch Name *</label><input id="eb_name" class="admin-input" value="${b.batch_name||''}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Date</label><input id="eb_date" type="date" class="admin-input" value="${dateVal}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Design Codes</label><input id="eb_designs" class="admin-input" value="${b.design_codes||''}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">Status</label><select id="eb_status" class="admin-input">
        ${['planning','in_production','completed'].map(s=>`<option value="${s}" ${b.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}
      </select></div>
    </div>
    <hr style="margin:16px 0;border-color:#e1e5f5"/>
    <div style="font-weight:700;color:var(--brand-blue);font-size:13px;text-transform:uppercase;margin-bottom:12px"><i class="fas fa-receipt"></i> Expenses</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      ${[['eb_fabric','🧵 Fabric',b.fabric_cost],['eb_garments','🪡 Garments',b.garments_bill],['eb_print','🖨️ Print',b.print_bill],['eb_accessories','🔩 Accessories',b.accessories_bill],['eb_transport','🚛 Transport',b.transport_cost],['eb_packaging','📦 Packaging',b.packaging_cost],['eb_other','➕ Other',b.other_costs]].map(([id,lbl,val])=>`
      <div class="admin-form-group"><label class="admin-form-label">${lbl} (৳)</label><input id="${id}" type="number" class="admin-input" value="${val||0}" min="0"/></div>`).join('')}
    </div>
    <hr style="margin:16px 0;border-color:#e1e5f5"/>
    <div style="font-weight:700;color:var(--brand-blue);font-size:13px;text-transform:uppercase;margin-bottom:12px"><i class="fas fa-ruler-combined"></i> Units & Prices</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
      <div class="admin-form-group"><label class="admin-form-label">S Qty</label><input id="eb_qty_s" type="number" class="admin-input" value="${b.qty_small||0}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">M Qty</label><input id="eb_qty_m" type="number" class="admin-input" value="${b.qty_medium||0}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">L Qty</label><input id="eb_qty_l" type="number" class="admin-input" value="${b.qty_large||0}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">XL Qty</label><input id="eb_qty_xl" type="number" class="admin-input" value="${b.qty_xl||0}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">S Price (৳)</label><input id="eb_price_s" type="number" class="admin-input" value="${b.sell_price_small||990}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">M Price (৳)</label><input id="eb_price_m" type="number" class="admin-input" value="${b.sell_price_medium||1190}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">L Price (৳)</label><input id="eb_price_l" type="number" class="admin-input" value="${b.sell_price_large||1490}"/></div>
      <div class="admin-form-group"><label class="admin-form-label">XL Price (৳)</label><input id="eb_price_xl" type="number" class="admin-input" value="${b.sell_price_xl||1690}"/></div>
    </div>
    <div class="admin-form-group" style="margin-top:12px"><label class="admin-form-label">Notes</label><textarea id="eb_notes" class="admin-input admin-textarea" rows="2">${b.notes||''}</textarea></div>
  `;
  openModal('Edit Production Batch', formHtml,
    `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
     <button class="admin-btn admin-btn-primary" onclick="updateBatch('${id}')"><i class="fas fa-save"></i> Update</button>`
  );
};

window.updateBatch = async function(id) {
  const name = document.getElementById('eb_name')?.value?.trim();
  if (!name) { Toast.error('Batch name is required.'); return; }
  const g = elId => parseFloat(document.getElementById(elId)?.value || 0) || 0;
  try {
    await API.put('lc_production_batches', id, {
      batch_name:        name,
      batch_date:        document.getElementById('eb_date')?.value ? new Date(document.getElementById('eb_date').value).toISOString() : new Date().toISOString(),
      design_codes:      document.getElementById('eb_designs')?.value || '',
      status:            document.getElementById('eb_status')?.value || 'completed',
      fabric_cost:       g('eb_fabric'),   garments_bill:    g('eb_garments'),
      print_bill:        g('eb_print'),    accessories_bill: g('eb_accessories'),
      transport_cost:    g('eb_transport'),packaging_cost:   g('eb_packaging'),
      other_costs:       g('eb_other'),
      qty_small:  g('eb_qty_s'),  qty_medium: g('eb_qty_m'),
      qty_large:  g('eb_qty_l'),  qty_xl:     g('eb_qty_xl'),
      sell_price_small:  g('eb_price_s'),  sell_price_medium: g('eb_price_m'),
      sell_price_large:  g('eb_price_l'),  sell_price_xl:     g('eb_price_xl'),
      notes: document.getElementById('eb_notes')?.value || '',
    });
    Toast.success('Batch updated! ✓');
    closeModal();
    showSection('production');
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

window.duplicateBatch = async function(id) {
  try {
    const b = await API.getOne('lc_production_batches', id);
    delete b.id;
    b.batch_name = b.batch_name + ' (Copy)';
    b.status = 'planning';
    b.batch_date = new Date().toISOString();
    await API.post('lc_production_batches', b);
    Toast.success('Batch duplicated!');
    showSection('production');
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

window.deleteBatch = function(id) {
  showConfirm('Delete Production Batch', 'This will permanently delete this batch and all its cost data. Cannot be undone.', async () => {
    try {
      await API.delete('lc_production_batches', id);
      Toast.success('Batch deleted.');
      showSection('production');
    } catch(e) { Toast.error('Failed: ' + e.message); }
  });
};

// ============================================================
// FACEBOOK MARKETING — Campaign Tracker & Profit Calculator
// ============================================================

/* ── Facebook Marketing styles ───────────────────────────── */
document.head.insertAdjacentHTML('beforeend', `
  <style>
    /* ── FB Marketing Module ──────────────────────────────── */
    .fb-tabs { display:flex; gap:8px; margin-bottom:24px; border-bottom:2px solid #e1e5f5; padding-bottom:0; }
    .fb-tab  { padding:10px 20px; border:none; background:none; font-family:var(--font-main); font-size:14px; font-weight:600; color:var(--admin-muted); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:var(--transition); border-radius:6px 6px 0 0; }
    .fb-tab:hover { color:#1877f2; background:rgba(24,119,242,0.05); }
    .fb-tab.active { color:#1877f2; border-bottom-color:#1877f2; background:rgba(24,119,242,0.06); }

    .fb-kpi-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:14px; margin-bottom:24px; }
    .fb-kpi { background:#fff; border:1.5px solid #e1e5f5; border-radius:14px; padding:18px 14px; text-align:center; position:relative; overflow:hidden; }
    .fb-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
    .fb-kpi.blue::before  { background:linear-gradient(90deg,#1877f2,#42a5f5); }
    .fb-kpi.green::before { background:linear-gradient(90deg,#27ae60,#1abc9c); }
    .fb-kpi.orange::before{ background:linear-gradient(90deg,#e67e22,#f39c12); }
    .fb-kpi.red::before   { background:linear-gradient(90deg,#e74c3c,#c0392b); }
    .fb-kpi.purple::before{ background:linear-gradient(90deg,#9b59b6,#7b68ee); }
    .fb-kpi-val { font-size:20px; font-weight:800; color:var(--brand-navy); margin-bottom:4px; }
    .fb-kpi-lbl { font-size:11px; color:var(--admin-muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
    .fb-kpi-sub { font-size:11px; color:#6c757d; margin-top:2px; }

    .fb-campaign-card { background:#fff; border:1.5px solid #e1e5f5; border-radius:14px; margin-bottom:16px; overflow:hidden; transition:box-shadow .2s,border-color .2s; }
    .fb-campaign-card:hover { border-color:#1877f2; box-shadow:0 4px 20px rgba(24,119,242,0.1); }
    .fb-campaign-header { display:flex; align-items:center; gap:16px; padding:16px 20px; cursor:pointer; }
    .fb-campaign-icon { width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg,#1877f2,#42a5f5); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .fb-campaign-meta { flex:1; min-width:0; }
    .fb-campaign-name { font-weight:700; font-size:15px; color:var(--brand-navy); }
    .fb-campaign-period { font-size:12px; color:var(--admin-muted); }
    .fb-campaign-pills { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .fb-pill { padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; }
    .fb-pill-blue   { background:#e8f0fe; color:#1877f2; }
    .fb-pill-green  { background:#d4edda; color:#155724; }
    .fb-pill-orange { background:#fff3cd; color:#856404; }
    .fb-pill-red    { background:#f8d7da; color:#721c24; }
    .fb-pill-purple { background:#e8e0f7; color:#6f42c1; }
    .fb-campaign-chevron { transition:transform .3s; color:var(--admin-muted); }

    .fb-campaign-body { padding:0 20px 20px; display:none; }
    .fb-campaign-body.open { display:block; }

    .fb-breakdown-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:12px; margin:16px 0; }
    .fb-breakdown-item { background:#f8f9ff; border:1px solid #e1e5f5; border-radius:10px; padding:12px 14px; }
    .fb-breakdown-item .fbi-label { font-size:11px; color:var(--admin-muted); font-weight:600; text-transform:uppercase; letter-spacing:.03em; margin-bottom:4px; }
    .fb-breakdown-item .fbi-value { font-size:17px; font-weight:700; color:var(--brand-navy); }
    .fb-breakdown-item.blue   { background:linear-gradient(135deg,#e8f0fe,#f0f4ff); border-color:#b8d0fb; }
    .fb-breakdown-item.blue .fbi-value { color:#1877f2; }
    .fb-breakdown-item.green  { background:linear-gradient(135deg,#f0fff4,#e8f8f0); border-color:#b7e4c7; }
    .fb-breakdown-item.green .fbi-value { color:var(--success); }
    .fb-breakdown-item.red    { background:linear-gradient(135deg,#fff5f5,#fff0f0); border-color:#fbb; }
    .fb-breakdown-item.red .fbi-value { color:var(--danger); }
    .fb-breakdown-item.orange { background:linear-gradient(135deg,#fff8f0,#fff3e0); border-color:#ffd08a; }
    .fb-breakdown-item.orange .fbi-value { color:#e67e22; }

    .fb-profit-result { background:linear-gradient(135deg,#0f1224,#1a1f3a); border-radius:14px; padding:20px; color:#fff; margin-top:16px; }
    .fb-profit-result h4 { color:#fff; font-weight:700; margin-bottom:16px; font-size:13px; letter-spacing:.05em; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
    .fb-profit-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid rgba(255,255,255,.07); font-size:13px; }
    .fb-profit-row:last-child { border-bottom:none; }
    .fb-profit-row .fpr-label { color:rgba(255,255,255,.6); }
    .fb-profit-row .fpr-value { font-weight:700; color:#fff; }
    .fb-profit-row.total-row { border-top:2px solid rgba(255,255,255,.2); margin-top:8px; padding-top:12px; }
    .fb-profit-row.total-row .fpr-label { color:#fff; font-weight:700; font-size:14px; }
    .fb-profit-row.total-row .fpr-value { font-size:18px; color:#4A90E2; }
    .fb-profit-row.win-row .fpr-value { color:#27ae60; }
    .fb-profit-row.loss-row .fpr-value { color:#e74c3c; }

    .fb-calc-panel { background:#f0f4ff; border:1.5px dashed #b8c4e8; border-radius:14px; padding:24px; }
    .fb-calc-section-title { font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:.05em; color:#1877f2; margin-bottom:12px; display:flex; align-items:center; gap:6px; }

    .fb-rate-banner { background:linear-gradient(135deg,#e8f0fe,#f0f4ff); border:1.5px solid #b8d0fb; border-radius:12px; padding:14px 18px; display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .fb-rate-badge { background:#1877f2; color:#fff; border-radius:8px; padding:6px 14px; font-weight:800; font-size:18px; min-width:120px; text-align:center; }

    .fb-summary-bar { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:24px; }
    .fb-summary-stat { background:#fff; border:1.5px solid #e1e5f5; border-radius:14px; padding:16px; text-align:center; }
    .fb-summary-stat .fss-val { font-size:20px; font-weight:800; color:#1877f2; }
    .fb-summary-stat .fss-lbl { font-size:11px; color:var(--admin-muted); font-weight:600; text-transform:uppercase; margin-top:4px; }
    .fb-summary-stat.green .fss-val { color:var(--success); }
    .fb-summary-stat.red .fss-val   { color:var(--danger); }
    .fb-summary-stat.orange .fss-val{ color:#e67e22; }

    @media (max-width:768px) {
      .fb-kpi-grid { grid-template-columns:repeat(2,1fr); }
      .fb-summary-bar { grid-template-columns:repeat(2,1fr); }
      .fb-breakdown-grid { grid-template-columns:repeat(2,1fr); }
    }
  </style>
`);

AdminSections.facebook = async function() {
  const el = document.getElementById('adminContent');
  el.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner"></div></div>';

  try {
    const campaigns = await API.getAll('lc_fb_campaigns');
    campaigns.sort((a,b) => (b.created_at||0) - (a.created_at||0));

    // ── Aggregate KPIs across all campaigns ─────────────────────
    let totalUSDSpent    = 0, totalBDTSpent = 0, totalPredOrders = 0;
    let totalActualOrders = 0, totalRevenue = 0, totalProfit = 0;
    let totalAdCostAlloc = 0;

    campaigns.forEach(c => {
      const bdt         = (c.usd_spent||0) * (c.exchange_rate||110);
      const orders      = c.actual_orders || c.predicted_orders || 0;
      const rev         = (c.avg_order_value||0) * orders;
      const prodCost    = (c.unit_production_cost||0) * orders;
      const delivCost   = (c.delivery_cost_per_order||0) * orders;
      const otherCosts  = c.other_costs_bdt || 0;
      const totalCost   = bdt + prodCost + delivCost + otherCosts;
      const profit      = rev - totalCost;

      totalUSDSpent     += (c.usd_spent||0);
      totalBDTSpent     += bdt;
      totalPredOrders   += (c.predicted_orders||0);
      totalActualOrders += (c.actual_orders||0);
      totalRevenue      += rev;
      totalProfit       += profit;
      totalAdCostAlloc  += bdt;
    });

    const profitColor = totalProfit >= 0 ? 'var(--success)' : 'var(--danger)';

    el.innerHTML = `
      <!-- Page Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:20px;font-weight:800;color:var(--brand-navy);margin-bottom:4px">
            <i class="fab fa-facebook-square" style="color:#1877f2"></i> Facebook Marketing Tracker
          </h2>
          <p style="font-size:13px;color:var(--admin-muted)">Track ad spend in USD → BDT, predict orders & calculate true profit per campaign</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="AdminSections.facebook()">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#1877f2,#42a5f5);border-color:#1877f2" onclick="fbOpenNewCampaignForm()">
            <i class="fas fa-plus"></i> New Campaign
          </button>
        </div>
      </div>

      <!-- Exchange Rate Banner -->
      ${campaigns.length > 0 ? (() => {
        const latestRate = campaigns[0]?.exchange_rate || 110;
        const latestUSD  = campaigns[0]?.usd_spent || 0;
        return `<div class="fb-rate-banner">
          <div style="font-size:1.4rem">💱</div>
          <div class="fb-rate-badge">1 USD = ৳${latestRate}</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px;color:#1877f2">Latest Exchange Rate (from newest campaign)</div>
            <div style="font-size:12px;color:var(--admin-muted)">$${latestUSD} USD = ৳${(latestUSD * latestRate).toLocaleString()} BDT · Update by editing the campaign</div>
          </div>
          <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="fbUpdateExchangeRate()">
            <i class="fas fa-edit"></i> Update Rate
          </button>
        </div>`;
      })() : ''}

      <!-- KPI Summary Bar -->
      <div class="fb-kpi-grid">
        <div class="fb-kpi blue">
          <div class="fb-kpi-val">$${totalUSDSpent.toFixed(0)}</div>
          <div class="fb-kpi-lbl">Total USD Spent</div>
          <div class="fb-kpi-sub">৳${Math.round(totalBDTSpent).toLocaleString()} BDT</div>
        </div>
        <div class="fb-kpi orange">
          <div class="fb-kpi-val">${totalPredOrders}</div>
          <div class="fb-kpi-lbl">Predicted Orders</div>
          <div class="fb-kpi-sub">Across all campaigns</div>
        </div>
        <div class="fb-kpi purple">
          <div class="fb-kpi-val">${totalActualOrders}</div>
          <div class="fb-kpi-lbl">Actual Orders</div>
          <div class="fb-kpi-sub">${totalPredOrders > 0 ? Math.round((totalActualOrders/totalPredOrders)*100) : 0}% of prediction</div>
        </div>
        <div class="fb-kpi ${totalRevenue > 0 ? 'green' : 'red'}">
          <div class="fb-kpi-val">৳${Math.round(totalRevenue).toLocaleString()}</div>
          <div class="fb-kpi-lbl">Total Revenue</div>
          <div class="fb-kpi-sub">From actual orders</div>
        </div>
        <div class="fb-kpi ${totalProfit >= 0 ? 'green' : 'red'}">
          <div class="fb-kpi-val" style="color:${profitColor}">৳${Math.round(totalProfit).toLocaleString()}</div>
          <div class="fb-kpi-lbl">Net Profit</div>
          <div class="fb-kpi-sub">After all costs</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="fb-tabs">
        <button class="fb-tab active" onclick="fbSwitchTab('campaigns', this)"><i class="fas fa-list"></i> Campaigns</button>
        <button class="fb-tab" onclick="fbSwitchTab('calculator', this)"><i class="fas fa-calculator"></i> Live Calculator</button>
        <button class="fb-tab" onclick="fbSwitchTab('analytics', this)"><i class="fas fa-chart-bar"></i> Analytics</button>
        <button class="fb-tab" onclick="fbSwitchTab('guide', this)"><i class="fas fa-lightbulb"></i> Business Tips</button>
      </div>

      <!-- Tab: Campaigns List -->
      <div id="fbTab-campaigns">
        ${campaigns.length === 0 ? `
          <div class="admin-card">
            <div style="text-align:center;padding:60px 20px">
              <div style="font-size:56px;margin-bottom:16px">📣</div>
              <h3 style="color:var(--brand-navy);margin-bottom:8px">No Campaigns Yet</h3>
              <p style="color:var(--admin-muted);margin-bottom:20px">Add your first Facebook ad campaign to start tracking ROI & profit</p>
              <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#1877f2,#42a5f5);border-color:#1877f2" onclick="fbOpenNewCampaignForm()">
                <i class="fas fa-plus"></i> Add First Campaign
              </button>
            </div>
          </div>
        ` : campaigns.map(c => fbRenderCampaignCard(c)).join('')}
      </div>

      <!-- Tab: Live Calculator -->
      <div id="fbTab-calculator" style="display:none">
        ${fbRenderLiveCalculator()}
      </div>

      <!-- Tab: Analytics -->
      <div id="fbTab-analytics" style="display:none">
        ${fbRenderAnalytics(campaigns)}
      </div>

      <!-- Tab: Guide -->
      <div id="fbTab-guide" style="display:none">
        ${fbRenderBusinessGuide()}
      </div>
    `;

    // Init live calculator
    setTimeout(fbLiveCalc, 200);

  } catch(e) {
    document.getElementById('adminContent').innerHTML = `<div class="admin-alert admin-alert-danger">Error: ${e.message}</div>`;
  }
};

/* ── Render Campaign Card ────────────────────────────────── */
function fbRenderCampaignCard(c) {
  const rate      = c.exchange_rate || 110;
  const bdtSpent  = (c.usd_spent||0) * rate;
  const orders    = c.actual_orders || c.predicted_orders || 0;
  const isActual  = (c.actual_orders || 0) > 0;
  const revenue   = (c.avg_order_value||0) * orders;
  const prodCost  = (c.unit_production_cost||0) * orders;
  const delivCost = (c.delivery_cost_per_order||0) * orders;
  const otherCost = c.other_costs_bdt || 0;
  const totalCost = bdtSpent + prodCost + delivCost + otherCost;
  const profit    = revenue - totalCost;
  const margin    = revenue > 0 ? ((profit/revenue)*100).toFixed(1) : 0;
  const roas      = bdtSpent > 0 ? (revenue / bdtSpent).toFixed(2) : 0;
  const cpo       = orders > 0 ? (bdtSpent / orders).toFixed(0) : 0; // cost per order (ad spend only)
  const cpoTotal  = orders > 0 ? (totalCost / orders).toFixed(0) : 0; // total cost per order

  const statusColors = { active:'green', completed:'blue', paused:'orange' };
  const sc = statusColors[c.status] || 'blue';

  return `
  <div class="fb-campaign-card">
    <div class="fb-campaign-header" onclick="fbToggleCampaign('fbc-${c.id}')">
      <div class="fb-campaign-icon">
        <i class="fab fa-facebook-f" style="color:#fff;font-size:18px"></i>
      </div>
      <div class="fb-campaign-meta">
        <div class="fb-campaign-name">${c.campaign_name || 'Unnamed Campaign'}</div>
        <div class="fb-campaign-period">${c.month || '—'} &nbsp;·&nbsp; 1 USD = ৳${rate}</div>
      </div>
      <div class="fb-campaign-pills" style="margin-right:8px">
        <span class="fb-pill fb-pill-blue">$${c.usd_spent||0} USD → ৳${Math.round(bdtSpent).toLocaleString()}</span>
        <span class="fb-pill fb-pill-${sc}">${c.status||'active'}</span>
        <span class="fb-pill ${profit>=0?'fb-pill-green':'fb-pill-red'}">${profit>=0?'✅ Profit':'❌ Loss'}: ৳${Math.round(profit).toLocaleString()}</span>
      </div>
      <i class="fas fa-chevron-down fb-campaign-chevron" id="fbchev-${c.id}"></i>
    </div>
    <div class="fb-campaign-body" id="fbc-${c.id}">

      <!-- Cost Breakdown Grid -->
      <div class="fb-breakdown-grid">
        <div class="fb-breakdown-item blue">
          <div class="fbi-label">💵 FB Ad Spend</div>
          <div class="fbi-value">$${c.usd_spent||0}</div>
          <div style="font-size:12px;color:#1877f2;margin-top:2px">= ৳${Math.round(bdtSpent).toLocaleString()}</div>
        </div>
        <div class="fb-breakdown-item orange">
          <div class="fbi-label">📦 Predicted Orders</div>
          <div class="fbi-value">${c.predicted_orders||0}</div>
        </div>
        <div class="fb-breakdown-item ${isActual?'green':'orange'}">
          <div class="fbi-label">✅ Actual Orders</div>
          <div class="fbi-value">${c.actual_orders||0}</div>
          <div style="font-size:12px;color:var(--admin-muted);margin-top:2px">${isActual?'Real data':'Not yet recorded'}</div>
        </div>
        <div class="fb-breakdown-item">
          <div class="fbi-label">💰 Avg Order Value</div>
          <div class="fbi-value">৳${(c.avg_order_value||0).toLocaleString()}</div>
        </div>
        <div class="fb-breakdown-item">
          <div class="fbi-label">🏭 Production Cost/Unit</div>
          <div class="fbi-value">৳${(c.unit_production_cost||0).toLocaleString()}</div>
          <div style="font-size:12px;color:var(--admin-muted)">Total: ৳${Math.round(prodCost).toLocaleString()}</div>
        </div>
        <div class="fb-breakdown-item">
          <div class="fbi-label">🚚 Delivery Cost/Order</div>
          <div class="fbi-value">৳${(c.delivery_cost_per_order||0).toLocaleString()}</div>
          <div style="font-size:12px;color:var(--admin-muted)">Total: ৳${Math.round(delivCost).toLocaleString()}</div>
        </div>
        <div class="fb-breakdown-item">
          <div class="fbi-label">➕ Other Costs</div>
          <div class="fbi-value">৳${otherCost.toLocaleString()}</div>
        </div>
        <div class="fb-breakdown-item orange">
          <div class="fbi-label">📊 ROAS</div>
          <div class="fbi-value">${roas}x</div>
          <div style="font-size:11px;color:var(--admin-muted)">Return on Ad Spend</div>
        </div>
      </div>

      <!-- Full P&L Breakdown -->
      <div class="fb-profit-result">
        <h4><i class="fas fa-chart-pie"></i> Full Profit & Loss Breakdown (${isActual?'Actual Orders':'Predicted Orders'})</h4>
        <div class="fb-profit-row">
          <span class="fpr-label">📈 Revenue (${orders} orders × ৳${(c.avg_order_value||0).toLocaleString()})</span>
          <span class="fpr-value">৳${Math.round(revenue).toLocaleString()}</span>
        </div>
        <div class="fb-profit-row" style="border-top:1px solid rgba(255,255,255,.1);margin-top:6px;padding-top:10px">
          <span class="fpr-label">📣 Facebook Ad Cost (৳)</span>
          <span class="fpr-value" style="color:#f39c12">- ৳${Math.round(bdtSpent).toLocaleString()}</span>
        </div>
        <div class="fb-profit-row">
          <span class="fpr-label">🏭 Production Cost (${orders} × ৳${(c.unit_production_cost||0).toLocaleString()})</span>
          <span class="fpr-value" style="color:#f39c12">- ৳${Math.round(prodCost).toLocaleString()}</span>
        </div>
        <div class="fb-profit-row">
          <span class="fpr-label">🚚 Delivery Cost (${orders} × ৳${(c.delivery_cost_per_order||0).toLocaleString()})</span>
          <span class="fpr-value" style="color:#f39c12">- ৳${Math.round(delivCost).toLocaleString()}</span>
        </div>
        ${otherCost > 0 ? `<div class="fb-profit-row">
          <span class="fpr-label">➕ Other Costs</span>
          <span class="fpr-value" style="color:#f39c12">- ৳${Math.round(otherCost).toLocaleString()}</span>
        </div>` : ''}
        <div class="fb-profit-row" style="border-top:1px solid rgba(255,255,255,.15);margin-top:6px;padding-top:10px">
          <span class="fpr-label" style="color:rgba(255,255,255,.8)">Total Costs</span>
          <span class="fpr-value" style="color:#e74c3c">- ৳${Math.round(totalCost).toLocaleString()}</span>
        </div>
        <div class="fb-profit-row total-row">
          <span class="fpr-label">Net Profit / Loss</span>
          <span class="fpr-value" style="color:${profit>=0?'#27ae60':'#e74c3c'}">${profit>=0?'✅':'❌'} ৳${Math.round(profit).toLocaleString()}</span>
        </div>
        <div class="fb-profit-row ${profit>=0?'win-row':'loss-row'}">
          <span class="fpr-label">Profit Margin</span>
          <span class="fpr-value">${margin}%</span>
        </div>
        <div class="fb-profit-row">
          <span class="fpr-label">Ad Cost Per Order</span>
          <span class="fpr-value">৳${cpo}</span>
        </div>
        <div class="fb-profit-row">
          <span class="fpr-label">Total Cost Per Order</span>
          <span class="fpr-value">৳${cpoTotal}</span>
        </div>
        <div class="fb-profit-row">
          <span class="fpr-label">ROAS (Revenue / Ad Spend)</span>
          <span class="fpr-value">${roas}x</span>
        </div>
        <div class="fb-profit-row">
          <span class="fpr-label">Break-even Orders Needed</span>
          <span class="fpr-value">${fbBreakEvenOrders(c, rate)} orders</span>
        </div>
      </div>

      ${c.notes ? `<div style="background:rgba(255,255,255,.08);border-radius:8px;padding:10px 14px;margin-top:12px;font-size:13px;color:var(--admin-muted)"><i class="fas fa-sticky-note" style="margin-right:6px;color:#1877f2"></i>${c.notes}</div>` : ''}

      <!-- Action Buttons -->
      <div style="display:flex;gap:10px;margin-top:16px;padding-top:16px;border-top:1px solid #e1e5f5;flex-wrap:wrap">
        <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="fbEditCampaign('${c.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="admin-btn admin-btn-outline admin-btn-sm" onclick="fbDuplicateCampaign('${c.id}')">
          <i class="fas fa-copy"></i> Duplicate
        </button>
        ${(c.actual_orders||0) === 0 ? `
        <button class="admin-btn admin-btn-success admin-btn-sm" onclick="fbRecordActualOrders('${c.id}')">
          <i class="fas fa-check-circle"></i> Record Actual Orders
        </button>` : ''}
        <button class="admin-btn admin-btn-danger admin-btn-sm" style="margin-left:auto" onclick="fbDeleteCampaign('${c.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  </div>`;
}

/* ── Break-even calculator ───────────────────────────────── */
function fbBreakEvenOrders(c, rate) {
  const bdtSpent  = (c.usd_spent||0) * (rate||110);
  const pricePerOrder = c.avg_order_value||0;
  const costPerOrder  = (c.unit_production_cost||0) + (c.delivery_cost_per_order||0);
  const profitPerOrder = pricePerOrder - costPerOrder;
  if (profitPerOrder <= 0) return '∞';
  const needed = Math.ceil(bdtSpent / profitPerOrder);
  return needed;
}

/* ── Toggle campaign expand ──────────────────────────────── */
window.fbToggleCampaign = function(id) {
  const body   = document.getElementById(id);
  const cId    = id.replace('fbc-', '');
  const chev   = document.getElementById(`fbchev-${cId}`);
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (chev) chev.style.transform = isOpen ? 'rotate(180deg)' : '';
};

/* ── Live Calculator ─────────────────────────────────────── */
function fbRenderLiveCalculator() {
  return `
  <div class="admin-card">
    <div class="admin-card-header">
      <div class="admin-card-title"><i class="fas fa-calculator" style="color:#1877f2"></i> Facebook Ad ROI Calculator</div>
      <small style="color:var(--admin-muted)">Fill in values — profit updates live</small>
    </div>
    <div class="admin-card-body padded">
      <div class="fb-calc-panel">

        <!-- USD → BDT Converter -->
        <div style="margin-bottom:24px">
          <div class="fb-calc-section-title"><i class="fab fa-facebook-square"></i> Facebook Ad Spend</div>
          <div class="prod-form-grid">
            <div class="prod-input-group">
              <label>💵 Ad Spend (USD)</label>
              <input type="number" id="fbc_usd" value="100" min="0" oninput="fbLiveCalc()" placeholder="e.g. 100"/>
            </div>
            <div class="prod-input-group">
              <label>💱 Exchange Rate (1 USD = ? BDT)</label>
              <input type="number" id="fbc_rate" value="110" min="1" oninput="fbLiveCalc()" placeholder="e.g. 110"/>
            </div>
            <div class="prod-input-group">
              <label>📦 Predicted Orders This Month</label>
              <input type="number" id="fbc_pred_orders" value="80" min="0" oninput="fbLiveCalc()" placeholder="e.g. 80"/>
            </div>
          </div>
          <!-- BDT display -->
          <div id="fbc_bdt_display" style="background:linear-gradient(135deg,#e8f0fe,#f0f4ff);border:1.5px solid #b8d0fb;border-radius:10px;padding:12px 16px;margin-top:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <div style="font-size:1.2rem">💱</div>
            <div><span style="font-size:13px;color:var(--admin-muted)">Ad spend in BDT: </span><span id="fbc_bdt_val" style="font-size:18px;font-weight:800;color:#1877f2">৳11,000</span></div>
            <div><span style="font-size:13px;color:var(--admin-muted)">Ad cost per order: </span><span id="fbc_cpo_val" style="font-size:16px;font-weight:700;color:#e67e22">৳137.50</span></div>
          </div>
        </div>

        <!-- Per-Order Economics -->
        <div style="margin-bottom:24px">
          <div class="fb-calc-section-title"><i class="fas fa-box-open"></i> Per-Order Economics</div>
          <div class="prod-form-grid">
            <div class="prod-input-group">
              <label>💰 Avg Selling Price / Order (৳)</label>
              <div class="taka"><input type="number" id="fbc_aov" value="1190" min="0" oninput="fbLiveCalc()" placeholder="e.g. 1190"/></div>
            </div>
            <div class="prod-input-group">
              <label>🏭 Production Cost / Unit (৳)</label>
              <div class="taka"><input type="number" id="fbc_prod" value="400" min="0" oninput="fbLiveCalc()" placeholder="e.g. 400"/></div>
            </div>
            <div class="prod-input-group">
              <label>🚚 Delivery / Courier Cost / Order (৳)</label>
              <div class="taka"><input type="number" id="fbc_deliv" value="80" min="0" oninput="fbLiveCalc()" placeholder="e.g. 80"/></div>
            </div>
            <div class="prod-input-group">
              <label>➕ Other Monthly Costs (৳)</label>
              <div class="taka"><input type="number" id="fbc_other" value="0" min="0" oninput="fbLiveCalc()" placeholder="e.g. 500"/></div>
            </div>
          </div>
        </div>

        <!-- Live P&L Result -->
        <div class="fb-profit-result" id="fbLiveResult">
          <h4><i class="fas fa-chart-pie"></i> Live P&L Calculation</h4>
          <div class="fb-profit-row">
            <span class="fpr-label">📣 FB Ad Spend (BDT)</span>
            <span class="fpr-value" id="fbr_ad_bdt">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">📦 Predicted Orders</span>
            <span class="fpr-value" id="fbr_orders">0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">📈 Total Revenue (Orders × AOV)</span>
            <span class="fpr-value" id="fbr_revenue">৳0</span>
          </div>
          <div class="fb-profit-row" style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px">
            <span class="fpr-label">🏭 Total Production Cost</span>
            <span class="fpr-value" id="fbr_prod_total" style="color:#f39c12">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">🚚 Total Delivery Cost</span>
            <span class="fpr-value" id="fbr_deliv_total" style="color:#f39c12">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">📣 Facebook Ad Cost</span>
            <span class="fpr-value" id="fbr_ad_cost" style="color:#f39c12">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">➕ Other Costs</span>
            <span class="fpr-value" id="fbr_other_cost" style="color:#f39c12">৳0</span>
          </div>
          <div class="fb-profit-row" style="border-top:1px solid rgba(255,255,255,.15);margin-top:6px;padding-top:10px">
            <span class="fpr-label" style="color:rgba(255,255,255,.8)">Total Costs</span>
            <span class="fpr-value" id="fbr_total_cost" style="color:#e74c3c">৳0</span>
          </div>
          <div class="fb-profit-row total-row">
            <span class="fpr-label">Net Profit / Loss</span>
            <span class="fpr-value" id="fbr_profit">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">Profit Margin</span>
            <span class="fpr-value" id="fbr_margin">0%</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">ROAS (Revenue ÷ Ad Spend)</span>
            <span class="fpr-value" id="fbr_roas">0x</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">Ad Cost Per Order</span>
            <span class="fpr-value" id="fbr_cpo">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">Total Cost Per Order</span>
            <span class="fpr-value" id="fbr_cpo_total">৳0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">Break-even Orders</span>
            <span class="fpr-value" id="fbr_breakeven">0</span>
          </div>
          <div class="fb-profit-row">
            <span class="fpr-label">Profit Per Order</span>
            <span class="fpr-value" id="fbr_profit_per_order">৳0</span>
          </div>
        </div>

        <button class="admin-btn admin-btn-primary" style="margin-top:16px;width:100%;background:linear-gradient(135deg,#1877f2,#42a5f5);border-color:#1877f2" onclick="fbSaveCalcAsCampaign()">
          <i class="fas fa-save"></i> Save as Campaign
        </button>
      </div>
    </div>
  </div>`;
}

/* ── Live Calc Logic ─────────────────────────────────────── */
window.fbLiveCalc = function() {
  const g   = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
  const usd = g('fbc_usd'), rate = g('fbc_rate'), orders = g('fbc_pred_orders');
  const aov = g('fbc_aov'), prod = g('fbc_prod'), deliv = g('fbc_deliv'), other = g('fbc_other');

  const adBDT       = usd * rate;
  const revenue     = aov * orders;
  const prodTotal   = prod * orders;
  const delivTotal  = deliv * orders;
  const totalCost   = adBDT + prodTotal + delivTotal + other;
  const profit      = revenue - totalCost;
  const margin      = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
  const roas        = adBDT > 0 ? (revenue / adBDT).toFixed(2) : 0;
  const cpo         = orders > 0 ? (adBDT / orders).toFixed(0) : 0;
  const cpoTotal    = orders > 0 ? (totalCost / orders).toFixed(0) : 0;
  const profitPerOrder = orders > 0 ? (profit / orders).toFixed(0) : 0;

  // Break-even
  const profitPerOrderCalc = aov - prod - deliv;
  const breakEven = profitPerOrderCalc > 0 ? Math.ceil(adBDT / profitPerOrderCalc) : '∞';

  const fc  = v => '৳' + Math.round(v).toLocaleString('en-IN');
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = v; };

  // Update BDT banner
  set('fbc_bdt_val', fc(adBDT));
  set('fbc_cpo_val', '৳' + (orders > 0 ? (adBDT/orders).toFixed(0) : 0));

  // Update P&L
  set('fbr_ad_bdt',       fc(adBDT));
  set('fbr_orders',       orders + ' orders');
  set('fbr_revenue',      fc(revenue));
  set('fbr_prod_total',   '- ' + fc(prodTotal));
  set('fbr_deliv_total',  '- ' + fc(delivTotal));
  set('fbr_ad_cost',      '- ' + fc(adBDT));
  set('fbr_other_cost',   '- ' + fc(other));
  set('fbr_total_cost',   '- ' + fc(totalCost));
  set('fbr_profit',       (profit >= 0 ? '✅ ' : '❌ ') + fc(profit));
  set('fbr_margin',       margin + '%');
  set('fbr_roas',         roas + 'x');
  set('fbr_cpo',          '৳' + cpo);
  set('fbr_cpo_total',    '৳' + cpoTotal);
  set('fbr_breakeven',    breakEven + ' orders');
  set('fbr_profit_per_order', fc(profitPerOrder));

  const profEl = document.getElementById('fbr_profit');
  if (profEl) profEl.style.color = profit >= 0 ? '#27ae60' : '#e74c3c';
};

/* ── Analytics Tab ───────────────────────────────────────── */
function fbRenderAnalytics(campaigns) {
  if (campaigns.length === 0) {
    return `<div class="admin-card" style="text-align:center;padding:60px">
      <div style="font-size:48px;margin-bottom:16px">📊</div>
      <p style="color:var(--admin-muted)">No campaign data yet.</p>
    </div>`;
  }

  const rows = campaigns.map(c => {
    const rate      = c.exchange_rate || 110;
    const bdtSpent  = (c.usd_spent||0) * rate;
    const orders    = c.actual_orders || c.predicted_orders || 0;
    const revenue   = (c.avg_order_value||0) * orders;
    const prodCost  = (c.unit_production_cost||0) * orders;
    const delivCost = (c.delivery_cost_per_order||0) * orders;
    const otherCost = c.other_costs_bdt || 0;
    const totalCost = bdtSpent + prodCost + delivCost + otherCost;
    const profit    = revenue - totalCost;
    const margin    = revenue > 0 ? ((profit/revenue)*100).toFixed(1) : 0;
    const roas      = bdtSpent > 0 ? (revenue / bdtSpent).toFixed(2) : 0;
    return { name: c.campaign_name||'Campaign', month: c.month||'—', usd: c.usd_spent||0, bdtSpent, orders, revenue, totalCost, profit, margin, roas };
  });

  return `
  <div class="admin-card" style="margin-bottom:20px">
    <div class="admin-card-header">
      <div class="admin-card-title"><i class="fas fa-table"></i> All Campaigns — P&L Summary</div>
    </div>
    <div class="admin-card-body">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Month</th>
              <th>USD Spent</th>
              <th>BDT Spent</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Total Cost</th>
              <th>Net Profit</th>
              <th>Margin</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
            <tr>
              <td class="cell-bold">${r.name}</td>
              <td>${r.month}</td>
              <td>$${r.usd}</td>
              <td>৳${Math.round(r.bdtSpent).toLocaleString()}</td>
              <td>${r.orders}</td>
              <td>৳${Math.round(r.revenue).toLocaleString()}</td>
              <td>৳${Math.round(r.totalCost).toLocaleString()}</td>
              <td class="${r.profit>=0?'text-success':'text-danger'} font-bold">৳${Math.round(r.profit).toLocaleString()}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  <div style="width:50px;height:5px;background:#e1e5f5;border-radius:3px">
                    <div style="height:100%;border-radius:3px;width:${Math.min(100,Math.max(0,r.margin))}%;background:${r.profit>=0?'var(--success)':'var(--danger)'}"></div>
                  </div>
                  <span class="${r.profit>=0?'text-success':'text-danger'} font-bold">${r.margin}%</span>
                </div>
              </td>
              <td class="font-bold">${r.roas}x</td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr style="background:linear-gradient(135deg,#e8f0fe,#f0f4ff);font-weight:800">
              <td>TOTAL</td>
              <td>—</td>
              <td>$${rows.reduce((s,r)=>s+r.usd,0).toFixed(0)}</td>
              <td>৳${Math.round(rows.reduce((s,r)=>s+r.bdtSpent,0)).toLocaleString()}</td>
              <td>${rows.reduce((s,r)=>s+r.orders,0)}</td>
              <td>৳${Math.round(rows.reduce((s,r)=>s+r.revenue,0)).toLocaleString()}</td>
              <td>৳${Math.round(rows.reduce((s,r)=>s+r.totalCost,0)).toLocaleString()}</td>
              <td class="${rows.reduce((s,r)=>s+r.profit,0)>=0?'text-success':'text-danger'}">৳${Math.round(rows.reduce((s,r)=>s+r.profit,0)).toLocaleString()}</td>
              <td class="${rows.reduce((s,r)=>s+r.profit,0)>=0?'text-success':'text-danger'}">${rows.reduce((s,r)=>s+r.revenue,0)>0?((rows.reduce((s,r)=>s+r.profit,0)/rows.reduce((s,r)=>s+r.revenue,0))*100).toFixed(1):0}%</td>
              <td>${rows.reduce((s,r)=>s+r.bdtSpent,0)>0?(rows.reduce((s,r)=>s+r.revenue,0)/rows.reduce((s,r)=>s+r.bdtSpent,0)).toFixed(2):0}x</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>

  <!-- Charts -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title"><i class="fas fa-chart-bar"></i> Revenue vs Cost vs Profit</div>
      </div>
      <div class="admin-card-body padded" style="height:280px">
        <canvas id="fbProfitChart"></canvas>
      </div>
    </div>
    <div class="admin-card">
      <div class="admin-card-header">
        <div class="admin-card-title"><i class="fas fa-chart-line"></i> ROAS per Campaign</div>
      </div>
      <div class="admin-card-body padded" style="height:280px">
        <canvas id="fbRoasChart"></canvas>
      </div>
    </div>
  </div>`;
}

/* ── Business Guide ──────────────────────────────────────── */
function fbRenderBusinessGuide() {
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

    <div class="admin-card">
      <div class="admin-card-header" style="background:linear-gradient(135deg,#e8f0fe,#f0f4ff)">
        <div class="admin-card-title" style="color:#1877f2"><i class="fab fa-facebook-square"></i> Key Facebook Metrics to Track</div>
      </div>
      <div class="admin-card-body padded">
        <div style="display:flex;flex-direction:column;gap:14px;font-size:14px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#e8f0fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">📊</div>
            <div><strong style="color:var(--brand-navy)">ROAS (Return on Ad Spend)</strong><br/><span style="color:var(--admin-muted)">Revenue ÷ Ad Spend in BDT. Target: <strong style="color:#27ae60">3x or higher</strong>. Below 1.5x is a loss.</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#fff3cd;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">💸</div>
            <div><strong style="color:var(--brand-navy)">CPO (Cost Per Order)</strong><br/><span style="color:var(--admin-muted)">Ad spend ÷ number of orders. Should be much lower than your selling price.</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#d4edda;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">📈</div>
            <div><strong style="color:var(--brand-navy)">Net Profit Margin</strong><br/><span style="color:var(--admin-muted)">Target <strong style="color:#27ae60">20–35%</strong> for e-commerce. Below 10% means you need to cut costs or raise prices.</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#f8d7da;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">⚖️</div>
            <div><strong style="color:var(--brand-navy)">Break-even Orders</strong><br/><span style="color:var(--admin-muted)">Minimum orders needed to cover all costs. Plan your ad budget around this number.</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header" style="background:linear-gradient(135deg,#f0fff4,#e8f8f0)">
        <div class="admin-card-title" style="color:#155724"><i class="fas fa-lightbulb"></i> Pro Tips to Maximize Profit</div>
      </div>
      <div class="admin-card-body padded">
        <div style="display:flex;flex-direction:column;gap:14px;font-size:14px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#d4edda;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">🎯</div>
            <div><strong style="color:var(--brand-navy)">Target Lookalike Audiences</strong><br/><span style="color:var(--admin-muted)">Use your best customer data to create lookalike audiences — lower CPO by 30–50%.</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#fff3cd;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">🔁</div>
            <div><strong style="color:var(--brand-navy)">Retargeting Campaigns</strong><br/><span style="color:var(--admin-muted)">Retarget website visitors & cart abandoners. Usually 4–5x cheaper than cold traffic.</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#e8f0fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">📸</div>
            <div><strong style="color:var(--brand-navy)">A/B Test Creatives</strong><br/><span style="color:var(--admin-muted)">Test 3–5 ad variations per campaign. Winner usually gets 60% of the budget.</span></div>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:8px;background:#f3e8ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px">📅</div>
            <div><strong style="color:var(--brand-navy)">Scale in Small Steps</strong><br/><span style="color:var(--admin-muted)">Increase budget by max 20% every 3–4 days to avoid the Facebook learning phase reset.</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header" style="background:linear-gradient(135deg,#fff8f0,#fff3e0)">
        <div class="admin-card-title" style="color:#856404"><i class="fas fa-calculator"></i> Total Product Cost Formula</div>
      </div>
      <div class="admin-card-body padded">
        <div style="background:#fff;border:1.5px solid #ffd08a;border-radius:12px;padding:18px;font-size:14px;line-height:1.8">
          <div style="font-weight:700;color:var(--brand-navy);margin-bottom:12px">Total Cost Per Unit/Order =</div>
          <div style="padding-left:12px;border-left:3px solid #1877f2;margin-bottom:8px">
            <span style="color:#1877f2;font-weight:600">📣 Facebook Ad Cost Per Order</span><br/>
            <small style="color:var(--admin-muted)">(Total USD × Exchange Rate) ÷ Expected Orders</small>
          </div>
          <div style="text-align:center;font-size:16px;font-weight:700;color:var(--admin-muted);margin:4px 0">+</div>
          <div style="padding-left:12px;border-left:3px solid #27ae60;margin-bottom:8px">
            <span style="color:#27ae60;font-weight:600">🏭 Production / Manufacturing Cost</span>
          </div>
          <div style="text-align:center;font-size:16px;font-weight:700;color:var(--admin-muted);margin:4px 0">+</div>
          <div style="padding-left:12px;border-left:3px solid #e67e22;margin-bottom:8px">
            <span style="color:#e67e22;font-weight:600">🚚 Delivery / Courier Cost</span>
          </div>
          <div style="text-align:center;font-size:16px;font-weight:700;color:var(--admin-muted);margin:4px 0">+</div>
          <div style="padding-left:12px;border-left:3px solid #9b59b6;margin-bottom:12px">
            <span style="color:#9b59b6;font-weight:600">➕ Other Overheads (packaging, etc.)</span>
          </div>
          <div style="background:linear-gradient(135deg,#0f1224,#1a1f3a);color:#fff;border-radius:8px;padding:12px;text-align:center">
            <div style="font-size:11px;color:rgba(255,255,255,.6);margin-bottom:4px">PROFIT PER ORDER =</div>
            <div style="font-size:16px;font-weight:800">Selling Price − Total Cost Per Order</div>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-card">
      <div class="admin-card-header" style="background:linear-gradient(135deg,#f5f0ff,#f0f4ff)">
        <div class="admin-card-title" style="color:#6f42c1"><i class="fas fa-chart-pie"></i> Healthy Business Benchmarks</div>
      </div>
      <div class="admin-card-body padded">
        <div style="display:flex;flex-direction:column;gap:10px;font-size:14px">
          ${[
            ['ROAS', '3x – 5x', 'green', 'Revenue is 3–5x your ad spend'],
            ['Net Profit Margin', '20% – 35%', 'green', 'After ALL costs including ads'],
            ['Ad Spend % of Revenue', '15% – 30%', 'orange', 'Keep FB ads under 30% of revenue'],
            ['CPO (Cost per Order)', '< ৳200', 'blue', 'Lower = more efficient ads'],
            ['Predicted vs Actual', '> 70%', 'purple', 'Prediction accuracy benchmark'],
            ['Break-even Orders', '< 30% of target', 'green', 'Hit break-even early in the month'],
          ].map(([metric, target, color, desc]) => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px;background:#f8f9ff;border-radius:8px">
            <div style="flex:1">
              <div style="font-weight:700;color:var(--brand-navy)">${metric}</div>
              <div style="font-size:12px;color:var(--admin-muted)">${desc}</div>
            </div>
            <div class="fb-pill fb-pill-${color}" style="white-space:nowrap;font-size:13px">${target}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>

  </div>`;
}

/* ── Tab Switch ──────────────────────────────────────────── */
window.fbSwitchTab = function(tab, btn) {
  ['campaigns','calculator','analytics','guide'].forEach(t => {
    const el = document.getElementById(`fbTab-${t}`);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.fb-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (tab === 'analytics') {
    setTimeout(async () => {
      const campaigns = await API.getAll('lc_fb_campaigns');
      const labels  = campaigns.map(c => c.campaign_name||'Camp');
      const rates   = campaigns.map(c => c.exchange_rate||110);
      const bdts    = campaigns.map((c,i) => (c.usd_spent||0) * rates[i]);
      const orders  = campaigns.map(c => c.actual_orders || c.predicted_orders || 0);
      const aovs    = campaigns.map(c => c.avg_order_value||0);
      const revs    = campaigns.map((c,i) => aovs[i] * orders[i]);
      const prods   = campaigns.map((c,i) => (c.unit_production_cost||0) * orders[i]);
      const delivs  = campaigns.map((c,i) => (c.delivery_cost_per_order||0) * orders[i]);
      const others  = campaigns.map(c => c.other_costs_bdt||0);
      const costs   = campaigns.map((c,i) => bdts[i] + prods[i] + delivs[i] + others[i]);
      const profits = campaigns.map((c,i) => revs[i] - costs[i]);
      const roas    = campaigns.map((c,i) => bdts[i] > 0 ? parseFloat((revs[i]/bdts[i]).toFixed(2)) : 0);

      // Profit chart
      const ctx1 = document.getElementById('fbProfitChart');
      if (ctx1) {
        if (window._fbProfitChart) window._fbProfitChart.destroy();
        window._fbProfitChart = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Revenue',    data: revs,    backgroundColor: 'rgba(27,188,156,0.7)',  borderRadius: 6 },
              { label: 'Total Cost', data: costs,   backgroundColor: 'rgba(231,76,60,0.6)',   borderRadius: 6 },
              { label: 'Net Profit', data: profits, backgroundColor: 'rgba(39,174,96,0.9)',   borderRadius: 6 },
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { ticks: { callback: v => '৳' + v.toLocaleString() } } }
          }
        });
      }

      // ROAS chart
      const ctx2 = document.getElementById('fbRoasChart');
      if (ctx2) {
        if (window._fbRoasChart) window._fbRoasChart.destroy();
        window._fbRoasChart = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'ROAS', data: roas, backgroundColor: roas.map(r => r >= 3 ? 'rgba(39,174,96,0.8)' : r >= 1.5 ? 'rgba(243,156,18,0.8)' : 'rgba(231,76,60,0.8)'), borderRadius: 6 }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
              y: { ticks: { callback: v => v + 'x' }, suggestedMin: 0, suggestedMax: Math.max(5, ...roas) + 1 }
            }
          }
        });
      }
    }, 100);
  }

  if (tab === 'calculator') {
    setTimeout(fbLiveCalc, 200);
  }
};

/* ── New Campaign Form ───────────────────────────────────── */
window.fbOpenNewCampaignForm = function(prefill = {}) {
  const today = new Date().toISOString().slice(0,7); // YYYY-MM
  openModal('New Facebook Campaign', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="admin-form-group" style="grid-column:1/-1">
        <label class="admin-form-label">📣 Campaign Name *</label>
        <input id="fc_name" class="admin-input" value="${prefill.campaign_name||''}" placeholder="e.g. Eid Collection Launch"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">📅 Month / Period</label>
        <input id="fc_month" type="month" class="admin-input" value="${prefill.month||today}"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">🏷️ Campaign Status</label>
        <select id="fc_status" class="admin-input">
          <option value="active" ${prefill.status==='active'?'selected':''}>Active</option>
          <option value="completed" ${prefill.status==='completed'?'selected':''}>Completed</option>
          <option value="paused" ${prefill.status==='paused'?'selected':''}>Paused</option>
        </select>
      </div>
    </div>

    <hr style="margin:14px 0;border-color:#e1e5f5"/>
    <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#1877f2;margin-bottom:12px"><i class="fab fa-facebook-square"></i> Ad Budget</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="admin-form-group">
        <label class="admin-form-label">💵 Ad Spend (USD) *</label>
        <input id="fc_usd" type="number" class="admin-input" value="${prefill.usd_spent||100}" min="0" placeholder="e.g. 100"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">💱 Exchange Rate (1 USD = ? BDT)</label>
        <input id="fc_rate" type="number" class="admin-input" value="${prefill.exchange_rate||110}" min="1" placeholder="e.g. 110"/>
      </div>
    </div>
    <div id="fc_bdt_preview" style="background:#e8f0fe;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;font-weight:600;color:#1877f2">
      = ৳${((prefill.usd_spent||100)*(prefill.exchange_rate||110)).toLocaleString()} BDT
    </div>

    <hr style="margin:14px 0;border-color:#e1e5f5"/>
    <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#1877f2;margin-bottom:12px"><i class="fas fa-shopping-cart"></i> Orders & Pricing</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="admin-form-group">
        <label class="admin-form-label">📦 Predicted Orders</label>
        <input id="fc_pred" type="number" class="admin-input" value="${prefill.predicted_orders||80}" min="0" placeholder="e.g. 80"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">✅ Actual Orders (leave 0 if not done)</label>
        <input id="fc_actual" type="number" class="admin-input" value="${prefill.actual_orders||0}" min="0" placeholder="Fill after campaign"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">💰 Avg Order Value (৳)</label>
        <input id="fc_aov" type="number" class="admin-input" value="${prefill.avg_order_value||1190}" min="0" placeholder="e.g. 1190"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">🏭 Production Cost / Unit (৳)</label>
        <input id="fc_prod" type="number" class="admin-input" value="${prefill.unit_production_cost||400}" min="0" placeholder="e.g. 400"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">🚚 Delivery Cost / Order (৳)</label>
        <input id="fc_deliv" type="number" class="admin-input" value="${prefill.delivery_cost_per_order||80}" min="0" placeholder="e.g. 80"/>
      </div>
      <div class="admin-form-group">
        <label class="admin-form-label">➕ Other Monthly Costs (৳)</label>
        <input id="fc_other" type="number" class="admin-input" value="${prefill.other_costs_bdt||0}" min="0" placeholder="e.g. 500"/>
      </div>
    </div>

    <div class="admin-form-group">
      <label class="admin-form-label">📝 Notes</label>
      <textarea id="fc_notes" class="admin-input admin-textarea" rows="2" placeholder="Campaign notes…">${prefill.notes||''}</textarea>
    </div>
  `,
  `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
   <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#1877f2,#42a5f5);border-color:#1877f2" onclick="fbSaveCampaign()"><i class="fas fa-save"></i> Save Campaign</button>`
  );

  // Live BDT preview inside modal
  setTimeout(() => {
    const usdEl  = document.getElementById('fc_usd');
    const rateEl = document.getElementById('fc_rate');
    const prev   = document.getElementById('fc_bdt_preview');
    const update = () => {
      if (!prev || !usdEl || !rateEl) return;
      const v = (parseFloat(usdEl.value)||0) * (parseFloat(rateEl.value)||0);
      prev.textContent = `= ৳${Math.round(v).toLocaleString()} BDT`;
    };
    if (usdEl)  usdEl.addEventListener('input', update);
    if (rateEl) rateEl.addEventListener('input', update);
  }, 100);
};

window.fbSaveCampaign = async function() {
  const name = document.getElementById('fc_name')?.value?.trim();
  if (!name) { Toast.error('Campaign name is required.'); return; }
  const g = id => parseFloat(document.getElementById(id)?.value || 0) || 0;
  const usd  = g('fc_usd');
  const rate = g('fc_rate');
  try {
    await API.post('lc_fb_campaigns', {
      campaign_name:          name,
      month:                  document.getElementById('fc_month')?.value || '',
      status:                 document.getElementById('fc_status')?.value || 'active',
      usd_spent:              usd,
      exchange_rate:          rate,
      bdt_spent:              usd * rate,
      predicted_orders:       g('fc_pred'),
      actual_orders:          g('fc_actual'),
      avg_order_value:        g('fc_aov'),
      unit_production_cost:   g('fc_prod'),
      delivery_cost_per_order:g('fc_deliv'),
      other_costs_bdt:        g('fc_other'),
      notes:                  document.getElementById('fc_notes')?.value || '',
    });
    Toast.success('Campaign saved! 🎉');
    closeModal();
    AdminSections.facebook();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

/* ── Edit Campaign ───────────────────────────────────────── */
window.fbEditCampaign = async function(id) {
  try {
    const c = await API.getOne('lc_fb_campaigns', id);
    const today = new Date().toISOString().slice(0,7);
    openModal('Edit Campaign', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="admin-form-group" style="grid-column:1/-1">
          <label class="admin-form-label">📣 Campaign Name *</label>
          <input id="ec_name" class="admin-input" value="${c.campaign_name||''}"/>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">📅 Month / Period</label>
          <input id="ec_month" type="month" class="admin-input" value="${c.month||today}"/>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">🏷️ Status</label>
          <select id="ec_status" class="admin-input">
            ${['active','completed','paused'].map(s=>`<option value="${s}" ${c.status===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
      <hr style="margin:14px 0;border-color:#e1e5f5"/>
      <div style="font-weight:700;font-size:12px;text-transform:uppercase;color:#1877f2;margin-bottom:12px"><i class="fab fa-facebook-square"></i> Ad Budget</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="admin-form-group">
          <label class="admin-form-label">💵 USD Spent</label>
          <input id="ec_usd" type="number" class="admin-input" value="${c.usd_spent||0}" min="0"/>
        </div>
        <div class="admin-form-group">
          <label class="admin-form-label">💱 Exchange Rate (1 USD = ? BDT)</label>
          <input id="ec_rate" type="number" class="admin-input" value="${c.exchange_rate||110}" min="1"/>
        </div>
      </div>
      <div id="ec_bdt_preview" style="background:#e8f0fe;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;font-weight:600;color:#1877f2">
        = ৳${Math.round((c.usd_spent||0)*(c.exchange_rate||110)).toLocaleString()} BDT
      </div>
      <hr style="margin:14px 0;border-color:#e1e5f5"/>
      <div style="font-weight:700;font-size:12px;text-transform:uppercase;color:#1877f2;margin-bottom:12px"><i class="fas fa-shopping-cart"></i> Orders & Pricing</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="admin-form-group"><label class="admin-form-label">📦 Predicted Orders</label><input id="ec_pred" type="number" class="admin-input" value="${c.predicted_orders||0}"/></div>
        <div class="admin-form-group"><label class="admin-form-label">✅ Actual Orders</label><input id="ec_actual" type="number" class="admin-input" value="${c.actual_orders||0}"/></div>
        <div class="admin-form-group"><label class="admin-form-label">💰 Avg Order Value (৳)</label><input id="ec_aov" type="number" class="admin-input" value="${c.avg_order_value||0}"/></div>
        <div class="admin-form-group"><label class="admin-form-label">🏭 Production Cost/Unit (৳)</label><input id="ec_prod" type="number" class="admin-input" value="${c.unit_production_cost||0}"/></div>
        <div class="admin-form-group"><label class="admin-form-label">🚚 Delivery Cost/Order (৳)</label><input id="ec_deliv" type="number" class="admin-input" value="${c.delivery_cost_per_order||0}"/></div>
        <div class="admin-form-group"><label class="admin-form-label">➕ Other Costs (৳)</label><input id="ec_other" type="number" class="admin-input" value="${c.other_costs_bdt||0}"/></div>
      </div>
      <div class="admin-form-group"><label class="admin-form-label">📝 Notes</label><textarea id="ec_notes" class="admin-input admin-textarea" rows="2">${c.notes||''}</textarea></div>
    `,
    `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
     <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#1877f2,#42a5f5);border-color:#1877f2" onclick="fbUpdateCampaign('${id}')"><i class="fas fa-save"></i> Update</button>`
    );

    setTimeout(() => {
      const usdEl  = document.getElementById('ec_usd');
      const rateEl = document.getElementById('ec_rate');
      const prev   = document.getElementById('ec_bdt_preview');
      const update = () => {
        if (!prev || !usdEl || !rateEl) return;
        const v = (parseFloat(usdEl.value)||0) * (parseFloat(rateEl.value)||0);
        prev.textContent = `= ৳${Math.round(v).toLocaleString()} BDT`;
      };
      if (usdEl)  usdEl.addEventListener('input', update);
      if (rateEl) rateEl.addEventListener('input', update);
    }, 100);
  } catch(e) { Toast.error('Failed to load campaign: ' + e.message); }
};

window.fbUpdateCampaign = async function(id) {
  const name = document.getElementById('ec_name')?.value?.trim();
  if (!name) { Toast.error('Campaign name is required.'); return; }
  const g = elId => parseFloat(document.getElementById(elId)?.value || 0) || 0;
  const usd = g('ec_usd'), rate = g('ec_rate');
  try {
    await API.put('lc_fb_campaigns', id, {
      campaign_name:           name,
      month:                   document.getElementById('ec_month')?.value || '',
      status:                  document.getElementById('ec_status')?.value || 'active',
      usd_spent:               usd,
      exchange_rate:           rate,
      bdt_spent:               usd * rate,
      predicted_orders:        g('ec_pred'),
      actual_orders:           g('ec_actual'),
      avg_order_value:         g('ec_aov'),
      unit_production_cost:    g('ec_prod'),
      delivery_cost_per_order: g('ec_deliv'),
      other_costs_bdt:         g('ec_other'),
      notes:                   document.getElementById('ec_notes')?.value || '',
    });
    Toast.success('Campaign updated! ✓');
    closeModal();
    AdminSections.facebook();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

/* ── Record Actual Orders ────────────────────────────────── */
window.fbRecordActualOrders = function(id) {
  openModal('Record Actual Orders',`
    <div class="admin-form-group">
      <label class="admin-form-label">✅ Actual Orders Received</label>
      <input id="fa_actual" type="number" class="admin-input" value="0" min="0" placeholder="e.g. 72"/>
      <small style="color:var(--admin-muted);margin-top:4px;display:block">Enter the real number of orders you received from this campaign</small>
    </div>
  `,
  `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
   <button class="admin-btn admin-btn-success" onclick="fbSaveActualOrders('${id}')"><i class="fas fa-check-circle"></i> Save Actual Orders</button>`
  );
};

window.fbSaveActualOrders = async function(id) {
  const actual = parseInt(document.getElementById('fa_actual')?.value || 0) || 0;
  try {
    await API.patch('lc_fb_campaigns', id, { actual_orders: actual });
    Toast.success('Actual orders recorded! ✓');
    closeModal();
    AdminSections.facebook();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

/* ── Quick Exchange Rate Update ──────────────────────────── */
window.fbUpdateExchangeRate = function() {
  openModal('Update Exchange Rate', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:48px;margin-bottom:8px">💱</div>
      <p style="color:var(--admin-muted)">Update the exchange rate for new campaigns. Existing campaigns keep their own rate.</p>
    </div>
    <div class="admin-form-group">
      <label class="admin-form-label">1 USD = ? BDT</label>
      <input id="ur_rate" type="number" class="admin-input" value="110" min="1" placeholder="e.g. 140" style="font-size:20px;font-weight:800;text-align:center"/>
    </div>
    <div id="ur_preview" style="background:#e8f0fe;border-radius:8px;padding:12px;text-align:center;font-weight:700;color:#1877f2;font-size:16px">$100 USD = ৳11,000</div>
  `,
  `<button class="admin-btn admin-btn-outline" onclick="closeModal()">Cancel</button>
   <button class="admin-btn admin-btn-primary" style="background:linear-gradient(135deg,#1877f2,#42a5f5);border-color:#1877f2" onclick="fbApplyExchangeRate()">Apply to Calculator</button>`
  );
  setTimeout(() => {
    const rateEl = document.getElementById('ur_rate');
    const prev   = document.getElementById('ur_preview');
    if (rateEl && prev) {
      rateEl.addEventListener('input', () => {
        const r = parseFloat(rateEl.value)||0;
        prev.textContent = `$100 USD = ৳${Math.round(100*r).toLocaleString()}`;
      });
    }
  }, 100);
};

window.fbApplyExchangeRate = function() {
  const rate = parseFloat(document.getElementById('ur_rate')?.value || 0);
  if (!rate) { Toast.error('Please enter a valid rate.'); return; }
  // Pre-fill calculator rate
  const calcEl = document.getElementById('fbc_rate');
  if (calcEl) { calcEl.value = rate; fbLiveCalc(); }
  Toast.success(`Exchange rate set to 1 USD = ৳${rate}`);
  closeModal();
};

/* ── Duplicate ───────────────────────────────────────────── */
window.fbDuplicateCampaign = async function(id) {
  try {
    const c = await API.getOne('lc_fb_campaigns', id);
    delete c.id;
    c.campaign_name = (c.campaign_name||'Campaign') + ' (Copy)';
    c.status = 'active';
    c.actual_orders = 0;
    await API.post('lc_fb_campaigns', c);
    Toast.success('Campaign duplicated!');
    AdminSections.facebook();
  } catch(e) { Toast.error('Failed: ' + e.message); }
};

/* ── Delete ──────────────────────────────────────────────── */
window.fbDeleteCampaign = function(id) {
  showConfirm('Delete Campaign', 'This will permanently delete this campaign and all its data.', async () => {
    try {
      await API.delete('lc_fb_campaigns', id);
      Toast.success('Campaign deleted.');
      AdminSections.facebook();
    } catch(e) { Toast.error('Failed: ' + e.message); }
  });
};
