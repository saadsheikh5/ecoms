# Phase 7: Deployment Instructions & Production Readiness Checklist

**Deployment Type:** Hosting.com Shared Hosting + Back4App Backend  
**Timeline Estimate:** 30-45 minutes  
**Difficulty:** Intermediate

---

## 📋 Pre-Deployment Checklist (MUST COMPLETE)

### A. Frontend Preparation

- [ ] **Build completed successfully**
  ```bash
  npm run build
  # Expected: dist/ folder created with HTML/JS/CSS
  ```

- [ ] **Build contains required files**
  ```bash
  ls dist/
  # Should show: 404.html, assets/, images/, index.html
  ```

- [ ] **No errors in build output**
  - No "Cannot resolve module" errors
  - No "API URL not configured" errors
  - Only warnings allowed: bundle size warnings

### B. Backend Configuration

- [ ] **`server/.env` file exists**
  ```bash
  test -f server/.env && echo "✓ Exists" || echo "✗ Missing"
  ```

- [ ] **All required variables set**
  ```bash
  # Check these exist and are non-empty
  grep "^MONGO_URI=" server/.env
  grep "^JWT_SECRET=" server/.env
  grep "^FRONTEND_URL=" server/.env
  grep "^CLIENT_URL=" server/.env
  ```

- [ ] **Stripe keys configured** (if using payments)
  ```bash
  grep "^STRIPE_SECRET_KEY=" server/.env
  grep "^STRIPE_WEBHOOK_SECRET=" server/.env
  ```

- [ ] **Domain URLs correct**
  - `FRONTEND_URL` = `https://yourdomain.hosting.com`
  - `CLIENT_URL` = `https://yourdomain.hosting.com`
  - ❌ NOT `http://` (must be HTTPS)
  - ❌ NOT `localhost`

### C. Database & Services

- [ ] **MongoDB Atlas accessible**
  ```bash
  # Test connection with mongosh if installed
  mongosh "your-mongo-uri-here"
  # Type: exit
  ```

- [ ] **MongoDB IP whitelist includes Hosting.com server**
  1. Get Hosting.com server IP from cPanel
  2. Add to MongoDB Atlas Network Access
  3. Wait 5 minutes for changes to propagate

- [ ] **Stripe webhook endpoint registered** (if using payments)
  1. Stripe Dashboard → Developers → Webhooks
  2. Add endpoint: `https://yourdomain.hosting.com/api/payment/webhook`
  3. Events: `checkout.session.completed`
  4. Save **Signing Secret** to `STRIPE_WEBHOOK_SECRET`

### D. Hosting.com Preparation

- [ ] **cPanel access working**
  - Username: from Hosting.com email
  - Password: from Hosting.com email
  - URL: `https://yourdomain.hosting.com:2083`

- [ ] **Domain pointing to Hosting.com**
  - Check nameservers (should point to Hosting.com)
  - `nslookup yourdomain.hosting.com` should resolve

