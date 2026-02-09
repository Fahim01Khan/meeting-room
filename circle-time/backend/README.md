# Circle Time — Backend

Django REST Framework backend for the Circle Time meeting-room management system.

---

## Tech Stack

| Component  | Choice                       | Why                                                   |
| ---------- | ---------------------------- | ----------------------------------------------------- |
| Language   | Python 3.12+                 | Latest stable, required by project                    |
| Framework  | Django 5.1 + DRF 3.15        | Battle-tested, explicit, boring                       |
| Database   | PostgreSQL                   | No SQLite fallback — Postgres from day one            |
| Auth       | SimpleJWT (access + refresh) | Stateless JWT, Bearer header, built-in token rotation |
| Env config | django-environ               | 12-factor env var management                          |
| CORS       | django-cors-headers          | Frontend dev on a different port                      |

### Why SimpleJWT?

The V1 API contract requires `Authorization: Bearer <token>`. SimpleJWT provides this natively with:

- **Access + refresh token pair** — short-lived access tokens (30 min) with long-lived refresh tokens (7 days) for secure session management.
- **Stateless verification** — no database lookup per request (unlike DRF TokenAuth).
- **Built-in rotation** — `ROTATE_REFRESH_TOKENS` issues fresh tokens on each refresh call.
- **Backward compatibility** — the login response includes a `token` field (alias for `access`) so existing frontends that expect a single token field continue to work.

The refresh endpoint is at `POST /api/auth/refresh`.

---

## Project Structure

```
backend/
├── manage.py                   # Entry point (defaults to local settings)
├── pyproject.toml              # Dependencies and tool config
├── .env.example                # Environment variable template
├── config/
│   ├── settings/
│   │   ├── base.py             # Shared settings
│   │   ├── local.py            # Local dev overrides (DEBUG, CORS, browsable API)
│   │   └── production.py       # Production hardening
│   ├── urls.py                 # Root URL conf — all /api/* routes
│   ├── wsgi.py                 # WSGI entry (production)
│   └── asgi.py                 # ASGI entry (future WebSocket support)
└── apps/
    ├── core/                   # Shared response helpers
    ├── accounts/               # Auth, users, roles
    ├── rooms/                  # Room inventory and filtering
    ├── bookings/               # Reservation lifecycle and check-in
    ├── analytics/              # Admin KPIs, utilization, ghosting, capacity
    └── panel/                  # Mobile panel composite API + WS stub
```

### App Responsibilities

| App         | Owns                              | Key Endpoints                                                                         |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `accounts`  | User model, JWT auth, roles       | `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`                  |
| `rooms`     | Room inventory, amenities, status | `GET /api/rooms`, `GET /api/rooms/{id}`                                               |
| `bookings`  | Reservations, check-in, end-early | `POST /api/bookings`, `DELETE /api/bookings/{id}`, `POST .../checkin`, `POST .../end` |
| `analytics` | Admin metric aggregation          | `GET /api/analytics/kpi\|utilization\|ghosting\|capacity`                             |
| `panel`     | Composite room state, device mgmt | `GET /api/panel/rooms/{id}/state`, `POST .../checkin`, `POST .../end`                 |

Cross-app communication goes through **service interfaces** (`services.py`), never direct model imports between apps.

---

## Local Setup

### 1. Prerequisites

- Python 3.12+
- PostgreSQL 15+ running locally

### 2. Create a PostgreSQL database

```bash
# Connect to Postgres and create the database + user
psql -U postgres

CREATE USER circletime WITH PASSWORD 'circletime';
CREATE DATABASE circletime OWNER circletime;
GRANT ALL PRIVILEGES ON DATABASE circletime TO circletime;
\q
```

### 3. Clone and configure

```bash
cd circle-time/backend

# Create a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Create .env from template
cp .env.example .env
# Edit .env with your local Postgres credentials if different from defaults
```

### 4. Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create a superuser

```bash
python manage.py createsuperuser
# Use email as the login identifier
```

### 6. Start the dev server

```bash
python manage.py runserver
```

The API is now available at `http://localhost:8000/api/`.
Django admin is at `http://localhost:8000/admin/`.

### 7. Quick smoke test

