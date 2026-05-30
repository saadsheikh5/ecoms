import api from '../api/axios';
import { isMockDataAllowed } from '../api/status';
import { 
  wigCategories, 
  featuredProducts, 
  beautyProducts, 
  bonnets 
} from '../constants/products';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://ecoms-tzrzwx8w.b4a.run/api')).replace(/\/api\/?$/, '');

function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
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

/**
 * Normalize a backend product document into the UI-expected format.
 * - Wigs: price displayed as "From $X" (starting price)
 * - Other products: price displayed as "$X.XX"
 * - Ensures both `title` and `name` fields exist for compatibility
 */
function normalizeProduct(p) {
  const isWig = p.category === 'Wigs';
  
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
    image: resolveMediaUrl(p.image),
    images: (p.images?.length ? p.images : (p.image ? [p.image] : [])).map(resolveMediaUrl),
  };
}

export async function fetchWigCategories() {
  try {
    const response = await api.get('/products?category=Wigs');
    return readDataArray(response, 'wigs').map(normalizeProduct);
  } catch (error) {
    return getDevelopmentMockData(wigCategories, 'Unable to load live wigs.', error);
  }
}

export async function fetchFeaturedProducts() {
  try {
    const response = await api.get('/products?category=Wigs&featured=true');
    const featured = readDataArray(response, 'featured products');
    if (featured.length > 0) return featured.map(normalizeProduct);

    const allWigsResponse = await api.get('/products?category=Wigs');
    return readDataArray(allWigsResponse, 'featured products')
      .filter(p => p.isFeatured)
      .map(normalizeProduct);
  } catch (error) {
    return getDevelopmentMockData(featuredProducts, 'Unable to load live featured products.', error);
  }
}

export async function fetchBeautyProducts() {
  try {
    const response = await api.get('/products');
    return readDataArray(response, 'beauty products')
      .filter(p => p.category !== 'Wigs')
      .map(normalizeProduct);
  } catch (error) {
    return getDevelopmentMockData(beautyProducts, 'Unable to load live beauty products.', error);
  }
}

export async function fetchBonnets() {
  try {
    const response = await api.get('/products?category=Bonnets');
    return readDataArray(response, 'bonnets').map(normalizeProduct);
  } catch (error) {
    return getDevelopmentMockData(bonnets, 'Unable to load live bonnets.', error);
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
  return response.data.data;
}

export async function updateAdminProduct(id, productData) {
  const response = await api.put(`/products/${id}`, buildProductPayload(productData), {
    preserveAdminSessionOnAuthError: true,
    skipHealthUpdate: true,
    timeout: 30000,
  });
  return response.data.data;
}

export async function deleteAdminProduct(id) {
  await api.delete(`/products/${id}`, {
    preserveAdminSessionOnAuthError: true,
    skipHealthUpdate: true,
  });
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
