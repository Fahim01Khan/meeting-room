from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from bookings.models import Booking, BookingAttendee
from bookings.serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
)
from rooms.models import Room
from providers.gateway import get_provider


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_overlap(room_id, start, end, exclude_booking_id=None):
    """Return True if there is a time-overlap conflict for the room."""
    qs = Booking.objects.filter(
        room_id=room_id,
        status__in=["confirmed", "checked_in"],
        start_time__lt=end,
        end_time__gt=start,
    )
    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)
    return qs.exists()


# ---------------------------------------------------------------------------
# GET /api/rooms/<room_id>/bookings?date=
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def room_bookings(request, room_id):
    """List bookings for a room on a given date (web-facing: organizer=User object)."""
    date_str = request.query_params.get("date")

    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    qs = Booking.objects.filter(room=room).select_related("organizer")
    if date_str:
        try:
            from datetime import datetime
            target = datetime.strptime(date_str, "%Y-%m-%d").date()
            qs = qs.filter(start_time__date=target)
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    qs = qs.exclude(status="cancelled")
    serializer = BookingSerializer(qs, many=True)
    return Response({"success": True, "data": serializer.data})


# ---------------------------------------------------------------------------
# POST /api/bookings
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_booking(request):
    """
    Create a booking. Enforces time-overlap conflicts → 409.
    Uses the provider gateway for external calendar sync.
    """
    ser = BookingCreateSerializer(data=request.data)
    if not ser.is_valid():
        errors = []
        for field, errs in ser.errors.items():
            for e in errs:
                errors.append(f"{field}: {e}")
        return Response(
            {"success": False, "message": "; ".join(errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = ser.validated_data
    room_id = data["roomId"]
    start = data["startTime"]
    end = data["endTime"]

    # Validate room exists
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Validate start < end
    if start >= end:
        return Response(
            {"success": False, "message": "startTime must be before endTime"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Conflict check (server-enforced — web client relies on this)
    if _check_overlap(room_id, start, end):
        return Response(
            {"success": False, "message": "Room is already booked for the requested time slot."},
            status=status.HTTP_409_CONFLICT,
        )

    # Provider gateway — sync to external calendar if not local
    provider = get_provider()
    provider.create_event({
        "room_id": str(room_id),
        "title": data["title"],
        "start": start.isoformat(),
        "end": end.isoformat(),
    })

    # Create booking
    booking = Booking.objects.create(
        room=room,
        title=data["title"],
        description=data.get("description", ""),
        organizer=request.user,
        start_time=start,
        end_time=end,
        status="confirmed",
    )

    # Attach attendees
    attendee_ids = data.get("attendeeIds", [])
    for uid in attendee_ids:
        try:
            from accounts.models import User
            user = User.objects.get(id=uid)
            BookingAttendee.objects.create(booking=booking, user=user)
        except Exception:
            pass

    serializer = BookingSerializer(booking)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# PUT /api/bookings/<id>
# ---------------------------------------------------------------------------

@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def booking_detail(request, booking_id):
    """PUT = update booking, DELETE = cancel booking."""
    if request.method == "DELETE":
        return cancel_booking_impl(request, booking_id)
    return update_booking_impl(request, booking_id)


def update_booking_impl(request, booking_id):
    """Update an existing booking (partial update allowed)."""
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    ser = BookingUpdateSerializer(data=request.data)
    if not ser.is_valid():
        errors = []
        for field, errs in ser.errors.items():
            for e in errs:
                errors.append(f"{field}: {e}")
        return Response(
            {"success": False, "message": "; ".join(errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    data = ser.validated_data
    start = data.get("startTime", booking.start_time)
    end = data.get("endTime", booking.end_time)

    if start >= end:
        return Response(
            {"success": False, "message": "startTime must be before endTime"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Conflict check (exclude self)
    if _check_overlap(booking.room_id, start, end, exclude_booking_id=booking.id):
        return Response(
            {"success": False, "message": "Room is already booked for the requested time slot."},
            status=status.HTTP_409_CONFLICT,
        )

    if "title" in data:
        booking.title = data["title"]
    if "description" in data:
        booking.description = data["description"]
    if "startTime" in data:
        booking.start_time = data["startTime"]
    if "endTime" in data:
        booking.end_time = data["endTime"]
    booking.save()

    # Update attendees if provided
    if "attendeeIds" in data:
        booking.booking_attendees.all().delete()
        from accounts.models import User
        for uid in data["attendeeIds"]:
            try:
                user = User.objects.get(id=uid)
                BookingAttendee.objects.create(booking=booking, user=user)
            except Exception:
                pass

    serializer = BookingSerializer(booking)
    return Response({"success": True, "data": serializer.data})


# ---------------------------------------------------------------------------
# DELETE /api/bookings/<id>
# ---------------------------------------------------------------------------

def cancel_booking_impl(request, booking_id):
    """Cancel a booking."""
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    booking.status = "cancelled"
    booking.save()

    # Notify provider
    provider = get_provider()
    provider.delete_event(str(booking.id))

    return Response({"success": True, "data": True})


# ---------------------------------------------------------------------------
# POST /api/bookings/<id>/checkin
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkin_booking(request, booking_id):
    """Check in to a booking (web-facing)."""
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if booking.checked_in:
        return Response(
            {"success": False, "message": "Already checked in"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.conf import settings as s
    now = timezone.now()
    window_minutes = getattr(s, "CHECKIN_WINDOW_MINUTES", 15)

    # Check-in is valid from start_time up to start_time + window
    from datetime import timedelta
    window_end = booking.start_time + timedelta(minutes=window_minutes)
    if now > window_end:
        return Response(
            {"success": False, "message": "Check-in window has expired"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    booking.checked_in = True
    booking.checked_in_at = now
    booking.status = "checked_in"
    booking.save()

    return Response({"success": True, "data": True})


# ---------------------------------------------------------------------------
# POST /api/bookings/<id>/end
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_booking(request, booking_id):
    """End a booking early."""
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    now = timezone.now()
    booking.end_time = now
    booking.status = "completed"
    booking.save()

    # Notify provider
    provider = get_provider()
    provider.delete_event(str(booking.id))

    return Response({"success": True, "data": True})
