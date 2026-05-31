import api from '../api/axios';
import { API_ORIGIN, isMockDataAllowed } from '../api/status';
import { cachedProducts, cachedProductsUpdatedAt } from '../constants/apiCache';
import { 
  wigCategories, 
  featuredProducts, 
  beautyProducts, 
  bonnets 
} from '../constants/products';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const PRODUCT_CACHE_KEY = 'jtsBeautyLiveProductsCache:v1';
const STATIC_IMAGE_FALLBACKS = [
  { match: /bob wig\s*-\s*dark/i, image: 'images/Dark Bob lace.jpeg' },
  { match: /bob wig\s*-\s*orange|light color bob/i, image: 'images/light bob wig.jpeg' },
  { match: /bob wig\s*-\s*blue/i, image: 'images/Dark Bob lace.jpeg' },
  { match: /bob wig\s*-\s*purple/i, image: 'images/dark bob lace purple1.jpeg' },
  { match: /burmese curl/i, image: 'images/burmese-curl-1.PNG' },
  { match: /water wave/i, image: 'images/water-wave-2.PNG' },
  { match: /pineapple wave/i, image: 'images/pineapple wave.PNG' },
  { match: /straight/i, image: 'images/straight.png' },
  { match: /bodywave|body wave/i, image: 'images/body-wave-1.PNG' },
  { match: /deepwave|deep wave/i, image: 'images/DEEPWAVE.jpeg' },
  { match: /tri color/i, image: 'images/tri color body wave.png' },
];

function getStaticFallbackImage(product) {
  const label = `${product?.title || ''} ${product?.name || ''} ${product?.style || ''}`;
  return STATIC_IMAGE_FALLBACKS.find(({ match }) => match.test(label))?.image || '';
}

function isLegacyLocalUploadUrl(url) {
  if (import.meta.env.DEV) return false;
  if (!url || typeof url !== 'string' || !/^https?:/i.test(url)) return false;
  try {
    const parsedUrl = new URL(url);
    return ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname) && parsedUrl.pathname.startsWith('/uploads/');
  } catch {
    return false;
  }
}

function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(data:|blob:)/i.test(url)) return url;
  if (/^https?:/i.test(url)) {
    try {
      const parsedUrl = new URL(url);
      const isLocalUpload = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname) && parsedUrl.pathname.startsWith('/uploads/');
      return isLocalUpload ? `${API_ORIGIN}${parsedUrl.pathname}` : url;
    } catch {
      return url;
    }
  }
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
  }
  return url;
}

function readDataArray(response, label) {
  const payload = response?.data;
  if (!payload?.success || !Array.isArray(payload.data)) {
    throw new Error(`Invalid ${label} response from API.`);
  }
  return payload.data;
}

async function getDevelopmentMockData(mockData, warning, error) {
  if (!isMockDataAllowed) {
    throw error;
  }
  console.warn(`${warning} Development mock data is being used.`, error);
  await delay(50);
  return [...mockData];
}

function readBrowserProductCache() {
  if (typeof window === 'undefined') return [];
  try {
    const parsedCache = JSON.parse(window.localStorage.getItem(PRODUCT_CACHE_KEY) || 'null');
    return Array.isArray(parsedCache?.products) ? parsedCache : null;
  } catch {
    return null;
  }
}

