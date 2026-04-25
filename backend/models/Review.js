const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName:  String,
    customerName: { type: String, required: true },
    rating:       { type: Number, required: true, min: 1, max: 5 },
    reviewText:   { type: String, required: true },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    orderId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, status: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
