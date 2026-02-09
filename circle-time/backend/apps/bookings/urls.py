from django.urls import path

from . import views

app_name = "bookings"

urlpatterns = [
    path("", views.CreateBookingView.as_view(), name="create-booking"),
    path("<str:booking_id>/", views.CancelBookingView.as_view(), name="cancel-booking"),
    path("<str:booking_id>/checkin", views.CheckInView.as_view(), name="checkin"),
    path("<str:booking_id>/end", views.EndBookingView.as_view(), name="end-booking"),
]
