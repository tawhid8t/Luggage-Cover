// ============================================================
// PRODUCTS ROUTES — /api/products
// ============================================================
const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// GET /api/products — Public: all active products
router.get('/', async (req, res) => {
  try {
    const { search, featured, status, limit = 50, page = 1 } = req.query;
    const query = {};

    // Public only sees active; admin can see all if ?status= passed with auth
    if (!req.headers.authorization) query.status = 'active';
    else if (status) query.status = status;

    if (featured === 'true') query.featured = true;
    if (search) query.$text = { $search: search };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Product.countDocuments(query);
    const products = await Product
      .find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, count: products.length, total, page: parseInt(page), data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:idOrCode — Public
router.get('/:idOrCode', async (req, res) => {
  try {
    const { idOrCode } = req.params;
    let product = null;

    if (idOrCode.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(idOrCode);
    } else {
      product = await Product.findOne({ $or: [{ code: idOrCode.toLowerCase() }, { slug: idOrCode.toLowerCase() }] });
    }

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Increment views
    product.totalViews += 1;
    await product.save({ validateBeforeSave: false });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products — Admin only
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id — Admin only
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id — Admin only (partial update)
router.patch('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id/gallery — Update gallery images
router.patch('/:id/gallery', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { gallery, imageUrl } = req.body;
    const update = {};
    if (imageUrl !== undefined) update.imageUrl = imageUrl;
    if (gallery !== undefined) {
      if (!Array.isArray(gallery) || gallery.length > 5) {
        return res.status(400).json({ success: false, message: 'Gallery must be an array of max 5 images.' });
      }
      update.gallery = gallery;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id — Admin only
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id/related — Public
router.get('/:id/related', async (req, res) => {
  try {
    const product  = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const related = await Product.find({
      _id: { $ne: product._id },
      status: 'active',
    }).limit(4).sort({ featured: -1, sortOrder: 1 });
    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
