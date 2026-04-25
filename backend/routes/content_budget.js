// ============================================================
// CONTENT BUDGET ROUTES — /api/content_budget
// ============================================================
const express       = require('express');
const router      = express.Router();
const ContentBudget = require('../models/ContentBudget');
const { protect, authorize } = require('../middleware/auth');

// ─── GET all entries ───────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { category, status, month, limit = 200 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (status)  query.status  = status;
    if (month)   query.month   = month;

    const entries = await ContentBudget.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: entries.length, total: entries.length, data: entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET single entry ───────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const entry = await ContentBudget.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST create entry ─────────────────────────────
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;

    if (data.amount_bdt && data.amount_bdt > 0) {
      data.effective_bdt = data.amount_bdt;
    } else if (data.amount_usd && data.exchange_rate) {
      data.effective_bdt = data.amount_usd * data.exchange_rate;
    }

    const entry = await ContentBudget.create(data);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PATCH update entry ───────────────────────────
router.patch('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;

    if (data.amount_bdt && data.amount_bdt > 0) {
      data.effective_bdt = data.amount_bdt;
    } else if (data.amount_usd && data.exchange_rate) {
      data.effective_bdt = data.amount_usd * data.exchange_rate;
    }

    const entry = await ContentBudget.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE entry ───────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const entry = await ContentBudget.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found.' });
    res.json({ success: true, message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;