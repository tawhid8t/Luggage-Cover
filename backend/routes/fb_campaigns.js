// ============================================================
// FB CAMPAIGNS ROUTES — /api/fb_campaigns
// ============================================================
const express   = require('express');
const router    = express.Router();
const FBCampaign = require('../models/FBCampaign');
const { protect, authorize } = require('../middleware/auth');

// ─── GET all campaigns ──────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { status, limit = 200 } = req.query;
    const query = {};
    if (status) query.status = status;

    const campaigns = await FBCampaign.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: campaigns.length, total: campaigns.length, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET single campaign ────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const campaign = await FBCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST create campaign ─────────────────────────────
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;
    if (!data.campaign_name) {
      return res.status(400).json({ success: false, message: 'campaign_name is required.' });
    }

    // Auto-calculate bdt_spent if not provided
    if (data.usd_spent && data.exchange_rate && !data.bdt_spent) {
      data.bdt_spent = data.usd_spent * data.exchange_rate;
    }

    const campaign = await FBCampaign.create(data);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── PATCH update campaign ────────────────────────
router.patch('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const data = req.body;

    // Auto-update bdt_spent if exchange rate or usd changes
    if (data.usd_spent !== undefined || data.exchange_rate !== undefined) {
      const current = await FBCampaign.findById(req.params.id);
      if (!current) return res.status(404).json({ success: false, message: 'Campaign not found.' });
      const usd = data.usd_spent ?? current.usd_spent;
      const rate = data.exchange_rate ?? current.exchange_rate;
      data.bdt_spent = usd * rate;
    }

    const campaign = await FBCampaign.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    res.json({ success: true, data: campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── DELETE campaign ──────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const campaign = await FBCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    res.json({ success: true, message: 'Campaign deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;