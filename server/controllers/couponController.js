const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');

// @route   GET /api/coupons
// @access  Private (admin)
const getAllCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort('-createdAt');
    res.status(200).json({ success: true, data: coupons });
  } catch (error) { next(error); }
};

// @route   POST /api/coupons
// @access  Private (admin)
const createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) { next(error); }
};

// @route   PUT /api/coupons/:id
// @access  Private (admin)
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return next(new ApiError('Coupon not found.', 404));
    res.status(200).json({ success: true, data: coupon });
  } catch (error) { next(error); }
};

// @route   DELETE /api/coupons/:id
// @access  Private (admin)
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return next(new ApiError('Coupon not found.', 404));
    res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (error) { next(error); }
};

// @route   POST /api/coupons/validate
// @access  Public (used at checkout)
const validateCoupon = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code || !String(code).trim()) {
      return next(new ApiError('Coupon code is required.', 400));
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon || !coupon.isActive || new Date() > coupon.expiryDate || coupon.usageCount >= coupon.usageLimit) {
      return next(new ApiError('Invalid or expired coupon code.', 400));
    }

    if (orderTotal < coupon.minOrderAmount) {
      return next(new ApiError(`Minimum order of $${coupon.minOrderAmount} required for this coupon.`, 400));
    }

    const discount = coupon.discountType === 'percentage'
      ? (orderTotal * coupon.discountValue) / 100
      : coupon.discountValue;

    res.status(200).json({
      success: true,
      message: 'Coupon applied!',
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        discount,
      },
    });
  } catch (error) { next(error); }
};

module.exports = { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon };
