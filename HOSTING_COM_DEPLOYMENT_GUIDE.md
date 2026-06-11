# Hosting.com Deployment Guide for JTS Beauty LLC

## Architecture Overview
- **Frontend**: Static React SPA deployed at `https://jtsbeautyllc.com` (root domain)
- **Backend**: Node.js Express API deployed at `https://api.jtsbeautyllc.com` (subdomain)
- **Database**: MongoDB Atlas (cloud, no local setup needed)
- **Payments**: Stripe (SaaS integration)

## Pre-Deployment Checklist

### 1. Frontend Deployment Prerequisites
- [ ] Domain pointed to Hosting.com nameservers (jtsbeautyllc.com)
- [ ] Hosting.com account with Node.js support enabled
- [ ] Git/Deploy integration configured in Hosting.com
- [ ] Node.js version 18+ available on hosting

### 2. Backend Deployment Prerequisites
- [ ] Subdomain created: api.jtsbeautyllc.com (CNAME or A record pointing to Hosting.com)
- [ ] MongoDB Atlas account with active cluster
- [ ] Stripe live account with API keys generated
- [ ] SMTP/Email service configured for password resets

## Deployment Steps

### Phase A: Frontend Deployment

#### Step 1: Prepare Build
```bash
# From root directory
cd frontend
npm install
npm run build
```

This creates `/frontend/dist/` with:
- `index.html` - Entry point
- `assets/` - CSS and JavaScript bundles

#### Step 2: Upload Static Files to Hosting.com
1. Connect via SFTP or Git deployment
2. Upload contents of `frontend/dist/` to Hosting.com public root:
   - Option 1: `public_html/` (if this is root domain)
   - Option 2: Hosting.com's web root (depends on control panel)
3. Verify `.htaccess` is configured for SPA routing (see section below)

#### Step 3: Configure SPA Routing with .htaccess
Create `.htaccess` in root of frontend deployment:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Serve static files if they exist
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [QSA,L]
  
  # Serve directories if they exist
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [QSA,L]
  
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [QSA,L]
</IfModule>
```

#### Step 4: Verify Frontend
1. Visit `https://jtsbeautyllc.com` in browser
2. Check browser console for CORS errors (should be none)
3. Verify page loads correctly

---

### Phase B: Backend API Deployment

#### Step 1: Install Node.js App on Hosting.com
1. Create subdomain: `api.jtsbeautyllc.com` in Hosting.com control panel
2. Set public directory to where Node.js will serve files
3. Ensure Node.js service is enabled

#### Step 2: Deploy Backend Code
```bash
# From root directory, upload server/ folder contents to api.jtsbeautyllc.com

# Option 1: Git Push (if Hosting.com supports)
git push hosting main

# Option 2: SFTP Upload
# Upload contents of /server/ to api.jtsbeautyllc.com public directory

# Option 3: SSH + Manual Deploy
ssh user@api.jtsbeautyllc.com
cd /path/to/app
git clone <repo>
npm install
```

#### Step 3: Configure Environment Variables
Create `.env` file on Hosting.com server at `/path/to/app/.env`:

```env
# Server Config
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/jts-beauty-db?retryWrites=true&w=majority

# JWT & Security
JWT_SECRET=<generate-secure-random-string>

# Stripe (Live Keys)
STRIPE_SECRET_KEY=REDACTED_FOR_PRODUCTION
STRIPE_WEBHOOK_SECRET=REDACTED_FOR_PRODUCTION
STRIPE_PUBLISHABLE_KEY=pk_live_<your-publishable-key>

# CORS
FRONTEND_URL=https://jtsbeautyllc.com
CLIENT_URL=https://jtsbeautyllc.com

# Email (for password resets)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-user>
SMTP_PASS=<your-smtp-password>
EMAIL_FROM=support@jtsbeautyllc.com

# Cloudinary (if used for image uploads)
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Rate Limiting
RATE_LIMIT_MAX=2000
LOGIN_RATE_LIMIT_MAX=10

# Admin Bootstrapping
ALLOW_ADMIN_BOOTSTRAP=false

# Additional
JWT_EXPIRE=7d
CURRENCY=USD
TAX_RATE=0.08
SHIPPING_AMOUNT=10
```

#### Step 4: Start Node.js Service
Hosting.com typically handles this automatically, but verify:
```bash
# On Hosting.com server
npm start

# Or if using PM2 for process management
pm2 start server.js --name "jts-api"
pm2 startup
pm2 save
```

#### Step 5: Verify Backend
```bash
# Test health endpoint
curl https://api.jtsbeautyllc.com/api/health

# Should return: { "success": true, "message": "API is running" }
```

---

### Phase C: Configure CORS
Verify `server/server.js` CORS is configured for production:

```javascript
const allowedOrigins = new Set([
  'https://jtsbeautyllc.com',
  'https://www.jtsbeautyllc.com',
  'https://api.jtsbeautyllc.com',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
]);
```

Already updated in codebase ✅

---

