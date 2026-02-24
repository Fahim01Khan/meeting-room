import uuid
from django.db import models
from django.conf import settings
from bookings.constants import BookingStatus, RecurrenceType


class Booking(models.Model):
    """
    Booking model representing a room reservation.
    
    Supports both single and recurring bookings. For recurring bookings:
    - The first occurrence is the parent (parent_booking=None, is_recurring=True)
    - Subsequent occurrences are children (parent_booking=parent, is_recurring=True)
    
    Status Flow:
        pending → confirmed → checked_in → completed
                          ↓
                      cancelled / no_show
    
    Attributes:
        id: UUID primary key
        room: The room being booked
        title: Meeting title/subject
        description: Optional meeting description
        organizer: User who created the booking
        start_time: When the meeting starts
        end_time: When the meeting ends
        status: Current booking status (confirmed, checked_in, etc.)
        checked_in: Whether organizer has checked in
        checked_in_at: Timestamp of check-in
        is_recurring: Whether this booking is part of a recurring series
        recurrence_type: Pattern type (daily, weekly, monthly, custom)
        recurrence_end_date: Last date in the recurring series
        parent_booking: For child bookings, reference to the first occurrence
        recurrence_pattern: JSON with pattern details (e.g., {"days": [0,2,4]})
        created_at: Record creation timestamp
        updated_at: Record last update timestamp
    """
    
    # Use enum values for choices
    STATUS_CHOICES = [(status.value, status.name.replace('_', ' ').title()) 
                      for status in BookingStatus]
    
    RECURRENCE_CHOICES = [(recur.value, recur.name.title()) 
                          for recur in RecurrenceType]

    # Core booking fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey("rooms.Room", on_delete=models.CASCADE, related_name="bookings")
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default="")
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="organized_bookings"
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default=BookingStatus.CONFIRMED.value
    )
    
    # Check-in tracking
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    
    # Attendee headcount (simple integer — separate from BookingAttendee through table)
    attendee_count = models.IntegerField(default=1, help_text="Number of expected attendees")
    
    # Recurring booking fields
    is_recurring = models.BooleanField(
        default=False,
        help_text="Whether this booking is part of a recurring series"
    )
    recurrence_type = models.CharField(
        max_length=20,
        choices=RECURRENCE_CHOICES,
        default=RecurrenceType.NONE.value,
        help_text="Type of recurrence pattern (daily, weekly, monthly)"
    )
    recurrence_end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Last date in the recurring series"
    )
    parent_booking = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="recurring_instances",
        help_text="For child bookings, reference to the parent booking"
    )
    recurrence_pattern = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON pattern details (e.g., {'days': [0,2,4], 'interval': 1})"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]
        indexes = [
            models.Index(fields=["room", "start_time"]),
            models.Index(fields=["status", "start_time"]),
            models.Index(fields=["parent_booking"]),
        ]

    def __str__(self):
        recurring_prefix = "↻ " if self.is_recurring else ""
        return f"{recurring_prefix}{self.title} ({self.room.name}, {self.start_time:%Y-%m-%d %H:%M})"
    
    def is_parent_booking(self) -> bool:
        """Check if this is a parent booking (first in recurring series)."""
        return self.is_recurring and self.parent_booking is None
    
    def get_series_count(self) -> int:
        """Get the total number of bookings in this recurring series."""
        if self.is_parent_booking():
            return 1 + self.recurring_instances.count()
        elif self.parent_booking:
            return 1 + self.parent_booking.recurring_instances.count()
        return 1


class BookingAttendee(models.Model):
    """
    Many-to-many through table for booking attendees.
    
    Links users to bookings to track who is invited/attending meetings.
    Each booking can have multiple attendees, and each user can attend
    multiple bookings.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="booking_attendees")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attended_bookings"
    )

    class Meta:
        unique_together = ("booking", "user")
        indexes = [
            models.Index(fields=["booking"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.name} → {self.booking.title}"


class BookingExtension(models.Model):
    """
    Tracks booking time extensions.
    
    When a meeting runs longer than scheduled, users can extend the booking
    in increments (typically 15 minutes). This model logs each extension
    for audit and analytics purposes.
    
    Attributes:
        id: UUID primary key
        booking: The booking being extended
        extended_by: User who requested the extension
        extension_minutes: Number of minutes added to the booking
        extended_at: Timestamp when extension was granted
    
    Example:
        A 1-hour meeting (2:00-3:00 PM) extended twice by 15 minutes
        would have two BookingExtension records, and end_time becomes 3:30 PM.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, 
        on_delete=models.CASCADE, 
        related_name="extensions",
        help_text="The booking being extended"
    )
    extended_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name="booking_extensions",
        help_text="User who requested the extension"
    )
    extension_minutes = models.IntegerField(
        help_text="Number of minutes added to the booking"
    )
    extended_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when extension was granted"
    )
    
    class Meta:
        ordering = ["-extended_at"]
        indexes = [
            models.Index(fields=["booking", "-extended_at"]),
        ]

    def __str__(self):
        return f"{self.booking.title} extended by {self.extension_minutes} min"
