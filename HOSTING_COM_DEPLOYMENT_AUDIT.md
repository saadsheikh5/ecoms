# Hosting.com Shared Hosting Deployment Audit

**Date:** 2026-06-12  
**Target:** Hosting.com Shared Hosting (cPanel, Passenger, static site)  
**Application:** JTS Beauty Ecommerce (React frontend + Express backend)

---

## 📋 Executive Summary

This repository contains a **hybrid deployment architecture**:
- **Frontend:** React + Vite (built as static site) → Deploy to Hosting.com shared hosting
- **Backend:** Node.js/Express + MongoDB Atlas → Already deployed on Back4App (b4a.run)
- **Database:** MongoDB Atlas (cloud-based, no local hosting needed)

**Status:** ⚠️ **PARTIALLY COMPATIBLE** — Frontend can deploy to Hosting.com; backend remains on Back4App.

---

## 🔍 Phase 2: Hosting.com Compatibility Assessment

### A. Frontend (React + Vite) - ✅ FULLY COMPATIBLE

| Component | Status | Notes |
|-----------|--------|-------|
| Framework | ✅ | React 18 + Vite (builds to static HTML/JS/CSS) |
| Base URL | ✅ | Configured as `base: '/ecoms/'` in vite.config.js |
| Build Output | ✅ | Static site (dist/ folder) ready for cPanel upload |
| Routing | ✅ | SPA with 404.html redirect → hash routing |
| Dependencies | ✅ | No server-side code; only client-side libraries |

**Recommendation:** Frontend is ready for Hosting.com shared hosting static deployment.

---

### B. Backend (Node.js/Express) - ⚠️ PARTIALLY COMPATIBLE

| Component | Status | Notes |
|-----------|--------|-------|
| Framework | ✅ | Express.js (lightweight, Passenger-compatible) |
| Node.js | ✅ | v18+ required (Hosting.com supports this) |
| Dependencies | ✅ | npm packages; no Redis/external services |
| MongoDB | ✅ | Uses MongoDB Atlas (no local DB required) |
| Stripe | ✅ | SaaS integration (no local install needed) |

**Status:** Backend can run on Hosting.com, **but currently deployed on Back4App**. See Phase 4 for backend deployment options.

---

### C. Critical Configuration Issues - 🔴 MUST FIX

#### Issue 1: Hardcoded API URL in Build Script
**Location:** `scripts/build-pages.mjs` (line 13)
```javascript
const productionApiUrl = 'https://ecoms-lkswc2a9.b4a.run/api';
```

**Problem:** The build script has a hardcoded Back4App URL. This breaks if:
- You redeploy the backend elsewhere
- You want to use a different backend for different environments
- You want to proxy API requests through Hosting.com

**Impact:** ⚠️ **HIGH** — Frontend cannot easily switch to a different backend

---

#### Issue 2: Frontend API Configuration - 🟡 NEEDS CLARIFICATION
**Location:** `frontend/.env.production.example` (line 3)
```
VITE_API_URL=/api
```

**Current State:** The environment variable suggests a relative `/api` path, but:
- The build script ignores this and uses the hardcoded URL
- Compiled assets show placeholder: `https://your-backend-domain.com/api`
- Runtime behavior unclear due to build script override

**Impact:** 🟡 **MEDIUM** — Ambiguous configuration; build script takes precedence

---

#### Issue 3: CORS Configuration
**Location:** `server/server.js` (lines 25-33)
```javascript
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  'https://saadsheikh5.github.io',
  'https://saadsheikh5.github.io/ecoms',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  // ...
]);
```

**Problem:** Backend CORS whitelist doesn't include:
- Hosting.com domain (e.g., `https://yourdomain.hosting.com`)
- Your custom domain if using Hosting.com nameservers

**Impact:** 🔴 **HIGH** — Frontend on Hosting.com will get CORS errors unless backend whitelist is updated

**Solution:**
```bash
# Backend .env must include:
FRONTEND_URL=https://yourdomain.hosting.com
CLIENT_URL=https://yourdomain.hosting.com
```

---

## 📊 Deployment Architecture Decision Matrix

### Option A: Frontend on Hosting.com + Backend on Back4App ✅ RECOMMENDED
**Pros:**
- Simple; uses existing Back4App backend
- Hosting.com handles static site hosting only
- No backend server management on Hosting.com

**Cons:**
- Dependent on Back4App uptime
- Cross-origin API calls (CORS required)
- Higher latency (separate providers)

**Setup:**
1. Upload `dist/` to Hosting.com public_html
2. Update backend CORS whitelist with Hosting.com domain
3. Frontend `.env` must resolve to Back4App API

---

### Option B: Frontend + Backend on Hosting.com ✅ ALTERNATIVE
**Pros:**
- Single provider (easier management)
- Lower latency
- Same IP/origin (fewer CORS issues)

**Cons:**
- More complex Hosting.com setup (Passenger + static site)
- Node.js app consumes more resources on shared hosting
- Backend and frontend scaling tied together

**Setup:**
1. Deploy Node.js backend to Hosting.com (Passenger)
2. Configure Passenger to route to Express app
3. Configure static site routing for `/ecoms/*` → frontend

