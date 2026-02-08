# Circle Time — V1 Backend API Contract

> Covers **checked (V1) capabilities only** from the [Backend Planning Brief](backend-planning-brief.md).
> Response shapes derived from the [Frontend Contract Specification](frontend-contract.md).
> No Django code, no database schemas, no deferred capabilities.

---

## Conventions

| Convention        | Detail                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Base URL          | `/api`                                                                                                       |
| Auth mechanism    | Bearer token in `Authorization` header (token obtained via login)                                            |
| Response envelope | `{ "data": T, "success": boolean, "message"?: string }` — matches `web/src/services/api.ts` `ApiResponse<T>` |
| Error envelope    | `{ "success": false, "message": string, "code": string, "errors"?: string[] }`                               |
| Dates             | ISO 8601 strings (`2026-02-08T09:00:00Z`)                                                                    |
| IDs               | String (UUID recommended)                                                                                    |

### Standard Error Codes

| HTTP Status | `code` value       | When                                              |
| ----------- | ------------------ | ------------------------------------------------- |
| 400         | `validation_error` | Missing/invalid fields                            |
| 401         | `unauthorized`     | Missing or expired token                          |
| 403         | `forbidden`        | Authenticated but insufficient role               |
| 404         | `not_found`        | Resource does not exist                           |
| 409         | `conflict`         | Business rule violation (e.g., time-slot overlap) |

---

## 1. Authentication (`accounts`)

### 1.1 Login

|                   |                                        |
| ----------------- | -------------------------------------- |
| **Purpose**       | Authenticate user, return access token |
| **Method**        | `POST`                                 |
| **Path**          | `/api/auth/login`                      |
| **Auth required** | No                                     |

**Request body**

```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "token": "string",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "admin | user",
      "department": "string | null"
    }
  }
}
```

**Error cases**

| Status | Code               | Condition                 |
| ------ | ------------------ | ------------------------- |
| 400    | `validation_error` | Missing email or password |
| 401    | `unauthorized`     | Invalid credentials       |

---

### 1.2 Get Current User

|                   |                                         |
| ----------------- | --------------------------------------- |
| **Purpose**       | Return the authenticated user's profile |
| **Method**        | `GET`                                   |
| **Path**          | `/api/auth/me`                          |
| **Auth required** | Yes                                     |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "admin | user",
    "department": "string | null"
  }
}
```

**Error cases**

| Status | Code           | Condition                |
| ------ | -------------- | ------------------------ |
| 401    | `unauthorized` | Missing or expired token |

---

## 2. Rooms (`rooms`)

### 2.1 List / Filter / Search Rooms

|                   |                                        |
| ----------------- | -------------------------------------- |
| **Purpose**       | Return rooms matching optional filters |
| **Method**        | `GET`                                  |
| **Path**          | `/api/rooms`                           |
| **Auth required** | Yes                                    |

**Query parameters** — all optional

| Param          | Type                     | Description                                        |
| -------------- | ------------------------ | -------------------------------------------------- |
| `search`       | string                   | Free-text name search                              |
| `building`     | string                   | Building identifier                                |
| `floor`        | integer                  | Floor number                                       |
| `min_capacity` | integer                  | Minimum seat count                                 |
| `amenities`    | string (comma-separated) | e.g., `projector,whiteboard`                       |
| `status`       | string                   | `available`, `occupied`, `reserved`, `maintenance` |

**Success response** — `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "building": "string",
      "floor": "integer",
      "capacity": "integer",
      "amenities": ["projector", "whiteboard", "..."],
      "status": "available | occupied | reserved | maintenance",
      "imageUrl": "string | null"
    }
  ]
}
```

**Error cases**

| Status | Code           | Condition         |
| ------ | -------------- | ----------------- |
| 401    | `unauthorized` | Not authenticated |

---

### 2.2 Get Room by ID

|                   |                                |
| ----------------- | ------------------------------ |
| **Purpose**       | Return a single room's details |
| **Method**        | `GET`                          |
| **Path**          | `/api/rooms/{roomId}`          |
| **Auth required** | Yes                            |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "building": "string",
    "floor": "integer",
    "capacity": "integer",
    "amenities": ["..."],
    "status": "available | occupied | reserved | maintenance",
    "imageUrl": "string | null"
  }
}
```

