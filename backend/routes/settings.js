const express = require('express');
const router  = express.Router();
const Setting = require('../models/Setting');
const { protect, authorize } = require('../middleware/auth');

// GET /api/settings — Public (store reads these)
router.get('/', async (req, res) => {
  try {
    const settings = await Setting.find({});
    const map = {};
    settings.forEach(s => { map[s.key] = s.value; });
    res.json({ success: true, data: map });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/settings/all — Public: full objects with labels/groups
router.get('/all', async (req, res) => {
  try {
    const settings = await Setting.find({}).sort({ group: 1, key: 1 });
    res.json({ success: true, data: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/settings/:key — Upsert single setting
router.put('/:key', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { value, label, group, type } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      { $set: { value, label, group, type } },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: setting });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/settings — Bulk update
router.put('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) return res.status(400).json({ success: false, message: 'settings must be an array.' });
    const ops = settings.map(s => ({
      updateOne: {
        filter: { key: s.key },
        update: { $set: { value: s.value, label: s.label, group: s.group, type: s.type } },
        upsert: true,
      },
    }));
    await Setting.bulkWrite(ops);
    res.json({ success: true, message: `${settings.length} setting(s) saved.` });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
