# Circle Time — Frontend Contract Specification

> Reverse-engineered from existing web and mobile source code.
> All claims reference actual files in `web/` and `mobile/`.
> This document describes **what the frontend expects**, not how the backend should implement it.

---

## 1. Web App Functional Map

The web app uses `react-router-dom` with a `BrowserRouter`. All authenticated routes render inside a `Layout` shell with a collapsible sidebar and a top header.

**Source:** `web/src/app/Router.tsx`, `web/src/app/Layout.tsx`

### 1.1 Login — `/login`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Login.tsx` |
| **Purpose** | Authenticate user with email + password |
| **UI elements** | Logo ("Meeting Rooms"), email input, password input, sign-in button, "Forgot your password?" link |
| **User actions** | Enter email/password → submit form; click forgot-password link (currently `#forgot`, no handler) |
| **Data consumed** | None (local state only) |
| **Data mutated** | Calls optional `onLogin(email, password)` prop — **currently not wired** to any auth service |
| **Notes** | Form validates that both fields are non-empty. No SSO, no MFA. Redirect-after-login preserves location via `react-router-dom` state. |

### 1.2 Layout Shell — `/` (protected)

| Aspect | Detail |
|---|---|
| **File** | `web/src/app/Layout.tsx`, `web/src/app/ProtectedRoute.tsx` |
| **Purpose** | Sidebar navigation + top header wrapping all authenticated routes |
| **UI elements** | Collapsible sidebar (Booking: Find Rooms, Floor Map; Admin: Dashboard, Utilization, Ghosting, Capacity), user avatar & name ("John Doe / Admin" — hardcoded), toggle button |
| **Auth guard** | `ProtectedRoute` calls `useAuth()` → currently **always returns `isAuthenticated: true`** (placeholder) |
| **Assumptions** | Frontend expects `useAuth()` to eventually return `{ isAuthenticated, isLoading }` from a real auth context. Redirect to `/login` if not authenticated. |

### 1.3 Room Search — `/rooms`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Booking/RoomSearch.tsx` |
| **Purpose** | Browse and filter bookable meeting rooms |
| **UI elements** | Search text input, Building dropdown, Floor dropdown, Min Capacity dropdown, Amenity checkboxes (6 types), room cards in a responsive grid |
| **User actions** | Type search query; change any filter → triggers re-fetch; click room card → `onRoomSelect(room)` (prop, not wired in Router) |
| **Data consumed** | `fetchRoomsFiltered(filters: RoomFilter)` → `Room[]` |
| **Data mutated** | None |
| **Fallback** | If service returns empty, displays 4 hardcoded mock rooms |
| **Filter shape** | `{ building?, floor?, minCapacity?, amenities?, searchQuery? }` |

### 1.4 Room Details — `/rooms/:roomId`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Booking/RoomDetails.tsx` |
| **Purpose** | View a single room — amenities, today's booking schedule, book action |
| **UI elements** | Back button, room name + status badge, building/floor/capacity metadata, amenity icon grid (6 types), date picker, booking list (title, time range, organizer, checked-in status), "Book This Room" button |
| **User actions** | Change date → re-fetch bookings; click "Back" → `history.back()`; click "Book This Room" → `onBookRoom(room)` (prop — modal system not wired in Router) |
| **Data consumed** | `fetchRoomById(roomId)` → `Room`, `fetchBookingsByRoom(roomId, date)` → `Booking[]` |
| **Data mutated** | None directly (booking happens via `BookingModal`) |
| **Fallback** | Mock room and 2 mock bookings if services return empty |

