from django.urls import path

from . import views

app_name = "rooms"

urlpatterns = [
    path("", views.RoomListView.as_view(), name="room-list"),
    path("<str:room_id>/", views.RoomDetailView.as_view(), name="room-detail"),
]
