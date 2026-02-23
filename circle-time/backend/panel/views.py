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
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta

from rooms.models import Room
from bookings.models import Booking
from panel.models import PairingCode, DeviceRegistration


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


# ---------------------------------------------------------------------------
# POST /api/panel/pairing-codes  (tablet generates a pairing code)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def generate_pairing_code(request):
    """
    Tablet calls this to get a 6-digit pairing code.
    Body: { "deviceSerial": "string" }
    """
    device_serial = request.data.get("deviceSerial")
    if not device_serial:
        return Response(
            {"success": False, "message": "deviceSerial is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Expire any existing pending codes for this device
    PairingCode.objects.filter(
        device_serial=device_serial, status="pending"
    ).update(status="expired")

    code = PairingCode.generate_unique_code()
    now = timezone.now()
    pairing = PairingCode.objects.create(
        code=code,
        device_serial=device_serial,
        expires_at=now + timedelta(minutes=PairingCode.EXPIRY_MINUTES),
    )

    return Response(
        {
            "success": True,
            "data": {
                "code": pairing.code,
                "expiresAt": pairing.expires_at.isoformat(),
            },
        },
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# GET /api/panel/pairing-status/<code>  (tablet polls this)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def pairing_status(request, code):
    """
    Tablet polls this every ~3 seconds to learn when it has been paired.
    Returns status + roomId/roomName once an admin has paired it.
    """
    try:
        pairing = PairingCode.objects.select_related("room").get(code=code)
    except PairingCode.DoesNotExist:
        return Response(
            {"success": False, "message": "Pairing code not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Auto-expire if past the deadline
    if pairing.status == "pending" and pairing.is_expired:
        pairing.status = "expired"
        pairing.save(update_fields=["status"])

    data = {
        "status": pairing.status,
        "roomId": str(pairing.room.id) if pairing.room else None,
        "roomName": pairing.room.name if pairing.room else None,
    }

    return Response({"success": True, "data": data})


# ---------------------------------------------------------------------------
# POST /api/panel/pair-device  (web admin pairs a code to a room)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pair_device(request):
    """
    Admin submits the 6-digit code shown on the tablet plus a roomId.
    Backend creates/updates DeviceRegistration and marks code as paired.
    Body: { "code": "123456", "roomId": "uuid" }
    """
    code_value = request.data.get("code")
    room_id = request.data.get("roomId")

    if not code_value or not room_id:
        return Response(
            {"success": False, "message": "code and roomId are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find the pairing code
    try:
        pairing = PairingCode.objects.get(code=code_value)
    except PairingCode.DoesNotExist:
        return Response(
            {"success": False, "message": "Pairing code not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Validate state
    if pairing.status == "paired":
        return Response(
            {"success": False, "message": "Code has already been paired"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if pairing.is_expired:
        pairing.status = "expired"
        pairing.save(update_fields=["status"])
        return Response(
            {"success": False, "message": "Pairing code has expired"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find the room
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Create or update DeviceRegistration
    device, _created = DeviceRegistration.objects.update_or_create(
        device_serial=pairing.device_serial,
        defaults={"room": room, "is_active": True},
    )

    # Mark pairing code as paired
    now = timezone.now()
    pairing.status = "paired"
    pairing.room = room
    pairing.paired_at = now
    pairing.save(update_fields=["status", "room", "paired_at"])

    return Response(
        {
            "success": True,
            "data": {
                "roomId": str(room.id),
                "roomName": room.name,
            },
        }
    )


# ---------------------------------------------------------------------------
# GET /api/panel/devices  (web admin — list paired devices)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_devices(request):
    """
    List all active DeviceRegistrations with room details.
    """
    devices = (
        DeviceRegistration.objects.filter(is_active=True)
        .select_related("room")
        .order_by("-registered_at")
    )

    data = [
        {
            "id": str(d.id),
            "deviceSerial": d.device_serial,
            "roomId": str(d.room.id),
            "roomName": d.room.name,
            "roomBuilding": d.room.building,
            "roomFloor": d.room.floor,
            "registeredAt": d.registered_at.isoformat(),
            "isActive": d.is_active,
        }
        for d in devices
    ]

    return Response({"success": True, "data": data})
