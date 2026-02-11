"""
Panel views — mobile-facing composite API.

Key contract differences vs web:
  - RoomStatus enum: available | occupied | upcoming | offline (NOT reserved/maintenance)
  - Meeting.organizer = string (NOT User object)
  - RoomState = { room, status, currentMeeting, nextMeeting, upcomingMeetings, lastUpdated }
"""
from django.utils import timezone
from django.conf import settings as django_settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta

from rooms.models import Room
from bookings.models import Booking


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _meeting_to_mobile(booking):
    """Convert a Booking ORM instance to the mobile Meeting shape."""
    return {
        "id": str(booking.id),
        "title": booking.title,
        "organizer": booking.organizer.name,          # string, NOT User object
        "organizerEmail": booking.organizer.email,
        "startTime": booking.start_time.isoformat(),
        "endTime": booking.end_time.isoformat(),
        "attendeeCount": booking.booking_attendees.count(),
        "checkedIn": booking.checked_in,
        "checkedInAt": booking.checked_in_at.isoformat() if booking.checked_in_at else None,
    }


def _derive_mobile_status(room, now, current, next_booking):
    """
    Derive mobile status enum:
      available | occupied | upcoming | offline
    """
    if room.status == "maintenance":
        return "offline"
    if current:
        return "occupied"
    if next_booking:
        diff = (next_booking.start_time - now).total_seconds() / 60
        if diff <= 15:
            return "upcoming"
    return "available"


# ---------------------------------------------------------------------------
# GET /api/rooms/<room_id>/state  (mobile panel)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])  # Panel has no auth layer per contract
def room_state(request, room_id):
    """
    Composite room-state endpoint for mobile panel.
    Returns RoomState with mobile enums and organizer as string.
    """
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    now = timezone.now()
    today_end = now.replace(hour=23, minute=59, second=59)

    # Current meeting: started and not ended, status confirmed or checked_in
    current = (
        Booking.objects.filter(
            room=room,
            start_time__lte=now,
            end_time__gt=now,
            status__in=["confirmed", "checked_in"],
        )
        .select_related("organizer")
        .first()
    )

    # Upcoming meetings today (after now, excluding current)
    upcoming_qs = (
        Booking.objects.filter(
            room=room,
            start_time__gt=now,
            start_time__lte=today_end,
            status__in=["confirmed", "checked_in"],
        )
        .select_related("organizer")
        .order_by("start_time")
    )
    upcoming_list = list(upcoming_qs[:10])
    next_booking = upcoming_list[0] if upcoming_list else None

    mobile_status = _derive_mobile_status(room, now, current, next_booking)

    room_info = {
        "id": str(room.id),
        "name": room.name,
        "building": room.building,
        "floor": room.floor,
        "capacity": room.capacity,
    }

    data = {
        "room": room_info,
        "status": mobile_status,
        "currentMeeting": _meeting_to_mobile(current) if current else None,
        "nextMeeting": _meeting_to_mobile(next_booking) if next_booking else None,
        "upcomingMeetings": [_meeting_to_mobile(b) for b in upcoming_list],
        "lastUpdated": now.isoformat(),
    }

    return Response({"success": True, "data": data})


# ---------------------------------------------------------------------------
# POST /api/meetings/<meeting_id>/checkin  (mobile panel)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def meeting_checkin(request, meeting_id):
    """
    Mobile panel check-in.
    Returns { success: bool, message?: string }
    """
    try:
        booking = Booking.objects.get(id=meeting_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Meeting not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if booking.checked_in:
        return Response(
            {"success": False, "message": "Already checked in"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    window = getattr(django_settings, "CHECKIN_WINDOW_MINUTES", 15)
    window_end = booking.start_time + timedelta(minutes=window)
    if now > window_end:
        return Response(
            {"success": False, "message": "Check-in window has expired"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    booking.checked_in = True
    booking.checked_in_at = now
    booking.status = "checked_in"
    booking.save()

    return Response({"success": True, "data": {"success": True, "message": "Checked in successfully"}})


# ---------------------------------------------------------------------------
# POST /api/meetings/<meeting_id>/end  (mobile panel — end early)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def meeting_end_early(request, meeting_id):
    """
    End a meeting early from the mobile panel.
    Returns { success: bool, message?: string, freedMinutes?: number }
    """
    try:
        booking = Booking.objects.get(id=meeting_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Meeting not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    now = timezone.now()
    freed = max(0, int((booking.end_time - now).total_seconds() / 60))

    booking.end_time = now
    booking.status = "completed"
    booking.save()

    return Response({
        "success": True,
        "data": {
            "success": True,
            "message": "Meeting ended early",
            "freedMinutes": freed,
        },
    })
