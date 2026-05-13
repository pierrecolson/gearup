#!/usr/bin/env bash
# Runs on the VPS on every GitHub Actions deploy. Idempotent and re-runnable.
# Install once at /usr/local/bin/gearup-deploy.sh (see DEPLOY.md).
#
# Requires: git, docker (with the compose plugin), and a .env.local in $APP_DIR.

set -euo pipefail

APP_DIR="${GEARUP_DIR:-/var/www/gearup}"
BRANCH="${GEARUP_BRANCH:-main}"
ENV_FILE="${GEARUP_ENV_FILE:-.env.local}"

cd "$APP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $APP_DIR/$ENV_FILE is missing. Create it before deploying (see DEPLOY.md)."
  exit 1
fi

echo "→ Pulling latest from origin/$BRANCH"
git fetch --quiet origin "$BRANCH"
# Hard reset is safe because data/, .env.local, and node_modules are all
# gitignored — nothing tracked lives outside the source tree.
git reset --hard "origin/$BRANCH"

echo "→ Building + restarting container"
# --env-file: variable interpolation in compose (build args, etc.)
# --build: rebuild the image from the new source
# --remove-orphans: clean up containers from deleted services
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans

echo "→ Pruning dangling images"
docker image prune -f >/dev/null 2>&1 || true

echo "✓ Deploy complete: $(git rev-parse --short HEAD)"
echo "  Logs:    docker compose logs -f gearup"
echo "  Status:  docker compose ps"
