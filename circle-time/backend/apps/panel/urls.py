from django.urls import path

from . import views

app_name = "panel"

urlpatterns = [
    # Composite room state
    path(
        "rooms/<str:room_id>/state",
        views.RoomStateView.as_view(),
        name="room-state",
    ),
    # Panel-specific actions
    path(
        "meetings/<str:meeting_id>/checkin",
        views.PanelCheckInView.as_view(),
        name="panel-checkin",
    ),
    path(
        "meetings/<str:meeting_id>/end",
        views.PanelEndMeetingView.as_view(),
        name="panel-end-meeting",
    ),
]

# NOTE: WebSocket path is not registered here.
# When Django Channels is introduced, the WS route will be:
#     ws://host/api/panel/rooms/{roomId}/ws
# Configured in config/asgi.py via Channels' URLRouter.
