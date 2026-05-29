const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: String,
    required: [true, 'Product reference is required'],
  },
  category: {
    type: String,
    required: [true, 'Review category is required'],
    default: 'Wigs',
    trim: true,
    validate: {
      validator: (value) => value && value !== 'Uncategorized',
      message: 'Review category must be a valid product category',
    },
  },
  customerName: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
  },
  showOnHome: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
