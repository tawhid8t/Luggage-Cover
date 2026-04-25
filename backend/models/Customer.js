const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    phone:       { type: String, required: true, unique: true, trim: true, index: true },
    email:       { type: String, trim: true, lowercase: true },
    address:     String,
    district:    String,
    area:        String,
    totalOrders: { type: Number, default: 0 },
    totalSpent:  { type: Number, default: 0 },
    tags:        { type: [String], default: [] },
    notes:       String,
    status:      { type: String, enum: ['active', 'blocked'], default: 'active' },
    lastOrderAt: Date,
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 'text', phone: 'text', email: 'text' });

module.exports = mongoose.model('Customer', CustomerSchema);
