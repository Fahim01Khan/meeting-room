from django.urls import path
from bookings.views import (
    room_bookings,
    create_booking,
    create_recurring_booking,
    extend_booking,
    booking_detail,
    checkin_booking,
    end_booking,
)

urlpatterns = [
    path("rooms/<uuid:room_id>/bookings", room_bookings, name="room-bookings"),
    path("bookings", create_booking, name="bookings-create"),
    path("bookings/recurring", create_recurring_booking, name="bookings-create-recurring"),
    # PUT + DELETE on the same path, dispatched by HTTP method
    path("bookings/<uuid:booking_id>", booking_detail, name="bookings-detail"),
    path("bookings/<uuid:booking_id>/checkin", checkin_booking, name="bookings-checkin"),
    path("bookings/<uuid:booking_id>/end", end_booking, name="bookings-end"),
    path("bookings/<uuid:booking_id>/extend", extend_booking, name="bookings-extend"),
    # Mobile/kiosk aliases — same views, /meetings/ prefix
    path("meetings/<uuid:booking_id>/checkin", checkin_booking, name="meetings-checkin"),
    path("meetings/<uuid:booking_id>/end", end_booking, name="meetings-end"),
]