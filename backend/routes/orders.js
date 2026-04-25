// ============================================================
// ORDERS ROUTES — /api/orders
// ============================================================
const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const Customer = require('../models/Customer');
const Product  = require('../models/Product');
const Inventory = require('../models/Inventory');
const Setting  = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

// ─── HELPERS ─────────────────────────────────────────────────
async function getSettingValue(key, fallback) {
  const s = await Setting.findOne({ key });
  return s ? s.value : fallback;
}

async function applyDiscount(subtotal, totalQty) {
  const enabled  = await getSettingValue('promo_bulk_enabled', true);
  const minQty   = await getSettingValue('promo_bulk_qty', 4);
  const pct      = await getSettingValue('promo_bulk_percent', 15);
  if (enabled && totalQty >= minQty) {
    return Math.round(subtotal * pct / 100);
  }
  return 0;
}

// ─── PUBLIC: Create order (customer checkout) ────────────────
router.post('/', async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, shippingAddress, district, area, items, paymentMethod, orderNotes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    // Validate items and compute totals from DB prices (never trust client prices)
    let subtotal = 0;
    const validatedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.status !== 'active') {
        return res.status(400).json({ success: false, message: `Product not available: ${item.productName}` });
      }
      const stock = product.getStockForSize(item.size);
      if (stock < item.qty) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name} (${item.size}).` });
      }
      const price = product.getPriceForSize(item.size);
      const total = price * item.qty;
      subtotal += total;
      validatedItems.push({
        productId: product._id, productName: product.name, productCode: product.code,
        imageUrl: product.imageUrl || '', size: item.size.toLowerCase(), qty: item.qty,
        price, total,
      });
    }

    const totalQty      = validatedItems.reduce((s, i) => s + i.qty, 0);
    const discountAmount = await applyDiscount(subtotal, totalQty);
    const isDhaka        = (district || '').toLowerCase().includes('dhaka');
    const dhakaCharge    = await getSettingValue('delivery_charge_dhaka', 60);
    const outsideCharge  = await getSettingValue('delivery_charge_outside', 120);
    const deliveryCharge = isDhaka ? dhakaCharge : outsideCharge;
    const totalAmount    = subtotal - discountAmount + deliveryCharge;

    const order = await Order.create({
      customerName, customerPhone, customerEmail, shippingAddress, district, area,
      items: validatedItems, subtotal, discountAmount, deliveryCharge, totalAmount,
      paymentMethod: paymentMethod || 'cod', orderNotes,
      statusHistory: [{ status: 'new', note: 'Order placed by customer', timestamp: new Date() }],
    });

    // Deduct stock
    for (const item of validatedItems) {
      const stockKey = `stock${item.size.charAt(0).toUpperCase() + item.size.slice(1)}`;
      await Product.findByIdAndUpdate(item.productId, { $inc: { [stockKey]: -item.qty, totalSold: item.qty } });
      await Inventory.create({
        productId: item.productId, productName: item.productName, productCode: item.productCode,
        size: item.size, transactionType: 'sale', quantity: -item.qty,
        reference: order.orderNumber, notes: `Order: ${order.orderNumber}`,
      });
    }

    // Upsert customer
    await Customer.findOneAndUpdate(
      { phone: customerPhone },
      { $set: { name: customerName, email: customerEmail, district, lastOrderAt: new Date() },
        $inc: { totalOrders: 1, totalSpent: totalAmount } },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Get all orders ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, payment, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.orderStatus = status;
    if (payment && payment !== 'all') query.paymentMethod = payment;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, count: orders.length, total, page: parseInt(page), data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Get single order ──────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Update order status ───────────────────────────────
router.patch('/:id/status', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { orderStatus, note, courierName, trackingNumber, staffNotes, orderDate } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.statusHistory.push({ status: orderStatus, note: note || '', changedBy: req.user.username, timestamp: new Date() });
    order.orderStatus = orderStatus;
    if (courierName)    order.courierName    = courierName;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (staffNotes)     order.staffNotes     = staffNotes;
    if (orderDate) {
      order.createdAt = new Date(orderDate);
    }

    // If cancelled before shipping — restore stock
    if (orderStatus === 'cancelled') {
      for (const item of order.items) {
        const stockKey = `stock${item.size.charAt(0).toUpperCase() + item.size.slice(1)}`;
        await Product.findByIdAndUpdate(item.productId, { $inc: { [stockKey]: item.qty } });
        await Inventory.create({
          productId: item.productId, productName: item.productName, productCode: item.productCode,
          size: item.size, transactionType: 'return', quantity: item.qty,
          reference: order.orderNumber, notes: `Cancelled order: ${order.orderNumber}`,
        });
      }
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Update payment status ────────────────────────────
router.patch('/:id/payment', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const { paymentStatus, paymentReference } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { paymentStatus, paymentReference } },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── ADMIN: Delete order ──────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;