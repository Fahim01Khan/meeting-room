"""
Panel models — stub.

The panel app owns device registration (room ↔ device mapping) and issue
reports. These are deferred for V1 but stubbed here for future use.
"""

import uuid

from django.db import models


class DeviceRegistration(models.Model):
    """
    Maps a physical tablet device to a room.
    Used for device-token authentication on the panel.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.OneToOneField(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="device",
    )
    device_id = models.CharField(max_length=255, unique=True)
    token = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "panel_device"

    def __str__(self):
        return f"Device {self.device_id} → {self.room}"


class IssueReport(models.Model):
    """Room issue reported from a panel device."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="issue_reports",
    )
    description = models.TextField()
    reported_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        db_table = "panel_issue_report"
        ordering = ["-reported_at"]

    def __str__(self):
        return f"Issue in {self.room} — {self.reported_at}"
