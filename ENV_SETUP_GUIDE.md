# Environment Variable Setup Guide

**Quick Links:**
- [For Developers](#for-developers)
- [For Hosting.com Deployment](#for-hosting-com-deployment)
- [Troubleshooting](#troubleshooting)

---

## 🚀 For Developers

### Step 1: Clone Repository
```bash
git clone https://github.com/your-repo.git
cd jts-wigs-store
```

### Step 2: Install Dependencies
```bash
# Frontend
npm install

# Backend
npm install --prefix server
```

### Step 3: Create Backend `.env`
```bash
cp server/.env.example server/.env
```

### Step 4: Get MongoDB URI
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account or login
3. Create cluster (or use existing)
4. Click "Connect"
5. Choose "Connect your application"
6. Copy connection string

### Step 5: Update `server/.env`
```bash
nano server/.env
```

**Set these values:**
```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?appName=...
JWT_SECRET=dev-secret-change-in-production
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
```

### Step 6: Start Development Servers

**Terminal 1 - Frontend:**
```bash
npm run dev
# Opens http://localhost:3000
```

**Terminal 2 - Backend:**
```bash
npm --prefix server dev
# Runs on http://localhost:5000
```

### Step 7: Verify Everything Works
- Frontend: http://localhost:3000 (should load)
- Backend: http://localhost:5000 (should show "JTS Beauty API is running")
- Health check: http://localhost:5000/api/health (should return JSON)

---

## 🌐 For Hosting.com Deployment

### Step 1: Prepare Backend

**Prerequisites:**
- MongoDB Atlas account with database
- Stripe account with API keys
- Hosting.com account with cPanel

#### 1a. Set Backend Environment Variables

Create `server/.env`:
```bash
cp server/.env.example server/.env
nano server/.env
```

**Fill in these values:**
```bash
# Required
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
JWT_SECRET=(use strong random value - see command below)
FRONTEND_URL=https://yourdomain.hosting.com
CLIENT_URL=https://yourdomain.hosting.com

# Stripe (required for payments)
STRIPE_SECRET_KEY=REDACTED_FOR_PRODUCTION
STRIPE_WEBHOOK_SECRET=REDACTED_FOR_PRODUCTION
```

**Generate JWT_SECRET:**
```bash
# Linux/macOS
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Windows PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output into JWT_SECRET value
```

#### 1b. Configure Stripe Webhooks

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Endpoint URL: `https://yourdomain.hosting.com/api/payment/webhook`
5. Events: Select `checkout.session.completed`
6. Copy **Signing Secret** → into `STRIPE_WEBHOOK_SECRET`

#### 1c. Configure MongoDB Atlas Network Access

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **Network Access**
3. Add IP address for Hosting.com server
   - Get from Hosting.com cPanel → Server Information
   - Or use `0.0.0.0/0` for testing (not recommended)
4. Click **Save**

### Step 2: Prepare Frontend

#### 2a. Build Frontend for Your Domain
```bash
# Replace yourdomain with your actual domain
VITE_API_URL=https://yourdomain.hosting.com/api npm run build
```

**Expected output:**
```
✓ 1886 modules transformed.
dist/index.html                   0.51 kB │ gzip:   0.32 kB
dist/assets/index-*.js          806.67 kB │ gzip: 224.83 kB
dist/assets/index-*.css          36.65 kB │ gzip:   7.23 kB
✓ built in 4.11s
```

#### 2b. Verify Build Contents
```bash
ls -la dist/
# Should see: index.html, 404.html, assets/, images/
```

### Step 3: Upload to Hosting.com

#### Option A: Using cPanel File Manager (Easier)

1. Log in to **cPanel** (usually https://yourdomain.hosting.com:2083)
2. Go to **File Manager** → **public_html**
3. Right-click → **Create New Folder** → name it `ecoms`
4. **Double-click ecoms** folder to enter
5. Click **Upload** button
6. Select all files from local `dist/` folder:
   - `index.html`
   - `404.html`
   - `assets/` folder (drag & drop)
   - `images/` folder (drag & drop)

#### Option B: Using FTP (If File Manager Unavailable)

1. Get FTP credentials from Hosting.com
2. Use FTP client (FileZilla, WinSCP, etc.)
3. Connect to hosting server
4. Navigate to `public_html/`
5. Create folder `ecoms/`
6. Upload contents of `dist/` into `ecoms/` folder

### Step 4: Configure Web Server (`.htaccess`)

1. In cPanel File Manager, go to `public_html/ecoms/`
2. Create new file: **`.htaccess`**
3. Add this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /ecoms/
  
  # Don't rewrite actual files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite all other requests to 404.html (which has hash redirect)
  RewriteRule ^ 404.html [L]
</IfModule>
```

### Step 5: Verify Frontend

1. Open browser: `https://yourdomain.hosting.com/ecoms/`
2. Should see homepage with products
3. Open browser DevTools → Console
4. Should have NO CORS errors
5. Try clicking a link (e.g., Products) - should work

### Step 6: Test Payment Flow (if using Stripe)

1. Log in to frontend
2. Add product to cart
3. Click Checkout
4. Use Stripe test card: `4242 4242 4242 4242`
5. Expiry: Any future date
6. CVC: Any 3 digits
7. Should see "Payment successful" message

---

## 🐛 Troubleshooting

### Frontend Issues

**Problem: "Blank page" when visiting `https://yourdomain.hosting.com/ecoms/`**
- Check browser console for errors
- Make sure all files uploaded to `public_html/ecoms/`
- Verify `index.html` and `404.html` are present

**Problem: "CORS error" when loading products**
- Backend CORS whitelist doesn't include your domain
- Fix: Update `server/.env`:
  ```bash
  FRONTEND_URL=https://yourdomain.hosting.com
  CLIENT_URL=https://yourdomain.hosting.com
  ```

**Problem: "Cannot GET /api/products" 404 error**
- Backend API not running or not accessible
- Check Backend URL in frontend build

### Backend Issues

**Problem: "MONGO_URI is not configured" on startup**
- Solution: Set `MONGO_URI` in `server/.env`
```bash
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=...
```

**Problem: "MongoDB connection timeout"**
- MongoDB Atlas IP whitelist doesn't include server IP
- Fix:
  1. Get server IP from Hosting.com
  2. Add to MongoDB Atlas Network Access
  3. Try again

**Problem: "Stripe webhook failed to verify"**
- Check `STRIPE_WEBHOOK_SECRET` is correct
- Make sure it matches the one in Stripe dashboard

**Problem: "Port 5000 already in use"**
- Another process using port 5000
- Solution: Use different port
  ```bash
  PORT=5001  # In server/.env
  ```

### Domain/SSL Issues

**Problem: "Mixed content" warnings (loading HTTP from HTTPS)**
- Make sure Hosting.com has SSL certificate
- Frontend/backend should both use HTTPS
- Hosting.com auto-enables Let's Encrypt

**Problem: "Certificate expired"**
- Hosting.com auto-renews Let's Encrypt
- Check SSL status in cPanel

---

## 📊 Environment Checklist

### Development
- [ ] `server/.env` created
- [ ] `MONGO_URI` set with dev database
- [ ] `JWT_SECRET` set (can be simple for dev)
- [ ] Frontend and backend running
- [ ] No CORS errors in console

### Staging
- [ ] `server/.env` updated for staging
- [ ] `FRONTEND_URL` set to staging domain
- [ ] `STRIPE_SECRET_KEY` set to test key
- [ ] Database backups configured
- [ ] SSL certificate active

### Production
- [ ] `server/.env` set with prod values
- [ ] `JWT_SECRET` strong and random
- [ ] `STRIPE_SECRET_KEY` set to live key
- [ ] `STRIPE_WEBHOOK_SECRET` registered in Stripe
- [ ] MongoDB Atlas backups enabled
- [ ] SSL certificate valid
- [ ] CORS whitelist includes prod domain

---

## 🔐 Security Checklist

### Before Going Live
- [ ] `.env` files NOT committed to git
- [ ] `.gitignore` includes `.env`
- [ ] No hardcoded secrets in code
- [ ] Stripe webhooks verified
- [ ] Database credentials strong
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Regular backups scheduled

### After Deployment
- [ ] Test full payment flow
- [ ] Check error logs
- [ ] Verify health endpoint: `/api/health`
- [ ] Monitor for CORS errors
- [ ] Set up error tracking
- [ ] Configure alerts for API downtime

---

## 📝 Reference Files

| File | Purpose | Status |
|------|---------|--------|
| `.env.example` | Template for all variables | ✅ Complete |
| `.env.b4a` | Back4App backend config | ✅ Complete |
| `.env.hosting` | Hosting.com backend config | ✅ Complete |
| `server/.env.example` | Backend variables template | ✅ Complete |
| `frontend/.env.production.example` | Frontend prod template | ✅ Complete |

---

## 🆘 Need Help?

### Common Commands

```bash
# Check if server is running
curl http://localhost:5000/api/health

# Check if frontend builds
npm run build

# View actual env vars (backend)
grep -v '^#' server/.env | grep -v '^$'

# Test MongoDB connection
mongosh "MONGO_URI_HERE"
```

### Getting Help

1. Check `.env.example` for variable descriptions
2. Check phase audit documents (PHASE_3, PHASE_4, PHASE_5)
3. Check error logs for specific error messages
4. See troubleshooting section above

---

**Last Updated:** 2026-06-12  
**Status:** ✅ Ready for Setup
