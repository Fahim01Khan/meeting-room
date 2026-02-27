# Deployment Guide

## Prerequisites

- **Server**: Ubuntu 22.04+ (or equivalent Linux) with:
  - Python 3.12
  - Node.js 18+
  - PostgreSQL 14+
  - nginx
  - A domain name with DNS pointing to the server
  - SSL certificate (Let's Encrypt recommended)

---

## Environment Variables for Production

Copy `backend/.env.example` to `backend/.env` and update every value:

| Variable                  | Production Value                                                         |
| ------------------------- | ------------------------------------------------------------------------ |
| `DJANGO_DEBUG`            | `False`                                                                  |
| `SECRET_KEY`              | Generate with `python -c "import secrets; print(secrets.token_hex(50))"` |
| `ALLOWED_HOSTS`           | `yourdomain.com,www.yourdomain.com`                                      |
| `CORS_ALLOWED_ORIGINS`    | `https://yourdomain.com`                                                 |
| `DATABASE_URL`            | `postgres://circletime:<strong-password>@localhost:5432/circletime_prod` |
| `PROVIDER_MODE`           | `local` (or `google` / `zoho` when calendar integration is ready)        |
| `CHECKIN_WINDOW_MINUTES`  | `15` (adjust per org preference)                                         |
| `PSEUDONYMIZE_AFTER_DAYS` | `30`                                                                     |
| `TIME_ZONE`               | `Africa/Johannesburg` (or your local timezone)                           |
| `EMAIL_BACKEND`           | `django.core.mail.backends.smtp.EmailBackend`                            |
| `SENDGRID_API_KEY`        | `SG.<your-production-sendgrid-key>`                                      |
| `DEFAULT_FROM_EMAIL`      | `noreply@groworx.co.za`                                                  |
| `FRONTEND_URL`            | `https://yourdomain.com`                                                 |
| `GOOGLE_CLIENT_ID`        | Production Google OAuth2 client ID                                       |
| `GOOGLE_CLIENT_SECRET`    | Production Google OAuth2 client secret                                   |
| `MICROSOFT_CLIENT_ID`     | Production Azure AD client ID                                            |
| `MICROSOFT_CLIENT_SECRET` | Production Azure AD client secret                                        |
| `MICROSOFT_TENANT_ID`     | Production Azure AD tenant ID                                            |
| `ZOHO_CLIENT_ID`          | Production Zoho OAuth2 client ID                                         |
| `ZOHO_CLIENT_SECRET`      | Production Zoho OAuth2 client secret                                     |
| `CALENDAR_REDIRECT_URI`   | `https://yourdomain.com/api/auth/calendar-tokens/callback`               |

---

## Deployment Steps

### 1. Server Setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3.12 python3.12-venv python3-pip \
  postgresql postgresql-contrib nginx certbot python3-certbot-nginx \
  nodejs npm git -y
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone <repo-url> circle-time
sudo chown -R $USER:$USER circle-time
cd circle-time
```

### 3. Create Production Database

```bash
sudo -u postgres psql -c "CREATE ROLE circletime LOGIN PASSWORD '<strong-password>';"
sudo -u postgres psql -c "CREATE DATABASE circletime_prod OWNER circletime;"
sudo -u postgres psql -d circletime_prod -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
```

### 4. Backend Setup

```bash
cd /opt/circle-time/backend

python3.12 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
pip install gunicorn

# Create .env from example and edit with production values
cp .env.example .env
nano .env
```

### 5. Run Migrations

```bash
source .venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

### 6. Create Superuser

```bash
python manage.py createsuperuser --email admin@yourdomain.com
```

### 7. Run with Gunicorn

Test manually first:

```bash
gunicorn config.wsgi:application \
  --bind 127.0.0.1:8000 \
  --workers 3 \
  --timeout 120
```

Then create a systemd service:

```ini
# /etc/systemd/system/circletime.service
[Unit]
Description=Circle Time Django API
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/circle-time/backend
Environment="PATH=/opt/circle-time/backend/.venv/bin"
EnvironmentFile=/opt/circle-time/backend/.env
ExecStart=/opt/circle-time/backend/.venv/bin/gunicorn config.wsgi:application \
  --bind 127.0.0.1:8000 \
  --workers 3 \
  --timeout 120 \
  --access-logfile /var/log/circletime/access.log \
  --error-logfile /var/log/circletime/error.log
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo mkdir -p /var/log/circletime
sudo chown www-data:www-data /var/log/circletime
sudo systemctl daemon-reload
sudo systemctl enable circletime
sudo systemctl start circletime
```

### 8. Build Web App

```bash
cd /opt/circle-time/web
npm install
npm run build
# Output is in web/dist/
```

### 9. Configure nginx

```nginx
# /etc/nginx/sites-available/circletime
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Django API + admin
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django static files (admin CSS/JS)
    location /static/ {
        alias /opt/circle-time/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Web app (Vite build output)
    location / {
        root /opt/circle-time/web/dist;
        try_files $uri $uri/ /index.html;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/circletime /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Auto-Release Cron Job

The auto-release mechanism runs on every tablet poll, but for rooms without tablets, add a server cron job:

```bash
crontab -e
```

Add:

```
* * * * * /opt/circle-time/backend/.venv/bin/python /opt/circle-time/backend/manage.py auto_release >> /var/log/circletime/auto_release.log 2>&1
```

This runs every minute and releases bookings that exceed the check-in window.

---

## Pseudonymization Cron Job

Per privacy requirements, booking PII (titles, attendee names) should be purged after the configured retention period:

```
0 2 * * * /opt/circle-time/backend/.venv/bin/python /opt/circle-time/backend/manage.py pseudonymize_old_bookings >> /var/log/circletime/pseudonymize.log 2>&1
```

This runs daily at 2 AM.

---

## OAuth Redirect URIs

After deployment, update the authorised redirect URIs in each provider's console:

| Provider      | Console URL                                                                                      | Redirect URI to Add                                        |
| ------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| **Google**    | [Google Cloud Console](https://console.cloud.google.com/apis/credentials)                        | `https://yourdomain.com/api/auth/calendar-tokens/callback` |
| **Microsoft** | [Azure Portal → App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps) | `https://yourdomain.com/api/auth/calendar-tokens/callback` |
| **Zoho**      | [Zoho API Console](https://api-console.zoho.com/)                                                | `https://yourdomain.com/api/auth/calendar-tokens/callback` |

Also add the production domain to the Google Cloud Console "Authorised JavaScript origins" if using Google Sign-In.

---

## APK Rebuild for Production

When the API URL changes from a development LAN IP to the production domain:

1. Update `mobile/.env`:

   ```
   API_BASE_URL=https://yourdomain.com/api
   ```

2. Rebuild the release APK:

   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```

3. Sideload to all SUNMI tablets:
   ```bash
   adb install -r app/build/outputs/apk/release/app-release.apk
   ```

> **Tip**: After sideloading, the tablet will auto-pair using its stored pairing code. No re-pairing is needed unless the device was factory-reset.

---

## Health Check

Verify the deployment:

```bash
curl -s https://yourdomain.com/api/health
# Expected: {"success": true, "data": {"status": "ok"}}
```

---

## Troubleshooting

| Symptom                | Check                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| 502 Bad Gateway        | `sudo systemctl status circletime` — is Gunicorn running?                        |
| Static files 404       | Did you run `collectstatic`? Check nginx `alias` path.                           |
| CORS errors            | Verify `CORS_ALLOWED_ORIGINS` matches the exact frontend URL (including scheme). |
| Tablets not connecting | Is the API reachable from the tablet's network? Check firewall rules.            |
| Emails not sending     | Verify `SENDGRID_API_KEY` and `EMAIL_BACKEND` in `.env`. Check logs.             |
| OAuth callback fails   | Ensure redirect URI in provider console exactly matches `CALENDAR_REDIRECT_URI`. |
