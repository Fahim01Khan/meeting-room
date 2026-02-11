import uuid
from django.db import models
from django.conf import settings


class DeviceRegistration(models.Model):
    """Maps a physical SUNMI device to a room."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey("rooms.Room", on_delete=models.CASCADE, related_name="devices")
    device_serial = models.CharField(max_length=255, unique=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Device {self.device_serial} → {self.room.name}"


class IssueReport(models.Model):
    """Issue reported from a panel device."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey("rooms.Room", on_delete=models.CASCADE, related_name="issues")
    description = models.TextField()
    reported_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Issue in {self.room.name}: {self.description[:50]}"
