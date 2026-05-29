import api from './axios';

function readApiData(response, label) {
  const payload = response?.data;
  if (!payload?.success || payload.data === undefined) {
    throw new Error(`Invalid ${label} response from API.`);
  }
  return payload.data;
}

// ─── PRODUCT API HELPERS ───────────────────────────────────────

/**
 * Fetch all products from the backend (with optional category filter).
 */
export async function getProducts(category) {
  const url = category ? `/products?category=${category}` : '/products';
  const response = await api.get(url);
  return readApiData(response, 'products');
}

/**
 * Fetch a single product details by ID.
 */
export async function getProduct(id) {
  const response = await api.get(`/products/${id}`);
  return readApiData(response, 'product');
}

/**
 * Create a new product (Admin authenticated).
 * Supports standard JSON or Form-Data if image files are uploaded.
 */
export async function createProduct(productData) {
  const headers = productData instanceof FormData 
    ? { 'Content-Type': 'multipart/form-data' } 
    : undefined;
  const response = await api.post('/products', productData, { headers });
  return readApiData(response, 'create product');
}

/**
 * Update an existing product (Admin authenticated).
 */
export async function updateProduct(id, productData) {
  const headers = productData instanceof FormData 
    ? { 'Content-Type': 'multipart/form-data' } 
    : undefined;
  const response = await api.put(`/products/${id}`, productData, { headers });
  return readApiData(response, 'update product');
}

/**
 * Delete a product by ID (Admin authenticated).
 */
export async function deleteProduct(id) {
  const response = await api.delete(`/products/${id}`);
  return response.data;
}

// ─── ORDER API HELPERS ──────────────────────────────────────────

/**
 * Fetch all orders (Admin authenticated).
 */
export async function getOrders() {
  const response = await api.get('/orders');
  return readApiData(response, 'orders');
}

/**
 * Place a new order (Public / Guest Checkout).
 */
export async function placeOrder(orderData) {
  const response = await api.post('/orders', orderData);
  return response.data;
}

/**
 * Update an order's status (Admin authenticated).
 */
export async function updateOrderStatus(id, statusData) {
  const response = await api.put(`/orders/${id}/status`, statusData);
  return readApiData(response, 'order status');
}

/**
 * Delete an order by ID (Admin authenticated).
 */
export async function deleteOrder(id) {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
}

// ─── ADMIN AUTH HELPERS ─────────────────────────────────────────

/**
 * Authenticate admin and return secure JWT.
 */
export async function adminLogin(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // Expecting { success: true, token, data: { name, email } }
}

export async function verifyAdminOtp(challengeToken, code) {
  const response = await api.post('/auth/2fa/verify-login', { challengeToken, code });
  return response.data;
}

export async function requestPasswordReset(email) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function resetAdminPassword(token, password, confirmPassword) {
  const response = await api.post('/auth/reset-password', { token, password, confirmPassword });
  return response.data;
}

export async function resetAdminPasswordWithCode(email, code, password, confirmPassword) {
  const response = await api.post('/auth/reset-password-code', { email, code, password, confirmPassword });
  return response.data;
}

export async function verifyAdminSession() {
  const response = await api.get('/auth/me');
  if (!response.data?.success || !response.data?.admin) {
    throw new Error('Invalid admin session response from API.');
  }
  return response.data.admin;
}

export async function changeAdminPassword(currentPassword, newPassword, confirmPassword) {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }, {
    preserveAdminSessionOnAuthError: true,
  });
  return response.data;
}

export async function requestAdminEmailChange(currentPassword, newEmail) {
  const response = await api.post('/auth/change-email/request', { currentPassword, newEmail }, {
    preserveAdminSessionOnAuthError: true,
  });
  return response.data;
}

export async function resendAdminEmailVerification() {
  const response = await api.post('/auth/change-email/resend');
  return response.data;
}

export async function verifyAdminEmailChange(token) {
  const response = await api.post('/auth/change-email/verify', { token });
  return response.data;
}

export async function verifyAdminEmailChangeCode(code) {
  const response = await api.post('/auth/change-email/verify-code', { code }, {
    preserveAdminSessionOnAuthError: true,
  });
  return response.data;
}

export async function getTwoFactorStatus() {
  const response = await api.get('/auth/2fa/status');
  return readApiData(response, 'two-factor status');
}

export async function setupTwoFactor(password) {
  const response = await api.post('/auth/2fa/setup', { password }, {
    preserveAdminSessionOnAuthError: true,
  });
  return readApiData(response, 'two-factor setup');
}

export async function confirmTwoFactor(code) {
  const response = await api.post('/auth/2fa/confirm', { code }, {
    preserveAdminSessionOnAuthError: true,
  });
  return response.data;
}

export async function disableTwoFactor(password) {
  const response = await api.post('/auth/2fa/disable', { password }, {
    preserveAdminSessionOnAuthError: true,
  });
  return response.data;
}

// ─── COUPON API HELPERS ─────────────────────────────────────────

/**
 * Fetch all active coupons (Admin authenticated).
 */
export async function getCoupons() {
  const response = await api.get('/coupons');
  return readApiData(response, 'coupons');
}

/**
 * Create a new discount coupon (Admin authenticated).
 */
export async function createCoupon(couponData) {
  const response = await api.post('/coupons', couponData);
  return readApiData(response, 'create coupon');
}

/**
 * Delete a coupon by ID (Admin authenticated).
 */
export async function deleteCoupon(id) {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
}

// ─── REVIEW API HELPERS ─────────────────────────────────────────

/**
 * Fetch reviews (Public).
 */
export async function getReviews(productTitle) {
  const url = productTitle ? `/reviews?product=${encodeURIComponent(productTitle)}` : '/reviews';
  const response = await api.get(url);
  return readApiData(response, 'reviews');
}

/**
 * Submit a product review (Public).
 */
export async function createReview(reviewData) {
  const category = reviewData.category && reviewData.category !== 'Uncategorized'
    ? reviewData.category
    : 'Wigs';
  const response = await api.post('/reviews', { ...reviewData, category });
  return readApiData(response, 'create review');
}

/**
 * Delete a review by ID (Admin authenticated).
 */
export async function deleteReview(id) {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
}
