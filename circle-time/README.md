# Circle Time — Local-First Setup Guide

> Complete local development setup for the meeting-room management system.
> Web app (employee booking + admin analytics) • Android panel app (room display) • Django backend.

---

## Architecture

```
┌─────────────┐   /api/*    ┌───────────────────┐   ProviderGateway
│   Web App   │────────────▶│   Django Backend   │───────────────────▶ local DB
│  (Vite)     │  proxy      │   (DRF + JWT)      │   (google/zoho stubs)
│  :5173      │             │   :8000             │
└─────────────┘             └──────┬──────────────┘
                                   │
┌─────────────┐   /api/*           │
│ Mobile Panel│────────────────────┘
│ (React Nav) │  HTTP / WS
│  SUNMI M2   │
└─────────────┘
```

### Five Django Apps

| App         | Responsibility                                                   |
| ----------- | ---------------------------------------------------------------- |
| `accounts`  | Auth (email+password JWT), users, roles, OIDC scaffold           |
| `rooms`     | Room CRUD, buildings, floor plans, availability                  |
| `bookings`  | Reservation lifecycle, conflict validation, check-in/end-early   |
| `panel`     | Mobile composite API (`/rooms/{id}/state`), meeting check-in/end |
| `analytics` | KPI, utilization, ghosting, capacity, heatmap, trends, export    |

### Provider Gateway (TRD Brokered Architecture)

`PROVIDER_MODE` in `.env` controls which adapter is used:

- **`local`** (default) — all data in PostgreSQL, no external calls
- **`google`** — stub adapter for Google Calendar API (future)
- **`zoho`** — stub adapter for Zoho Calendar API (future)

---

## Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Node.js 18+ / npm
- (Optional) Android emulator or SUNMI M2 MAX device

---

## 1) PostgreSQL — Create DB & Role

```bash
psql -U postgres -c "CREATE ROLE circletime LOGIN PASSWORD 'ct_dev_pass';"
psql -U postgres -c "CREATE DATABASE circletime_dev OWNER circletime;"
psql -U postgres -d circletime_dev -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
```

---

## 2) Backend — venv, deps, migrate, seed, run

```bash
cd circle-time/backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# (edit .env if your Postgres credentials differ)

# Run migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser --email admin@example.com
# When prompted, use password: pass1234

# Seed demo data (users, rooms, buildings, ~2 weeks of bookings)
python manage.py seed

# Start the server
python manage.py runserver 0.0.0.0:8000
```

### Environment Variables

| Variable                  | Default                                                           | Description                                 |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------- |
| `DJANGO_DEBUG`            | `True`                                                            | Debug mode                                  |
| `SECRET_KEY`              | `dev-ONLY-change-me`                                              | Django secret key                           |
| `ALLOWED_HOSTS`           | `localhost,127.0.0.1,0.0.0.0`                                     | Allowed hosts                               |
| `CORS_ALLOWED_ORIGINS`    | `http://localhost:5173`                                           | CORS origins                                |
| `DATABASE_URL`            | `postgres://circletime:ct_dev_pass@localhost:5432/circletime_dev` | PostgreSQL connection                       |
| `PROVIDER_MODE`           | `local`                                                           | Provider adapter: `local`, `google`, `zoho` |
| `CHECKIN_WINDOW_MINUTES`  | `15`                                                              | Check-in window duration                    |
| `PSEUDONYMIZE_AFTER_DAYS` | `30`                                                              | Days before pseudonymizing booking data     |
| `TIME_ZONE`               | `Africa/Johannesburg`                                             | Server timezone                             |

---

## 3) Web App — Vite proxy to `/api`

The `web/vite.config.ts` proxies `/api/*` → `http://localhost:8000` so the web client's relative `/api` base URL works unchanged.

```bash
cd circle-time/web
npm install
npm run dev
# Open http://localhost:5173
```

### Demo Credentials

| Email             | Password | Role  |
| ----------------- | -------- | ----- |
| admin@example.com | pass1234 | Admin |
| jane@example.com  | pass1234 | User  |

---

## 4) Mobile Panel — Point to laptop API

The mobile app uses `API_BASE_URL` in `mobile/src/services/api.ts`.

