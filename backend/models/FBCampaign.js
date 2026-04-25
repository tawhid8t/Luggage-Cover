// ============================================================
// FB CAMPAIGN MODEL — Facebook Ad Campaign Tracker
// ============================================================
const mongoose = require('mongoose');

const FBCampaignSchema = new mongoose.Schema(
  {
    campaign_name:       { type: String, required: true, trim: true },
    month:              { type: String, trim: true },
    status:            { type: String, enum: ['active', 'completed', 'paused', 'cancelled'], default: 'active' },

    // Ad spend
    usd_spent:          { type: Number, default: 0, min: 0 },
    exchange_rate:      { type: Number, default: 110, min: 1 },
    bdt_spent:          { type: Number, default: 0 },

    // Orders
    predicted_orders:    { type: Number, default: 0, min: 0 },
    actual_orders:       { type: Number, default: 0, min: 0 },

    // Economics
    avg_order_value:     { type: Number, default: 1190, min: 0 },
    unit_production_cost: { type: Number, default: 400, min: 0 },
    delivery_cost_per_order: { type: Number, default: 80, min: 0 },
    other_costs_bdt:    { type: Number, default: 0 },

    // Notes
    notes:             { type: String, trim: true },
  },
  { timestamps: true }
);

FBCampaignSchema.index({ status: 1 });
FBCampaignSchema.index({ month: -1 });
FBCampaignSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FBCampaign', FBCampaignSchema);