### 1.5 Booking Modal (not routed — component)

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Booking/BookingModal.tsx` |
| **Purpose** | Create a new booking for a selected room |
| **UI elements** | Modal overlay, room info banner, title input (required), description textarea, date input, start time + end time inputs, error box, Cancel + Confirm Booking buttons |
| **User actions** | Fill form → Confirm Booking → `createBooking(request)` |
| **Data consumed** | Room prop (pre-filled) |
| **Data mutated** | `createBooking(BookingRequest)` → `Booking` |
| **Validation** | Client-side via `validateBooking()`: title required, roomId required, start/end times required |
| **Notes** | Time-slot conflict checking is **not implemented client-side** — frontend assumes the backend will reject conflicts. No attendee picker UI despite `attendeeIds` field. |

### 1.6 Floor Map — `/floor-map`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Booking/FloorMap.tsx` |
| **Purpose** | Visual SVG floor plan showing room locations with real-time status |
| **UI elements** | Building dropdown, floor dropdown, SVG map with colored room rectangles (green=available, red=occupied, yellow=reserved), legend, hover highlight, status dots |
| **User actions** | Select building/floor; hover room → highlight; click room → "Click a room for details" prompt (no handler implemented) |
| **Data consumed** | Currently mock data only. Service layer exposes `fetchFloorPlan(buildingId, floor)` → `FloorPlan` |
| **Data mutated** | None |
| **Notes** | Room click handler is not connected. The `FloorPlan` type includes `svgData: string` suggesting the backend would supply SVG floor-plan geometry. |

### 1.7 Admin Dashboard — `/admin/dashboard`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Admin/Dashboard.tsx` |
| **Purpose** | High-level KPI overview and trends |
| **UI elements** | Date range picker, 4 KPI cards (Total Rooms, Avg Utilization, Ghosting Rate, Total Bookings — with % change), Utilization Trends chart placeholder, Weekly Heatmap (5-day × 9-hour grid), Room Performance Comparison table (room, utilization%, ghosting%, total bookings) |
| **User actions** | Adjust date range; view data |
| **Data consumed** | Frontend expects `fetchKPIData(dateRange)`, `fetchHeatmapData(dateRange, metric)`, `fetchRoomComparison(roomIds, dateRange)`. Currently all mock. |
| **Data mutated** | None |

### 1.8 Utilization View — `/admin/utilization`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Admin/UtilizationView.tsx` |
| **Purpose** | Detailed room utilization analysis |
| **UI elements** | Date range picker, building filter dropdown, utilization-over-time chart placeholder (line chart), by-time-of-day chart placeholder, by-day-of-week chart placeholder, room-by-room utilization bar chart with trend arrows (up/down/stable) |
| **User actions** | Adjust date range; filter by building |
| **Data consumed** | `fetchUtilizationData(dateRange)` → `UtilizationData[]` |
| **Data mutated** | None |
| **Color coding** | ≥70% green, 50–69% yellow, <50% red |

### 1.9 Ghosting View — `/admin/ghosting`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Admin/GhostingView.tsx` |
| **Purpose** | Analyze no-show patterns and wasted meeting time |
| **UI elements** | Date range picker, 4 KPI cards (Ghosting Rate, No-Shows Today, Wasted Hours, Recovery Rate), Ghosting Trend chart placeholder, Department Breakdown horizontal bar chart, "Rooms with Highest Ghosting Rates" table (room, ghosting%, no-shows count, wasted time, severity badge), 3 recommendation cards |
| **User actions** | Adjust date range |
| **Data consumed** | `fetchGhostingData(dateRange)` → `GhostingData[]` |
| **Data mutated** | None |
| **Notes** | Department breakdown implies the backend can associate bookings with departments. Recommendations are hard-coded text. Severity badges: >25% Critical (red), >15% Warning (yellow), else Good (green). |

### 1.10 Capacity View — `/admin/capacity`

| Aspect | Detail |
|---|---|
| **File** | `web/src/pages/Admin/CapacityView.tsx` |
| **Purpose** | Analyze room sizing efficiency: oversized vs undersized bookings |
| **UI elements** | Date range picker, 4 KPI cards (Avg Capacity Used, Oversized Bookings, Undersized Bookings, Right-Sized Rate), Capacity Distribution pie chart placeholder, Scatter plot placeholder (capacity vs attendees), Room-by-Room capacity efficiency bars (avgAttendees / roomCapacity), 3 insight cards (warnings, successes, recommendations) |
| **User actions** | Adjust date range |
| **Data consumed** | `fetchCapacityData(dateRange)` → `CapacityData[]` |
| **Data mutated** | None |
| **Notes** | "Oversized" / "undersized" implies the backend knows actual attendee counts per meeting, not just booked counts. |

