"""
Booking service layer.

Business logic for booking creation, cancellation, check-in, end-early,
and conflict detection. Views call services; services talk to models.

This layer is designed to be the future entry point for Celery tasks:
- Conflict detection stays synchronous
- Notifications (email to organizer on cancel/end-early) become async tasks
- Auto-release on no-show becomes a periodic Celery beat task
"""


def get_placeholder_room_bookings(room_id: str, date: str) -> list[dict]:
    """Return placeholder bookings for a room on a date."""
    # TODO: replace with real queryset filtered by room + date
    return [
        {
            "id": "booking-001",
            "roomId": room_id,
            "roomName": "Maple Room",
            "title": "Sprint Planning",
            "description": "Weekly sprint planning session",
            "organizer": {
                "id": "user-001",
                "name": "Jane Smith",
                "email": "jane@example.com",
            },
            "attendees": [
                {"id": "user-002", "name": "Bob Johnson", "email": "bob@example.com"},
            ],
            "startTime": f"{date}T09:00:00Z",
            "endTime": f"{date}T10:00:00Z",
            "status": "confirmed",
            "checkedIn": False,
            "checkedInAt": None,
        },
    ]


def get_placeholder_booking(
    room_id: str,
    title: str,
    description: str | None,
    start_time,
    end_time,
    organizer,
) -> dict:
    """Return a placeholder booking response after 'creation'."""
    # TODO: replace with real Booking.objects.create() + conflict validation
    return {
        "id": "booking-new-001",
        "roomId": room_id,
        "roomName": "Maple Room",
        "title": title,
        "description": description,
        "organizer": {
            "id": str(organizer.id),
            "name": getattr(organizer, "name", ""),
            "email": getattr(organizer, "email", ""),
        },
        "attendees": [],
        "startTime": start_time.isoformat() if hasattr(start_time, "isoformat") else str(start_time),
        "endTime": end_time.isoformat() if hasattr(end_time, "isoformat") else str(end_time),
        "status": "confirmed",
        "checkedIn": False,
        "checkedInAt": None,
    }


# TODO: implement create_booking(data, user) with time-slot conflict detection
# TODO: implement cancel_booking(booking_id, user) with ownership check
# TODO: implement checkin_booking(booking_id) with check-in window validation
# TODO: implement end_booking_early(booking_id) with freed-minutes calculation
# TODO: implement detect_no_shows() — periodic task for auto-release (Celery beat)
# TODO: move notification dispatch to async task when Celery is introduced