function writeBrowserProductCache(products) {
  if (typeof window === 'undefined' || !Array.isArray(products) || products.length === 0) return;
  try {
    window.localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify({
      products,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Unable to save live product cache.', error);
  }
}

function getProductCacheKey(product) {
  return product?._id || product?.id || product?.title || product?.name;
}

function upsertBrowserProductCache(product) {
  if (typeof window === 'undefined' || !product) return;
  const productKey = getProductCacheKey(product);
  if (!productKey) return;

  const browserCache = readBrowserProductCache();
  const currentProducts = browserCache?.products?.length ? browserCache.products : cachedProducts;
  const productsByKey = new Map(currentProducts.map((item) => [getProductCacheKey(item), item]));

  productsByKey.set(productKey, product);
  writeBrowserProductCache([...productsByKey.values()].filter(Boolean));
}

function removeBrowserProductCache(productId) {
  if (typeof window === 'undefined' || !productId) return;

  const browserCache = readBrowserProductCache();
  const currentProducts = browserCache?.products?.length ? browserCache.products : cachedProducts;
  const nextProducts = currentProducts.filter((product) => getProductCacheKey(product) !== productId);
  writeBrowserProductCache(nextProducts);
}

function mergeCachedProducts(products) {
  if (!Array.isArray(products) || products.length === 0) return;
  const currentProducts = getCachedProducts();
  const productsById = new Map(currentProducts.map((product) => [product._id || product.id || product.title || product.name, product]));
  products.forEach((product) => {
    productsById.set(product._id || product.id || product.title || product.name, product);
  });
  writeBrowserProductCache([...productsById.values()]);
}

function getCachedProducts() {
  const browserCache = readBrowserProductCache();
  const browserProducts = browserCache?.products || [];
  if (browserProducts.length === 0) return cachedProducts;

  const browserUpdatedAt = Date.parse(browserCache.updatedAt || '');
  const staticUpdatedAt = Date.parse(cachedProductsUpdatedAt || '');

  if (Number.isFinite(browserUpdatedAt) && Number.isFinite(staticUpdatedAt)) {
    return browserUpdatedAt > staticUpdatedAt ? browserProducts : cachedProducts;
  }

  return browserProducts;
}

async function getCachedProductData(filter, warning, error, fallbackData = []) {
  const cached = getCachedProducts();
  if (cached.length > 0) {
    console.warn(`${warning} Cached live product data is being used.`, error);
    await delay(50);
    return cached.filter(filter).map(normalizeProduct);
  }

  return getDevelopmentMockData(fallbackData, warning, error);
}

/**
 * Normalize a backend product document into the UI-expected format.
 * - Wigs: price displayed as "From $X" (starting price)
 * - Other products: price displayed as "$X.XX"
 * - Ensures both `title` and `name` fields exist for compatibility
 */
function normalizeProduct(p) {
  const isWig = p.category === 'Wigs';
  const staticFallbackImage = getStaticFallbackImage(p);
  const apiImages = (p.images?.length ? p.images : (p.image ? [p.image] : []))
    .filter((image) => !isLegacyLocalUploadUrl(image));
  const displayImages = apiImages.length > 0 ? apiImages : [staticFallbackImage].filter(Boolean);
  
  // Format the price string correctly based on category
  let priceStr = p.price;
  if (typeof p.price === 'number') {
    priceStr = isWig ? `From $${p.price.toFixed(0)}` : `$${p.price.toFixed(2)}`;
  } else if (typeof p.price === 'string' && !p.price.includes('$')) {
    // If it's a string but missing the $ sign, add it
    const num = parseFloat(p.price);
    if (!isNaN(num)) {
      priceStr = isWig ? `From $${num.toFixed(0)}` : `$${num.toFixed(2)}`;
    }
  }

  return {
    ...p,
    // Ensure both name and title exist (wigs use title, other products use name)
    title: p.title || p.name,
    name: p.name || p.title,
    price: priceStr,
    id: p._id || p.id,
    image: resolveMediaUrl(displayImages[0] || ''),
    images: [...new Set(displayImages.map(resolveMediaUrl))],
  };
}

export async function fetchWigCategories() {
  try {
    const response = await api.get('/products?category=Wigs');
    const products = readDataArray(response, 'wigs');
    mergeCachedProducts(products);
    return products.map(normalizeProduct);
  } catch (error) {
    return getCachedProductData(
      (product) => product.category === 'Wigs',
      'Unable to load live wigs.',
      error,
      wigCategories
    );
  }
}

export async function fetchFeaturedProducts() {
  try {
    const response = await api.get('/products?category=Wigs&featured=true');
    const featured = readDataArray(response, 'featured products');
    if (featured.length > 0) {
      mergeCachedProducts(featured);
      return featured.map(normalizeProduct);
    }

    const allWigsResponse = await api.get('/products?category=Wigs');
    const products = readDataArray(allWigsResponse, 'featured products');
    mergeCachedProducts(products);
    return products.filter(p => p.isFeatured).map(normalizeProduct);
  } catch (error) {
    return getCachedProductData(
      (product) => product.category === 'Wigs' && product.isFeatured,
      'Unable to load live featured products.',
      error,
      featuredProducts
    );
  }
}

export async function fetchBeautyProducts() {
  try {
    const response = await api.get('/products');
    const products = readDataArray(response, 'beauty products');
    writeBrowserProductCache(products);
    return products.filter(p => p.category !== 'Wigs').map(normalizeProduct);
  } catch (error) {
    return getCachedProductData(
      (product) => product.category !== 'Wigs',
      'Unable to load live beauty products.',
      error,
      beautyProducts
    );
  }
}

export async function fetchBonnets() {
  try {
    const response = await api.get('/products?category=Bonnets');
    const products = readDataArray(response, 'bonnets');
    mergeCachedProducts(products);
    return products.map(normalizeProduct);
  } catch (error) {
    return getCachedProductData(
      (product) => product.category === 'Bonnets',
      'Unable to load live bonnets.',
      error,
      bonnets
    );
  }
}

/**
 * Submits guest checkout order information to the backend server.
 */
export async function placeOrder(orderDetails) {
  if (!orderDetails?.apiAvailable) {
    throw new Error('Ordering is disabled while the API is unavailable.');
  }

  const formattedPayload = {
    customerName: `${orderDetails.billingInfo.firstName} ${orderDetails.billingInfo.lastName}`,
    email: orderDetails.billingInfo.email,
    phone: orderDetails.billingInfo.phone,
    address: {
      street: orderDetails.billingInfo.address,
      city: orderDetails.billingInfo.city,
      state: orderDetails.billingInfo.state,
      zipCode: orderDetails.billingInfo.zipCode,
      country: 'US'
    },
    items: orderDetails.items.map(item => ({
      product: item._id || item.id,
      title: item.title || item.name,
      category: item.adminCategory || item.category || '',
      image: item.image,
      quantity: 1,
      price: parseFloat(String(item.price).replace('$', '').replace('From ', '')) || 0,
      variant: item.specs ? {
        length: item.specs.length,
        density: item.specs.density,
        sku: item.specs.sku || ''
      } : undefined
    })),
    subtotal: orderDetails.subtotal || orderDetails.amount,
    discount: orderDetails.discount || 0,
    shipping: orderDetails.shipping || 0,
    tax: orderDetails.tax || 0,
    total: orderDetails.amount,
    couponCode: orderDetails.couponCode || '',
    paymentMethod: orderDetails.paymentMethod || 'Credit Card'
  };

  if (formattedPayload.items.some(item => !item.product)) {
    throw new Error('Unable to place order because one or more cart items are not linked to live inventory.');
  }

  const response = await api.post('/orders', formattedPayload);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to place your order.');
  }

  return {
    success: true,
    orderId: response.data.data._id,
    message: 'Order placed successfully!'
  };
}

export async function createStripeCheckoutSession(orderDetails) {
  if (!orderDetails?.apiAvailable) {
    throw new Error('Checkout is disabled while the API is unavailable.');
  }

  const response = await api.post('/payment/create-checkout-session', {
    billingInfo: orderDetails.billingInfo,
    items: orderDetails.items.map(item => ({
      product: item._id || item.id,
      quantity: Number(item.quantity) || 1,
      variant: item.specs ? {
        length: item.specs.length,
        density: item.specs.density,
        sku: item.specs.sku || ''
      } : undefined
    })),
    couponCode: orderDetails.couponCode || '',
    userId: orderDetails.userId || ''
  });

  if (!response.data.success || !response.data.sessionUrl) {
    throw new Error(response.data.message || 'Unable to start Stripe checkout.');
  }

  return response.data;
}

// ─── ADMIN BACKEND CONNECTIVITY HELPERS ───────────────────────

export async function validateCoupon(code, orderTotal) {
  const response = await api.post('/coupons/validate', {
    code,
    orderTotal,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Unable to apply coupon.');
  }

  return response.data.data;
}

export async function fetchAdminProducts() {
  const response = await api.get('/products');
  return response.data.data;
}

export async function fetchAdminOrders() {
  const response = await api.get('/orders');
  return response.data.data;
}

export async function updateAdminOrderStatus(id, orderStatus, paymentStatus) {
  const response = await api.put(`/orders/${id}/status`, { orderStatus, paymentStatus });
  return response.data.data;
}

export async function deleteAdminOrder(id) {
  await api.delete(`/orders/${id}`);
  return true;
}

export async function fetchAdminReviews() {
  const response = await api.get('/reviews');
  return response.data.data;
}

export async function fetchHomepageReviews() {
  const response = await api.get('/reviews?home=true');
  return response.data.data;
}

export async function createAdminReview(reviewData) {
  const response = await api.post('/reviews', reviewData);
  const created = response.data.data;
  if (reviewData.showOnHome) {
    const updated = await api.put(`/reviews/${created._id || created.id}`, {
      ...reviewData,
      showOnHome: true,
    });
    return updated.data.data;
  }
  return created;
}

export async function updateAdminReview(id, reviewData) {
  const response = await api.put(`/reviews/${id}`, reviewData);
  return response.data.data;
}

export async function deleteAdminReview(id) {
  await api.delete(`/reviews/${id}`);
  return true;
}

export async function fetchAdminCoupons() {
  const response = await api.get('/coupons');
  return response.data.data;
}

export async function createAdminCoupon(couponData) {
  const response = await api.post('/coupons', couponData);
  return response.data.data;
}

export async function deleteAdminCoupon(id) {
  await api.delete(`/coupons/${id}`);
  return true;
}

export async function createAdminProduct(productData) {
  const response = await api.post('/products', buildProductPayload(productData), {
    preserveAdminSessionOnAuthError: true,
    skipHealthUpdate: true,
    timeout: 30000,
  });
  upsertBrowserProductCache(response.data.data);
  return response.data.data;
}

export async function updateAdminProduct(id, productData) {
  const response = await api.put(`/products?id=${encodeURIComponent(id)}`, buildProductPayload(productData), {
    preserveAdminSessionOnAuthError: true,
    skipHealthUpdate: true,
    timeout: 30000,
  });
  upsertBrowserProductCache(response.data.data);
  return response.data.data;
}

export async function deleteAdminProduct(id) {
  await api.delete(`/products?id=${encodeURIComponent(id)}`, {
    preserveAdminSessionOnAuthError: true,
    skipHealthUpdate: true,
  });
  removeBrowserProductCache(id);
  return true;
}

function buildProductPayload(productData) {
  const imageFiles = productData.imageFiles || (productData.imageFile ? [productData.imageFile] : []);
  if (imageFiles.length === 0) {
    return productData;
  }

  const formData = new FormData();
  Object.entries(productData).forEach(([key, value]) => {
    if (key === 'imageFile' || key === 'imageFiles') {
      return;
    } else if (key === 'image') {
      return;
    } else if (key === 'images') {
      formData.append(key, JSON.stringify((value || []).filter((image) => !String(image).startsWith('data:'))));
    } else if (key === 'variants') {
      formData.append(key, JSON.stringify(value || []));
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  imageFiles.forEach((file) => formData.append('images', file));

  return formData;
}
