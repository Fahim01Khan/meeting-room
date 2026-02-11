from django.urls import path
from panel.views import room_state, meeting_checkin, meeting_end_early

urlpatterns = [
    path("rooms/<uuid:room_id>/state", room_state, name="panel-room-state"),
    path("meetings/<uuid:meeting_id>/checkin", meeting_checkin, name="panel-meeting-checkin"),
    path("meetings/<uuid:meeting_id>/end", meeting_end_early, name="panel-meeting-end"),
]
