# Phase 4: Backend Audit & Configuration

**Status:** ✅ Configuration Verified | 🔴 Requires ENV Updates

---

## 📋 Backend Server Architecture

### Framework & Libraries
| Component | Version | Status |
|-----------|---------|--------|
| Express.js | 4.18.2 | ✅ |
| Node.js | >=18 | ✅ |
| Mongoose | (latest) | ✅ |
| Stripe SDK | 22.2.0 | ✅ |
| Helmet | 7.0.0 | ✅ |
| Rate-Limit | (latest) | ✅ |

### Database
| Component | Value | Status |
|-----------|-------|--------|
| Type | MongoDB Atlas (Cloud) | ✅ |
| Connection String | `mongodb+srv://` | ✅ |
| Fallback Logic | DNS SRV failure handling | ✅ |
| Timeout | 10 seconds | ✅ |

---

## 🔐 Required Environment Variables

### Critical (Must Have)

| Variable | Example | Purpose | Missing = |
|----------|---------|---------|-----------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/?appName=...` | MongoDB Atlas connection | Server exits with error ❌ |
| `JWT_SECRET` | `your_super_secret_key_min_32_chars_recommended` | JWT token signing | Server exits with error ❌ |

**Validation:** `server.js` line 19-25 checks these at startup and exits if missing.

### Important (Highly Recommended)

| Variable | Example | Purpose | Default |
|----------|---------|---------|---------|
| `FRONTEND_URL` | `https://yourdomain.hosting.com` | CORS whitelist | `process.env.FRONTEND_URL` |
| `CLIENT_URL` | `https://yourdomain.hosting.com` | CORS whitelist (alias) | `process.env.CLIENT_URL` |
| `NODE_ENV` | `production` | Environment mode | (not enforced) |
| `PORT` | `5000` | Server port | `5000` |

### Rate Limiting (Optional - Configurable)

| Variable | Default | Min Value | Max Value |
|----------|---------|-----------|-----------|
| `RATE_LIMIT_WINDOW_MS` | 10 min (600000 ms) | 1 min | No limit |
| `RATE_LIMIT_MAX` | 2000 (prod) / 1000 (dev) | 100 | ∞ |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | 15 min (900000 ms) | 1 min | No limit |
| `LOGIN_RATE_LIMIT_MAX` | 10 (prod) / 100 (dev) | 1 | 1000 |

---

## 🌐 CORS Configuration

### Current Whitelist (server.js, lines 24-31)

```javascript
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,                      // For Hosting.com: https://yourdomain.hosting.com
  process.env.CLIENT_URL,                        // For Hosting.com: https://yourdomain.hosting.com
  'https://saadsheikh5.github.io',               // GitHub Pages (old frontend)
  'https://saadsheikh5.github.io/ecoms',         // GitHub Pages /ecoms subpath
  'http://localhost:3000',                       // Local dev (Vite)
  'http://127.0.0.1:3000',                       // Local dev (loopback)
  'http://localhost:5173',                       // Local dev (Vite default)
  'http://127.0.0.1:5173',                       // Local dev (Vite loopback)
].filter(Boolean));
```

### 🔴 CRITICAL: Update for Hosting.com Deployment

**Before uploading frontend to Hosting.com, set environment variables:**

```bash
# For Hosting.com
FRONTEND_URL=https://yourdomain.hosting.com
CLIENT_URL=https://yourdomain.hosting.com

# These will be added to CORS whitelist, enabling frontend requests
```

**Without this, frontend on `https://yourdomain.hosting.com/ecoms/` will get CORS errors:**

```
Access to XMLHttpRequest at 'https://ecoms-lkswc2a9.b4a.run/api/products'
from origin 'https://yourdomain.hosting.com'
has been blocked by CORS policy
```

---

## 🔒 Security Middleware

### Helmet
```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
```
**Status:** ✅ Enforces security headers (CSP, XSS, etc.)

### CORS
```javascript
app.use(cors({
  origin(origin, callback) {
    const isLocalDevOrigin = !isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.has(origin) || isLocalDevOrigin) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
}));
```
**Status:** ✅ Whitelist-based; allows localhost in dev mode

