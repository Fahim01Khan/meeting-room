from django.urls import path
from panel.views import (
    room_state,
    meeting_checkin,
    meeting_end_early,
    generate_pairing_code,
    pairing_status,
    pair_device,
    list_devices,
    delete_device,
)

urlpatterns = [
    # Existing panel endpoints
    path("rooms/<uuid:room_id>/state", room_state, name="panel-room-state"),
    path("meetings/<uuid:meeting_id>/checkin", meeting_checkin, name="panel-meeting-checkin"),
    path("meetings/<uuid:meeting_id>/end", meeting_end_early, name="panel-meeting-end"),
    # Pairing flow
    path("panel/pairing-codes", generate_pairing_code, name="panel-pairing-codes"),
    path("panel/pairing-status/<str:code>", pairing_status, name="panel-pairing-status"),
    path("panel/pair-device", pair_device, name="panel-pair-device"),
    path("panel/devices", list_devices, name="panel-devices"),
    path("panel/devices/<uuid:device_id>", delete_device, name="panel-delete-device"),
]
