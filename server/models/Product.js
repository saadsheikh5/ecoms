const mongoose = require('mongoose');

// Each wig variant (length + density combination)
const variantSchema = new mongoose.Schema({
  length: { type: String, required: true },   // e.g. "16 inch"
  density: { type: String, required: true },  // e.g. "180%"
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, default: '' },
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
  },
  description: { type: String, default: '' },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Wigs', 'Bonnets', 'Lace Tints', 'Hair Products', 'Lace Glues'],
  },
  price: {
    type: Number,
    default: 0, // For wigs, price is derived from variants
  },
  stock: {
    type: Number,
    default: 0, // For wigs, stock is derived from variants
  },
  image: { type: String, default: '' },
  images: [{ type: String }],
  isFeatured: {
    type: Boolean,
    default: false,
  },
  // Variants only used when category is "Wigs"
  variants: [variantSchema],
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
