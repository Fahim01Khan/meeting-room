"""
Booking views — CRUD, check-in, and end-early.

Thin wrappers around services.py. Return placeholder data matching the
V1 API contract shapes.
"""

from rest_framework import status
from rest_framework.views import APIView

from apps.core.responses import error_response, success_response

from .serializers import CreateBookingSerializer
from .services import (
    get_placeholder_booking,
    get_placeholder_room_bookings,
)


class RoomBookingsView(APIView):
    """
    GET /api/rooms/{roomId}/bookings?date=YYYY-MM-DD

    Return all bookings for a specific room on a given date.
    """

    def get(self, request, room_id):
        date = request.query_params.get("date")
        if not date:
            return error_response(
                message="'date' query parameter is required",
                code="validation_error",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # TODO: validate date format; look up real room; return 404 if missing
        bookings = get_placeholder_room_bookings(room_id, date)
        return success_response(data=bookings)


class CreateBookingView(APIView):
    """
    POST /api/bookings

    Reserve a room for a time slot.
    """

    def post(self, request):
        serializer = CreateBookingSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Missing or invalid fields",
                code="validation_error",
                errors=[str(v[0]) for v in serializer.errors.values()],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        # TODO: call services.create_booking() with conflict detection
        booking = get_placeholder_booking(
            room_id=serializer.validated_data["roomId"],
            title=serializer.validated_data["title"],
            description=serializer.validated_data.get("description"),
            start_time=serializer.validated_data["startTime"],
            end_time=serializer.validated_data["endTime"],
            organizer=request.user,
        )
        return success_response(data=booking, status_code=status.HTTP_201_CREATED)


class CancelBookingView(APIView):
    """
    DELETE /api/bookings/{bookingId}

    Cancel an existing booking.
    """

    def delete(self, request, booking_id):
        # TODO: verify booking exists (404), user owns it or is admin (403),
        #       booking isn't already cancelled/completed (409)
        # TODO: call services.cancel_booking(booking_id, request.user)
        return success_response(data={"cancelled": True})


class CheckInView(APIView):
    """
    POST /api/bookings/{bookingId}/checkin

    Record that someone has arrived for the meeting.
    """

    def post(self, request, booking_id):
        # TODO: verify booking exists, is confirmed, check-in window open
        # TODO: call services.checkin_booking(booking_id)
        return success_response(
            data={
                "checkedIn": True,
                "checkedInAt": "2026-02-09T09:01:00Z",
            }
        )


class EndBookingView(APIView):
    """
    POST /api/bookings/{bookingId}/end

    Terminate an active meeting before its scheduled end, freeing the room.
    """

    def post(self, request, booking_id):
        # TODO: verify booking is currently active (checked in, not ended)
        # TODO: call services.end_booking_early(booking_id)
        # TODO: trigger room-state push when Channels/Celery is introduced
        return success_response(
            data={
                "ended": True,
                "freedMinutes": 25,
            }
        )