**Error cases**

| Status | Code           | Condition              |
| ------ | -------------- | ---------------------- |
| 401    | `unauthorized` | Not authenticated      |
| 404    | `not_found`    | Room ID does not exist |

---

## 3. Bookings (`bookings`)

### 3.1 List Bookings for a Room on a Date

|                   |                                                         |
| ----------------- | ------------------------------------------------------- |
| **Purpose**       | Return all bookings for a specific room on a given date |
| **Method**        | `GET`                                                   |
| **Path**          | `/api/rooms/{roomId}/bookings`                          |
| **Auth required** | Yes                                                     |

**Query parameters**

| Param  | Type                | Required | Description |
| ------ | ------------------- | -------- | ----------- |
| `date` | string (YYYY-MM-DD) | Yes      | Target date |

**Success response** — `200`

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "roomId": "string",
      "roomName": "string",
      "title": "string",
      "description": "string | null",
      "organizer": {
        "id": "string",
        "name": "string",
        "email": "string"
      },
      "attendees": [{ "id": "string", "name": "string", "email": "string" }],
      "startTime": "ISO 8601",
      "endTime": "ISO 8601",
      "status": "confirmed | pending | cancelled | completed | no_show",
      "checkedIn": "boolean",
      "checkedInAt": "ISO 8601 | null"
    }
  ]
}
```

**Error cases**

| Status | Code               | Condition                           |
| ------ | ------------------ | ----------------------------------- |
| 400    | `validation_error` | Missing or invalid `date` parameter |
| 401    | `unauthorized`     | Not authenticated                   |
| 404    | `not_found`        | Room ID does not exist              |

---

### 3.2 Create Booking

|                   |                                |
| ----------------- | ------------------------------ |
| **Purpose**       | Reserve a room for a time slot |
| **Method**        | `POST`                         |
| **Path**          | `/api/bookings`                |
| **Auth required** | Yes                            |

**Request body**

```json
{
  "roomId": "string (required)",
  "title": "string (required)",
  "description": "string (optional)",
  "startTime": "ISO 8601 (required)",
  "endTime": "ISO 8601 (required)",
  "attendeeIds": ["string"]
}
```

> `attendeeIds` is accepted but optional for V1 (no attendee picker in the web UI yet).

**Success response** — `201`

```json
{
  "success": true,
  "data": {
    "id": "string",
    "roomId": "string",
    "roomName": "string",
    "title": "string",
    "description": "string | null",
    "organizer": { "id": "string", "name": "string", "email": "string" },
    "attendees": [],
    "startTime": "ISO 8601",
    "endTime": "ISO 8601",
    "status": "confirmed",
    "checkedIn": false,
    "checkedInAt": null
  }
}
```

**Error cases**

| Status | Code               | Condition                                                         |
| ------ | ------------------ | ----------------------------------------------------------------- |
| 400    | `validation_error` | Missing title, roomId, startTime, or endTime; endTime ≤ startTime |
| 401    | `unauthorized`     | Not authenticated                                                 |
| 404    | `not_found`        | Room ID does not exist                                            |
| 409    | `conflict`         | Time slot overlaps an existing confirmed booking for this room    |

---

### 3.3 Cancel Booking

|                   |                             |
| ----------------- | --------------------------- |
| **Purpose**       | Cancel an existing booking  |
| **Method**        | `DELETE`                    |
| **Path**          | `/api/bookings/{bookingId}` |
| **Auth required** | Yes                         |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": { "cancelled": true }
}
```

**Error cases**

