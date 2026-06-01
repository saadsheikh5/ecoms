const Product = require('../models/Product');
const ApiError = require('../utils/apiError');

const parseVariants = (variants) => {
  if (!variants) return [];
  if (Array.isArray(variants)) return variants;
  return JSON.parse(variants);
};

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) {
    return images.flatMap((image) => parseImages(image));
  }
  if (typeof images === 'string' && images.trim().startsWith('[')) {
    return JSON.parse(images).filter(Boolean);
  }
  return [images].filter(Boolean);
};

const getUploadedImagePaths = (files) => {
  if (!files) return [];
  if (Array.isArray(files)) {
    return files.map((file) => file.path);
  }

  return [
    ...(files.images || []),
    ...(files.image || []),
  ].map((file) => file.path);
};

const hasUploadedImages = (files) => getUploadedImagePaths(files).length > 0;

const imageRemovalAllowed = () => process.env.ALLOW_IMAGE_REMOVAL === 'true';
const preventProductResponseCaching = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
};

// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res, next) => {
  try {
    preventProductResponseCaching(res);
    const { category, featured } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured !== undefined) filter.isFeatured = featured === 'true';
    const products = await Product.find(filter).sort('-createdAt');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  try {
    preventProductResponseCaching(res);
    const product = await Product.findById(req.params.id || req.query.id);
    if (!product) return next(new ApiError('Product not found.', 404));
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// @route   POST /api/products
// @access  Private (admin)
const createProduct = async (req, res, next) => {
  try {
    const { title, description, category, price, stock, variants, isFeatured } = req.body;

    const uploadedImages = getUploadedImagePaths(req.files);
    const images = uploadedImages.length > 0
      ? uploadedImages
      : parseImages(req.body.images || (req.body.image ? [req.body.image] : []));
    const image = images[0] || '';

    const product = await Product.create({
      title, description, category,
      price: price || 0,
      stock: stock || 0,
      image,
      images,
      isFeatured: isFeatured === true || isFeatured === 'true',
      variants: parseVariants(variants),
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// @route   PUT /api/products/:id
// @access  Private (admin)
const updateProduct = async (req, res, next) => {
  try {
    const productId = req.params.id || req.query.id || req.body.id || req.body._id;
    if (!productId) return next(new ApiError('Product id is required.', 400));

    const { title, description, category, price, stock, variants, isFeatured, images } = req.body;
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) return next(new ApiError('Product not found.', 404));

    const updateData = { title, description, category, price, stock };
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === true || isFeatured === 'true';
    if (variants) updateData.variants = parseVariants(variants);
    if (images !== undefined || hasUploadedImages(req.files)) {
      const nextImages = [
        ...parseImages(images),
        ...getUploadedImagePaths(req.files),
      ];
      if (nextImages.length > 0 || imageRemovalAllowed()) {
        updateData.images = nextImages;
        updateData.image = nextImages[0] || '';
      } else {
        updateData.images = existingProduct.images?.length ? existingProduct.images : (existingProduct.image ? [existingProduct.image] : []);
        updateData.image = existingProduct.image || updateData.images[0] || '';
      }
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) return next(new ApiError('Product not found.', 404));
    res.status(200).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// @route   DELETE /api/products/:id
// @access  Private (admin)
const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id || req.query.id || req.body.id || req.body._id;
    if (!productId) return next(new ApiError('Product id is required.', 400));

    const product = await Product.findByIdAndDelete(productId);
    if (!product) return next(new ApiError('Product not found.', 404));
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) { next(error); }
};

module.exports = { getAllProducts, getProduct, createProduct, updateProduct, deleteProduct };
