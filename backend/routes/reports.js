const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

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
