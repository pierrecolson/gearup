# Deploying GearUp to a VPS (Docker)

Target: Ubuntu 24.04 with Docker already installed (Hostinger KVM2 or similar).
One-time bootstrap, then auto-deploy on every push to `main` via GitHub Actions.

## One-time VPS setup

SSH in as **root** and copy-paste these blocks. Replace `<YOUR_SSH_PUBKEY>` and
`<DOMAIN>` where prompted.

### 1. Docker + compose plugin (skip if already installed)

```bash
docker --version || curl -fsSL https://get.docker.com | sh
docker compose version || apt install -y docker-compose-plugin
```

### 2. Deploy user (so GitHub Actions doesn't SSH as root)

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo,docker deploy

# Paste the PUBLIC half of your deploy key. Generate locally with:
#   ssh-keygen -t ed25519 -C "gearup-deploy" -f ~/.ssh/gearup_deploy
mkdir -p /home/deploy/.ssh
echo "<YOUR_SSH_PUBKEY>" > /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3. Firewall (skip if already configured)

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 4. Clone the repo + create production env

```bash
mkdir -p /var/www
git clone https://github.com/pierrecolson/gearup.git /var/www/gearup
chown -R deploy:deploy /var/www/gearup
```

Create `/var/www/gearup/.env.local` with your production values — **rotate any
key that was pasted in chat** before putting it here:

```bash
cat > /var/www/gearup/.env.local <<'EOF'
NEXT_PUBLIC_LOGODEV_KEY=pk_...
THIINGS_API_URL=http://76.13.181.11:3088
THIINGS_API_KEY=<rotated>
OPENROUTER_API_KEY=<rotated>
# OPENROUTER_MODEL=openai/gpt-5-mini   # optional override
AUTH_PASSWORD=<your real password>
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))">
EOF
chmod 600 /var/www/gearup/.env.local
chown deploy:deploy /var/www/gearup/.env.local
```

### 5. First deploy

```bash
install -m 755 -o root -g root \
  /var/www/gearup/deploy/gearup-deploy.sh \
  /usr/local/bin/gearup-deploy.sh

sudo -u deploy bash /usr/local/bin/gearup-deploy.sh
```

This builds the image and starts the container. Container is bound to
`127.0.0.1:3000` only — you need a reverse proxy on the host (or in another
container) to expose it.

### 6. Reverse proxy + HTTPS — pick one

**A. You already run Traefik / Caddy / nginx-proxy in Docker**: open
`docker-compose.yml`, uncomment the Traefik labels block at the bottom,
remove the `ports:` block, and set the `proxy` external network name to
match yours. Redeploy:

```bash
sudo -u deploy bash /usr/local/bin/gearup-deploy.sh
```

**B. No reverse proxy yet — use host Nginx**:

```bash
apt install -y nginx certbot python3-certbot-nginx

sed "s/<DOMAIN>/your-domain.com/" /var/www/gearup/deploy/nginx.conf \
  > /etc/nginx/sites-available/gearup.conf
ln -sf /etc/nginx/sites-available/gearup.conf /etc/nginx/sites-enabled/gearup.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d your-domain.com
```

Visit `https://your-domain.com` — should land on the login page.

---

## GitHub auto-deploy

In the repo on github.com → **Settings → Secrets and variables → Actions** —
add four secrets:

| Name | Value |
|---|---|
| `VPS_HOST` | your VPS IP or hostname |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | contents of the **private** key whose `.pub` is in `/home/deploy/.ssh/authorized_keys` |
| `VPS_PORT` | (optional) SSH port if non-standard |

Next push to `main` triggers `.github/workflows/deploy.yml` → SSH in → run
`/usr/local/bin/gearup-deploy.sh` → `docker compose up -d --build`. Watch
progress in the **Actions** tab.

---

## Day-to-day operations

| Task | Command |
|---|---|
| Tail logs | `docker compose -f /var/www/gearup/docker-compose.yml logs -f` |
| Restart | `docker compose -f /var/www/gearup/docker-compose.yml restart gearup` |
| Edit env | `nano /var/www/gearup/.env.local` then `docker compose up -d --build` (rebuild needed for `NEXT_PUBLIC_*`; otherwise `restart` is enough) |
| Manual deploy | `bash /usr/local/bin/gearup-deploy.sh` (as `deploy` user) |
| Status | `docker compose ps` and `docker compose top` |
| Rollback | `cd /var/www/gearup && git log --oneline \| head -5`, pick a SHA, `git reset --hard <sha> && bash /usr/local/bin/gearup-deploy.sh` |
| Shell into container | `docker compose exec gearup sh` |

## Filesystem layout on the VPS

```
/var/www/gearup/
├── .env.local            # secrets, never in git, not in image
├── docker-compose.yml
├── Dockerfile
├── data/                 # bind-mounted into the container at /app/data
│   ├── devices.json      # created lazily on first request
│   ├── groups.json
│   ├── categories.json
│   ├── resellers.json
│   ├── settings.json
│   ├── uploads/          # receipt files
│   └── .cache/           # FX rates, thiings icons, version lookups
└── ...                   # rest of the repo
```

Everything under `data/` is gitignored, lives on the host, survives `git reset
--hard` and container rebuilds. The container is stateless; the volume is the
state.

## Backups

A weekly cron is enough for personal use:

```bash
# As root:
cat > /etc/cron.weekly/gearup-backup <<'EOF'
#!/bin/bash
mkdir -p /var/backups/gearup
tar czf /var/backups/gearup/data-$(date +%F).tgz -C /var/www/gearup data/
find /var/backups/gearup -name 'data-*.tgz' -mtime +60 -delete
EOF
chmod +x /etc/cron.weekly/gearup-backup
```

Keeps weekly snapshots, prunes after 60 days. Mirror them off-box with
`rsync` to your laptop or to S3 if you want true off-site redundancy.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `502 Bad Gateway` after push | Container failed to start — `docker compose logs gearup` |
| Login page loads but every API returns 401 | `AUTH_PASSWORD` env var differs from what you're typing |
| Login page redirects forever | `SESSION_SECRET` is unset *and* the container can't read `AUTH_PASSWORD` (fallback derivation failed) — check `env_file` path |
| Logo.dev images broken after env change | `NEXT_PUBLIC_LOGODEV_KEY` is build-time — needs `up -d --build`, not just `restart` |
| `data/` permission errors | Bind-mount owned by root on the host but the container runs as uid 1001. Fix: `chown -R 1001:1001 /var/www/gearup/data` |