| Status | Code           | Condition                                           |
| ------ | -------------- | --------------------------------------------------- |
| 401    | `unauthorized` | Not authenticated                                   |
| 403    | `forbidden`    | Authenticated user is not the organizer or an admin |
| 404    | `not_found`    | Booking ID does not exist                           |
| 409    | `conflict`     | Booking is already cancelled or completed           |

---

### 3.4 Check In to a Booking

|                   |                                                 |
| ----------------- | ----------------------------------------------- |
| **Purpose**       | Record that someone has arrived for the meeting |
| **Method**        | `POST`                                          |
| **Path**          | `/api/bookings/{bookingId}/checkin`             |
| **Auth required** | Yes                                             |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "checkedIn": true,
    "checkedInAt": "ISO 8601"
  }
}
```

**Error cases**

| Status | Code           | Condition                                                                          |
| ------ | -------------- | ---------------------------------------------------------------------------------- |
| 401    | `unauthorized` | Not authenticated                                                                  |
| 404    | `not_found`    | Booking ID does not exist                                                          |
| 409    | `conflict`     | Already checked in; booking status is not `confirmed`; check-in window has expired |

---

### 3.5 End Booking Early

|                   |                                                                             |
| ----------------- | --------------------------------------------------------------------------- |
| **Purpose**       | Terminate an active meeting before its scheduled end time, freeing the room |
| **Method**        | `POST`                                                                      |
| **Path**          | `/api/bookings/{bookingId}/end`                                             |
| **Auth required** | Yes                                                                         |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "ended": true,
    "freedMinutes": "integer"
  }
}
```

**Error cases**

| Status | Code           | Condition                                                                     |
| ------ | -------------- | ----------------------------------------------------------------------------- |
| 401    | `unauthorized` | Not authenticated                                                             |
| 404    | `not_found`    | Booking ID does not exist                                                     |
| 409    | `conflict`     | Booking is not currently active (not checked in, already ended, or cancelled) |

---

## 4. Panel — Composite Room State (`panel`)

### 4.1 Get Room State

|                   |                                                                      |
| ----------------- | -------------------------------------------------------------------- |
| **Purpose**       | Return full composite state for a single room (used by mobile panel) |
| **Method**        | `GET`                                                                |
| **Path**          | `/api/panel/rooms/{roomId}/state`                                    |
| **Auth required** | Yes (device token or standard token)                                 |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "room": {
      "id": "string",
      "name": "string",
      "building": "string",
      "floor": "integer",
      "capacity": "integer"
    },
    "status": "available | occupied | upcoming | offline",
    "currentMeeting": {
      "id": "string",
      "title": "string",
      "organizer": "string",
      "organizerEmail": "string",
      "startTime": "ISO 8601",
      "endTime": "ISO 8601",
      "attendeeCount": "integer",
      "checkedIn": "boolean",
      "checkedInAt": "ISO 8601 | null"
    },
    "nextMeeting": "Meeting | null  (same shape as above)",
    "upcomingMeetings": ["Meeting"],
    "lastUpdated": "ISO 8601"
  }
}
```

> `currentMeeting` is `null` when no meeting is active.
> `status` is derived server-side from the booking schedule.

**Error cases**

| Status | Code           | Condition              |
| ------ | -------------- | ---------------------- |
| 401    | `unauthorized` | Not authenticated      |
| 404    | `not_found`    | Room ID does not exist |

---

### 4.2 Panel Check-In

|                   |                                                         |
| ----------------- | ------------------------------------------------------- |
| **Purpose**       | Check in to the current meeting from the in-room tablet |
| **Method**        | `POST`                                                  |
| **Path**          | `/api/panel/meetings/{meetingId}/checkin`               |
| **Auth required** | Yes (device token)                                      |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "message": "Checked in successfully"
}
```

**Error cases**

| Status | Code           | Condition                                                      |
| ------ | -------------- | -------------------------------------------------------------- |
| 401    | `unauthorized` | Invalid device token                                           |
| 404    | `not_found`    | Meeting ID does not exist                                      |
| 409    | `conflict`     | Already checked in; check-in window expired; meeting cancelled |