- [ ] **SSL certificate active**
  - cPanel → SSL/TLS → Certificates
  - Should show valid certificate (Let's Encrypt)
  - Status: "Active"

### E. File Preparation

- [ ] **All dist files ready**
  ```bash
  find dist -type f | wc -l
  # Should show 30+ files (HTML, JS, CSS, images)
  ```

- [ ] **Large files noted** (for slower uploads)
  - Main JS: `index-*.js` (~807 KB)
  - CSS: `index-*.css` (~36 KB)
  - Total: ~843 KB uncompressed

---

## 🚀 Step-by-Step Deployment

### PART 1: Upload Frontend to Hosting.com

#### Step 1: Log Into cPanel

1. Open browser: `https://yourdomain.hosting.com:2083`
2. Username: (from Hosting.com email)
3. Password: (from Hosting.com email)
4. Click **Log In**

#### Step 2: Access File Manager

1. In cPanel, find **File Manager**
2. Click to open
3. You should be in `public_html` folder

#### Step 3: Create `/ecoms` Folder

1. Right-click in empty space
2. Select **Create New Folder**
3. Type: `ecoms`
4. Press Enter/OK

#### Step 4: Upload Frontend Files

**Option A: Using Web Upload** (Slower, ~10-15 min)

1. Double-click `ecoms` folder to enter
2. Click **Upload** button
3. Select all files from local `dist/` folder:
   - `index.html` ✓
   - `404.html` ✓
   - Everything in `assets/` folder ✓
   - Everything in `images/` folder ✓
4. Click **Upload**
5. Wait for "Upload Complete" message

**Option B: Using FTP** (Faster, ~3-5 min)

1. Get FTP credentials:
   - cPanel → Files → FTP Accounts
   - Or email from Hosting.com
2. Download FTP client: FileZilla, WinSCP, or similar
3. Connect to Hosting.com:
   - Host: `yourdomain.hosting.com`
   - Username: FTP username
   - Password: FTP password
4. Navigate to `public_html/`
5. Create folder `ecoms/`
6. Drag `dist/` contents into `ecoms/` folder
7. Wait for upload to complete

#### Step 5: Create `.htaccess` File

1. In cPanel File Manager, go to `public_html/ecoms/`
2. Create new file:
   - Right-click → **Create New File**
   - Name: `.htaccess`
3. Edit file and add:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /ecoms/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ 404.html [L]
</IfModule>
```

4. Save and close

#### Step 6: Verify Upload

1. Open browser: `https://yourdomain.hosting.com/ecoms/`
2. Should see homepage
3. If blank: check browser console for errors

---

### PART 2: Verify Frontend is Working

#### Test 1: Homepage Loads

```bash
# In browser, open:
https://yourdomain.hosting.com/ecoms/

# Expected: JTS Beauty homepage with products
# Check browser console (F12 → Console tab)
# Should have NO red errors
```

**If blank page:**
- Check Dev Tools Console (F12) for errors
- Common: "Failed to fetch products" = backend not running
- Verify `dist/index.html` was uploaded correctly

#### Test 2: Navigation Works

1. Click on "Products" link
2. Should navigate to `#/products` (notice hash in URL)
3. Products should load from API

#### Test 3: API Connectivity

```javascript
// In browser console, run:
fetch('https://ecoms-lkswc2a9.b4a.run/api/health')
  .then(r => r.json())
  .then(d => console.log('API Status:', d))

// Expected output: { success: true, status: 'ok', ... }
```

#### Test 4: Add to Cart

1. Click a product
2. Click "Add to Cart"
3. Should show in cart (top right)
4. Cart persists on page reload

---

### PART 3: Backend Configuration (If Not on Back4App Yet)

**Note:** If backend is already on Back4App, skip to Part 4.

If deploying backend to Hosting.com (advanced):

1. Upload `server/` folder to Hosting.com
2. Configure Node.js/Passenger in cPanel
3. Set environment variables
4. Restart application

*(See Hosting.com docs or contact support for Node.js setup)*

---

### PART 4: Test Payment Flow (If Using Stripe)

#### Step 1: Add Product to Cart

1. Browse to `https://yourdomain.hosting.com/ecoms/`
2. Click a product
3. Adjust quantity if needed
4. Click "Add to Cart"

#### Step 2: Go to Checkout

1. Click shopping cart icon (top right)
2. Click "Proceed to Checkout"

#### Step 3: Enter Billing Info

```
Name: Test User
Email: test@example.com
Phone: +1234567890
Address: 123 Main St
City: Test City
State: TC
Zip: 12345
Country: United States
```

#### Step 4: Apply Coupon (Optional)

- If you have test coupon code, try it
- System should validate and apply discount

#### Step 5: Complete Payment

1. Click "Checkout"
2. Redirected to Stripe checkout
3. Use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/26)
   - CVC: `123`
4. Click "Pay"

#### Step 6: Verify Payment

- Should see success message
- Order should appear in admin dashboard
- Check Stripe Dashboard for payment record

---

## ✅ Post-Deployment Verification

### Immediate (Within 5 minutes)

- [ ] Frontend loads at `https://yourdomain.hosting.com/ecoms/`
- [ ] No JavaScript errors in browser console
- [ ] Products load from database
- [ ] Navigation works (hash routing)
- [ ] API health check passes

### Short-term (Within 1 hour)

- [ ] All pages load without errors
- [ ] Search functionality works
- [ ] Filters work correctly
- [ ] Add to cart works
- [ ] Remove from cart works
- [ ] Checkout page loads
- [ ] No CORS errors in console

### Medium-term (Within 24 hours)

- [ ] Payment flow works end-to-end
- [ ] Order confirmation email sent (if configured)
- [ ] Order appears in admin dashboard
- [ ] API response times acceptable (<2 seconds)
- [ ] No database connection errors
- [ ] SSL certificate valid

### Long-term (Ongoing)

- [ ] Monitor error logs
- [ ] Check API uptime
- [ ] Verify backups running
- [ ] Performance monitoring
- [ ] Security updates applied

---

## 🔙 Rollback Procedure

If something goes wrong, here's how to revert:

### Quick Rollback (< 5 minutes)

1. Go to cPanel File Manager
2. Delete `public_html/ecoms/` folder
3. Create new `ecoms/` folder
4. Re-upload previous working version of `dist/`
5. Restore `.htaccess` file

### More Complete Rollback (< 15 minutes)

1. In cPanel, take database snapshot backup
2. Stop application if running
3. Restore files from previous backup
4. Restore `.env` file (if changed)
5. Restart application
6. Test

### Full Rollback (< 30 minutes)

1. Contact Hosting.com support
2. Request restore from automated backup (usually daily)
3. Confirm restore point date/time
4. Restore performed by support team

---

## 📊 Post-Deployment Monitoring

### Health Check Script

```bash
#!/bin/bash
# Save as: check-health.sh
# Run: chmod +x check-health.sh && ./check-health.sh

DOMAIN="yourdomain.hosting.com"
API_URL="https://ecoms-lkswc2a9.b4a.run/api"

echo "=== Frontend Status ==="
curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ecoms/
echo " (should be 200)"

echo ""
echo "=== Backend API Status ==="
curl -s $API_URL/health | jq '.status'

echo ""
echo "=== Response Time ==="
time curl -s $API_URL/products > /dev/null
```