---

## 2. Mobile Panel App Functional Map

The mobile app targets a **SUNMI M2 MAX Android tablet** (~1920×1200) running in kiosk mode. Navigation is **state-driven** via `RoomStateContext` — there is no navigation library.

**Source:** `mobile/App.tsx`, `mobile/src/context/RoomStateContext.tsx`

### 2.1 Screen Flow

```
                ┌──────────────────────────┐
                │   status = available      │
                │   OR no currentMeeting    │
                │                           │
                │        IdleScreen         │
                │                           │
                └───────────┬──────────────┘
                            │ status = occupied
                            │ AND currentMeeting exists
                            │ AND checkedIn = false
                            ▼
                ┌──────────────────────────┐
                │       CheckInScreen       │
                │  (15-min countdown)       │
                │                           │
                │ [Check In Now]            │
                │ [Release Room]            │
                └───────────┬──────────────┘
                            │ handleCheckIn() succeeds
                            ▼
                ┌──────────────────────────┐
                │       MeetingScreen       │
                │  (countdown to end)       │
                │                           │
                │ [End Meeting Early] ──────┼───┐
                └──────────────────────────┘   │
                                                ▼
                                   ┌─────────────────────┐
                                   │   EndEarlyScreen     │
                                   │   (modal overlay)    │
                                   │                      │
                                   │ [End Meeting] ───────┼──→ idle
                                   │ [Cancel] ────────────┼──→ meeting
                                   └─────────────────────┘
```

**Auto-navigation rules** (from `RoomStateContext`):
- `status === 'occupied' && currentMeeting && !checkedIn` → `checkin`
- `status === 'occupied' && currentMeeting && checkedIn` → `meeting`
- everything else → `idle`

### 2.2 Idle Screen

| Aspect | Detail |
|---|---|
| **File** | `mobile/src/screens/IdleScreen.tsx` |
| **When shown** | Room is `available` or no current meeting |
| **UI** | Large clock + date, room name + building/floor, `StatusIndicator` (available/occupied/upcoming/offline), capacity badge, next-meeting card (title, time range, organizer, "Starts in Xh Ym"), "Book Now" button (visible when available) |
| **User actions** | "Book Now" (handler is a placeholder `console.log`) |
| **Real-time** | Clock updates every 60 s; room state refreshes via polling (30 s default) + WebSocket subscription |
| **Background color** | Green-tinted (`successLight`) when available, white otherwise |

### 2.3 Check-In Screen

| Aspect | Detail |
|---|---|
| **File** | `mobile/src/screens/CheckInScreen.tsx` |
| **When shown** | Auto-entered when `status === 'occupied' && !checkedIn` |
| **UI** | Status indicator (upcoming), room name, large check-mark icon in circle, "Check In Required" title + subtitle, meeting card (title, organizer, time, attendee count), countdown timer (starts at 15:00), progress bar, "Check In Now" button, "Release Room" button, help text |
| **User actions** | "Check In Now" → `handleCheckIn()` → API call → on success transitions to MeetingScreen; "Release Room" → placeholder (`console.log`) |
| **Urgency** | When <5 min remaining: background turns `warningLight`, countdown turns red, warning text "Room will be released if not checked in" |
| **Countdown** | 15 minutes, ticks every second client-side — the starting value is hardcoded, not server-driven |

### 2.4 Meeting Screen

| Aspect | Detail |
|---|---|
| **File** | `mobile/src/screens/MeetingScreen.tsx` |
| **When shown** | `status === 'occupied' && checkedIn === true` |
| **UI** | Status indicator (occupied), room name, meeting title, "Organized by" organizer, time range, elapsed-time progress bar with countdown ("Xh Ym remaining" → "Xm Xs remaining" → "Ended"), attendee card, checked-in badge with timestamp, "End Meeting Early" button, next-meeting warning bar |
| **User actions** | "End Meeting Early" → navigates to `endEarly` screen |
| **Background** | Red-tinted; turns to warning-tinted when >90% of meeting time elapsed |
| **Real-time** | Countdown updates every second |

