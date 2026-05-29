const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 0,
  },
  minOrderAmount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: [true, 'Expiry date is required'] },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: 100 },
}, { timestamps: true });

// Virtual: check if coupon is still valid
couponSchema.virtual('isValid').get(function () {
  return this.isActive && new Date() < this.expiryDate && this.usageCount < this.usageLimit;
});

module.exports = mongoose.model('Coupon', couponSchema);