---

### 4.3 Panel End Meeting Early

|                   |                                                       |
| ----------------- | ----------------------------------------------------- |
| **Purpose**       | End the current meeting early from the in-room tablet |
| **Method**        | `POST`                                                |
| **Path**          | `/api/panel/meetings/{meetingId}/end`                 |
| **Auth required** | Yes (device token)                                    |

**Request body** — none

**Success response** — `200`

```json
{
  "success": true,
  "data": {
    "freedMinutes": "integer"
  },
  "message": "Meeting ended"
}
```

**Error cases**

| Status | Code           | Condition                       |
| ------ | -------------- | ------------------------------- |
| 401    | `unauthorized` | Invalid device token            |
| 404    | `not_found`    | Meeting ID does not exist       |
| 409    | `conflict`     | Meeting is not currently active |

---

### 4.4 Real-Time Room State Updates

|                   |                                                          |
| ----------------- | -------------------------------------------------------- |
| **Purpose**       | Push room state changes to the panel device in real time |
| **Transport**     | WebSocket (with HTTP long-polling fallback)              |
| **Path**          | `ws://host/api/panel/rooms/{roomId}/ws`                  |
| **Auth required** | Yes (token sent as query param or on connect)            |

**Subscribe** — client opens connection with `roomId`. No message body required.

**Server push payload** — sent on every state change:

```json
{
  "type": "room_state_update",
  "data": { "…same shape as GET /api/panel/rooms/{roomId}/state .data" }
}
```

**Fallback** — if WebSocket is unavailable, client polls `GET /api/panel/rooms/{roomId}/state` every 30 seconds (client-side behavior, no backend change needed beyond the REST endpoint).

**Error cases**

| Condition           | Behavior                                          |
| ------------------- | ------------------------------------------------- |
| Invalid token       | Connection rejected (4001)                        |
| Unknown room        | Connection rejected (4004)                        |
| Server-side failure | Connection closed; client reconnects with backoff |

---

## 5. Analytics (`analytics`)

All analytics endpoints require authentication and an admin role.

### 5.1 KPI Summary

|                   |                                                |
| ----------------- | ---------------------------------------------- |
| **Purpose**       | Return high-level KPIs for the admin dashboard |
| **Method**        | `GET`                                          |
| **Path**          | `/api/analytics/kpi`                           |
| **Auth required** | Yes (admin)                                    |

**Query parameters**

| Param        | Type                | Required | Description |
| ------------ | ------------------- | -------- | ----------- |
| `start_date` | string (YYYY-MM-DD) | Yes      | Range start |
| `end_date`   | string (YYYY-MM-DD) | Yes      | Range end   |

**Success response** — `200`

```json
{
  "success": true,
  "data": [
    {
      "label": "string",
      "value": "number | string",
      "change": "number | null",
      "changeType": "positive | negative | neutral | null",
      "unit": "string | null"
    }
  ]
}
```

> Expected KPIs: Total Rooms, Avg Utilization, Ghosting Rate, Total Bookings.

**Error cases**

| Status | Code               | Condition                     |
| ------ | ------------------ | ----------------------------- |
| 400    | `validation_error` | Missing or invalid date range |
| 401    | `unauthorized`     | Not authenticated             |
| 403    | `forbidden`        | User is not an admin          |

---

### 5.2 Utilization Data

|                   |                                                      |
| ----------------- | ---------------------------------------------------- |
| **Purpose**       | Return per-room utilization metrics for a date range |
| **Method**        | `GET`                                                |
| **Path**          | `/api/analytics/utilization`                         |
| **Auth required** | Yes (admin)                                          |

**Query parameters**

| Param        | Type                | Required | Description        |
| ------------ | ------------------- | -------- | ------------------ |
| `start_date` | string (YYYY-MM-DD) | Yes      | Range start        |
| `end_date`   | string (YYYY-MM-DD) | Yes      | Range end          |
| `building`   | string              | No       | Filter by building |

