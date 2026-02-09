"""
Booking models — stub.

Minimal model definition for the booking lifecycle. Fields match the V1 API
contract. Conflict detection, check-in window enforcement, and auto-release
will be implemented in services.py (and eventually as Celery tasks).
"""

import uuid

from django.conf import settings
from django.db import models


class Booking(models.Model):
    """A room reservation for a specific time slot."""

    class Status(models.TextChoices):
        CONFIRMED = "confirmed", "Confirmed"
        PENDING = "pending", "Pending"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"
        NO_SHOW = "no_show", "No Show"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="bookings",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_bookings",
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIRMED,
    )
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings_booking"
        ordering = ["start_time"]

    def __str__(self):
        return f"{self.title} ({self.start_time} – {self.end_time})"


class BookingAttendee(models.Model):
    """
    Many-to-many link between bookings and attending users.
    Explicit through table for future metadata (RSVP status, etc.).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name="attendee_links",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attended_bookings",
    )

    class Meta:
        db_table = "bookings_attendee"
        unique_together = [("booking", "user")]

    def __str__(self):
        return f"{self.user} → {self.booking}"
