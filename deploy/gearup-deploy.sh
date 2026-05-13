#!/usr/bin/env bash
# Runs on the VPS on every GitHub Actions deploy. Idempotent and re-runnable.
# Install once at /usr/local/bin/gearup-deploy.sh (see DEPLOY.md).

set -euo pipefail

APP_DIR="${GEARUP_DIR:-/var/www/gearup}"
PM2_NAME="${GEARUP_PM2_NAME:-gearup}"
BRANCH="${GEARUP_BRANCH:-main}"

cd "$APP_DIR"

echo "→ Pulling latest from origin/$BRANCH"
git fetch --quiet origin "$BRANCH"
# Hard reset is safe because data/*.json + .env.local are gitignored — neither
# is tracked, so a reset can't clobber them. If someone ever commits something
# on the VPS by accident, this throws it away (which is what we want for prod).
git reset --hard "origin/$BRANCH"

echo "→ Installing dependencies"
npm ci --no-audit --no-fund

echo "→ Building"
npm run build

echo "→ Reloading pm2 process"
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_NAME" --update-env
else
  pm2 start npm --name "$PM2_NAME" -- start
fi
pm2 save

echo "✓ Deploy complete: $(git rev-parse --short HEAD)"