### 2.5 End Early Screen (Modal)

| Aspect | Detail |
|---|---|
| **File** | `mobile/src/screens/EndEarlyModal.tsx` |
| **When shown** | User taps "End Meeting Early" on MeetingScreen |
| **UI** | Modal overlay, stop icon, "End Meeting Early?" title, meeting info (title + organizer), time-saved display ("X minutes" — calculated from now to scheduled end), "The room will become immediately available for others", "End Meeting" button (danger), "Cancel" button, disclaimer "The meeting organizer will be notified via email" |
| **User actions** | "End Meeting" → `handleEndEarly()` → API call → success → go to idle; "Cancel" → go back to meeting |
| **Data mutated** | `endMeetingEarly(meetingId)` |

---

## 3. Shared Frontend Assumptions

### 3.1 Authentication

- Frontend expects a global auth state exposing `{ isAuthenticated: boolean, isLoading: boolean }`.
- `ProtectedRoute` redirects unauthenticated users to `/login` and preserves the original URL.
- Login accepts email + password credentials — no token management, refresh logic, or session storage is implemented yet.
- The mobile panel app has **no authentication layer** — it is assumed to be pre-configured for a specific room.

### 3.2 Current Room Context (Mobile)

- The room ID is **hardcoded** (`ROOM_ID = 'room-001'`) in `RoomStateContext`.
- In production the frontend expects this to come from device configuration or provisioning.
- All mobile API calls are scoped to this single room.

### 3.3 Time & Scheduling Rules

- Check-in window: 15 minutes (hardcoded in `CheckInScreen`).
- Auto-release on no-show: implied by UI copy ("Room will be released if not checked in") but **not implemented client-side** — backend must enforce.
- Meeting end detection: client compares `Date.now()` to `endTime` — does not account for time-zone or server-clock skew.
- Booking time slots: `BookingModal` uses `<input type="time">` and `<input type="date">` — no minimum duration, no maximum duration, no buffer between meetings enforced on client.

### 3.4 Analytics Availability

- All admin views accept a `DateRange` and expect the backend to return aggregated analytics.
- The frontend assumes the backend can compute: utilization rate, ghosting rate, capacity efficiency, department-level breakdowns, heatmap (day × hour), trend data, and room-level comparisons.
- Export functionality is expected: `exportAnalyticsReport(dateRange, 'csv' | 'pdf')` → `Blob`.

### 3.5 Real-Time Updates (Mobile)

- `subscribeToRoomUpdates(roomId, callback)` — frontend expects either WebSocket push or fallback polling.
- Default polling interval: 30 seconds.
- On connection failure, falls back to 5-minute TTL cache via `AsyncStorage` (not yet wired — placeholder only).

### 3.6 User Identity

- Web layout hardcodes "John Doe / Admin" with initials "JD".
- User type references elsewhere: `User { id, name, email, department? }`.
- The frontend assumes at minimum two roles: regular user (booking) and admin (analytics). Role enforcement is not implemented.

---

## 4. Expected API Surface

All endpoints assume a base URL of `/api` (defined in `web/src/services/api.ts` and `mobile/src/services/api.ts`).

### 4.1 Room Endpoints

| Purpose | Method | Path (inferred) | Input | Output |
|---|---|---|---|---|
| List all rooms | GET | `/rooms` | — | `Room[]` |
| Get room by ID | GET | `/rooms/:id` | — | `Room` |
| Filter rooms | GET | `/rooms?...` | query params from `RoomFilter` | `Room[]` |
| Search rooms | GET | `/rooms/search?q=` | `query: string` | `Room[]` |
| Get room availability | GET | `/rooms/:id/availability?date=` | `date: string` | `TimeSlot[]` |
| List buildings | GET | `/buildings` | — | `Building[]` |
| Get floor plan | GET | `/buildings/:id/floors/:num` | — | `FloorPlan` |

### 4.2 Booking Endpoints

