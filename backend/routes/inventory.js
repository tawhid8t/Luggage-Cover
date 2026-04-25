const express   = require('express');
const router    = express.Router();
const Inventory = require('../models/Inventory');
const Product   = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { productId, page = 1, limit = 50 } = req.query;
    const query = productId ? { productId } : {};
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inventory.countDocuments(query);
    const logs  = await Inventory.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, total, data: logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Restock or adjust a product variant
router.post('/adjust', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { productId, size, transactionType, quantity, notes } = req.body;
    if (!productId || !size || !transactionType || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'productId, size, transactionType, quantity are required.' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const stockKey = `stock${size.charAt(0).toUpperCase() + size.slice(1)}`;
    const isPositive = ['restock', 'return'].includes(transactionType);
    const delta = isPositive ? Math.abs(quantity) : -Math.abs(quantity);
    const newStock = Math.max(0, (product[stockKey] || 0) + delta);

    await Product.findByIdAndUpdate(productId, { $set: { [stockKey]: newStock } });

    const log = await Inventory.create({
      productId, productName: product.name, productCode: product.code,
      size: size.toLowerCase(), transactionType, quantity: delta,
      notes, doneBy: req.user.username,
    });

    res.status(201).json({ success: true, data: log, newStock });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// Bulk restock (set absolute stock values)
router.post('/restock', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { productId, stockSmall, stockMedium, stockLarge, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const updates = {};
    const logs = [];
    const sizes = [
      { key: 'stockSmall', size: 'small', newVal: stockSmall },
      { key: 'stockMedium', size: 'medium', newVal: stockMedium },
      { key: 'stockLarge', size: 'large', newVal: stockLarge },
    ];
    for (const s of sizes) {
      if (s.newVal !== undefined && s.newVal !== null) {
        const delta = s.newVal - (product[s.key] || 0);
        updates[s.key] = s.newVal;
        if (delta !== 0) {
          logs.push({
            productId, productName: product.name, productCode: product.code,
            size: s.size, transactionType: 'restock', quantity: delta,
            notes: notes || 'Manual restock', doneBy: req.user.username,
          });
        }
      }
    }

    await Product.findByIdAndUpdate(productId, { $set: updates });
    if (logs.length) await Inventory.insertMany(logs);

    const updated = await Product.findById(productId);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