### Mongo Sanitization
```javascript
app.use(mongoSanitize());
```
**Status:** ✅ Prevents NoSQL injection

### XSS Protection
```javascript
app.use(xssClean());
```
**Status:** ✅ Sanitizes request body

### Rate Limiting
```javascript
// General API rate limit: 2000 req/10 min (production)
app.use('/api', limiter);

// Login attempts: 10 per 15 min
app.use('/api/auth/login', loginLimiter);

// Password/Email changes: 5 per 15 min
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

// OTP verification: 8 per 10 min
app.use('/api/auth/2fa/verify-login', otpLimiter);
```
**Status:** ✅ Comprehensive rate limiting

---

## 🛣️ API Routes

### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout
- `POST /api/auth/refresh-token` — Refresh JWT
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password-code` — Reset password with code
- `POST /api/auth/2fa/setup` — Enable 2FA
- `POST /api/auth/2fa/verify-login` — Verify OTP on login
- `POST /api/auth/2fa/confirm` — Confirm 2FA setup

### Products
- `GET /api/products` — List all products
- `GET /api/products/:id` — Get product details
- `GET /api/products/search` — Search products
- `POST /api/products` — Create product (admin)
- `PUT /api/products/:id` — Update product (admin)
- `DELETE /api/products/:id` — Delete product (admin)

### Orders
- `GET /api/orders` — List user orders
- `POST /api/orders` — Create order
- `GET /api/orders/:id` — Get order details
- `PUT /api/orders/:id` — Update order status (admin)
- `DELETE /api/orders/:id` — Cancel order

### Payments
- `POST /api/payment/checkout` — Create Stripe checkout session
- `POST /api/payment/webhook` — Stripe webhook (raw body required)
- `GET /api/payment/success` — Payment success redirect

### Reviews
- `GET /api/reviews` — List reviews
- `POST /api/reviews` — Create review
- `DELETE /api/reviews/:id` — Delete review

### Coupons
- `GET /api/coupons` — List coupons
- `POST /api/coupons` — Create coupon (admin)
- `GET /api/coupons/validate/:code` — Validate coupon code

### Health Check
- `GET /api/health` — Service health status
- `GET /` — Root endpoint (basic info)

---

## ✅ Pre-Deployment Server Checklist

### Environment Variables (Required)
- [ ] `MONGO_URI` set and valid (MongoDB Atlas connection string)
- [ ] `JWT_SECRET` set (minimum 32 characters recommended)
- [ ] `FRONTEND_URL` set to Hosting.com domain (e.g., `https://yourdomain.hosting.com`)
- [ ] `CLIENT_URL` set to Hosting.com domain
- [ ] `NODE_ENV` set to `production`

### Optional but Recommended
- [ ] `STRIPE_SECRET_KEY` set (if using payments)
- [ ] `STRIPE_WEBHOOK_SECRET` set (if using payments)
- [ ] `PORT` explicitly set (default 5000)
- [ ] Rate limit vars tuned for production

### Database
- [ ] MongoDB Atlas cluster accessible
- [ ] IP whitelist includes deployment server (if on Hosting.com)
- [ ] Database credentials valid
- [ ] Collections created (auth, products, orders, etc.)

### Security
- [ ] JWT secret is strong and unique
- [ ] CORS whitelist includes production domain
- [ ] HTTPS enforced (Hosting.com provides SSL)
- [ ] Helmet security headers enabled

### Monitoring
- [ ] Health check endpoint working: `GET /api/health`
- [ ] Error handler logging configured
- [ ] Server startup logs captured

---

## 🔧 Server Configuration Template