| Purpose | Method | Path (inferred) | Input | Output |
|---|---|---|---|---|
| List all bookings | GET | `/bookings` | — | `Booking[]` |
| Get booking by ID | GET | `/bookings/:id` | — | `Booking` |
| Bookings by room+date | GET | `/rooms/:id/bookings?date=` | `roomId, date` | `Booking[]` |
| Bookings by user | GET | `/users/:id/bookings` | `userId` | `Booking[]` |
| Create booking | POST | `/bookings` | `BookingRequest` | `Booking` |
| Update booking | PUT | `/bookings/:id` | `Partial<BookingRequest>` | `Booking` |
| Cancel booking | DELETE | `/bookings/:id` | — | `boolean` |
| Check in | POST | `/bookings/:id/checkin` | — | `boolean` |
| End early | POST | `/bookings/:id/end` | — | `boolean` |
| Available time slots | GET | `/rooms/:id/timeslots?date=` | `roomId, date` | `TimeSlot[]` |

### 4.3 Mobile-Specific Endpoints

| Purpose | Method | Path (inferred) | Input | Output |
|---|---|---|---|---|
| Get room state (composite) | GET | `/rooms/:id/state` | — | `RoomState` (room info + current meeting + next meeting + upcoming list) |
| Check in meeting | POST | `/meetings/:id/checkin` | — | `CheckInResult { success, message? }` |
| End meeting early | POST | `/meetings/:id/end` | — | `EndMeetingResult { success, message?, freedMinutes? }` |
| Report room issue | POST | `/rooms/:id/issues` | `{ issue: string }` | `boolean` |
| Extend meeting | POST | `/meetings/:id/extend` | `{ minutes: number }` | `boolean` |

### 4.4 Analytics Endpoints

| Purpose | Method | Path (inferred) | Input | Output |
|---|---|---|---|---|
| Utilization data | GET | `/analytics/utilization` | `DateRange` | `UtilizationData[]` |
| Ghosting data | GET | `/analytics/ghosting` | `DateRange` | `GhostingData[]` |
| Capacity data | GET | `/analytics/capacity` | `DateRange` | `CapacityData[]` |
| KPI summary | GET | `/analytics/kpi` | `DateRange` | `KPIData[]` |
| Heatmap | GET | `/analytics/heatmap` | `DateRange, metric` | `HeatmapCell[]` |
| Room comparison | GET | `/analytics/rooms/compare` | `roomIds[], DateRange` | `RoomComparison[]` |
| Trend line | GET | `/analytics/trends` | `metric, DateRange` | `{ date, value }[]` |
| Export report | GET | `/analytics/export` | `DateRange, format` | `Blob (CSV/PDF)` |

### 4.5 Real-Time Channel

| Purpose | Transport | Input | Output |
|---|---|---|---|
| Room state push | WebSocket (or polling fallback) | `roomId` subscription | `RoomState` object on every change |

---

## 5. Implied Data Models

### 5.1 Room

| Field | Type | Read/Write | Source |
|---|---|---|---|
| `id` | string | R | `web/src/types/room.ts` |
| `name` | string | R | |
| `building` | string | R | |
| `floor` | number | R | |
| `capacity` | number | R | |
| `amenities` | `Amenity[]` | R | enum: `projector`, `whiteboard`, `video_conference`, `phone`, `tv_display`, `air_conditioning` |
| `status` | `RoomStatus` | R | `available`, `occupied`, `reserved`, `maintenance` |
| `imageUrl` | string? | R | defined but never used |

### 5.2 Building

| Field | Type | Read/Write | Source |
|---|---|---|---|
| `id` | string | R | `web/src/types/room.ts` |
| `name` | string | R | |
| `address` | string | R | |
| `floors` | number | R | |

### 5.3 FloorPlan

| Field | Type | Read/Write | Source |
|---|---|---|---|
| `floorNumber` | number | R | `web/src/types/room.ts` |
| `buildingId` | string | R | |
| `svgData` | string | R | raw SVG markup |
| `rooms` | `FloorRoom[]` | R | `{ roomId, x, y, width, height }` |

