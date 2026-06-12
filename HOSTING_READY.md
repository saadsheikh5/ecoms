Hosting.com Ready: Clone & Deploy

This repo has been prepared for cloning to Hosting.com (cPanel/Passenger). Follow these steps on the server (or use the included built frontend archive `frontend-dist.zip`):

1) Clone the repo
```bash
cd ~
git clone https://github.com/saadsheikh5/ecoms.git ecoms
cd ecoms
```

2) Backend (server) setup
- The backend is in `server/` and requires Node >= 18 (see `server/package.json` engines).
- In cPanel Node.js app or SSH session, set environment variables (do NOT commit `.env`):
  - `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, `CLIENT_URL`, `PORT` (if needed)
- Install and start:
```bash
cd ~/ecoms/server
npm install --production
# Start via Passenger (cPanel) by pointing the Node app root to ~/ecoms/server and entry file server.js
# Or use pm2:
pm install -g pm2
pm install
pm run build # optional if your deploy needs to run any build steps in server
pm start # or pm2 start server.js --name ecoms-backend
```

3) Frontend deployment options
A) Upload pre-built archive (recommended):
- Upload `frontend-dist.zip` to `public_html/ecoms/` using cPanel File Manager or SCP and extract there.
- Place `hosting-ecoms.htaccess` as `public_html/ecoms/.htaccess` (already provided in repo as `hosting-ecoms.htaccess`).

B) Build on server (if Node/Vite present):
```bash
cd ~/ecoms
# install deps at repo root because frontend files are built via scripts/build-pages.mjs
npm install
npm run build
# Copy generated files to public_html/ecoms/
```

4) Stripe webhook
- In Stripe dashboard, register webhook endpoint: `https://api.jtsbeautyllc.com/api/payment/webhook`
- Copy webhook secret into `STRIPE_WEBHOOK_SECRET` in server environment variables.

5) MongoDB Atlas
- Add Hosting.com server IP(s) to Atlas Network Access whitelist so `MONGO_URI` connects.

6) SSL & DNS
- Ensure `api.jtsbeautyllc.com` and `jtsbeautyllc.com` DNS point to your Hosting.com server and SSL is provisioned.

Notes & Safety
- `backend/.env` and `server/.env` are ignored; never commit live secrets. Use cPanel environment management to set secrets securely.
- The repo branch `architecture-refactor` contains the sanitized, production-ready changes and is pushed to GitHub.

If you want, I can:
- Build and upload the frontend archive directly to your hosting via SCP (you must provide SSH credentials), or
- Attempt a remote run (build on server) if you provide hosting SSH access.
