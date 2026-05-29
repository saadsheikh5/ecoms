const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/apiError');

// @route   POST /api/orders
// @access  Public (guest checkout)
const placeOrder = async (req, res, next) => {
  try {
    const { customerName, email, phone, address, items, couponCode, paymentMethod, notes } = req.body;

    if (!items || items.length === 0) {
      return next(new ApiError('Order must have at least one item.', 400));
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);
    let discount = 0;
    let appliedCouponCode = '';

    // Apply coupon if provided
    if (couponCode) {
      const normalizedCouponCode = String(couponCode).trim().toUpperCase();
      const coupon = await Coupon.findOne({ code: normalizedCouponCode });
      if (!coupon || !coupon.isActive || new Date() > coupon.expiryDate || coupon.usageCount >= coupon.usageLimit) {
        return next(new ApiError('Invalid or expired coupon code.', 400));
      }

      if (subtotal < coupon.minOrderAmount) {
        return next(new ApiError(`Minimum order of $${coupon.minOrderAmount} required for this coupon.`, 400));
      }

      discount = coupon.discountType === 'percentage'
        ? (subtotal * coupon.discountValue) / 100
        : coupon.discountValue;
      appliedCouponCode = normalizedCouponCode;

      // Increment coupon usage count
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usageCount: 1 } });
    }

    const discountedSubtotal = Math.max(subtotal - discount, 0);
    const shipping = subtotal > 0 ? 10 : 0;
    const tax = discountedSubtotal * 0.08;
    const total = discountedSubtotal + shipping + tax;

    const order = await Order.create({
      customerName, email, phone, address,
      items, subtotal, discount, shipping, tax, total,
      couponCode: appliedCouponCode,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

// @route   GET /api/orders
// @access  Private (admin)
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort('-createdAt');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) { next(error); }
};

// @route   GET /api/orders/:id
// @access  Private (admin)
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError('Order not found.', 404));
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

// @route   PUT /api/orders/:id/status
// @access  Private (admin)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...(orderStatus && { orderStatus }), ...(paymentStatus && { paymentStatus }) },
      { new: true, runValidators: true }
    );
    if (!order) return next(new ApiError('Order not found.', 404));
    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

// @route   DELETE /api/orders/:id
// @access  Private (admin)
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return next(new ApiError('Order not found.', 404));
    res.status(200).json({ success: true, message: 'Order deleted.' });
  } catch (error) { next(error); }
};

module.exports = { placeOrder, getAllOrders, getOrder, updateOrderStatus, deleteOrder };
