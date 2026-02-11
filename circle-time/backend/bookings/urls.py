from django.urls import path
from bookings.views import (
    room_bookings,
    create_booking,
    booking_detail,
    checkin_booking,
    end_booking,
)

urlpatterns = [
    path("rooms/<uuid:room_id>/bookings", room_bookings, name="room-bookings"),
    path("bookings", create_booking, name="bookings-create"),
    # PUT + DELETE on the same path, dispatched by HTTP method
    path("bookings/<uuid:booking_id>", booking_detail, name="bookings-detail"),
    path("bookings/<uuid:booking_id>/checkin", checkin_booking, name="bookings-checkin"),
    path("bookings/<uuid:booking_id>/end", end_booking, name="bookings-end"),
]