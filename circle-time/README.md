# Circle Time — Meeting Room Booking System

Circle Time is an internal meeting-room management platform built for office environments. It provides a **web dashboard** for employees and admins to book rooms, view analytics, and manage resources, alongside a **tablet app** designed for SUNMI M2 MAX devices that displays real-time room status on the door. A **Django REST API** backs both clients with JWT authentication, role-based access, calendar provider integration stubs, and automatic no-show release.

## Architecture

```
┌─────────────┐   HTTP/REST    ┌───────────────────┐
│  Web App    │───────────────▶│                   │
│  (Vite)     │   proxy :5173  │   Django REST API │──▶ PostgreSQL
│  React 18   │                │   :8000            │
└─────────────┘                └────────┬──────────┘
                                        │
┌─────────────┐   HTTP/REST             │
│ Tablet App  │─────────────────────────┘
│ React Native│   poll every 10s
│ SUNMI M2 MAX│
└─────────────┘
```

| Component      | Stack                                   | Purpose                                                |
| -------------- | --------------------------------------- | ------------------------------------------------------ |
| **Backend**    | Django 6.0.2 + DRF + SimpleJWT          | REST API, auth, booking logic, analytics, auto-release |
| **Web App**    | Vite + React 18 + TypeScript + Tailwind | Employee booking, admin dashboard, analytics           |
| **Tablet App** | React Native 0.76                       | Room-door display — status, check-in, ad-hoc booking   |

## Quick Start (Development)

### Prerequisites

- Python 3.12
- Node.js 18+
- PostgreSQL 14+
- React Native CLI + Android SDK (for tablet app)

### 1. Clone the repository

```bash
git clone <repo-url> circle-time
cd circle-time
```

### 2. PostgreSQL — Create database and role

```bash
psql -U postgres -c "CREATE ROLE circletime LOGIN PASSWORD 'ct_dev_pass';"
psql -U postgres -c "CREATE DATABASE circletime_dev OWNER circletime;"
psql -U postgres -d circletime_dev -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate
# Activate (macOS/Linux)
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from example
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux

# Edit .env if your Postgres credentials differ from defaults

# Run migrations
.venv\Scripts\python.exe manage.py migrate

# Create the first admin user
.venv\Scripts\python.exe manage.py createsuperuser --email admin@example.com

# Start the dev server (binds to all interfaces so tablets can reach it)
.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
```

### 4. Web App Setup

```bash
cd web
npm install
npm run dev
# Opens at http://localhost:5173
```

> **Note:** `vite.config.ts` proxies `/api/*` requests to `http://localhost:8000`, so the web app communicates with the backend seamlessly in development.

### 5. Tablet App Setup

```bash
cd mobile
npm install

# For emulator:
adb reverse tcp:8000 tcp:8000
npx react-native run-android

# For physical SUNMI M2 MAX on the same LAN:
# 1. Find your PC's IP: ipconfig | Select-String "IPv4"
# 2. Create mobile/.env with: API_BASE_URL=http://<YOUR_PC_IP>:8000/api
# 3. Build a release APK:
cd android
./gradlew assembleRelease
# APK is at: android/app/build/outputs/apk/release/app-release.apk
# 4. Sideload via USB:
adb install android/app/build/outputs/apk/release/app-release.apk
```

## Environment Variables

All backend variables are configured in `backend/.env`. See `backend/.env.example` for defaults.

| Variable                  | Description                                         | Example                                                           |
| ------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `DJANGO_DEBUG`            | Enable Django debug mode                            | `True`                                                            |
| `SECRET_KEY`              | Django secret key (change in production!)           | `dev-ONLY-change-me`                                              |
| `ALLOWED_HOSTS`           | Comma-separated allowed hostnames                   | `localhost,127.0.0.1`                                             |
| `CORS_ALLOWED_ORIGINS`    | Allowed CORS origins                                | `http://localhost:5173`                                           |
| `DATABASE_URL`            | PostgreSQL connection string                        | `postgres://circletime:ct_dev_pass@localhost:5432/circletime_dev` |
| `PROVIDER_MODE`           | Calendar provider: `local`, `google`, `zoho`        | `local`                                                           |
| `CHECKIN_WINDOW_MINUTES`  | Minutes before/after start that check-in is allowed | `15`                                                              |
| `PSEUDONYMIZE_AFTER_DAYS` | Days before booking PII is purged                   | `30`                                                              |
| `TIME_ZONE`               | Server timezone                                     | `Africa/Johannesburg`                                             |
| `SENDGRID_API_KEY`        | SendGrid API key for transactional email            | `SG.your-key-here`                                                |
| `DEFAULT_FROM_EMAIL`      | Sender address for system emails                    | `noreply@yourdomain.com`                                          |
| `EMAIL_BACKEND`           | Django email backend class                          | `django.core.mail.backends.console.EmailBackend`                  |
| `FRONTEND_URL`            | Web app base URL (used in email links)              | `http://localhost:5173`                                           |
| `GOOGLE_CLIENT_ID`        | Google OAuth2 client ID                             | `your-id.apps.googleusercontent.com`                              |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth2 client secret                         | `your-google-client-secret`                                       |
| `MICROSOFT_CLIENT_ID`     | Microsoft/Azure AD client ID                        | `your-azure-app-client-id-uuid`                                   |
| `MICROSOFT_CLIENT_SECRET` | Microsoft/Azure AD client secret                    | `your-azure-client-secret`                                        |
| `MICROSOFT_TENANT_ID`     | Azure AD tenant ID                                  | `your-azure-tenant-id`                                            |
| `ZOHO_CLIENT_ID`          | Zoho OAuth2 client ID                               | `your-zoho-client-id`                                             |
| `ZOHO_CLIENT_SECRET`      | Zoho OAuth2 client secret                           | `your-zoho-client-secret`                                         |

The tablet app reads `API_BASE_URL` from `mobile/.env`. See `mobile/.env.example`.

## Default Accounts

- **Admin**: Created via `createsuperuser` during setup
- **Kiosk**: `kiosk@circletime.io` — auto-created system account used by tablets for ad-hoc bookings (no login required)

## Key URLs

| URL                              | Description               |
| -------------------------------- | ------------------------- |
| http://localhost:5173            | Web app (Vite dev server) |
| http://localhost:8000/api        | REST API                  |
| http://localhost:8000/admin      | Django admin panel        |
| http://localhost:8000/api/health | Health check endpoint     |

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System design, components, key decisions
- [Deployment](docs/DEPLOYMENT.md) — Production deployment guide
- [API Reference](docs/API.md) — Full endpoint documentation
- [Backend Planning Brief](docs/backend-planning-brief.md) — Original technical requirements
- [Frontend Contract](docs/frontend-contract.md) — API contract for frontend clients