### 5.4 Booking

| Field | Type | Read/Write | Source |
|---|---|---|---|
| `id` | string | R | `web/src/types/booking.ts` |
| `roomId` | string | R/W | |
| `roomName` | string | R | denormalized |
| `title` | string | R/W | |
| `description` | string? | R/W | |
| `organizer` | `User` | R | embedded `{ id, name, email }` |
| `attendees` | `User[]` | R | |
| `startTime` | string (ISO) | R/W | |
| `endTime` | string (ISO) | R/W | |
| `status` | `BookingStatus` | R | `confirmed`, `pending`, `cancelled`, `completed`, `no_show` |
| `checkedIn` | boolean | R | |
| `checkedInAt` | string? (ISO) | R | |

### 5.5 BookingRequest (write model)

| Field | Type | Source |
|---|---|---|
| `roomId` | string | `web/src/types/booking.ts` |
| `title` | string | |
| `description` | string? | |
| `startTime` | string (ISO) | |
| `endTime` | string (ISO) | |
| `attendeeIds` | string[] | |

### 5.6 User

| Field | Type | Read/Write | Source |
|---|---|---|---|
| `id` | string | R | `web/src/types/booking.ts` |
| `name` | string | R | |
| `email` | string | R | |
| `department` | string? | R | referenced by ghosting analysis |

### 5.7 Meeting (mobile model)

| Field | Type | Read/Write | Source |
|---|---|---|---|
| `id` | string | R | `mobile/src/types/meeting.ts` |
| `title` | string | R | |
| `organizer` | string | R | name only (not a User object) |
| `organizerEmail` | string | R | |
| `startTime` | string (ISO) | R | |
| `endTime` | string (ISO) | R | |
| `attendeeCount` | number | R | count only (no individual attendees) |
| `checkedIn` | boolean | R/W | |
| `checkedInAt` | string? (ISO) | R | |

### 5.8 RoomState (mobile composite)

| Field | Type | Source |
|---|---|---|
| `room` | `RoomInfo` | `{ id, name, building, floor, capacity }` |
| `status` | `RoomStatus` | `available`, `occupied`, `upcoming`, `offline` |
| `currentMeeting` | `Meeting?` | |
| `nextMeeting` | `Meeting?` | |
| `upcomingMeetings` | `Meeting[]` | |
| `lastUpdated` | string (ISO) | |

### 5.9 Analytics Entities

| Entity | Key Fields | Source |
|---|---|---|
| `UtilizationData` | `roomId, roomName, utilizationRate, totalBookings, totalHoursBooked, peakHours[]` | `web/src/types/analytics.ts` |
| `GhostingData` | `roomId, roomName, ghostingRate, totalNoShows, totalBookings, averageWastedMinutes` | |
| `CapacityData` | `roomId, roomName, roomCapacity, averageAttendees, capacityUtilization, oversizedBookings, undersizedBookings` | |
| `KPIData` | `label, value, change?, changeType?, unit?` | generic KPI card model |
| `HeatmapCell` | `day, hour, value` | |
| `RoomComparison` | `roomId, roomName, utilization, ghosting, capacity, bookings` | |

### 5.10 Entity Relationships

```
Building  1──*  Room
Room      1──*  Booking
User      1──*  Booking (as organizer)
User      *──*  Booking (as attendees)
Room      1──1  FloorPlan (per floor)
Room      1──*  UtilizationData  (per date range)
Room      1──*  GhostingData     (per date range)
Room      1──*  CapacityData     (per date range)
```

---

## 6. Gaps & Open Questions

### 6.1 Authentication & Authorization

1. **No auth implementation exists.** `useAuth()` is a stub returning `true`. Backend must define: token format, session management, login endpoint, refresh flow.
2. **No role model.** The layout shows "Admin" text but no role-based route guarding or conditional UI. Q: Are the admin analytics pages restricted to a specific role?
3. **Mobile has no auth.** The panel app assumes it is pre-authorized. Q: How is the device provisioned and its room assignment stored?