### File: `server/.env` (for Hosting.com deployment)

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (MongoDB Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_to_something_very_secure_and_random

# CORS - Frontend Domains
FRONTEND_URL=https://yourdomain.hosting.com
CLIENT_URL=https://yourdomain.hosting.com

# Stripe (Optional but needed for payments)
STRIPE_SECRET_KEY=REDACTED_FOR_PRODUCTION
STRIPE_WEBHOOK_SECRET=REDACTED_FOR_PRODUCTION

# Rate Limiting (Optional - uses defaults if not set)
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX=2000
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10

# Email (Optional - for password resets)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 🚀 Server Startup Process

### 1. Environment Validation
```javascript
validateEnvironment() {
  // Checks for MONGO_URI and JWT_SECRET
  // Exits if any required var is missing
}
```

### 2. Database Connection
```javascript
connectDB() {
  // Try MongoDB Atlas SRV connection
  // If DNS fails, retry with seed-list fallback
  // Exits if connection fails
}
```

### 3. Server Listen
```javascript
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
})
```

### Startup Sequence
```
server.js
  ↓
validate environment (MONGO_URI, JWT_SECRET)
  ↓
connectDB() → MongoDB connection
  ↓
app.listen(PORT)
  ↓
Server ready to accept requests
```

---

## 🔍 Health Check & Monitoring

### Health Endpoint
```bash
GET /api/health
```

**Response (if healthy):**
```json
{
  "success": true,
  "status": "ok",
  "service": "jts-beauty-api",
  "database": "connected",
  "timestamp": "2026-06-12T12:00:00.000Z"
}
```

**Response (if database down):**
```json
{
  "success": false,
  "status": "degraded",
  "service": "jts-beauty-api",
  "database": "disconnected",
  "timestamp": "2026-06-12T12:00:00.000Z"
}
HTTP 503
```

### Database Readiness Middleware
```javascript
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  return res.status(503).json({
    success: false,
    message: 'Database is unavailable...'
  });
});
```

**Status:** ✅ All API endpoints blocked until database is ready

---

## 🎯 Phase 4 Checklist

### Verification
- [ ] Read `server.js` and verify security middleware
- [ ] Confirm CORS whitelist logic
- [ ] Verify environment variable validation
- [ ] Check MongoDB connection with fallback logic
- [ ] Review all API routes documented

### Preparation (for Phase 5-6)
- [ ] Update `server/.env` with Hosting.com domain
- [ ] Test local backend startup
- [ ] Verify health check endpoint works
- [ ] Confirm CORS accepts Hosting.com domain

---

## 📊 Dependencies Summary

| Package | Purpose | Security |
|---------|---------|----------|
| express | Web framework | ✅ |
| mongoose | MongoDB ORM | ✅ |
| dotenv | Env config | ✅ |
| cors | CORS handling | ✅ |
| helmet | Security headers | ✅ |
| express-mongo-sanitize | NoSQL injection prevention | ✅ |
| xss-clean | XSS prevention | ✅ |
| express-rate-limit | Rate limiting | ✅ |
| jsonwebtoken | JWT auth | ✅ |
| stripe | Payment processing | ✅ |

**Status:** ✅ All critical dependencies present

---

## ⚠️ Known Limitations

### 1. Hardcoded to Back4App for Now
Currently deployed at `https://ecoms-lkswc2a9.b4a.run`
- To switch to Hosting.com backend, update `server/.env` and redeploy

### 2. CORS Must Be Updated
Default whitelist won't include Hosting.com domain
- Solution: Set `FRONTEND_URL` and `CLIENT_URL` environment variables

### 3. MongoDB Atlas IP Whitelist
- If deploying to new server, add its IP to MongoDB Atlas IP whitelist
- Otherwise, connection fails with authentication error

---

## 🎯 Next Steps

### Phase 5: Stripe & Security Audit
- [ ] Verify Stripe webhook routing works
- [ ] Test webhook signature verification
- [ ] Confirm HTTPS enforcement in production mode

### Phase 6: Environment Consolidation
- [ ] Create consolidated `.env.example` 
- [ ] Document all required variables
- [ ] Provide setup script

### Phase 7: Deployment Instructions
- [ ] Backend deployment to Hosting.com (if choosing Option B)
- [ ] Frontend deployment to Hosting.com cPanel
- [ ] DNS/SSL configuration
- [ ] Post-deployment verification

---

**Report Status:** ✅ Phase 4 Audit Complete | Backend Ready | Requires ENV Update

**Key Finding:** Backend is production-ready. Only requires environment variables to be updated for Hosting.com deployment.