```bash
# Login (replace with your superuser credentials)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'

# Response includes: token (alias), access, refresh, user
# Use the access token for authenticated requests
curl http://localhost:8000/api/rooms/ \
  -H "Authorization: Bearer <access-token>"

# When the access token expires, refresh it
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh": "<refresh-token>"}'
```

---

## Switching to Production Settings

```bash
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py runserver
```

Or set `DJANGO_SETTINGS_MODULE` in your deployment environment. `wsgi.py` and `asgi.py` default to production settings.

---

## Where Celery + Redis Will Be Introduced

The codebase is **pre-structured** for background task processing, but neither Celery nor Redis is installed yet.

### The Pattern

All business logic lives in `services.py` files. Views are thin wrappers that call service functions. When Celery is added:

1. **Install** `celery` and `redis` (add to `pyproject.toml`)
2. **Create** `config/celery.py` with the Celery app instance
3. **Convert** service functions to `@shared_task` where async execution is needed
4. **Add** Celery Beat for periodic tasks (no-show detection, metric pre-computation)

### Specific Migration Points (marked with TODO in code)

| Location                | What Becomes a Task                                |
| ----------------------- | -------------------------------------------------- |
| `bookings/services.py`  | No-show detection + auto-release (periodic)        |
| `bookings/services.py`  | Email notifications on cancel / end-early          |
| `analytics/services.py` | Heavy metric aggregation + CSV/PDF export          |
| `panel/services.py`     | Room-state cache invalidation                      |
| `panel/consumers.py`    | WebSocket push via Django Channels + Redis backend |

### WebSocket Support

`panel/consumers.py` contains a commented-out Channels consumer. When ready:

1. Install `channels` and `channels-redis`
2. Add `channels` to `INSTALLED_APPS`
3. Update `config/asgi.py` to use `ProtocolTypeRouter`
4. Uncomment and activate the consumer
5. WebSocket path: `ws://host/api/panel/rooms/{roomId}/ws`

---

## V1 Endpoint Summary

All endpoints return the standard envelope: `{ "success": bool, "data": T, "message"?: string }`

| #   | Method | Path                                      | App       | Auth  |
| --- | ------ | ----------------------------------------- | --------- | ----- |
| 1.1 | POST   | `/api/auth/login`                         | accounts  | No    |
| 1.2 | POST   | `/api/auth/refresh`                       | accounts  | No    |
| 1.3 | GET    | `/api/auth/me`                            | accounts  | Yes   |
| 2.1 | GET    | `/api/rooms`                              | rooms     | Yes   |
| 2.2 | GET    | `/api/rooms/{roomId}`                     | rooms     | Yes   |
| 3.1 | GET    | `/api/rooms/{roomId}/bookings?date=`      | bookings  | Yes   |
| 3.2 | POST   | `/api/bookings`                           | bookings  | Yes   |
| 3.3 | DELETE | `/api/bookings/{bookingId}`               | bookings  | Yes   |
| 3.4 | POST   | `/api/bookings/{bookingId}/checkin`       | bookings  | Yes   |
| 3.5 | POST   | `/api/bookings/{bookingId}/end`           | bookings  | Yes   |
| 4.1 | GET    | `/api/panel/rooms/{roomId}/state`         | panel     | Yes   |
| 4.2 | POST   | `/api/panel/meetings/{meetingId}/checkin` | panel     | Yes   |
| 4.3 | POST   | `/api/panel/meetings/{meetingId}/end`     | panel     | Yes   |
| 4.4 | WS     | `/api/panel/rooms/{roomId}/ws`            | panel     | Yes\* |
| 5.1 | GET    | `/api/analytics/kpi`                      | analytics | Admin |
| 5.2 | GET    | `/api/analytics/utilization`              | analytics | Admin |
| 5.3 | GET    | `/api/analytics/ghosting`                 | analytics | Admin |
| 5.4 | GET    | `/api/analytics/capacity`                 | analytics | Admin |

\* WebSocket endpoint is stubbed — not active until Django Channels is introduced.

---

## Running Tests

```bash
pytest
```

Test files live in each app's `tests/` directory. The test runner is configured in `pyproject.toml`.