### Phase D: Configure Stripe Webhooks
1. Log into Stripe Dashboard
2. Go to Developers → Webhooks
3. Add endpoint: `https://api.jtsbeautyllc.com/api/webhooks/stripe`
4. Events to subscribe:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

---

### Phase E: SSL Certificates
- Hosting.com typically provides free SSL via AutoSSL
- Ensure both domains have valid certificates:
  - [ ] https://jtsbeautyllc.com (frontend)
  - [ ] https://api.jtsbeautyllc.com (backend)

---

### Phase F: Domain Configuration

#### DNS Records Needed:
1. **Main Domain** (jtsbeautyllc.com):
   - A record pointing to Hosting.com IP
   - www CNAME record pointing to main domain
   
2. **API Subdomain** (api.jtsbeautyllc.com):
   - CNAME record pointing to Hosting.com API endpoint
   - OR A record pointing to API server IP

#### Verification:
```bash
# Test DNS resolution
nslookup jtsbeautyllc.com
nslookup api.jtsbeautyllc.com

# Should resolve to Hosting.com servers
```

---

## Post-Deployment Testing

### Frontend Verification
- [ ] Home page loads at https://jtsbeautyllc.com
- [ ] Navigation routes work (React Router)
- [ ] Hash routes functional (#/products, #/cart, #/admin)
- [ ] Static assets load (images, CSS, JS)
- [ ] No CORS errors in browser console
- [ ] Admin login page accessible at /#/admin

### Backend Verification
- [ ] Health endpoint: `curl https://api.jtsbeautyllc.com/api/health`
- [ ] Products endpoint: `curl https://api.jtsbeautyllc.com/api/products`
- [ ] Authentication endpoints working
- [ ] Database connections stable

### Integration Verification
- [ ] Add product to cart → API responds
- [ ] Checkout flow works → Stripe integration active
- [ ] Payment success/failure pages redirect correctly
- [ ] Order confirmation emails send
- [ ] Admin dashboard loads data from API
- [ ] Login/logout works with JWT tokens
- [ ] CORS allows requests from frontend

---

## Production Monitoring

### Logging
- Monitor `/var/log/` on Hosting.com for Node.js errors
- Set up error notifications
- Monitor MongoDB Atlas connection status

### Performance
- Monitor API response times
- Check CPU/Memory usage on Hosting.com
- Monitor database query performance in MongoDB Atlas

### Security
- Regularly update npm dependencies: `npm audit fix`
- Monitor Stripe for failed payments
- Check CORS logs for unauthorized origins
- Verify JWT secrets are strong and never exposed

---

## Troubleshooting

### Frontend Issues
| Problem | Solution |
|---------|----------|
| 404 on refresh | Verify .htaccess SPA routing configuration |
| API calls fail | Check CORS whitelist includes jtsbeautyllc.com |
| Assets not loading | Verify base path in vite.config.js is "/" |
| Hash routes not working | Check index.html served for all routes |

### Backend Issues
| Problem | Solution |
|---------|----------|
| MONGO_URI error | Verify MongoDB Atlas connection string in .env |
| Port already in use | Check PORT env var, restart Node process |
| CORS errors | Add origin to allowedOrigins set in server.js |
| Stripe failures | Verify STRIPE_SECRET_KEY is live key, not test |

### Network Issues
| Problem | Solution |
|---------|----------|
| Subdomain not resolving | Verify DNS records, wait up to 24 hours |
| SSL certificate error | Verify AutoSSL enabled, wait for renewal |
| Slow API response | Check MongoDB Atlas cluster status |

---

## Rollback Plan

If deployment fails:

1. **Frontend**: Restore previous version via FTP or Git
2. **Backend**: Revert to previous commit: `git revert <commit-hash>`
3. **Database**: MongoDB Atlas automatic backups (14 days retention)
4. **Stripe**: No rollback needed (data immutable)

---

## Production Deployment Checklist

- [ ] All environment variables set on Hosting.com
- [ ] .env file created and secured (not committed to Git)
- [ ] CORS whitelist updated for production domains
- [ ] SSL certificates valid for both domains
- [ ] MongoDB Atlas cluster running and accessible
- [ ] Stripe webhooks configured
- [ ] Frontend builds and deploys without errors
- [ ] Backend starts without errors
- [ ] Health endpoints respond
- [ ] API and frontend communicate successfully
- [ ] Admin authentication works
- [ ] Payment flow completes
- [ ] Database queries execute correctly
- [ ] Error logs monitored
- [ ] Backups configured

---

## Contact & Support

For Hosting.com support:
- **Control Panel**: https://www.hosting.com/control-panel
- **Help**: https://www.hosting.com/support
- **Documentation**: https://docs.hosting.com

For MongoDB Atlas support:
- **Dashboard**: https://cloud.mongodb.com
- **Documentation**: https://docs.mongodb.com

For Stripe support:
- **Dashboard**: https://dashboard.stripe.com
- **Documentation**: https://stripe.com/docs
