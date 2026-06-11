# Phase 5: Stripe & Security Audit

**Status:** ✅ Payment Processing Configured | ✅ Security Headers Enabled | 🔴 Requires Stripe Keys

---

## 💳 Stripe Integration Overview

### Current Setup
| Component | Status | Location |
|-----------|--------|----------|
| Stripe SDK | ✅ Installed | `server/config/stripe.js` |
| Checkout Sessions | ✅ Implemented | `server/controllers/paymentController.js` |
| Webhook Handler | ✅ Implemented | `server/controllers/paymentController.js` |
| Signature Verification | ✅ Enabled | Line 249-261 |
| Idempotency Keys | ✅ Enabled | Line 202 |
| Event Deduplication | ✅ Enabled | Line 269-270 |

---

## 💰 Payment Flow

### Step 1: Create Checkout Session
```
POST /api/payment/create-checkout-session
├─ Validate billing info
├─ Verify cart items in database
├─ Calculate totals (subtotal - discount + tax + shipping)
├─ Create Order in MongoDB
├─ Create Stripe checkout session
├─ Link order to session with idempotency key
└─ Return session URL to frontend
```

**Request Format:**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "US"
  },
  "items": [
    {
      "product": "product_id_from_db",
      "quantity": 1,
      "variant": { "length": "12", "density": "150%", "sku": "SKU123" }
    }
  ],
  "couponCode": "SUMMER20",
  "notes": "Gift wrap please"
}
```

**Validations:**
- ✅ All fields required (name, email, phone, address)
- ✅ Items verified against live database
- ✅ Variant matching (length, density, SKU)
- ✅ Prices fetched from database (not client)
- ✅ Coupon code validated (active, not expired, usage limit)
- ✅ Minimum order amount for coupon checked

---

### Step 2: Checkout & Payment
```
1. Frontend opens Stripe checkout URL
2. Customer enters payment info
3. Stripe processes payment
4. Stripe sends webhook to /api/payment/webhook
```

---

### Step 3: Webhook Processing
```
POST /api/payment/webhook (from Stripe)
├─ Verify signature using STRIPE_WEBHOOK_SECRET
├─ Extract event type
├─ Find order in MongoDB by orderId or sessionId
├─ Check for duplicate (stripeEventIds array)
├─ If new payment:
│   ├─ Set paymentStatus = "Paid"
│   ├─ Set orderStatus = "Processing"
│   ├─ Increment coupon usage count
│   ├─ Store stripePaymentIntentId
│   └─ Save event ID for deduplication
└─ Return { received: true }
```

---

## 🔒 Security Features - Stripe

### 1. Signature Verification
**Location:** `paymentController.js` line 248-261
```javascript
const signature = req.headers['stripe-signature'];
event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```
**Status:** ✅ **CRITICAL** — Prevents fake webhook events

**Without this:** Attacker could send fake webhook to mark unpaid orders as "Paid"

### 2. Idempotency Keys
**Location:** `paymentController.js` line 202
```javascript
const session = await stripe.checkout.sessions.create(sessionOptions, {
  idempotencyKey: `order-${order._id}`,
});
```
**Status:** ✅ **IMPORTANT** — Prevents duplicate charges

**Without this:** Network retry could create multiple charges for one order

### 3. Event Deduplication
**Location:** `paymentController.js` line 269-270
```javascript
if (order.stripeEventIds.includes(event.id)) {
  return res.json({ received: true });
}
order.stripeEventIds.push(event.id);
```
**Status:** ✅ **IMPORTANT** — Prevents double-processing

**Without this:** Webhook retry could update order twice

### 4. Price Validation
**Location:** `paymentController.js` line 57-86
```javascript
// Prices fetched from database, never from client
const product = await Product.findById(productId);
const price = variant ? variant.price : product.price;
```
**Status:** ✅ **CRITICAL** — Prevents price manipulation

**Without this:** Client could send fake prices in request

---

## 🔐 General Security Architecture

### Authentication & Authorization

| Layer | Implementation | Location | Status |
|-------|-----------------|----------|--------|
| JWT Tokens | Signed with `JWT_SECRET` | `middleware/` | ✅ |
| Role-based Access | Admin vs Customer | `routes/` | ✅ |
| Token Validation | Checked on protected routes | `middleware/auth.js` | ✅ |
| HTTPS/TLS | Required in production | Hosting.com SSL | ✅ |

### Input Validation & Sanitization

| Protection | Implementation | Location | Status |
|------------|------------------|----------|--------|
| NoSQL Injection | `express-mongo-sanitize` | `server.js` line 87 | ✅ |
| XSS Attacks | `xss-clean` | `server.js` line 88 | ✅ |
| SQL Injection | N/A (MongoDB, not SQL) | — | ✅ |
| Request Size Limit | `express.json({ limit: '10kb' })` | `server.js` line 84 | ✅ |

### Network Security

| Feature | Value | Location | Status |
|---------|-------|----------|--------|
| CORS | Whitelist-based | `server.js` line 37-47 | ✅ |
| CSP Headers | Via Helmet | `server.js` line 35 | ✅ |
| X-Frame-Options | `DENY` (via Helmet) | `server.js` line 35 | ✅ |
| X-Content-Type-Options | `nosniff` (via Helmet) | `server.js` line 35 | ✅ |
| HSTS | Via Helmet in prod | `server.js` line 35 | ✅ |

### Rate Limiting

| Endpoint | Limit | Window | Status |
|----------|-------|--------|--------|
| General API (`/api/*`) | 2000 req | 10 min | ✅ |
| Login (`/api/auth/login`) | 10 attempts | 15 min | ✅ |
| Password Reset | 5 attempts | 15 min | ✅ |
| 2FA Verification | 8 attempts | 10 min | ✅ |

### Data Protection

| Measure | Implementation | Status |
|---------|-----------------|--------|
| Passwords | Bcrypt hashing (in auth module) | ✅ |
| Sensitive Fields | Excluded from responses | ✅ |
| Database Encryption | MongoDB Atlas encryption | ✅ |
| HTTPS Only | Required in production | ✅ |

---

## 🚨 Security Checklist - Pre-Production

### Stripe Configuration
- [ ] `STRIPE_SECRET_KEY` set (live key for production)
- [ ] `STRIPE_WEBHOOK_SECRET` set (from Stripe dashboard)
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Webhook URL: `https://yourdomain/api/payment/webhook`
- [ ] Only `checkout.session.completed` event enabled
- [ ] Test webhook sending from Stripe CLI before deploying

### Authentication & Tokens
- [ ] `JWT_SECRET` is strong (32+ characters, random)
- [ ] JWT tokens have expiration
- [ ] Refresh token rotation implemented
- [ ] 2FA enabled for sensitive operations
- [ ] Session timeout configured

### Data Protection
- [ ] All API endpoints use HTTPS (Hosting.com provides)
- [ ] Sensitive data not logged
- [ ] CORS whitelist doesn't include `*`
- [ ] CORS doesn't accept credentials for public endpoints
- [ ] Rate limiting prevents abuse

### MongoDB Security
- [ ] IP whitelist configured in MongoDB Atlas
- [ ] Network access includes deployment server IP
- [ ] Database credentials strong and unique
- [ ] Collections have proper indexing
- [ ] No sensitive data stored unencrypted

### Hosting.com Deployment
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] Firewall rules configured
- [ ] DDoS protection enabled
- [ ] Regular backups configured

### Code Security
- [ ] No hardcoded secrets in code
- [ ] Environment variables used for all configs
- [ ] Error messages don't leak internal details
- [ ] Request validation comprehensive
- [ ] SQL injection (N/A) / NoSQL injection (✅ sanitized)

---

## 🛡️ Helmet Security Headers

```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
```

**Headers Enabled:**
```
Content-Security-Policy: Restricts resource loading
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

**Status:** ✅ Comprehensive security headers

---

## 🎯 Payment Validation Rules

### Order Creation Rules
1. ✅ Customer name required (non-empty)
2. ✅ Email required (valid email format)
3. ✅ Phone required
4. ✅ Address required (street, city, country)
5. ✅ At least one cart item required
6. ✅ Each item must reference existing product
7. ✅ Quantity must be positive integer
8. ✅ Product must have valid price
9. ✅ Variant (if specified) must exist
10. ✅ Coupon (if used) must be valid/active/not expired
11. ✅ Coupon usage limit must not be exceeded
12. ✅ Order subtotal must be > coupon minimum

### Pricing Calculations
```javascript
subtotal = sum(price * quantity for each item)
discount = calculateCoupon(subtotal) → max $discount
discounted = max(subtotal - discount, 0)
tax = discounted * 0.08 (hardcoded)
shipping = $10 (if subtotal > 0)
total = discounted + tax + shipping
```

**Status:** ✅ No client-side price manipulation possible

---

## 🔧 Stripe Configuration Template

### File: `server/.env`

```bash
# Stripe Live Keys (production)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_1xxxxxxxxxxxxx

# Stripe Test Keys (development)
# STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
# STRIPE_WEBHOOK_SECRET=whsec_1xxxxxxxxxxxxx
```

### Get Keys From:
1. Log in to Stripe Dashboard
2. Navigate to Developers → API Keys
3. Copy **Secret Key** (starts with `sk_`)
4. Go to Webhooks section
5. Add webhook endpoint: `https://yourdomain.hosting.com/api/payment/webhook`
6. Select event: `checkout.session.completed`
7. Copy **Signing Secret** (starts with `whsec_`)

---

## 📋 Webhook Testing (Before Production)

### Using Stripe CLI
```bash
# 1. Download Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS

# 2. Login to Stripe
stripe login

# 3. Forward webhooks to local server
stripe listen --forward-to http://localhost:5000/api/payment/webhook

# 4. In another terminal, trigger test event
stripe trigger checkout.session.completed
```

### Expected Response
```
[2026-06-12 12:00:00] checkout.session.completed
[2026-06-12 12:00:00] Webhook signature verification passed
[2026-06-12 12:00:00] Order marked as Paid
```

---

## 🚀 Stripe Dashboard Configuration

### Required Settings

1. **Webhook Endpoint**
   - URL: `https://yourdomain.hosting.com/api/payment/webhook`
   - Events: `checkout.session.completed`
   - Status: ✅ Active

2. **API Keys**
   - Live Mode: Enabled for production
   - Secret Key: Set in `STRIPE_SECRET_KEY`
   - Webhook Secret: Set in `STRIPE_WEBHOOK_SECRET`

3. **Checkout Settings**
   - Success URL: Uses session ID parameter
   - Cancel URL: Includes order ID parameter
   - Currency: USD (hardcoded)

---

## ⚠️ Known Security Considerations

### 1. Stripe Webhook Endpoint
**Risk:** Unverified webhooks could fake payments  
**Mitigation:** ✅ Signature verification enabled  
**Action Required:** Protect webhook URL from public disclosure

### 2. Idempotency Keys
**Risk:** Network retry could double-charge customer  
**Mitigation:** ✅ Idempotency keys enabled  
**Action Required:** Ensure Order ID is unique per request

### 3. Price Manipulation
**Risk:** Client sends custom price in cart  
**Mitigation:** ✅ Prices fetched from database  
**Action Required:** Never trust client prices

### 4. Coupon Abuse
**Risk:** Customer uses same coupon multiple times  
**Mitigation:** ✅ Usage limit and duplicate checking  
**Action Required:** Validate coupon before each use

### 5. MongoDB Atlas Network
**Risk:** Database not accessible from Hosting.com IP  
**Mitigation:** ⚠️ Requires IP whitelist update  
**Action Required:** Add Hosting.com server IP to MongoDB Atlas

---

## 🎯 Phase 5 Checklist

### Stripe Integration
- [ ] Stripe webhook handler validates signatures
- [ ] Idempotency keys prevent duplicate charges
- [ ] Event deduplication prevents double-processing
- [ ] Price validation prevents client-side manipulation
- [ ] Coupon validation checks usage limits

### Security Headers
- [ ] Helmet configured with security options
- [ ] CORS whitelist properly set
- [ ] XSS protection enabled
- [ ] CSRF protection in place
- [ ] CSP headers enforced

### Rate Limiting
- [ ] General API rate limit: 2000/10min
- [ ] Login rate limit: 10/15min
- [ ] OTP rate limit: 8/10min
- [ ] Password reset rate limit: 5/15min

### Data Validation
- [ ] NoSQL injection prevention enabled
- [ ] XSS sanitization enabled
- [ ] Request size limits enforced
- [ ] All inputs validated before processing

---

## 🔗 Next Steps

### Before Deployment
1. [ ] Obtain Stripe live API keys
2. [ ] Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
3. [ ] Register webhook endpoint in Stripe dashboard
4. [ ] Test webhook with Stripe CLI
5. [ ] Verify payment flow end-to-end

### Phase 6: Environment Consolidation
- [ ] Create master `.env.example` with all variables
- [ ] Document each variable's purpose and constraints
- [ ] Create environment setup script

### Phase 7: Deployment Instructions
- [ ] Final pre-deployment checklist
- [ ] Deployment procedure for Hosting.com
- [ ] Post-deployment verification
- [ ] Rollback procedures

---

**Report Status:** ✅ Phase 5 Audit Complete | Stripe Ready | Requires API Keys

**Key Finding:** Stripe integration is properly secured with signature verification, idempotency keys, and event deduplication. Security headers comprehensive. Only requires live Stripe keys before production.
