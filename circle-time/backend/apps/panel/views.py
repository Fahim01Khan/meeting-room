"""
Panel views — composite room state and panel-specific actions.

The panel app serves the mobile tablet UI. It aggregates data from
rooms and bookings into a single composite payload.
"""

from rest_framework.views import APIView

from apps.core.responses import success_response

from .services import get_placeholder_room_state


class RoomStateView(APIView):
    """
    GET /api/panel/rooms/{roomId}/state

    Return full composite state for a single room (used by mobile panel).
    Aggregates room info, current meeting, next meeting, and upcoming list.
    """

    def get(self, request, room_id):
        # TODO: verify room exists; return 404 if not found
        # TODO: call services.get_room_state(room_id) with real data
        state = get_placeholder_room_state(room_id)
        return success_response(data=state)


class PanelCheckInView(APIView):
    """
    POST /api/panel/meetings/{meetingId}/checkin

    Check in to the current meeting from the in-room tablet.
    Delegates to the bookings service layer internally.
    """

    def post(self, request, meeting_id):
        # TODO: delegate to bookings.services.checkin_booking(meeting_id)
        # TODO: trigger room-state push via WebSocket when Channels is added
        return success_response(message="Checked in successfully")


class PanelEndMeetingView(APIView):
    """
    POST /api/panel/meetings/{meetingId}/end

    End the current meeting early from the in-room tablet.
    Delegates to the bookings service layer internally.
    """

    def post(self, request, meeting_id):
        # TODO: delegate to bookings.services.end_booking_early(meeting_id)
        # TODO: trigger room-state push via WebSocket when Channels is added
        return success_response(
            data={"freedMinutes": 25},
            message="Meeting ended",
        )
