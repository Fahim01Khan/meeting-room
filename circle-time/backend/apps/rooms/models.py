"""
Room models — stub.

These are minimal model definitions needed so Django can create migration
files and the admin can register them. Fields match the V1 API contract
response shapes. Flesh out with constraints, indexes, and managers when
implementing real business logic.
"""

import uuid

from django.db import models


class Room(models.Model):
    """A bookable meeting room."""

    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        OCCUPIED = "occupied", "Occupied"
        RESERVED = "reserved", "Reserved"
        MAINTENANCE = "maintenance", "Maintenance"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    building = models.CharField(max_length=255)
    floor = models.IntegerField()
    capacity = models.IntegerField()
    amenities = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    image_url = models.URLField(blank=True, null=True)

    class Meta:
        db_table = "rooms_room"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.building}, Floor {self.floor})"
