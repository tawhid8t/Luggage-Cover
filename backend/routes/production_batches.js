// ============================================================
// PRODUCTION BATCHES ROUTES — /api/production_batches
// ============================================================
const express = require('express');
const router = express.Router();
const ProductionBatch = require('../models/ProductionBatch');
const { protect, authorize } = require('../middleware/auth');

// Get all production batches
router.get('/', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { batch_name: { $regex: search, $options: 'i' } },
        { design_codes: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ProductionBatch.countDocuments(query);
    const batches = await ProductionBatch.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ success: true, count: batches.length, total, page: parseInt(page), data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get single production batch
router.get('/:id', async (req, res) => {
  try {
    const batch = await ProductionBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create production batch
router.post('/', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    const batch = await ProductionBatch.create(req.body);
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Update production batch
router.patch('/:id', protect, authorize('admin', 'manager', 'accountant'), async (req, res) => {
  try {
    console.log("[production_batches PATCH] req.body:", JSON.stringify(req.body));
    const batch = await ProductionBatch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, data: batch });
  } catch (err) {
    console.error("[production_batches PATCH] Error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Delete production batch (no auth for now)
router.delete('/:id', async (req, res) => {
  try {
    const batch = await ProductionBatch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    res.json({ success: true, message: 'Batch deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;