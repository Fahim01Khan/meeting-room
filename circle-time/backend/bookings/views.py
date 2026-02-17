from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta

from bookings.models import Booking, BookingAttendee, BookingExtension
from bookings.serializers import (
    BookingSerializer,
    BookingCreateSerializer,
    BookingUpdateSerializer,
    RecurringBookingCreateSerializer,
    BookingExtensionSerializer,
)
from bookings.constants import BookingStatus, RecurrenceType, BookingDefaults
from bookings.utils import check_booking_conflicts, generate_recurring_dates
from rooms.models import Room
from providers.gateway import get_provider
from accounts.models import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _check_overlap(room_id, start, end, exclude_booking_id=None):
    """
    Return True if there is a time-overlap conflict for the room.
    
    DEPRECATED: Use check_booking_conflicts from bookings.utils instead.
    This function is kept for backwards compatibility but will be removed.
    """
    return check_booking_conflicts(room_id, start, end, exclude_booking_id)


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
    Create a single booking. Enforces time-overlap conflicts → 409.
    Uses the provider gateway for external calendar sync.
    Uses BookingStatus enum and check_booking_conflicts utility.
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

    # Conflict check using utility (server-enforced — web client relies on this)
    if check_booking_conflicts(room_id, start, end):
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

    # Create booking with status enum
    booking = Booking.objects.create(
        room=room,
        title=data["title"],
        description=data.get("description", ""),
        organizer=request.user,
        start_time=start,
        end_time=end,
        status=BookingStatus.CONFIRMED.value,
    )

    # Attach attendees
    attendee_ids = data.get("attendeeIds", [])
    for uid in attendee_ids:
        try:
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
# POST /api/bookings/recurring
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_recurring_booking(request):
    """
    Create a recurring booking series.
    
    Creates a parent booking (first occurrence) and child bookings for
    each subsequent occurrence. Skips dates that have conflicts.
    
    Returns:
        {
            "success": true,
            "data": {
                "parentBookingId": "uuid",
                "createdCount": 12,
                "skippedDates": ["2026-03-15", "2026-04-12"],
                "parent": {...booking object...}
            }
        }
    
    Errors:
        400: Invalid request data or no occurrences generated
        404: Room not found
        409: First occurrence conflicts with existing booking
    """
    ser = RecurringBookingCreateSerializer(data=request.data)
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
    recurrence_type = data["recurrenceType"]
    recurrence_end_date = data["recurrenceEndDate"]
    recurrence_pattern = data["recurrencePattern"]

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

    # Generate occurrence dates
    try:
        occurrence_dates = generate_recurring_dates(
            start_date=start.date(),
            end_date=recurrence_end_date,
            recurrence_type=recurrence_type,
            pattern=recurrence_pattern,
        )
    except Exception as e:
        return Response(
            {"success": False, "message": f"Invalid recurrence pattern: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate we have at least one occurrence
    if not occurrence_dates:
        return Response(
            {"success": False, "message": "No occurrences generated from recurrence pattern"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate max 52 occurrences (one year of weekly meetings)
    if len(occurrence_dates) > 52:
        return Response(
            {
                "success": False,
                "message": f"Too many occurrences ({len(occurrence_dates)}). Maximum is 52. "
                          f"Please use a shorter recurrence_end_date."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Calculate duration for each occurrence
    duration = end - start

    # Check first occurrence for conflicts (must succeed for parent)
    first_date = occurrence_dates[0]
    first_start = start.replace(year=first_date.year, month=first_date.month, day=first_date.day)
    first_end = first_start + duration

    if check_booking_conflicts(room_id, first_start, first_end):
        return Response(
            {"success": False, "message": f"First occurrence ({first_date}) conflicts with existing booking"},
            status=status.HTTP_409_CONFLICT,
        )

    # Create parent booking (first occurrence)
    parent = Booking.objects.create(
        room=room,
        title=data["title"],
        description=data.get("description", ""),
        organizer=request.user,
        start_time=first_start,
        end_time=first_end,
        status=BookingStatus.CONFIRMED.value,
        is_recurring=True,
        recurrence_type=recurrence_type,
        recurrence_end_date=recurrence_end_date,
        recurrence_pattern=recurrence_pattern,
    )

    # Attach attendees to parent
    attendee_ids = data.get("attendeeIds", [])
    for uid in attendee_ids:
        try:
            user = User.objects.get(id=uid)
            BookingAttendee.objects.create(booking=parent, user=user)
        except Exception:
            pass

    # Create child bookings for remaining occurrences
    created_count = 1  # Parent counts as first
    skipped_dates = []

    for occurrence_date in occurrence_dates[1:]:  # Skip first (already created as parent)
        occurrence_start = start.replace(
            year=occurrence_date.year,
            month=occurrence_date.month,
            day=occurrence_date.day
        )
        occurrence_end = occurrence_start + duration

        # Check for conflicts (skip if conflict exists)
        if check_booking_conflicts(room_id, occurrence_start, occurrence_end):
            skipped_dates.append(occurrence_date.isoformat())
            continue

        # Create child booking
        child = Booking.objects.create(
            room=room,
            title=data["title"],
            description=data.get("description", ""),
            organizer=request.user,
            start_time=occurrence_start,
            end_time=occurrence_end,
            status=BookingStatus.CONFIRMED.value,
            is_recurring=True,
            parent_booking=parent,
        )

        # Attach same attendees to child
        for uid in attendee_ids:
            try:
                user = User.objects.get(id=uid)
                BookingAttendee.objects.create(booking=child, user=user)
            except Exception:
                pass

        created_count += 1

    # Return parent booking details plus creation stats
    parent_serializer = BookingSerializer(parent)
    return Response(
        {
            "success": True,
            "data": {
                "parentBookingId": str(parent.id),
                "createdCount": created_count,
                "skippedDates": skipped_dates,
                "parent": parent_serializer.data,
            }
        },
        status=status.HTTP_201_CREATED,
    )


# ---------------------------------------------------------------------------
# POST /api/bookings/<id>/extend
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def extend_booking(request, booking_id):
    """
    Extend a booking by specified minutes.
    
    Requirements:
    - Booking must exist and not be completed/cancelled
    - User must be the organizer or an admin
    - Extension must not conflict with another booking
    - Maximum 4 extensions per booking (configurable)
    
    Request body:
        { "extensionMinutes": 15 }
    
    Returns:
        { "success": true, "data": {...updated booking...} }
    
    Errors:
        400: Invalid extension minutes or max extensions reached
        403: User not authorized to extend this booking
        404: Booking not found
        409: Extension would conflict with another booking
    """
    # Validate booking exists
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {"success": False, "message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Validate user is organizer or admin
    if booking.organizer != request.user and not request.user.is_staff:
        return Response(
            {"success": False, "message": "Only the organizer or admin can extend this booking"},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Validate booking is not completed or cancelled
    if booking.status in [BookingStatus.COMPLETED.value, BookingStatus.CANCELLED.value]:
        return Response(
            {"success": False, "message": f"Cannot extend {booking.status} booking"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate request data
    ser = BookingExtensionSerializer(data=request.data)
    if not ser.is_valid():
        errors = []
        for field, errs in ser.errors.items():
            for e in errs:
                errors.append(f"{field}: {e}")
        return Response(
            {"success": False, "message": "; ".join(errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    extension_minutes = ser.validated_data["extensionMinutes"]

    # Check max extensions limit
    max_extensions = BookingDefaults.MAX_EXTENSIONS_PER_BOOKING.value
    current_extensions = booking.extensions.count()
    
    if current_extensions >= max_extensions:
        return Response(
            {
                "success": False,
                "message": f"Maximum {max_extensions} extensions already reached for this booking"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Calculate new end time
    new_end_time = booking.end_time + timedelta(minutes=extension_minutes)

    # Check for conflicts with the extended time
    if check_booking_conflicts(
        booking.room_id,
        booking.end_time,  # Check from current end time
        new_end_time,      # To new end time
        exclude_booking_id=booking.id
    ):
        return Response(
            {"success": False, "message": "Extension would conflict with another booking"},
            status=status.HTTP_409_CONFLICT,
        )

    # Update booking end time
    booking.end_time = new_end_time
    booking.save()

    # Create extension record for audit trail
    BookingExtension.objects.create(
        booking=booking,
        extended_by=request.user,
        extension_minutes=extension_minutes,
    )

    # Return updated booking
    serializer = BookingSerializer(booking)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_200_OK,
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

    booking.status = BookingStatus.CANCELLED.value
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
    booking.status = BookingStatus.CHECKED_IN.value
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
    booking.status = BookingStatus.COMPLETED.value
    booking.save()

    # Notify provider
    provider = get_provider()
    provider.delete_event(str(booking.id))

    return Response({"success": True, "data": True})
