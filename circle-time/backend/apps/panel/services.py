"""
Panel service layer.

Aggregates data from rooms and bookings into the composite RoomState
payload that the mobile panel consumes.

When Celery + Redis are introduced:
- Room state will be cached in Redis and invalidated on booking changes.
- WebSocket push notifications will be dispatched as Celery tasks.
"""

from django.utils import timezone


def get_placeholder_room_state(room_id: str) -> dict:
    """
    Return placeholder composite room state matching the V1 contract.

    In production, this will:
    1. Fetch the room from rooms.models.Room
    2. Query today's bookings from bookings.models.Booking
    3. Derive status from the current time vs booking schedule
    4. Assemble the composite payload
    """
    # TODO: replace with real data aggregation from rooms + bookings
    now = timezone.now().isoformat()
    return {
        "room": {
            "id": room_id,
            "name": "Maple Room",
            "building": "HQ",
            "floor": 1,
            "capacity": 10,
        },
        "status": "available",
        "currentMeeting": None,
        "nextMeeting": {
            "id": "booking-001",
            "title": "Sprint Planning",
            "organizer": "Jane Smith",
            "organizerEmail": "jane@example.com",
            "startTime": "2026-02-09T14:00:00Z",
            "endTime": "2026-02-09T15:00:00Z",
            "attendeeCount": 5,
            "checkedIn": False,
            "checkedInAt": None,
        },
        "upcomingMeetings": [],
        "lastUpdated": now,
    }


# TODO: implement get_room_state(room_id) with real data
# TODO: implement derive_room_status(room, bookings, now) → status enum
# TODO: cache room state in Redis when Redis is introduced
# TODO: implement push_room_state_update(room_id) via Channels/Celery
