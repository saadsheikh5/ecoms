const express = require('express');
const router = express.Router();
const { getReviews, addReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/', getReviews);          // Public: get reviews
router.post('/', addReview);          // Public: guests can add reviews
router.put('/:id', protect, updateReview); // Admin: update review display/settings
router.delete('/:id', protect, deleteReview); // Admin: delete review

module.exports = router;