### Automated Monitoring (Uptime Monitoring)

Services to monitor (optional):
- [Pingdom](https://www.pingdom.com) - Free tier available
- [Status.io](https://status.io) - Service status page
- [Better Stack](https://betterstack.com) - Log/uptime monitoring

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Blank white page" on `https://yourdomain.hosting.com/ecoms/`

**Cause:** Frontend not loading or crashing  
**Solution:**
1. Check browser DevTools Console (F12)
2. Look for red errors
3. Common: "Cannot fetch /api/*" = backend not accessible
4. Verify API URL is correct in built frontend

### Issue 2: "CORS error" in console

```
Access to XMLHttpRequest at 'https://api.example.com/products'
from origin 'https://yourdomain.hosting.com'
has been blocked by CORS policy
```

**Cause:** Backend CORS whitelist doesn't include frontend domain  
**Solution:**
1. Update `server/.env`:
   ```bash
   FRONTEND_URL=https://yourdomain.hosting.com
   CLIENT_URL=https://yourdomain.hosting.com
   ```
2. Restart backend
3. Wait 5 seconds and refresh frontend

### Issue 3: "Cannot GET /api/health" 404 error

**Cause:** Backend not running or API endpoint not responding  
**Solution:**
1. Verify backend is running (if on Hosting.com)
2. Check if using Back4App:
   - Backend URL: `https://ecoms-lkswc2a9.b4a.run`
   - Should be publicly accessible
3. Test in browser: `https://ecoms-lkswc2a9.b4a.run/api/health`

### Issue 4: "Payment fails" with Stripe error

```
Error: Stripe is not configured on the server
```

**Cause:** `STRIPE_SECRET_KEY` not set  
**Solution:**
1. Get key from Stripe Dashboard
2. Set in `server/.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```
3. Restart backend

### Issue 5: "Timeout" errors loading products

**Cause:** API taking too long to respond  
**Solution:**
1. Check if MongoDB Atlas is accessible
2. Verify IP whitelist includes Hosting.com server
3. Check database performance
4. Increase timeout if temporary

---

## 📝 Production Readiness Final Checklist

### Security
- [ ] All HTTPS (no HTTP)
- [ ] SSL certificate valid
- [ ] CORS properly configured
- [ ] No sensitive data in console.log()
- [ ] Error messages don't leak internals
- [ ] Rate limiting enabled
- [ ] XSS/CSRF protections active

### Performance
- [ ] Page load < 3 seconds
- [ ] API response < 1 second
- [ ] Images optimized
- [ ] No console errors
- [ ] No performance warnings

### Reliability
- [ ] 99.9% uptime target
- [ ] Database backups daily
- [ ] Error monitoring active
- [ ] Rollback procedure documented
- [ ] Support contact info visible

### Compliance
- [ ] Privacy policy visible
- [ ] Terms of service visible
- [ ] Cookie consent (if needed)
- [ ] GDPR compliant (if EU users)

### Operations
- [ ] All credentials documented
- [ ] Contact list for support
- [ ] Escalation procedures
- [ ] Incident response plan
- [ ] Change log maintained

---

## 📞 Support & Troubleshooting

### Getting Help

**For frontend issues:**
- Browser DevTools Console (F12)
- Check Network tab for failed requests
- Check .htaccess configuration

**For backend issues:**
- SSH into Hosting.com (if applicable)
- Check error logs: `tail -f server.log`
- Verify .env variables: `grep -v '^#' server/.env`

**For Stripe issues:**
- Stripe Dashboard → Logs → Webhooks
- Verify webhook signing secret
- Check Stripe event history

**For database issues:**
- MongoDB Atlas → Metrics
- Check network access / IP whitelist
- Verify connection string
- Check database size limits

---

## 📚 Documentation Links

| Topic | Link | Status |
|-------|------|--------|
| Phase 2: Hosting.com Audit | [HOSTING_COM_DEPLOYMENT_AUDIT.md](HOSTING_COM_DEPLOYMENT_AUDIT.md) | ✅ |
| Phase 3: Frontend Audit | [PHASE_3_FRONTEND_BUILD_AUDIT.md](PHASE_3_FRONTEND_BUILD_AUDIT.md) | ✅ |
| Phase 4: Backend Audit | [PHASE_4_BACKEND_AUDIT.md](PHASE_4_BACKEND_AUDIT.md) | ✅ |
| Phase 5: Security Audit | [PHASE_5_STRIPE_SECURITY_AUDIT.md](PHASE_5_STRIPE_SECURITY_AUDIT.md) | ✅ |
| Build Config | [BUILD_CONFIGURATION.md](BUILD_CONFIGURATION.md) | ✅ |
| Env Setup | [ENV_SETUP_GUIDE.md](ENV_SETUP_GUIDE.md) | ✅ |

---

**Report Status:** ✅ Phase 7 Complete | Deployment Ready

**Estimated Deployment Time:** 30-45 minutes  
**Difficulty Level:** Intermediate (File uploads + config)  
**Risk Level:** Low (Frontend only, rollback easy)

**Next: Execute deployment following steps above, then verify post-deployment checklist.**
