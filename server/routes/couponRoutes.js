const express = require('express');
const router = express.Router();
const { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

router.post('/validate', validateCoupon);       // Public: used at checkout
router.get('/', protect, getAllCoupons);         // Admin: view all coupons
router.post('/', protect, createCoupon);        // Admin: create coupon
router.put('/:id', protect, updateCoupon);      // Admin: update coupon
router.delete('/:id', protect, deleteCoupon);   // Admin: delete coupon

module.exports = router;
