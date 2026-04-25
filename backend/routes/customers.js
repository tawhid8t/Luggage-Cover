const express  = require('express');
const router   = express.Router();
const Customer = require('../models/Customer');
const Order    = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query).sort({ totalSpent: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, count: customers.length, total, data: customers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    const orders = await Order.find({ customerPhone: customer.phone }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: customer, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id', protect, authorize('admin', 'manager', 'support'), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
    res.json({ success: true, data: customer });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
