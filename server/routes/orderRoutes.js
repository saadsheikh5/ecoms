const express = require('express');
const router = express.Router();
const { placeOrder, getAllOrders, getOrder, updateOrderStatus, deleteOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/', placeOrder);                              // Public: guest checkout
router.get('/', protect, getAllOrders);                    // Admin: view all orders
router.get('/:id', protect, getOrder);                    // Admin: view single order
router.put('/:id/status', protect, updateOrderStatus);    // Admin: update status
router.delete('/:id', protect, deleteOrder);              // Admin: delete order

module.exports = router;
