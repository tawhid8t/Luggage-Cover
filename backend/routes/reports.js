const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// ============================================================
// SIMPLE CACHE with TTL
// ============================================================
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Cleanup old entries
  if (cache.size > 20) {
    const oldest = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) cache.delete(oldest[0]);
  }
}

// ============================================================
// DATE FILTER HELPERS
// ============================================================
function getDateRange(period, customStart, customEnd) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };
    }
    case 'week': {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 6);
      return { start: weekStart, end: now };
    }
    case 'month': {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: monthStart, end: now };
    }
    case 'quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
      return { start: quarterStart, end: now };
    }
    case 'year': {
      const yearStart = new Date(today.getFullYear(), 0, 1);
      return { start: yearStart, end: now };
    }
    case 'custom':
      return { start: new Date(customStart), end: new Date(customEnd) };
    default: // 'all'
      return { start: null, end: null };
  }
}

function aggregateByPeriod(orders, period) {
  const grouped = {};
  
  orders.forEach(order => {
    const date = order.createdAt ? new Date(order.createdAt) : null;
    if (!date) return;
    
    let key;
    if (period === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (period === 'year') {
      key = String(date.getFullYear());
    }
    
    if (!grouped[key]) {
      grouped[key] = { orders: 0, revenue: 0, qty: 0 };
    }
    grouped[key].orders++;
    grouped[key].revenue += order.totalAmount || 0;
    grouped[key].qty += (order.items || []).reduce((s, i) => s + (i.qty || 0), 0);
  });
  
  return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
}

// ============================================================
// AGGREGATION ENDPOINT with date filtering
// ============================================================
router.get('/aggregate', protect, async (req, res) => {
  try {
    const { period = 'all', groupBy = 'day', status, paymentMethod, nocache, start, end } = req.query;
    const cacheKey = `aggregate:${period}:${groupBy}:${status}:${paymentMethod}:${start}:${end}`;
    
    // Check cache
    if (!nocache) {
      const cached = getCached(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, cached: true });
      }
    }
    
    const { start: startDate, end: endDate } = getDateRange(period, start, end);
    
    // Build query
    const query = {};
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (status && status !== 'all') {
      query.orderStatus = status;
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query.paymentMethod = paymentMethod;
    }
    
    // Optimized: use lean() for faster queries, select only needed fields
    const orders = await require('../models/Order')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();
    
    // Pre-compute aggregations
    const delivered = orders.filter(o => o.orderStatus === 'delivered');
    const totalRevenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.orderStatus === 'new').length;
    const pendingOrders = orders.filter(o => ['new', 'confirmed', 'packing', 'packed'].includes(o.orderStatus)).length;
    const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled').length;
    const returnedOrders = orders.filter(o => ['return_requested', 'returned', 'refunded'].includes(o.orderStatus)).length;
    
    // Status breakdown
    const byStatus = {};
    orders.forEach(o => {
      byStatus[o.orderStatus] = (byStatus[o.orderStatus] || 0) + 1;
    });
    
    // Payment breakdown
    const byPayment = {};
    orders.forEach(o => {
      byPayment[o.paymentMethod] = (byPayment[o.paymentMethod] || 0) + 1;
    });
    
    // Group by period
    const timeSeries = groupBy && groupBy !== 'none' ? aggregateByPeriod(delivered, groupBy) : [];
    
    // Product performance (top sellers)
    const productSales = {};
    delivered.forEach(order => {
      (order.items || []).forEach(item => {
        const code = item.productCode || 'unknown';
        if (!productSales[code]) {
          productSales[code] = { name: item.productName, code, qty: 0, revenue: 0 };
        }
        productSales[code].qty += item.qty || 0;
        productSales[code].revenue += item.total || 0;
      });
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    const resultData = {
      period,
      dateRange: { start: startDate?.toISOString(), end: endDate?.toISOString() },
      stats: {
        totalRevenue,
        totalOrders,
        newOrders,
        pendingOrders,
        deliveredOrders: delivered.length,
        cancelledOrders,
        returnedOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / delivered.length) : 0,
      },
      byStatus,
      byPayment,
      timeSeries,
      topProducts,
    };
    
    // Cache the result
    setCache(cacheKey, resultData);
    
    res.json({ success: true, data: resultData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Original summary endpoint (kept for compatibility)
router.get('/summary', protect, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const Customer = require('../models/Customer');

    const orders = await Order.find().lean();
    const delivered = orders.filter(o => o.orderStatus === 'delivered');

    const totalRevenue = delivered.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => o.orderStatus === 'new').length;
    const totalCustomers = await Customer.countDocuments();

    const byStatus = {};
    orders.forEach(o => {
      byStatus[o.orderStatus] = (byStatus[o.orderStatus] || 0) + 1;
    });

    const byPayment = {};
    orders.forEach(o => {
      byPayment[o.paymentMethod] = (byPayment[o.paymentMethod] || 0) + 1;
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        return o.createdAt.toISOString().startsWith(key);
      });
      return { date: key, orders: dayOrders.length, revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) };
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        newOrders,
        totalCustomers,
        byStatus,
        byPayment,
        last7Days,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
