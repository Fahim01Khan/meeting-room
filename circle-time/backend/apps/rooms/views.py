"""
Room views — list and detail.

Return placeholder data matching the V1 API contract.
Real filtering, search, and status derivation will be added in services.py.
"""

from rest_framework.views import APIView

from apps.core.responses import success_response

from .services import get_placeholder_room, get_placeholder_rooms


class RoomListView(APIView):
    """
    GET /api/rooms?search=&building=&floor=&min_capacity=&amenities=&status=

    Return rooms matching optional filters.
    """

    def get(self, request):
        # TODO: implement real filtering via services.filter_rooms(params)
        _filters = {
            "search": request.query_params.get("search"),
            "building": request.query_params.get("building"),
            "floor": request.query_params.get("floor"),
            "min_capacity": request.query_params.get("min_capacity"),
            "amenities": request.query_params.get("amenities"),
            "status": request.query_params.get("status"),
        }
        rooms = get_placeholder_rooms()
        return success_response(data=rooms)


class RoomDetailView(APIView):
    """
    GET /api/rooms/{roomId}

    Return a single room's details.
    """

    def get(self, request, room_id):
        # TODO: look up real room from DB; return 404 if not found
        room = get_placeholder_room(room_id)
        return success_response(data=room)
