// ============================================================
// PRODUCT MODEL — Design + Variants (size pricing + stock)
// ============================================================
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    code: { type: String, required: [true, 'Product code is required'], unique: true, trim: true, lowercase: true },
    slug: { type: String, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true },
    material: { type: String, default: 'High-Quality Polyester + Spandex Blend' },

    // Main image + gallery (up to 6 total: 1 main + 5 gallery)
    imageUrl: { type: String, default: '' },
    gallery: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Gallery can have at most 5 images.',
      },
      default: [],
    },

    // Per-size pricing (variant-based — CRITICAL feature)
    priceSmall:  { type: Number, required: true, default: 990,  min: 0 },
    priceMedium: { type: Number, required: true, default: 1190, min: 0 },
    priceLarge:  { type: Number, required: true, default: 1490, min: 0 },

    // Per-size stock
    stockSmall:  { type: Number, default: 0, min: 0 },
    stockMedium: { type: Number, default: 0, min: 0 },
    stockLarge:  { type: Number, default: 0, min: 0 },

    // Metadata
    status:    { type: String, enum: ['active', 'inactive'], default: 'active' },
    featured:  { type: Boolean, default: false },
    sortOrder: { type: Number, default: 99 },

    // SEO
    seoTitle:       { type: String, trim: true },
    seoDescription: { type: String, trim: true },
    tags:           { type: [String], default: [] },

    // Stats
    totalSold:  { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug from name
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }
  next();
});

// Virtual: total stock
ProductSchema.virtual('totalStock').get(function () {
  return (this.stockSmall || 0) + (this.stockMedium || 0) + (this.stockLarge || 0);
});

// Virtual: get price by size
ProductSchema.methods.getPriceForSize = function (size) {
  const map = { small: this.priceSmall, medium: this.priceMedium, large: this.priceLarge };
  return map[size?.toLowerCase()] || this.priceSmall;
};

// Virtual: get stock by size
ProductSchema.methods.getStockForSize = function (size) {
  const map = { small: this.stockSmall, medium: this.stockMedium, large: this.stockLarge };
  return map[size?.toLowerCase()] ?? 0;
};

ProductSchema.index({ code: 1 });
ProductSchema.index({ status: 1, featured: -1, sortOrder: 1 });
ProductSchema.index({ name: 'text', code: 'text', tags: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