### Emulator

```bash
adb reverse tcp:8000 tcp:8000
cd circle-time/mobile
npx react-native run-android
```

The default `API_BASE_URL` is `http://10.0.2.2:8000/api` (Android emulator → host).

### Physical Device on Wi-Fi

1. Ensure phone/tablet is on the same LAN as your laptop.
2. Edit `mobile/src/services/api.ts`: set `API_BASE_URL = "http://<LAPTOP_LAN_IP>:8000/api"`.
3. Run the app.

---

## 5) Privacy — Pseudonymize Old Bookings

Per TRD §6, meeting titles and attendee names are purged after 30 days:

```bash
# Preview what would be changed
python manage.py pseudonymize_old_bookings --dry-run

# Actually pseudonymize
python manage.py pseudonymize_old_bookings

# Custom threshold
python manage.py pseudonymize_old_bookings --days 60
```

---

## API Endpoints

All responses use the envelope: `{ "success": boolean, "data": <payload|null>, "message"?: string }`

### Auth

| Method | Path                      | Auth | Description                              |
| ------ | ------------------------- | ---- | ---------------------------------------- |
| POST   | `/api/auth/login`         | No   | Email+password → JWT tokens + user       |
| GET    | `/api/auth/me`            | Yes  | Current user profile                     |
| GET    | `/api/auth/oidc/login`    | No   | OIDC redirect (stub — 501 in local mode) |
| GET    | `/api/auth/oidc/callback` | No   | OIDC callback (stub — 501 in local mode) |

### Health

| Method | Path          | Auth | Description  |
| ------ | ------------- | ---- | ------------ |
| GET    | `/api/health` | No   | Health check |

### Rooms

| Method | Path                                 | Auth | Description                                                              |
| ------ | ------------------------------------ | ---- | ------------------------------------------------------------------------ |
| GET    | `/api/rooms`                         | Yes  | List/filter rooms (searchQuery, building, floor, minCapacity, amenities) |
| GET    | `/api/rooms/{id}`                    | Yes  | Room details                                                             |
| GET    | `/api/rooms/{id}/availability?date=` | Yes  | Time-slot availability                                                   |
| GET    | `/api/buildings`                     | Yes  | List buildings                                                           |
| GET    | `/api/buildings/{id}/floors/{num}`   | Yes  | Floor plan with SVG + room positions                                     |

### Bookings

| Method | Path                             | Auth | Description                      |
| ------ | -------------------------------- | ---- | -------------------------------- |
| GET    | `/api/rooms/{id}/bookings?date=` | Yes  | Bookings by room + date          |
| POST   | `/api/bookings`                  | Yes  | Create booking (409 on conflict) |
| PUT    | `/api/bookings/{id}`             | Yes  | Update booking                   |
| DELETE | `/api/bookings/{id}`             | Yes  | Cancel booking                   |
| POST   | `/api/bookings/{id}/checkin`     | Yes  | Check in to booking              |
| POST   | `/api/bookings/{id}/end`         | Yes  | End booking early                |

### Panel (Mobile — no auth)

| Method | Path                         | Auth | Description                                               |
| ------ | ---------------------------- | ---- | --------------------------------------------------------- |
| GET    | `/api/rooms/{id}/state`      | No   | Composite room state (mobile enums + organizer as string) |
| POST   | `/api/meetings/{id}/checkin` | No   | Mobile check-in                                           |
| POST   | `/api/meetings/{id}/end`     | No   | Mobile end early                                          |

### Analytics (Admin)

| Method | Path                                                   | Auth | Description                  |
| ------ | ------------------------------------------------------ | ---- | ---------------------------- |
| GET    | `/api/analytics/kpi?startDate=&endDate=`               | Yes  | KPI summary                  |
| GET    | `/api/analytics/utilization?startDate=&endDate=`       | Yes  | Per-room utilization         |
| GET    | `/api/analytics/ghosting?startDate=&endDate=`          | Yes  | Per-room ghosting            |
| GET    | `/api/analytics/capacity?startDate=&endDate=`          | Yes  | Per-room capacity efficiency |
| GET    | `/api/analytics/heatmap?startDate=&endDate=`           | Yes  | Day × hour heatmap           |
| GET    | `/api/analytics/rooms/compare?startDate=&endDate=`     | Yes  | Room comparison              |
| GET    | `/api/analytics/trends?startDate=&endDate=&metric=`    | Yes  | Trend data                   |
| GET    | `/api/analytics/export?startDate=&endDate=&format=csv` | Yes  | CSV export                   |

