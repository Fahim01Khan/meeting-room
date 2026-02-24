from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone

from rooms.models import Room, Building, FloorPlan
from rooms.serializers import RoomSerializer, BuildingSerializer, FloorPlanSerializer


def _param(request, *names):
    """Return the first non-None query-param value from a list of aliases."""
    for name in names:
        val = request.query_params.get(name)
        if val is not None:
            return val
    return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_rooms(request):
    """
    GET /api/rooms
    List rooms with optional camelCase filters:
      searchQuery, building, floor, minCapacity, amenities (comma-separated), status
    """
    queryset = Room.objects.all()

    # Free-text search (camelCase canonical: searchQuery)
    search = _param(request, "searchQuery", "search")
    if search:
        queryset = queryset.filter(Q(name__icontains=search) | Q(building__icontains=search))

    # Building filter
    building = _param(request, "building")
    if building:
        queryset = queryset.filter(building__iexact=building)

    # Floor filter
    floor = _param(request, "floor")
    if floor:
        try:
            queryset = queryset.filter(floor=int(floor))
        except ValueError:
            pass

    # Min capacity (camelCase canonical: minCapacity)
    min_capacity = _param(request, "minCapacity", "min_capacity")
    if min_capacity:
        try:
            queryset = queryset.filter(capacity__gte=int(min_capacity))
        except ValueError:
            pass

    # Amenities filter (comma-separated)
    amenities = _param(request, "amenities")
    if amenities:
        amenity_list = [a.strip() for a in amenities.split(",") if a.strip()]
        for amenity in amenity_list:
            queryset = queryset.filter(amenities__contains=[amenity])

    # Status filter
    status_filter = _param(request, "status")
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    serializer = RoomSerializer(queryset, many=True)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_room(request):
    """
    POST /api/rooms
    Create a new room. Admin only.
    Body: { name, building, floor, capacity, amenities?, status? }
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    name = request.data.get("name", "").strip()
    building = request.data.get("building", "").strip()
    floor = request.data.get("floor")
    capacity = request.data.get("capacity")

    errors = {}
    if not name:
        errors["name"] = "This field is required."
    if not building:
        errors["building"] = "This field is required."
    if floor is None:
        errors["floor"] = "This field is required."
    if capacity is None:
        errors["capacity"] = "This field is required."

    try:
        floor = int(floor)
    except (TypeError, ValueError):
        errors["floor"] = "Must be an integer."
    try:
        capacity = int(capacity)
    except (TypeError, ValueError):
        errors["capacity"] = "Must be an integer."

    if errors:
        return Response(
            {"success": False, "errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    amenities = request.data.get("amenities", [])
    if not isinstance(amenities, list):
        amenities = []

    room_status = request.data.get("status", "available")
    valid_statuses = [c[0] for c in Room.STATUS_CHOICES]
    if room_status not in valid_statuses:
        room_status = "available"

    room = Room.objects.create(
        name=name,
        building=building,
        floor=floor,
        capacity=capacity,
        amenities=amenities,
        status=room_status,
    )

    serializer = RoomSerializer(room)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_room(request, room_id):
    """
    PUT /api/rooms/<room_id>
    Partially update a room. Admin only.
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValueError:
        return Response(
            {"success": False, "message": "Invalid room ID format"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    errors = {}

    if "name" in request.data:
        name = str(request.data["name"]).strip()
        if not name:
            errors["name"] = "This field cannot be blank."
        else:
            room.name = name

    if "building" in request.data:
        building = str(request.data["building"]).strip()
        if not building:
            errors["building"] = "This field cannot be blank."
        else:
            room.building = building

    if "floor" in request.data:
        try:
            room.floor = int(request.data["floor"])
        except (TypeError, ValueError):
            errors["floor"] = "Must be an integer."

    if "capacity" in request.data:
        try:
            room.capacity = int(request.data["capacity"])
        except (TypeError, ValueError):
            errors["capacity"] = "Must be an integer."

    if "amenities" in request.data:
        amenities = request.data["amenities"]
        room.amenities = amenities if isinstance(amenities, list) else []

    if "status" in request.data:
        new_status = request.data["status"]
        valid_statuses = [c[0] for c in Room.STATUS_CHOICES]
        if new_status not in valid_statuses:
            errors["status"] = f"Must be one of: {', '.join(valid_statuses)}."
        else:
            room.status = new_status

    if errors:
        return Response(
            {"success": False, "errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    room.save()
    serializer = RoomSerializer(room)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_room(request, room_id):
    """
    DELETE /api/rooms/<room_id>
    Delete a room. Admin only.
    Blocked if room has active or future bookings (status not in cancelled/completed).
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValueError:
        return Response(
            {"success": False, "message": "Invalid room ID format"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from bookings.models import Booking

    now = timezone.now()
    blocking_count = Booking.objects.filter(
        room=room,
        end_time__gte=now,
    ).exclude(
        status__in=["cancelled", "completed"]
    ).count()

    if blocking_count > 0:
        return Response(
            {
                "success": False,
                "message": (
                    f"Cannot delete room: {blocking_count} active or future "
                    f"booking{'s' if blocking_count != 1 else ''} must be cancelled first."
                ),
            },
            status=status.HTTP_409_CONFLICT,
        )

    room.delete()
    return Response(
        {"success": True},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_room(request, room_id):
    """
    GET /api/rooms/<room_id>
    Return a single room's details.
    """
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except ValueError:
        return Response(
            {"success": False, "message": "Invalid room ID format"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = RoomSerializer(room)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def room_availability(request, room_id):
    """
    GET /api/rooms/<room_id>/availability?date=YYYY-MM-DD
    Return time slots with availability for the given date.
    """
    from bookings.models import Booking
    from datetime import datetime, time
    import pytz

    date_str = request.query_params.get("date")
    if not date_str:
        return Response(
            {"success": False, "message": "date query parameter is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response(
            {"success": False, "message": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Business hours: 07:00-19:00 in 30-min slots
    from django.conf import settings as s
    tz = pytz.timezone(s.TIME_ZONE)

    bookings = Booking.objects.filter(
        room_id=room_id,
        start_time__date=target_date,
        status__in=["confirmed", "checked_in"],
    )

    slots = []
    for hour in range(7, 19):
        for minute in (0, 30):
            slot_start = datetime.combine(target_date, time(hour, minute), tzinfo=tz)
            slot_end = datetime.combine(
                target_date,
                time(hour + (1 if minute == 30 else 0), 0 if minute == 30 else 30),
                tzinfo=tz,
            )
            is_available = not bookings.filter(
                start_time__lt=slot_end, end_time__gt=slot_start
            ).exists()
            slots.append({
                "startTime": slot_start.isoformat(),
                "endTime": slot_end.isoformat(),
                "isAvailable": is_available,
            })

    return Response(
        {"success": True, "data": slots},
        status=status.HTTP_200_OK,
    )


# ---------------------------------------------------------------------------
# GET /api/rooms/<room_id>/state  (kiosk — no auth required)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def room_state(request, room_id):
    """
    GET /api/rooms/<room_id>/state
    Return the live state of a room for the tablet kiosk app.
    No authentication required.
    """
    from bookings.models import Booking
    from datetime import timedelta

    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    now = timezone.now()
    today = now.date()

    # Room offline when under maintenance
    if room.status == "maintenance":
        return Response({
            "success": True,
            "data": {
                "room": {
                    "id": str(room.id),
                    "name": room.name,
                    "building": room.building,
                    "floor": room.floor,
                    "capacity": room.capacity,
                },
                "status": "offline",
                "currentMeeting": None,
                "nextMeeting": None,
                "upcomingMeetings": [],
                "lastUpdated": now.isoformat(),
            },
        })

    # Active booking: overlaps now
    active_booking = (
        Booking.objects
        .filter(
            room=room,
            start_time__lte=now,
            end_time__gte=now,
            status__in=["confirmed", "checked_in"],
        )
        .select_related("organizer")
        .first()
    )

    # All remaining bookings for today after now, ordered by start
    upcoming_qs = (
        Booking.objects
        .filter(
            room=room,
            start_time__date=today,
            start_time__gt=now,
            status__in=["confirmed", "checked_in"],
        )
        .select_related("organizer")
        .order_by("start_time")
    )

    # Determine status
    if active_booking is not None:
        room_status = "occupied"
    elif upcoming_qs.filter(start_time__lte=now + timedelta(minutes=30)).exists():
        room_status = "upcoming"
    else:
        room_status = "available"

    def _meeting_shape(booking):
        if booking is None:
            return None
        organizer = booking.organizer
        attendee_count = booking.attendee_count
        return {
            "id": str(booking.id),
            "title": booking.title,
            "organizer": (organizer.name or organizer.email) if organizer else "",
            "organizerEmail": organizer.email if organizer else "",
            "startTime": booking.start_time.isoformat(),
            "endTime": booking.end_time.isoformat(),
            "attendeeCount": attendee_count,
            "checkedIn": booking.checked_in,
            "checkedInAt": booking.checked_in_at.isoformat() if booking.checked_in_at else None,
        }

    upcoming_list = list(upcoming_qs)
    next_meeting = upcoming_list[0] if upcoming_list else None

    return Response({
        "success": True,
        "data": {
            "room": {
                "id": str(room.id),
                "name": room.name,
                "building": room.building,
                "floor": room.floor,
                "capacity": room.capacity,
            },
            "status": room_status,
            "currentMeeting": _meeting_shape(active_booking),
            "nextMeeting": _meeting_shape(next_meeting),
            "upcomingMeetings": [_meeting_shape(b) for b in upcoming_list],
            "lastUpdated": now.isoformat(),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_buildings(request):
    """GET /api/buildings — List all buildings."""
    buildings = Building.objects.all()
    serializer = BuildingSerializer(buildings, many=True)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_floor_plan(request, building_id, floor_num):
    """GET /api/buildings/<id>/floors/<num> — Floor plan with room positions."""
    try:
        fp = FloorPlan.objects.get(building_id=building_id, floor_number=floor_num)
    except FloorPlan.DoesNotExist:
        return Response(
            {"success": False, "message": "Floor plan not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = FloorPlanSerializer(fp)
    return Response(
        {"success": True, "data": serializer.data},
        status=status.HTTP_200_OK,
    )


# ---------------------------------------------------------------------------
# POST /api/rooms/<room_id>/book-adhoc  (kiosk — no auth required)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([AllowAny])
def book_adhoc(request, room_id):
    """
    POST /api/rooms/<room_id>/book-adhoc
    Create an ad-hoc booking from the tablet kiosk. No authentication required.

    Request body:
        { "durationMinutes": 30 }   # valid values: 30, 60, 90, 120

    Returns the new booking in Meeting shape so the mobile app can use it
    directly without a follow-up state fetch.
    """
    from datetime import timedelta
    from bookings.models import Booking
    from bookings.constants import BookingStatus
    from bookings.utils import check_booking_conflicts
    from accounts.models import User as AuthUser

    # Validate durationMinutes
    duration_minutes = request.data.get("durationMinutes")
    valid_durations = [30, 60, 90, 120]
    try:
        duration_minutes = int(duration_minutes)
    except (TypeError, ValueError):
        return Response(
            {"success": False, "message": "durationMinutes is required and must be an integer."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if duration_minutes not in valid_durations:
        return Response(
            {
                "success": False,
                "message": f"durationMinutes must be one of {valid_durations}.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate room exists
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {"success": False, "message": "Room not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Reject maintenance rooms
    if room.status == "maintenance":
        return Response(
            {"success": False, "message": "Room is under maintenance and cannot be booked."},
            status=status.HTTP_409_CONFLICT,
        )

    # Calculate booking window
    start_time = timezone.now()
    end_time = start_time + timedelta(minutes=duration_minutes)

    # Conflict check
    if check_booking_conflicts(room_id, start_time, end_time):
        return Response(
            {"success": False, "message": "Room is already booked for the requested time slot."},
            status=status.HTTP_409_CONFLICT,
        )

    # Get or create the system kiosk user
    kiosk_user, _ = AuthUser.objects.get_or_create(
        email="kiosk@circletime.io",
        defaults={
            "name": "Kiosk User",
        },
    )

    # Create booking
    booking = Booking.objects.create(
        room=room,
        title="Ad-hoc Booking",
        description="",
        organizer=kiosk_user,
        start_time=start_time,
        end_time=end_time,
        status=BookingStatus.CONFIRMED.value,
        attendee_count=0,
    )

    # Return in Meeting shape (matches mobile RoomState.Meeting interface)
    organizer_name = kiosk_user.name or kiosk_user.email

    return Response(
        {
            "success": True,
            "data": {
                "id": str(booking.id),
                "title": booking.title,
                "organizer": organizer_name,
                "organizerEmail": kiosk_user.email,
                "startTime": booking.start_time.isoformat(),
                "endTime": booking.end_time.isoformat(),
                "attendeeCount": 0,
                "checkedIn": False,
                "checkedInAt": None,
            },
        },
        status=status.HTTP_201_CREATED,
    )
