const Review = require('../models/Review');
const ApiError = require('../utils/apiError');

const normalizeReviewCategory = (category) => {
  const normalized = typeof category === 'string' ? category.trim() : '';
  return normalized && normalized !== 'Uncategorized' ? normalized : 'Wigs';
};

// @route   GET /api/reviews?product=productId
// @access  Public
const getReviews = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.home === 'true') filter.showOnHome = true;
    const reviews = await Review.find(filter).sort('-createdAt');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) { next(error); }
};

// @route   POST /api/reviews
// @access  Public (guest customers can leave reviews)
const addReview = async (req, res, next) => {
  try {
    const { product, category, customerName, rating, comment } = req.body;
    const review = await Review.create({
      product,
      category: normalizeReviewCategory(category),
      customerName,
      rating,
      comment,
      showOnHome: false,
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
};

// @route   PUT /api/reviews/:id
// @access  Private (admin)
const updateReview = async (req, res, next) => {
  try {
    const { product, category, customerName, rating, comment, showOnHome } = req.body;
    const updateData = {
      ...(product !== undefined && { product }),
      ...(category !== undefined && { category: normalizeReviewCategory(category) }),
      ...(customerName !== undefined && { customerName }),
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
      ...(showOnHome !== undefined && { showOnHome: Boolean(showOnHome) }),
    };

    const review = await Review.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!review) return next(new ApiError('Review not found.', 404));
    res.status(200).json({ success: true, data: review });
  } catch (error) { next(error); }
};

// @route   DELETE /api/reviews/:id
// @access  Private (admin)
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return next(new ApiError('Review not found.', 404));
    res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (error) { next(error); }
};

module.exports = { getReviews, addReview, updateReview, deleteReview };
