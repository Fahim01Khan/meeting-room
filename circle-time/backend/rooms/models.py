import uuid
from django.db import models


class Building(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    address = models.CharField(max_length=500, blank=True, default="")
    floors = models.IntegerField(default=1)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class FloorPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="floor_plans")
    floor_number = models.IntegerField()
    svg_data = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("building", "floor_number")
        ordering = ["building", "floor_number"]

    def __str__(self):
        return f"{self.building.name} – Floor {self.floor_number}"


class Room(models.Model):
    STATUS_CHOICES = [
        ("available", "Available"),
        ("occupied", "Occupied"),
        ("reserved", "Reserved"),
        ("maintenance", "Maintenance"),
    ]

    AMENITY_CHOICES = [
        ("projector", "Projector"),
        ("whiteboard", "Whiteboard"),
        ("video_conference", "Video Conference"),
        ("phone", "Phone"),
        ("tv_display", "TV Display"),
        ("air_conditioning", "Air Conditioning"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    building = models.CharField(max_length=255)
    floor = models.IntegerField()
    capacity = models.IntegerField()
    amenities = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")
    image_url = models.URLField(max_length=500, null=True, blank=True)

    # Optional FK to Building for floor-plan lookups
    building_ref = models.ForeignKey(
        Building, on_delete=models.SET_NULL, null=True, blank=True, related_name="rooms"
    )

    class Meta:
        ordering = ["building", "floor", "name"]

    def __str__(self):
        return f"{self.name} ({self.building}, Floor {self.floor})"
