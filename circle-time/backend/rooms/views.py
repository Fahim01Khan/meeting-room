from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

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