---

## Acceptance Tests

### 1. Health Check

```bash
curl -s http://localhost:8000/api/health
# → { "success": true, "data": { "status": "ok" } }
```

### 2. Login

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@example.com", "password": "pass1234" }'
# → { "success": true, "data": { "access": "...", "refresh": "...", "user": {...} } }
```

### 3. Me

```bash
curl -s http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
# → { "success": true, "data": { "id": "...", "name": "John Doe", "email": "admin@example.com", ... } }
```

### 4. Rooms (filtered)

```bash
curl -s "http://localhost:8000/api/rooms?building=HQ&floor=1&minCapacity=6&amenities=whiteboard&searchQuery=conference" \
  -H "Authorization: Bearer <access_token>"
```

### 5. Room Details

```bash
curl -s http://localhost:8000/api/rooms/00000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer <access_token>"
```

### 6. Bookings by Room + Date

```bash
curl -s "http://localhost:8000/api/rooms/00000000-0000-0000-0000-000000000001/bookings?date=2026-02-10" \
  -H "Authorization: Bearer <access_token>"
```

### 7. Create Booking (conflict → 409)

```bash
curl -s -X POST http://localhost:8000/api/bookings \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "00000000-0000-0000-0000-000000000001",
    "title": "Ad-hoc Sync",
    "startTime": "2026-02-11T11:00:00Z",
    "endTime": "2026-02-11T11:30:00Z",
    "attendeeIds": []
  }'
```

### 8. Panel Room State (mobile — no auth)

```bash
curl -s http://localhost:8000/api/rooms/00000000-0000-0000-0000-000000000001/state
```

### 9. Analytics KPI

```bash
curl -s "http://localhost:8000/api/analytics/kpi?startDate=2026-01-27&endDate=2026-02-10" \
  -H "Authorization: Bearer <access_token>"
```

---

## Notes & Gotchas

- **CORS**: `http://localhost:5173` is included by default. In debug mode `CORS_ALLOW_ALL_ORIGINS=True`.
- **IDs**: All IDs are UUID strings. The mobile panel uses `room-001` which maps to `00000000-0000-0000-0000-000000000001`.
- **No trailing slashes**: `APPEND_SLASH=False`. All API paths have no trailing slash.
- **Time window**: Check-in window is 15 min (server-enforced). Mobile countdown uses device clock.
- **WebSocket**: WS route (`ws://localhost:8000/api/rooms/{id}/stream`) is ready for production per TRD; polling remains the method in local mode.
- **Provider mode**: Set `PROVIDER_MODE=local` (default). Future Google/Zoho integration only requires implementing the adapter methods.
- **JSON only**: `DEFAULT_RENDERER_CLASSES` is set to JSONRenderer only. No browsable API.

---

## Project Tree

```
circle-time/backend/
├── .env.example
├── manage.py
├── requirements.txt
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── exceptions.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── providers/
│   ├── __init__.py
│   ├── gateway.py
│   ├── google_adapter.py
│   └── zoho_adapter.py
├── accounts/
│   ├── __init__.py
│   ├── admin.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   └── migrations/
├── rooms/
│   ├── __init__.py
│   ├── admin.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   └── migrations/
├── bookings/
│   ├── __init__.py
│   ├── admin.py
│   ├── models.py
│   ├── serializers.py
│   ├── urls.py
│   ├── views.py
│   ├── management/
│   │   └── commands/
│   │       ├── pseudonymize_old_bookings.py
│   │       └── seed.py
│   └── migrations/
├── panel/
│   ├── __init__.py
│   ├── admin.py
│   ├── models.py
│   ├── urls.py
│   ├── views.py
│   └── migrations/
└── analytics/
    ├── __init__.py
    ├── admin.py
    ├── models.py
    ├── urls.py
    ├── views.py
    └── migrations/
```
