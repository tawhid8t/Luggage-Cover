// ============================================================
// PRODUCTION BATCH MODEL — Track production costs and units
// ============================================================
const mongoose = require('mongoose');

const ProductionBatchSchema = new mongoose.Schema({
  batch_name: { type: String, required: true },
  batch_date: { type: Date, default: Date.now },
  design_codes: { type: String },
  status: {
    type: String,
    enum: ['planning', 'in_production', 'completed'],
    default: 'planning'
  },
  // Costs
  fabric_cost: { type: Number, default: 0, min: 0 },
  garments_bill: { type: Number, default: 0, min: 0 },
  print_bill: { type: Number, default: 0, min: 0 },
  accessories_bill: { type: Number, default: 0, min: 0 },
  transport_cost: { type: Number, default: 0, min: 0 },
  packaging_cost: { type: Number, default: 0, min: 0 },
  other_costs: { type: Number, default: 0, min: 0 },
  // Units produced
  qty_small: { type: Number, default: 0, min: 0 },
  qty_medium: { type: Number, default: 0, min: 0 },
  qty_large: { type: Number, default: 0, min: 0 },
  qty_xl: { type: Number, default: 0, min: 0 },
  // Selling prices
  sell_price_small: { type: Number, default: 990, min: 0 },
  sell_price_medium: { type: Number, default: 1190, min: 0 },
  sell_price_large: { type: Number, default: 1490, min: 0 },
  sell_price_xl: { type: Number, default: 1690, min: 0 },
  notes: { type: String },
}, { timestamps: true });

ProductionBatchSchema.index({ batch_name: 1 });
ProductionBatchSchema.index({ status: 1 });
ProductionBatchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProductionBatch', ProductionBatchSchema);