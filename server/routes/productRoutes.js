const express = require('express');
const router = express.Router();
const { getAllProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAllProducts);
router.get('/:id', getProduct);
router.post('/', protect, upload.fields([
  { name: 'images', maxCount: 8 },
  { name: 'image', maxCount: 1 },
]), createProduct);
router.put('/:id', protect, upload.fields([
  { name: 'images', maxCount: 8 },
  { name: 'image', maxCount: 1 },
]), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
