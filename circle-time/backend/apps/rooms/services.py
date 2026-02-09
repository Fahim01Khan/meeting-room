"""
Room service layer.

Business logic for room querying, status derivation, and filtering.
Views call services; services talk to models.

When Celery is introduced, room-status cache invalidation will be dispatched
as background tasks from this layer.
"""


def get_placeholder_rooms() -> list[dict]:
    """Return placeholder room data matching the V1 contract shape."""
    # TODO: replace with real queryset + serializer when models are populated
    return [
        {
            "id": "room-001",
            "name": "Maple Room",
            "building": "HQ",
            "floor": 1,
            "capacity": 10,
            "amenities": ["projector", "whiteboard", "video_conference"],
            "status": "available",
            "imageUrl": None,
        },
        {
            "id": "room-002",
            "name": "Oak Room",
            "building": "HQ",
            "floor": 2,
            "capacity": 6,
            "amenities": ["tv_display", "phone"],
            "status": "occupied",
            "imageUrl": None,
        },
    ]


def get_placeholder_room(room_id: str) -> dict:
    """Return placeholder single-room data matching the V1 contract shape."""
    # TODO: replace with Room.objects.get(id=room_id) + serializer
    return {
        "id": room_id,
        "name": "Maple Room",
        "building": "HQ",
        "floor": 1,
        "capacity": 10,
        "amenities": ["projector", "whiteboard", "video_conference"],
        "status": "available",
        "imageUrl": None,
    }


# TODO: implement filter_rooms(search, building, floor, min_capacity, amenities, status)
# TODO: implement derive_room_status(room_id) — compute from current bookings
# TODO: move status derivation to async task when Celery is introduced
