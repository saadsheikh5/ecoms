# Frontend Build Configuration Guide

This document explains how to build the frontend for different deployment targets and backend configurations.

---

## 📋 Quick Reference

### Build for Back4App Backend (Current Production)
```bash
npm run build:b4a
# or
npm run build
```

### Build for Hosting.com Backend  
```bash
VITE_API_URL=https://yourdomain.hosting.com/api npm run build
```

### Build with Custom API URL
```bash
# Linux/macOS
VITE_API_URL=https://custom-api.example.com/api npm run build

# Windows PowerShell
$env:VITE_API_URL='https://custom-api.example.com/api'; npm run build
```

---

## 🔧 How It Works

### Build Script Flow

1. **Read Configuration**
   - Check `VITE_API_URL` environment variable
   - If not set, use default: `https://ecoms-lkswc2a9.b4a.run/api`

2. **Fetch Products**
   - Try to fetch products from API at `${VITE_API_URL}/products`
   - If API fails, try MongoDB (requires `server/.env` with `MONGO_URI`)
   - If both fail, keep existing cached snapshot

3. **Compile Frontend**
   - Run Vite build with API URL embedded
   - Output: `dist/` folder with static HTML/CSS/JS

4. **Result**
   - API URL is hardcoded into compiled JavaScript
   - Cannot change backend without rebuilding

---

## 📁 Environment Files

### `.env.b4a` - Back4App Configuration
```bash
VITE_API_URL=https://ecoms-lkswc2a9.b4a.run/api
```

**Usage:**
```bash
source .env.b4a
npm run build
```

### `.env.hosting` - Hosting.com Configuration
```bash
VITE_API_URL=https://YOURDOMAIN.hosting.com/api
```

**Edit this file with your actual domain, then:**
```bash
source .env.hosting
npm run build
```

---

## 🎯 Deployment Scenarios

### Scenario 1: Frontend on Hosting.com + Backend on Back4App (✅ RECOMMENDED)

**Build Command:**
```bash
npm run build  # Uses default Back4App URL
```

**Upload to Hosting.com:**
```
cPanel File Manager → public_html/ecoms/
├── index.html
├── 404.html
├── assets/
└── images/
```

**Frontend URL:** `https://yourdomain.hosting.com/ecoms/`  
**API URL:** `https://ecoms-lkswc2a9.b4a.run/api`

---

### Scenario 2: Frontend & Backend on Hosting.com

**Step 1: Deploy Backend to Hosting.com (Node.js/Passenger)**

Deploy `server/` folder to Hosting.com with:
- `MONGO_URI` environment variable
- `JWT_SECRET` environment variable
- Passenger configured to run `server.js`

**Step 2: Build Frontend with Hosting.com API**

```bash
VITE_API_URL=https://yourdomain.hosting.com/api npm run build
```

**Step 3: Upload Frontend**

```
cPanel File Manager → public_html/ecoms/
```

**Frontend URL:** `https://yourdomain.hosting.com/ecoms/`  
**API URL:** `https://yourdomain.hosting.com/api`

---

### Scenario 3: Keep Current Setup (GitHub Pages + Back4App)

**Build Command:**
```bash
npm run build
```

**Deploy:**
```bash
npm run deploy  # Uploads to gh-pages
```

**Frontend URL:** `https://saadsheikh5.github.io/ecoms/`  
**API URL:** `https://ecoms-lkswc2a9.b4a.run/api`

---

## 🚀 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/build.yml`:

```yaml
name: Build for Different Targets

on:
  push:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      target:
        description: 'Build target'
        required: true
        default: 'b4a'
        type: choice
        options:
          - b4a
          - hosting

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      
      - run: npm run build:${{ github.event.inputs.target || 'b4a' }}
      
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

---

## ⚠️ Important Notes

### 1. API URL is Baked Into the Build
Once you build with an API URL, it's embedded in the compiled JavaScript. To change the API URL, you must rebuild.

### 2. Build Times
- First build: ~10-15 seconds (fetches products, compiles)
- Subsequent builds: ~5-6 seconds (uses cached products)

### 3. Product Cache
The `src/constants/apiCache.js` file caches products during build. This enables:
- **Offline fallback** if API is down at runtime
- **Faster page loads** (products pre-loaded)
- **SEO benefits** (content available at build time)

### 4. CORS Configuration
Regardless of build URL, the backend CORS whitelist must include the frontend domain:

```javascript
// server/server.js
const allowedOrigins = new Set([
  process.env.FRONTEND_URL,        // e.g., https://yourdomain.hosting.com
  process.env.CLIENT_URL,          // e.g., https://yourdomain.hosting.com  
  // ... other origins
]);
```

---

## 🔍 Troubleshooting

### Build Fails: "Unable to resolve MONGO_URI"
**Cause:** `server/.env` not configured  
**Fix:** Populate `server/.env` with valid MongoDB Atlas connection string

### Build Succeeds but API Calls Fail
**Cause:** CORS error from backend  
**Fix:** Update backend `CORS_WHITELIST` to include your Hosting.com domain

### API Cache Not Updating
**Cause:** API endpoint not accessible or returning wrong format  
**Fix:** Check API endpoint responds with `{ success: true, data: [...] }` format

### Large Bundle Size
**Cause:** React + dependencies = ~800 KB uncompressed  
**Mitigation:** Use gzip compression (Hosting.com should handle this)

---

## 📊 Build Output Structure

```
dist/
├── index.html                 # SPA entry point (~0.5 KB)
├── 404.html                   # Redirect for deep links
├── assets/
│   ├── index-HoGdFF2S.js     # Main React bundle (~807 KB)
│   └── index-jlsa6lb8.css    # Tailwind CSS (~36 KB)
└── images/
    ├── logo.png
    ├── *.PNG
    └── ...

Total Size: ~843 KB uncompressed, ~232 KB gzipped
```

---

## 🎯 Next Steps

1. **Test Build for Different Targets**
   ```bash
   npm run build:b4a
   VITE_API_URL=https://example.com/api npm run build
   ```

2. **Update Backend CORS Whitelist**
   - Edit `server/server.js`
   - Add Hosting.com domain to `allowedOrigins`

3. **Prepare Hosting.com Upload**
   - Create `ecoms/` folder in cPanel
   - Upload `dist/` contents

4. **Verify Frontend on Hosting.com**
   - Navigate to `https://yourdomain.hosting.com/ecoms/`
   - Check browser console for errors

---

**Last Updated:** 2026-06-12  
**Status:** ✅ Configuration Complete | Ready for Deployment