**Success response** — `200`

```json
{
  "success": true,
  "data": [
    {
      "roomId": "string",
      "roomName": "string",
      "utilizationRate": "number (0–100)",
      "totalBookings": "integer",
      "totalHoursBooked": "number",
      "peakHours": ["string"]
    }
  ]
}
```

**Error cases**

| Status | Code               | Condition                     |
| ------ | ------------------ | ----------------------------- |
| 400    | `validation_error` | Missing or invalid date range |
| 401    | `unauthorized`     | Not authenticated             |
| 403    | `forbidden`        | User is not an admin          |

---

### 5.3 Ghosting Data

|                   |                                                             |
| ----------------- | ----------------------------------------------------------- |
| **Purpose**       | Return per-room ghosting (no-show) metrics for a date range |
| **Method**        | `GET`                                                       |
| **Path**          | `/api/analytics/ghosting`                                   |
| **Auth required** | Yes (admin)                                                 |

**Query parameters**

| Param        | Type                | Required | Description |
| ------------ | ------------------- | -------- | ----------- |
| `start_date` | string (YYYY-MM-DD) | Yes      | Range start |
| `end_date`   | string (YYYY-MM-DD) | Yes      | Range end   |

**Success response** — `200`

```json
{
  "success": true,
  "data": [
    {
      "roomId": "string",
      "roomName": "string",
      "ghostingRate": "number (0–100)",
      "totalNoShows": "integer",
      "totalBookings": "integer",
      "averageWastedMinutes": "number"
    }
  ]
}
```

**Error cases**

| Status | Code               | Condition                     |
| ------ | ------------------ | ----------------------------- |
| 400    | `validation_error` | Missing or invalid date range |
| 401    | `unauthorized`     | Not authenticated             |
| 403    | `forbidden`        | User is not an admin          |

---

### 5.4 Capacity Data

|                   |                                                              |
| ----------------- | ------------------------------------------------------------ |
| **Purpose**       | Return per-room capacity efficiency metrics for a date range |
| **Method**        | `GET`                                                        |
| **Path**          | `/api/analytics/capacity`                                    |
| **Auth required** | Yes (admin)                                                  |

**Query parameters**

| Param        | Type                | Required | Description |
| ------------ | ------------------- | -------- | ----------- |
| `start_date` | string (YYYY-MM-DD) | Yes      | Range start |
| `end_date`   | string (YYYY-MM-DD) | Yes      | Range end   |

**Success response** — `200`

```json
{
  "success": true,
  "data": [
    {
      "roomId": "string",
      "roomName": "string",
      "roomCapacity": "integer",
      "averageAttendees": "number",
      "capacityUtilization": "number (0–100)",
      "oversizedBookings": "integer",
      "undersizedBookings": "integer"
    }
  ]
}
```

**Error cases**

| Status | Code               | Condition                     |
| ------ | ------------------ | ----------------------------- |
| 400    | `validation_error` | Missing or invalid date range |
| 401    | `unauthorized`     | Not authenticated             |
| 403    | `forbidden`        | User is not an admin          |

---

## 6. Endpoint Summary

| #   | Method | Path                                      | App       | Auth  |
| --- | ------ | ----------------------------------------- | --------- | ----- |
| 1.1 | POST   | `/api/auth/login`                         | accounts  | No    |
| 1.2 | GET    | `/api/auth/me`                            | accounts  | Yes   |
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
| 4.4 | WS     | `/api/panel/rooms/{roomId}/ws`            | panel     | Yes   |
| 5.1 | GET    | `/api/analytics/kpi`                      | analytics | Admin |
| 5.2 | GET    | `/api/analytics/utilization`              | analytics | Admin |
| 5.3 | GET    | `/api/analytics/ghosting`                 | analytics | Admin |
| 5.4 | GET    | `/api/analytics/capacity`                 | analytics | Admin |

**17 endpoints** (14 REST + 1 WebSocket + 2 panel action duplicates that delegate to bookings internally).
