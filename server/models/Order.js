const mongoose = require('mongoose');

// Each item in the order
const orderItemSchema = new mongoose.Schema({
  product: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, default: '' },
  image: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  // Variant info (only for wigs)
  variant: {
    length: String,
    density: String,
    sku: String,
  },
});

const orderSchema = new mongoose.Schema({
  // Customer Info (guest checkout — no account needed)
  customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
  phone: { type: String, required: [true, 'Phone number is required'], trim: true },

  // Shipping Address
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, required: true },
  },

  // Order Details
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // Coupon Applied
  couponCode: { type: String, default: '' },

  // Status
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Refunded'],
    default: 'Unpaid',
  },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  paymentProvider: { type: String, default: '' },
  stripeSessionId: { type: String, unique: true, sparse: true },
  stripePaymentIntentId: { type: String, default: '' },
  stripeEventIds: [{ type: String }],

  // Notes
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
