const express = require('express');
const router  = express.Router();
const Review  = require('../models/Review');
const { protect, authorize } = require('../middleware/auth');

// GET /api/reviews?productId=xxx — Public approved reviews
router.get('/', async (req, res) => {
  try {
    const query = { status: 'approved' };
    if (req.query.productId) query.productId = req.query.productId;
    const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reviews/all — Admin: all reviews
router.get('/all', protect, async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: reviews });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/reviews — Public or Admin
router.post('/', async (req, res) => {
  try {
    const review = await Review.create({ ...req.body, status: 'pending' });
    res.status(201).json({ success: true, data: review });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PATCH /api/reviews/:id — Admin approve/reject
router.patch('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
    res.json({ success: true, data: review });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/reviews/:id — Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
