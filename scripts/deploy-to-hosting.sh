#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for Hosting.com (cPanel) environments.
# Usage: run this after cloning the repo on the hosting shell.

echo "Deploy helper started"

REPO_ROOT="$(pwd)"

echo "Checking Node.js version..."
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
  if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "WARNING: Node $NODE_MAJOR detected. Node >= 18 is required. Please enable Passenger/Node or install Node 18+."
  else
    echo "Node >=18 OK (v$(node -v))"
  fi
else
  echo "Node is not installed or not in PATH. Use cPanel Node.js app or install Node 18+."
fi

echo "Checking required environment variables (MONGO_URI, JWT_SECRET)..."
if [ -z "${MONGO_URI:-}" ] || [ -z "${JWT_SECRET:-}" ]; then
  echo "WARNING: MONGO_URI and/or JWT_SECRET are not set in the environment. Configure them in cPanel or export them before running."
else
  echo "Environment variables found: MONGO_URI and JWT_SECRET"
fi

# Backend install & start
if [ -d "server" ]; then
  echo "Installing backend dependencies (production)..."
  cd server
  if [ -f package-lock.json ]; then
    npm ci --production
  else
    npm install --production
  fi

  echo "Attempting to start backend. Prefer Passenger (cPanel) or pm2 if available."
  if command -v pm2 >/dev/null 2>&1; then
    echo "Starting with pm2 (pm2 start server.js --name ecoms-backend --update-env)"
    pm2 start server.js --name ecoms-backend --update-env || pm2 restart ecoms-backend || true
    pm2 save || true
  else
    echo "pm2 not found. If using Passenger, set app root to $(pwd) and entry file to server.js in cPanel Node app."
    echo "To run in background (not recommended on cPanel): nohup node server.js > server.log 2>&1 &"
  fi
  cd "$REPO_ROOT"
else
  echo "No server directory found; skipping backend install/start"
fi

# Frontend deploy: extract frontend-dist.zip to public_html/ecoms/
WWW_DIR="$HOME/public_html/ecoms"
if [ -f "$REPO_ROOT/frontend-dist.zip" ]; then
  echo "Found frontend-dist.zip — extracting to $WWW_DIR"
  mkdir -p "$WWW_DIR"
  unzip -o "$REPO_ROOT/frontend-dist.zip" -d "$WWW_DIR"
  echo "Frontend extracted. Ensure hosting-ecoms.htaccess is at $WWW_DIR/.htaccess"
else
  if [ -d "$REPO_ROOT/frontend/dist" ]; then
    echo "Copying existing frontend/dist to $WWW_DIR"
    mkdir -p "$WWW_DIR"
    cp -r "$REPO_ROOT/frontend/dist/." "$WWW_DIR/"
  else
    echo "No frontend build found. Run 'npm run build' locally and upload frontend-dist.zip or build on server." 
  fi
fi

echo "Deploy helper finished. Verify logs and that services are running."