### 6.2 Booking Rules

4. **No conflict detection on client.** The frontend submits a `BookingRequest` and trusts the backend to reject time conflicts. The backend must define overlap rules.
5. **No minimum/maximum duration.** The time inputs allow any range. Q: Business rules for minimum slot (15 min? 30 min?) and maximum slot?
6. **No buffer between meetings.** Q: Should there be a mandatory gap (e.g., 5-10 min) between consecutive bookings for room transitions?
7. **Attendee selection is absent.** `BookingRequest.attendeeIds` is a `string[]` but the `BookingModal` has no attendee picker. Q: Will attendees be added from a directory, or is this field optional?
8. **Recurring bookings not modeled.** No recurrence fields exist in any type. Q: Future requirement?

### 6.3 Check-In & Ghosting

9. **15-minute check-in window is hardcoded.** Q: Should this be configurable per-room or per-org?
10. **"Release Room" button has no handler.** `CheckInScreen` renders it but only logs. Backend needs a "release/decline booking" action.
11. **Auto-release policy is implied but not implemented.** The UI warns "Room will be released" — backend must actually enforce the auto-release after timeout and update `RoomState`.
12. **Ghosting definition is unclear.** Q: Is ghosting defined as "no check-in within window" or "booking exists but room sensor shows empty"?

### 6.4 Floor Map

13. **Floor plan data source is undefined.** `FloorPlan.svgData` expects raw SVG — Q: Will this be admin-uploaded, auto-generated, or vendor-provided?
14. **Room click on floor map has no navigation.** The hover state exists but clicking a room doesn't navigate to `RoomDetails`.

### 6.5 Analytics

15. **Department data source unclear.** Ghosting view shows per-department breakdown, but `User.department` is optional. Q: Where does department data come from — HR system, user profile, manual?
16. **"Actual attendees" vs "expected attendees".** Capacity analysis uses `averageAttendees` — Q: Is this based on check-ins, badge swipes, sensor data, or self-reported values?
17. **Chart rendering not implemented.** All admin pages show placeholder boxes for charts. The frontend will need a charting library (e.g., recharts, chart.js) once real data flows.
18. **Heatmap is randomly colored.** The dashboard heatmap calls `Math.random()` — it needs real data.
19. **Recommendations are static text.** Ghosting and Capacity views show hardcoded recommendation cards, not data-driven insights.
20. **Export endpoint shape undefined.** `exportAnalyticsReport()` returns `Blob | null`. Q: What columns/format for CSV? What layout for PDF?

### 6.6 Mobile-Specific

21. **"Book Now" on IdleScreen is a placeholder.** No quick-booking flow exists for the panel — Q: Should this create an ad-hoc booking for the next N minutes?
22. **Extend meeting feature is in the API stub but has no UI.** `extendMeeting(meetingId, minutes)` exists in the mobile service layer but no screen exposes it.
23. **Report room issue feature is in the API stub but has no UI.** Same situation.
24. **Offline resilience is scaffolded but not wired.** `AsyncStorage` calls are commented out.
25. **Device clock is trusted.** All countdowns use `Date.now()`. If the tablet clock drifts, check-in windows and meeting-end detection will be incorrect.

### 6.7 Data Model Divergence

26. **Web and mobile define Room/Meeting types independently.** Web has `Booking` with a `User` organizer object; mobile has `Meeting` with `organizer: string` (name only). The backend must serve both shapes or the frontends need a shared type contract.
27. **Room status enums differ.** Web: `available | occupied | reserved | maintenance`. Mobile: `available | occupied | upcoming | offline`. Backend must reconcile.

### 6.8 API Client

28. **No error handling beyond console.log.** The `apiClient` in `web/src/services/api.ts` stubs all methods. It wraps responses in `ApiResponse<T> { data, success, message? }` — the backend should match this envelope.
29. **No pagination.** Room lists, booking lists, and analytics all return full arrays. Q: At what scale does pagination become necessary?
30. **No CORS or proxy configuration.** The Vite dev server will need a proxy to `/api`. No `vite.config.ts` exists yet.
