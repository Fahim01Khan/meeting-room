# System Architecture

## Overview

Circle Time is a three-tier meeting-room booking system designed for office environments with wall-mounted tablets.

```
┌──────────────┐                    ┌──────────────────────┐
│  Web Browser │─── HTTP/REST ─────▶│                      │
│  (React SPA) │                    │                      │
└──────────────┘                    │    Django REST API    │──▶ PostgreSQL
                                    │    (DRF + JWT)        │
┌──────────────┐                    │                      │
│ SUNMI Tablet │─── HTTP/REST ─────▶│                      │
│ (React Native)                    └──────────────────────┘
└──────────────┘
      polls every 10s
```

All business logic lives in the Django backend. Both clients are thin — they fetch data via REST and render it. There is no shared state between the web and tablet apps.

---

## Backend (Django)

- **Framework**: Django 6.0.2 + Django REST Framework 3.16
- **Auth**: JWT via `djangorestframework-simplejwt` (12-hour access tokens, 7-day refresh)
- **Database**: PostgreSQL 14+ with `uuid-ossp` extension
- **Python**: 3.12

### Django Apps

| App            | Responsibility                                                                            |
| -------------- | ----------------------------------------------------------------------------------------- |
| `accounts`     | User model (email-based), JWT login, user invitations, calendar OAuth tokens, OIDC stubs  |
| `rooms`        | Room CRUD, buildings, floor plans, availability queries, ad-hoc booking                   |
| `bookings`     | Reservation lifecycle — create, update, cancel, check-in, end early, extend, auto-release |
| `panel`        | Tablet-facing composite API — room state polling, device pairing, meeting actions         |
| `organisation` | Org-level settings (name, logo, check-in window, timezone)                                |
| `analytics`    | KPI dashboard, utilization, ghosting, capacity, heatmap, trends, CSV export               |
| `providers`    | Calendar provider gateway with Google and Zoho adapter stubs                              |

### Provider Gateway (Brokered Architecture)

The `PROVIDER_MODE` setting controls which calendar adapter is active:

- **`local`** (default) — all data stored in PostgreSQL, no external API calls
- **`google`** — routes through `GoogleAdapter` (stub — raises `NotImplementedError`)
- **`zoho`** — routes through `ZohoAdapter` (stub — raises `NotImplementedError`)

This architecture allows the system to work standalone in development and be wired to external calendar providers in production without changing the booking logic.

### Auto-Release

Bookings that are not checked in within the configured window (`CHECKIN_WINDOW_MINUTES`, default 15 min) are automatically released. This is triggered:

1. **On every tablet poll** — the `room_state` endpoint checks and releases expired bookings for the requested room.
2. **Via management command** — `python manage.py auto_release` scans all rooms (intended for cron).

---

## Web App (React)

- **Bundler**: Vite 6
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6 with role-based route guards
- **Styling**: Tailwind CSS 4 + inline styles
- **Charts**: Recharts (analytics dashboards)
- **Icons**: Lucide React

### Key Pages

| Route              | Role   | Component                                   |
| ------------------ | ------ | ------------------------------------------- |
| `/login`           | Public | Login form                                  |
| `/rooms`           | User   | Room list with search, filter, availability |
| `/rooms/:id`       | User   | Room detail + booking form                  |
| `/admin/rooms`     | Admin  | Room CRUD management                        |
| `/admin/users`     | Admin  | User list + invitations                     |
| `/admin/devices`   | Admin  | Tablet device management + pairing          |
| `/admin/settings`  | Admin  | Organisation settings                       |
| `/admin/analytics` | Admin  | Dashboard, utilization, ghosting views      |

### Dev Server Proxy

`vite.config.ts` proxies `/api/*` to `http://localhost:8000` so the frontend uses relative URLs and avoids CORS issues in development.

---

## Tablet App (React Native 0.76)

- **Target device**: SUNMI M2 MAX (10.1" Android tablet, wall-mounted)
- **Architecture**: Polling-based (10-second intervals via `setInterval`)
- **State management**: `RoomStateContext` — single context that manages all room/meeting state
- **Navigation**: React Navigation stack

### Key Screens

| Screen                 | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `PairingScreen`        | First-run pairing code entry                           |
| `CalendarSelectScreen` | Calendar provider connection                           |
| `IdleScreen`           | Room available — shows next meeting, "Book Now" button |
| `CheckInScreen`        | Meeting starting — countdown timer, check-in button    |
| `MeetingScreen`        | Meeting in progress — end early, extend options        |
| `BookNowScreen`        | Ad-hoc booking form (15/30/45/60 min)                  |

### Data Flow

1. Tablet boots → checks local storage for paired room ID
2. If not paired → shows `PairingScreen`
3. Once paired → polls `GET /api/rooms/{id}/state?device_serial=XXX` every 10 seconds
4. Response includes `status` enum (`available`, `occupied`, `upcoming`, `checked_in`) + meeting details
5. Screen transitions based on status changes

---

## Key Design Decisions

### 1. Polling instead of WebSockets

The tablet environment (SUNMI Android, potentially flaky Wi-Fi) favours simplicity. A 10-second polling interval is acceptable for room-status updates and avoids the complexity of WebSocket reconnection logic. The backend has a WebSocket route stubbed for future use.

### 2. Console email backend in development

Uses `django.core.mail.backends.console.EmailBackend` by default to avoid SendGrid domain verification issues during development. Invitation emails print to the Django console instead of being sent.

### 3. JWT stored in localStorage (web)

Acceptable for an internal corporate tool that is not exposed to the public internet. Simplifies the auth flow compared to HTTP-only cookies with CSRF tokens.

### 4. No trailing slashes on API paths

`APPEND_SLASH=False` in Django settings. All API endpoints omit trailing slashes to match frontend expectations and avoid redirect issues on mobile.

### 5. UUID primary keys everywhere

All models use UUID primary keys (`uuid-ossp` extension). This avoids sequential ID enumeration and simplifies future multi-tenant or distributed scenarios.

### 6. Auto-release on poll (no dedicated scheduler)

Rather than requiring a separate cron job or Celery worker, the auto-release check runs every time a tablet polls for room state. This ensures bookings are released promptly for rooms that have tablets, with the management command as a fallback for rooms without.

### 7. Single `room_state` composite endpoint for tablets

Instead of making the tablet call multiple endpoints and assemble state client-side, a single `/api/rooms/{id}/state` endpoint returns everything the tablet needs in one response — current status, current meeting, next meeting, and room info. This reduces network round-trips and simplifies the mobile app.
