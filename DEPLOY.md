# Deploying GearUp to a VPS

Target: fresh Ubuntu 24.04 (Hostinger KVM2 or similar). One-time bootstrap, then auto-deploy on every push to `main` via GitHub Actions.

## One-time VPS setup

SSH in as **root** and copy-paste these blocks. Replace `<DOMAIN>` and `<YOUR_SSH_PUBKEY>` where prompted.

### 1. System packages

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx ufw git
npm install -g pm2
```

### 2. Deploy user (so GitHub Actions doesn't SSH as root)

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy

# Paste the PUBLIC half of your deploy key here. Generate one with:
#   ssh-keygen -t ed25519 -C "gearup-deploy" -f ~/.ssh/gearup_deploy
# Use the *public* key (.pub) below, store the *private* key in GitHub Secrets.
mkdir -p /home/deploy/.ssh
echo "<YOUR_SSH_PUBKEY>" > /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Let `deploy` run pm2 + reload nginx without password prompts.
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy
```

### 3. Firewall

```bash
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable
```

### 4. Clone the repo and seed env

```bash
mkdir -p /var/www
git clone https://github.com/pierrecolson/gearup.git /var/www/gearup
chown -R deploy:deploy /var/www/gearup

# Production env. Generate fresh values — rotate any keys that were pasted in chat.
cat > /var/www/gearup/.env.local <<'EOF'
NEXT_PUBLIC_LOGODEV_KEY=pk_...
THIINGS_API_URL=http://76.13.181.11:3088
THIINGS_API_KEY=<rotated>
OPENROUTER_API_KEY=<rotated>
# OPENROUTER_MODEL=openai/gpt-5-mini   # optional override

AUTH_PASSWORD=<your real password>
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))">

NODE_ENV=production
EOF
chmod 600 /var/www/gearup/.env.local
chown deploy:deploy /var/www/gearup/.env.local
```

### 5. First build + start the process

```bash
sudo -u deploy bash <<'EOF'
cd /var/www/gearup
npm ci --no-audit --no-fund
npm run build
pm2 start npm --name gearup -- start
pm2 save
EOF

# Make pm2 survive reboots — the `pm2 startup` command prints another
# command you have to run as root. Do that.
sudo -u deploy pm2 startup systemd -u deploy --hp /home/deploy
# ... it prints a `sudo env PATH=... pm2 startup ...` command — copy/paste it.
```

### 6. Install the deploy script

```bash
install -m 755 -o root -g root \
  /var/www/gearup/deploy/gearup-deploy.sh \
  /usr/local/bin/gearup-deploy.sh
```

### 7. Nginx reverse proxy

```bash
# Edit the file and replace <DOMAIN> with your real hostname first:
sed "s/<DOMAIN>/your-domain.com/" /var/www/gearup/deploy/nginx.conf \
  > /etc/nginx/sites-available/gearup.conf
ln -sf /etc/nginx/sites-available/gearup.conf /etc/nginx/sites-enabled/gearup.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 8. HTTPS

```bash
certbot --nginx -d your-domain.com
# Pick "redirect HTTP → HTTPS" when asked. Renewal is auto via systemd timer.
```

Visit `https://your-domain.com` — you should hit the login page.

---

## GitHub auto-deploy

In the repo on github.com → **Settings → Secrets and variables → Actions** → add four secrets:

| Name | Value |
|---|---|
| `VPS_HOST` | your VPS IP or hostname |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | contents of the **private** key whose `.pub` you put in `/home/deploy/.ssh/authorized_keys` |
| `VPS_PORT` | (optional) SSH port if non-standard |

That's it. Next push to `main` triggers `.github/workflows/deploy.yml` → SSHes in → runs `/usr/local/bin/gearup-deploy.sh` → reloads pm2. Watch progress in the repo's **Actions** tab.

---

## Day-to-day operations

| Task | Command |
|---|---|
| Tail logs | `pm2 logs gearup` |
| Restart manually | `pm2 reload gearup --update-env` |
| Edit env vars | `nano /var/www/gearup/.env.local` then `pm2 reload gearup --update-env`. **`NEXT_PUBLIC_*` changes also need a rebuild** — easiest is to trigger a manual deploy from GitHub Actions ("Run workflow"). |
| Manual deploy | `bash /usr/local/bin/gearup-deploy.sh` (as `deploy` user) |
| Status | `pm2 status` |
| Backup data | `tar czf gearup-backup-$(date +%F).tgz -C /var/www/gearup data/` (or `scp` it home) |
| Rollback | `cd /var/www/gearup && git log --oneline | head -5` to pick a SHA, then `git reset --hard <sha> && npm ci && npm run build && pm2 reload gearup --update-env` |

## Filesystem layout on the VPS

```
/var/www/gearup/
├── .env.local            # production secrets, never in git
├── data/
│   ├── devices.json      # gitignored — created on first request
│   ├── groups.json
│   ├── categories.json
│   ├── resellers.json
│   ├── settings.json
│   ├── uploads/          # receipt files
│   └── .cache/           # FX rates, thiings icons, version lookups
└── ...                   # rest of the repo
```

Everything under `data/` is gitignored. `git reset --hard` in the deploy script doesn't touch it. The container/VPS reboot doesn't touch it. The only ways to lose this data:

1. You `rm -rf /var/www/gearup/data/`
2. Hostinger replaces the VPS disk (very rare; back up periodically)

Run a periodic backup. A weekly cron is enough for personal use:

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

Keeps weekly snapshots, prunes anything older than 60 days.