**Note:** This requires cPanel setup for Node.js and is more advanced.

---

### Option C: Frontend on Hosting.com + Migrate Backend to Hosting.com ⚠️ COMPLEX
Similar to Option B but migrating from Back4App. Requires data migration and downtime.

---

## 🚀 Phase 3-7 Roadmap

### Phase 3: Frontend Build Audit (Next)
- [ ] Verify `npm run build` produces valid `dist/` structure
- [ ] Confirm 404.html redirect handles hash routing
- [ ] Check asset paths are relative or `/ecoms/`-prefixed
- [ ] Validate no hardcoded localhost URLs

### Phase 4: Backend Audit
- [ ] Confirm server.js uses correct env vars
- [ ] Update CORS whitelist for Hosting.com domain
- [ ] Verify all required env vars are set

### Phase 5: Stripe & Security Audit
- [ ] Validate Stripe webhook routing
- [ ] Check HTTPS enforcement
- [ ] Review helmet security headers
- [ ] Verify XSS/CSRF protections

### Phase 6: Environment Variable Consolidation
- [ ] Migrate from `backend/.env.example` → `server/.env.example`
- [ ] Standardize MONGO_URI across environments
- [ ] Document all required env vars

### Phase 7: Deployment Instructions
- [ ] Create step-by-step Hosting.com upload guide
- [ ] Document cPanel file manager upload process
- [ ] Create rollback procedures
- [ ] Production readiness checklist

---

## ⚙️ Hosting.com Shared Hosting Requirements

### File Structure
```
public_html/
├── ecoms/                    # Base path for frontend
│   ├── index.html           # Hash routing entry point
│   ├── 404.html             # Redirect for deep links
│   ├── assets/
│   │   ├── *.js
│   │   └── *.css
│   └── ...
└── [optional: Node.js backend setup]
```

### .htaccess Configuration (If Needed)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /ecoms/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /ecoms/404.html [L]
</IfModule>
```

### API Proxy (Optional, for Hosting.com Backend)
If running Node.js on Hosting.com, setup reverse proxy in `.htaccess`:
```apache
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  ProxyPass /api http://127.0.0.1:5000/api
  ProxyPassReverse /api http://127.0.0.1:5000/api
</IfModule>
```

---

## 🔧 Environment Variables Needed

### For Frontend (.env in dist build or via build script)
```
VITE_API_URL=https://ecoms-lkswc2a9.b4a.run/api
# OR (if using Hosting.com backend):
VITE_API_URL=https://yourdomain.hosting.com/api
```

### For Backend (server/.env)
```
# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?appName=Cluster0

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Frontend URLs (UPDATE FOR HOSTING.COM DOMAIN)
FRONTEND_URL=https://yourdomain.hosting.com
CLIENT_URL=https://yourdomain.hosting.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
PORT=5000
NODE_ENV=production
```

---

## ✅ Pre-Deployment Checklist

### Frontend Readiness
- [ ] Frontend builds without errors: `npm run build`
- [ ] `dist/` folder exists with proper structure
- [ ] `dist/ecoms/404.html` exists and redirects to hash routes
- [ ] No hardcoded localhost or API URLs in compiled assets
- [ ] `.env.production` or build vars set correctly

### Backend Readiness
- [ ] `server/.env` exists with all required vars
- [ ] MONGO_URI is valid (MongoDB Atlas accessible)
- [ ] JWT_SECRET is strong and unique
- [ ] Stripe keys are present (if using payments)
- [ ] FRONTEND_URL matches Hosting.com domain

### Hosting.com Setup
- [ ] cPanel account created and configured
- [ ] Domain pointed to Hosting.com nameservers
- [ ] SSL certificate provisioned (Let's Encrypt)
- [ ] File manager or FTP access working

### Post-Upload Verification
- [ ] Frontend loads at `https://yourdomain.hosting.com/ecoms/`
- [ ] Hash routes work (e.g., `#/products`, `#/checkout`)
- [ ] API calls succeed (check Network tab)
- [ ] No CORS errors in browser console
- [ ] Stripe payment flow works end-to-end

---

## 📝 Key Findings Summary

| Finding | Severity | Fix |
|---------|----------|-----|
| Hardcoded Build API URL | 🔴 HIGH | Extract to env var or build param |
| CORS whitelist outdated | 🔴 HIGH | Add Hosting.com domain before deploy |
| API URL config ambiguous | 🟡 MEDIUM | Clarify `.env.production.example` usage |
| No Hosting.com docs | 🟡 MEDIUM | Document cPanel upload & routing |
| Backend still on B4A | 🟢 LOW | Keep as-is or migrate later |

---

## 🎯 Next Steps

1. **Immediate:** Update CORS whitelist in `server/server.js` with your Hosting.com domain
2. **This Phase (Phase 3):** Run frontend build audit
3. **Phase 4:** Test backend startup with all required env vars
4. **Phase 5-7:** Complete remaining audits and generate deployment guide

---

**Report Status:** ✅ Audit Complete | Phase 2/7 Done | Ready for Phase 3
