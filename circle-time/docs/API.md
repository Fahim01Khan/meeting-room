# API Reference

## Overview

All responses use a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "optional message"
}
```

Error responses follow the same structure with `"success": false`.

## Authentication

JWT-based authentication. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after **12 hours**. Use the refresh endpoint to get a new pair.

Refresh tokens expire after **7 days**.

---

## Endpoints

### Health

#### `GET /api/health`

- **Auth required**: No
- **Description**: Health check endpoint
- **Returns**: `{ "success": true, "data": { "status": "ok" } }`

---

### Auth (`/api/auth/*`)

#### `POST /api/auth/login`

- **Auth required**: No
- **Description**: Authenticate with email and password, returns JWT tokens
- **Body**:
  - `email` (string, required)
  - `password` (string, required)
- **Returns**: `{ access, refresh, user: { id, email, name, role } }`

#### `GET /api/auth/me`

- **Auth required**: Yes
- **Description**: Get the current authenticated user's profile
- **Returns**: `{ id, email, name, role, ... }`

#### `GET /api/auth/users`

- **Auth required**: Yes (admin)
- **Description**: List all users (excludes the kiosk system account)
- **Returns**: Array of user objects

#### `DELETE /api/auth/users/<user_id>`

- **Auth required**: Yes (admin)
- **Description**: Delete a user by UUID
- **Returns**: `{ "success": true }`

#### `POST /api/auth/invite`

- **Auth required**: Yes (admin)
- **Description**: Send an invitation email to a new user
- **Body**:
  - `email` (string, required)
  - `role` (string: `admin` | `user`)
- **Returns**: Invitation object

#### `GET /api/auth/invite/validate?token=<token>`

- **Auth required**: No
- **Description**: Validate an invitation token (check if still valid/unused)
- **Returns**: `{ valid, email, organisation }`

#### `POST /api/auth/accept-invite`

- **Auth required**: No
- **Description**: Accept an invitation — creates user account
- **Body**:
  - `token` (string, required)
  - `name` (string, required)
  - `password` (string, required)
- **Returns**: `{ access, refresh, user }`

#### `GET /api/auth/invites`

- **Auth required**: Yes (admin)
- **Description**: List all pending invitations
- **Returns**: Array of invitation objects

#### `DELETE /api/auth/invites/<invitation_id>`

- **Auth required**: Yes (admin)
- **Description**: Cancel a pending invitation
- **Returns**: `{ "success": true }`

#### `GET /api/auth/calendar-tokens`

- **Auth required**: Yes
- **Description**: List connected calendar provider tokens for current user
- **Returns**: Array of `{ provider, connected_at }`

#### `GET /api/auth/calendar-tokens/<provider>/auth-url`

- **Auth required**: Yes
- **Description**: Get the OAuth authorization URL for a calendar provider
- **Returns**: `{ auth_url }`

#### `GET /api/auth/calendar-tokens/callback`

- **Auth required**: No (OAuth redirect)
- **Description**: OAuth callback — exchanges auth code for tokens and stores them
- **Returns**: Redirects to frontend

#### `DELETE /api/auth/calendar-tokens/<provider>`

- **Auth required**: Yes
- **Description**: Disconnect a calendar provider
- **Returns**: `{ "success": true }`

#### `GET /api/auth/oidc/login`

- **Auth required**: No
- **Description**: OIDC login redirect (returns 501 in local mode)

#### `GET /api/auth/oidc/callback`

- **Auth required**: No
- **Description**: OIDC callback (returns 501 in local mode)

---

### Rooms (`/api/rooms/*`)

#### `GET /api/rooms`

- **Auth required**: Yes
- **Description**: List rooms with optional filters
- **Query params**:
  - `searchQuery` (string) — search by name
  - `building` (string) — filter by building name
  - `floor` (integer) — filter by floor number
  - `minCapacity` (integer) — minimum seat capacity
  - `amenities` (string) — comma-separated amenity list
- **Returns**: Array of room objects

#### `POST /api/rooms/new`

- **Auth required**: Yes (admin)
- **Description**: Create a new room
- **Body**: `{ name, capacity, floor, building, amenities[], ... }`
- **Returns**: Created room object

#### `GET /api/rooms/<room_id>`

- **Auth required**: Yes
- **Description**: Get room details by UUID
- **Returns**: Room object with full details

#### `PUT /api/rooms/<room_id>/edit`

- **Auth required**: Yes (admin)
- **Description**: Update a room
- **Body**: `{ name, capacity, floor, building, amenities[], ... }`
- **Returns**: Updated room object

#### `DELETE /api/rooms/<room_id>/delete`

- **Auth required**: Yes (admin)
- **Description**: Delete a room
- **Returns**: `{ "success": true }`

#### `GET /api/rooms/<room_id>/availability?date=YYYY-MM-DD`

- **Auth required**: Yes
- **Description**: Get available time slots for a room on a given date
- **Returns**: Array of available time slot objects

#### `POST /api/rooms/<room_id>/book-adhoc`

- **Auth required**: No (tablet/kiosk)
- **Description**: Create an ad-hoc booking from the tablet
- **Body**: `{ duration_minutes, title? }`
- **Returns**: Created booking object

#### `GET /api/buildings`

- **Auth required**: Yes
- **Description**: List all buildings
- **Returns**: Array of building objects

#### `GET /api/buildings/<building_id>/floors/<floor_num>`

- **Auth required**: Yes
- **Description**: Get floor plan with SVG and room positions
- **Returns**: Floor plan object

---

### Bookings (`/api/bookings/*`)

#### `GET /api/rooms/<room_id>/bookings?date=YYYY-MM-DD`

- **Auth required**: Yes
- **Description**: List bookings for a room on a given date
- **Returns**: Array of booking objects

#### `POST /api/bookings`

- **Auth required**: Yes
- **Description**: Create a booking (returns 409 on conflict)
- **Body**:
  - `roomId` (UUID, required)
  - `title` (string, required)
  - `startTime` (ISO datetime, required)
  - `endTime` (ISO datetime, required)
  - `attendeeIds` (array of UUIDs)
- **Returns**: Created booking object

#### `POST /api/bookings/recurring`

- **Auth required**: Yes
- **Description**: Create a recurring booking series
- **Body**: Same as create + `recurrence` object
- **Returns**: Array of created booking objects

#### `PUT /api/bookings/<booking_id>`

- **Auth required**: Yes
- **Description**: Update an existing booking
- **Body**: `{ title, startTime, endTime, attendeeIds }`
- **Returns**: Updated booking object

#### `DELETE /api/bookings/<booking_id>`

- **Auth required**: Yes
- **Description**: Cancel/delete a booking
- **Returns**: `{ "success": true }`

#### `POST /api/bookings/<booking_id>/checkin`

- **Auth required**: Yes
- **Description**: Check in to a booking (must be within check-in window)
- **Returns**: Updated booking with `checked_in` status

#### `POST /api/bookings/<booking_id>/end`

- **Auth required**: Yes
- **Description**: End a booking early
- **Returns**: Updated booking with `ended` status

#### `POST /api/bookings/<booking_id>/extend`

- **Auth required**: Yes
- **Description**: Extend a booking's end time
- **Body**: `{ minutes }` (integer)
- **Returns**: Updated booking

#### `POST /api/bookings/trigger-auto-release`

- **Auth required**: Yes
- **Description**: Manually trigger the auto-release check for all rooms
- **Returns**: `{ released_count }`

---

### Panel — Tablet API (`/api/panel/*` and aliases)

These endpoints are used by the SUNMI tablet app. Most do not require JWT auth.

#### `GET /api/rooms/<room_id>/state?device_serial=XXX`

- **Auth required**: No
- **Description**: Composite room state for the tablet. Returns current status, current meeting, next meeting, and room info. Also triggers auto-release for the room.
- **Query params**:
  - `device_serial` (string, optional) — tablet device serial for identification
- **Returns**:
  ```json
  {
    "status": "available|occupied|upcoming|checked_in",
    "room": { "id", "name", "capacity", "amenities" },
    "currentMeeting": { ... } | null,
    "nextMeeting": { ... } | null,
    "orgSettings": { "checkinWindowMinutes", "orgName", "logoUrl" }
  }
  ```

#### `POST /api/meetings/<meeting_id>/checkin`

- **Auth required**: No
- **Description**: Check in to a meeting from the tablet
- **Returns**: Updated meeting object

#### `POST /api/meetings/<meeting_id>/end`

- **Auth required**: No
- **Description**: End a meeting early from the tablet
- **Returns**: Updated meeting object

#### `POST /api/panel/pairing-codes`

- **Auth required**: No
- **Description**: Generate a pairing code for a new tablet device
- **Body**: `{ device_serial }` (string)
- **Returns**: `{ code, expires_at }`

#### `GET /api/panel/pairing-status/<code>`

- **Auth required**: No
- **Description**: Poll pairing status (tablet checks if admin has completed pairing)
- **Returns**: `{ paired, room_id? }`

#### `POST /api/panel/pair-device`

- **Auth required**: Yes (admin)
- **Description**: Complete pairing — assign a room to a tablet by pairing code
- **Body**: `{ code, room_id }`
- **Returns**: Device object

#### `GET /api/panel/devices`

- **Auth required**: Yes (admin)
- **Description**: List all paired tablet devices
- **Returns**: Array of device objects

#### `DELETE /api/panel/devices/<device_id>`

- **Auth required**: Yes (admin)
- **Description**: Unpair/delete a tablet device
- **Returns**: `{ "success": true }`

---

### Organisation (`/api/organisation/*`)

#### `GET /api/organisation/settings`

- **Auth required**: Yes
- **Description**: Get organisation settings
- **Returns**: `{ name, logoUrl, checkinWindowMinutes, timezone, ... }`

#### `PUT /api/organisation/settings`

- **Auth required**: Yes (admin)
- **Description**: Update organisation settings
- **Body**: `{ name?, logoUrl?, checkinWindowMinutes?, timezone? }`
- **Returns**: Updated settings object

---

### Analytics (`/api/analytics/*`)

All analytics endpoints require admin authentication and accept `startDate` and `endDate` query parameters in `YYYY-MM-DD` format.

#### `GET /api/analytics/kpi?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: KPI summary — total bookings, utilization %, ghosting %, avg duration
- **Returns**: KPI summary object

#### `GET /api/analytics/utilization?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: Per-room utilization percentages
- **Returns**: Array of `{ room, utilization_pct }`

#### `GET /api/analytics/ghosting?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: Per-room ghosting (no-show) rates
- **Returns**: Array of `{ room, ghosting_pct, ghosted_count }`

#### `GET /api/analytics/ghosting/departments?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: Ghosting rates broken down by department
- **Returns**: Array of department ghosting data

#### `GET /api/analytics/capacity?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: Capacity efficiency — how well room sizes match actual attendance
- **Returns**: Array of `{ room, avg_attendees, capacity, efficiency_pct }`

#### `GET /api/analytics/heatmap?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: Day-of-week × hour-of-day booking heatmap
- **Returns**: 2D array of booking counts

#### `GET /api/analytics/rooms/compare?startDate=&endDate=`

- **Auth required**: Yes (admin)
- **Description**: Side-by-side room comparison metrics
- **Returns**: Array of room comparison objects

#### `GET /api/analytics/trends?startDate=&endDate=&metric=`

- **Auth required**: Yes (admin)
- **Description**: Trend data over time for a given metric
- **Query params**: `metric` — one of `utilization`, `ghosting`, `bookings`
- **Returns**: Array of `{ date, value }`

#### `GET /api/analytics/export?startDate=&endDate=&format=csv`

- **Auth required**: Yes (admin)
- **Description**: Export analytics data as CSV
- **Query params**: `format` — `csv`
- **Returns**: CSV file download
