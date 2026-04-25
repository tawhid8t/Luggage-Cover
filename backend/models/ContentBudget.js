// ============================================================
// CONTENT BUDGET MODEL — Content Production Cost Tracker
// ============================================================
const mongoose = require('mongoose');

const ContentBudgetSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true },
    category:    { type: String, enum: ['video', 'photo', 'graphic', 'copywriting', 'model', 'other'], default: 'graphic' },
    month:       { type: String, trim: true },
    vendor_name: { type: String, trim: true },
    platform:   { type: String, enum: ['facebook', 'instagram', 'youtube', 'website', 'all'], default: 'all' },

    amount_bdt:     { type: Number, default: null },
    amount_usd:     { type: Number, default: null },
    exchange_rate:  { type: Number, default: 110 },
    effective_bdt:  { type: Number, default: 0 },

    status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'pending' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

ContentBudgetSchema.index({ month: -1 });
ContentBudgetSchema.index({ status: 1 });
ContentBudgetSchema.index({ category: 1 });

// Auto-calculate effective_bdt before save
ContentBudgetSchema.pre('save', function (next) {
  if (this.amount_bdt && this.amount_bdt > 0) {
    this.effective_bdt = this.amount_bdt;
  } else if (this.amount_usd && this.exchange_rate) {
    this.effective_bdt = this.amount_usd * this.exchange_rate;
  }
  next();
});

module.exports = mongoose.model('ContentBudget', ContentBudgetSchema);