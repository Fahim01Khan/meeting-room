# Circle Time — Backend Planning Brief

> Derived from the [Frontend Contract Specification](frontend-contract.md).
> Defines Django app boundaries, responsibilities, and data ownership.
> Does **not** prescribe models, serializers, views, or implementation details.

---

## 1. Proposed Django App Structure

```
backend/
├── accounts/       — Authentication, users, roles
├── rooms/          — Physical space inventory and floor plans
├── bookings/       — Reservation lifecycle and check-in
├── analytics/      — Aggregated metrics and reporting
└── panel/          — Mobile panel composite API and real-time
```

Five apps. Each owns a clear domain boundary. Cross-app communication goes through service interfaces, not direct model imports.

---

## 2. App Responsibilities & Data Ownership

### 2.1 `accounts`

| Concern              | Detail                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | User registration, email+password login, token issuance, session management, role assignment                    |
| **Owns**             | User, Role/Permission                                                                                           |
| **Key behaviors**    | Authenticate credentials → return token; expose current-user profile; guard admin vs regular access             |
| **Decisions needed** | Token format (JWT vs session), password reset flow, whether department lives here or is synced from external HR |

### 2.2 `rooms`

| Concern              | Detail                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Responsibility**   | CRUD for buildings, floors, rooms, amenities; floor-plan storage; room status derivation                                                               |
| **Owns**             | Building, Room, Amenity, FloorPlan                                                                                                                     |
| **Key behaviors**    | Filter/search rooms by building, floor, capacity, amenities, text query; return current room status (derived from bookings); serve floor-plan geometry |
| **Decisions needed** | Whether room status is computed live or cached; floor-plan SVG storage strategy; amenity set — fixed enum vs admin-managed                             |

### 2.3 `bookings`

| Concern              | Detail                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Create, update, cancel bookings; enforce time-slot conflict rules; check-in / end-early lifecycle; no-show detection and auto-release                                                                      |
| **Owns**             | Booking, TimeSlot (derived), CheckInRecord                                                                                                                                                                 |
| **Key behaviors**    | Validate new booking against existing schedule; transition booking status (`pending → confirmed → checked_in → completed / cancelled / no_show`); enforce check-in window; release room on timeout         |
| **Decisions needed** | Conflict overlap rules, minimum/maximum duration, buffer between bookings, check-in window duration (currently 15 min — configurable?), auto-release trigger mechanism (cron/celery vs request-time check) |

### 2.4 `analytics`

| Concern              | Detail                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Responsibility**   | Compute and serve aggregated metrics over date ranges; export reports                                                                                                       |
| **Owns**             | Pre-computed metric snapshots (if using materialized aggregation), export job records                                                                                       |
| **Key behaviors**    | Utilization rates per room, ghosting rates per room and department, capacity efficiency, heatmap (day × hour), trend lines, room comparisons, KPI summaries; CSV/PDF export |
| **Decisions needed** | Real-time computation vs periodic materialization; department data source; what constitutes "actual attendees" (check-in count, sensor, self-report); export templating     |

### 2.5 `panel`

| Concern              | Detail                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Responsibility**   | Serve the composite `RoomState` payload for a single room; handle panel-specific actions (check-in, end-early, extend, report issue); push real-time updates                                     |
| **Owns**             | DeviceRegistration (room ↔ device mapping), IssueReport                                                                                                                                          |
| **Key behaviors**    | Single endpoint returning room info + current meeting + next meeting + upcoming list + status; WebSocket or polling channel per room; optimistic local fallback support (offline cache contract) |
| **Decisions needed** | WebSocket implementation (Django Channels vs external broker); device provisioning/auth; extend-meeting rules; issue-report workflow                                                             |

---

## 3. Cross-App Dependencies

```
accounts ──────────────────────────────────────────────────
    │  (user identity, auth tokens)
    ├──→ rooms       (who can manage rooms)
    ├──→ bookings    (who creates/owns bookings)
    ├──→ analytics   (who can view admin data)
    └──→ panel       (device auth / room assignment)

rooms ─────────────────────────────────────────────────────
    │  (room existence, capacity, amenities)
    ├──→ bookings    (booking references a room)
    ├──→ analytics   (metrics are per-room)
    └──→ panel       (room state includes room info)

bookings ──────────────────────────────────────────────────
    │  (booking records, check-in events)
    ├──→ analytics   (source data for all metrics)
    └──→ panel       (current/next meeting derived from bookings)
```

`analytics` and `panel` are **read-heavy consumers** of `rooms` and `bookings`. They do not write back.

---

## 4. Frontend → Backend Dependency Map

### Web App Screens

| Screen              | Route                | Backend Apps Required                |
| ------------------- | -------------------- | ------------------------------------ |
| Login               | `/login`             | `accounts`                           |
| Layout / Auth Guard | `/`                  | `accounts`                           |
| Room Search         | `/rooms`             | `rooms`                              |
| Room Details        | `/rooms/:roomId`     | `rooms`, `bookings`                  |
| Booking Modal       | (overlay)            | `bookings`                           |
| Floor Map           | `/floor-map`         | `rooms`                              |
| Dashboard           | `/admin/dashboard`   | `analytics`                          |
| Utilization View    | `/admin/utilization` | `analytics`, `rooms`                 |
| Ghosting View       | `/admin/ghosting`    | `analytics`, `accounts` (department) |
| Capacity View       | `/admin/capacity`    | `analytics`, `rooms`                 |

### Mobile Panel Screens

| Screen    | Trigger                 | Backend Apps Required |
| --------- | ----------------------- | --------------------- |
| Idle      | `status = available`    | `panel`, `rooms`      |
| Check-In  | `occupied + !checkedIn` | `panel`, `bookings`   |
| Meeting   | `occupied + checkedIn`  | `panel`, `bookings`   |
| End Early | user action             | `panel`, `bookings`   |

### Real-Time

| Channel         | Consumer     | Backend Apps Required        |
| --------------- | ------------ | ---------------------------- |
| Room state push | Mobile panel | `panel`, `bookings`, `rooms` |

---

## 5. Capability Checklist

A minimal backend that unblocks all existing frontend screens must provide these capabilities. Checked items are required for V1; unchecked items are referenced in code but can be deferred.

- [x] Email + password authentication with token response
- [x] Current-user endpoint (id, name, email, role)
- [x] List/filter/search rooms
- [x] Get single room by ID
- [x] List bookings for a room on a given date
- [x] Create a booking (with conflict validation)
- [x] Cancel a booking
- [x] Check in to a booking
- [x] End a booking early
- [x] Composite room-state endpoint (for mobile panel)
- [x] Real-time or polling room-state updates
- [x] KPI summary for a date range
- [x] Utilization data per room for a date range
- [x] Ghosting data per room for a date range
- [x] Capacity data per room for a date range
- [ ] List buildings
- [ ] Get floor plan SVG + room positions
- [ ] Heatmap data (day × hour)
- [ ] Room comparison across multiple rooms
- [ ] Trend line data for a given metric
- [ ] Export analytics as CSV/PDF
- [ ] Update a booking
- [ ] Bookings by user
- [ ] Available time-slot listing
- [ ] Extend a meeting (mobile)
- [ ] Report a room issue (mobile)
- [ ] Password reset flow
- [ ] Device provisioning / room assignment
