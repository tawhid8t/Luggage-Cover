// ============================================================
// ORDER MODEL — Full order lifecycle
// ============================================================
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  productCode: String,
  imageUrl:    String,
  size:        { type: String, enum: ['small', 'medium', 'large'], required: true },
  qty:         { type: Number, required: true, min: 1 },
  price:       { type: Number, required: true, min: 0 },
  total:       { type: Number, required: true, min: 0 },
}, { _id: false });

const StatusHistorySchema = new mongoose.Schema({
  status:    String,
  note:      String,
  changedBy: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },

    // Customer info
    customerName:    { type: String, required: true, trim: true },
    customerPhone:   { type: String, required: true, trim: true },
    customerEmail:   { type: String, trim: true, lowercase: true },
    customerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

    // Shipping
    shippingAddress: { type: String, required: true },
    district:        { type: String, required: true },
    area:            { type: String },

    // Items
    items: { type: [OrderItemSchema], required: true, validate: v => v.length > 0 },

    // Pricing
    subtotal:       { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 60, min: 0 },
    totalAmount:    { type: Number, required: true, min: 0 },

    // Payment
    paymentMethod:    { type: String, enum: ['cod', 'bkash', 'nagad', 'card'], default: 'cod' },
    paymentStatus:    { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentReference: { type: String },

    // Order status
    orderStatus: {
      type: String,
      enum: ['new','confirmed','packing','packed','shipped','delivered','cancelled','return_requested','returned','refunded'],
      default: 'new',
    },

    // Shipping
    courierName:     String,
    trackingNumber:  String,

    // Notes
    orderNotes:  String,
    staffNotes:  String,

    // Timeline
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

// Auto-generate order number before save
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.orderNumber = `LC-${ts}-${rand}`;
  }
  next();
});

OrderSchema.index({ customerPhone: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);