const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema(
  {
    productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: String,
    productCode: String,
    size:        { type: String, enum: ['small', 'medium', 'large'], required: true },
    transactionType: {
      type: String,
      enum: ['restock', 'sale', 'adjustment', 'damaged', 'return'],
      required: true,
    },
    quantity:  { type: Number, required: true },
    notes:     String,
    reference: String,
    doneBy:    String,
  },
  { timestamps: true }
);

InventorySchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('Inventory', InventorySchema);