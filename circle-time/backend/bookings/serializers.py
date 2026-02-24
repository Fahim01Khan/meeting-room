from rest_framework import serializers
from bookings.models import Booking, BookingAttendee
from bookings.constants import BookingStatus
from accounts.serializers import UserSerializer


class AttendeeSerializer(serializers.ModelSerializer):
    """Serializes attendee → User object for web frontend."""

    id = serializers.SerializerMethodField()
    name = serializers.CharField(source="user.name")
    email = serializers.CharField(source="user.email")
    department = serializers.CharField(source="user.department", allow_null=True)

    class Meta:
        model = BookingAttendee
        fields = ["id", "name", "email", "department"]

    def get_id(self, obj):
        return str(obj.user_id)


class BookingSerializer(serializers.ModelSerializer):
    """
    Web-facing booking serializer.
    Contract: organizer = User object, attendees = User[]
    
    Uses BookingStatus enum for type safety.
    """
    roomId = serializers.SerializerMethodField()
    roomName = serializers.CharField(source="room.name", read_only=True)
    organizer = UserSerializer(read_only=True)
    attendees = serializers.SerializerMethodField()
    startTime = serializers.DateTimeField(source="start_time")
    endTime = serializers.DateTimeField(source="end_time")
    checkedIn = serializers.BooleanField(source="checked_in", read_only=True)
    checkedInAt = serializers.DateTimeField(source="checked_in_at", read_only=True, allow_null=True)
    isRecurring = serializers.BooleanField(source="is_recurring", required=False, default=False)
    recurrenceType = serializers.CharField(source="recurrence_type", required=False, default="none")

    class Meta:
        model = Booking
        fields = [
            "id", "roomId", "roomName", "title", "description",
            "organizer", "attendees", "startTime", "endTime",
            "status", "checkedIn", "checkedInAt",
            "isRecurring", "recurrenceType",
        ]

    def get_roomId(self, obj):
        return str(obj.room_id)

    def get_attendees(self, obj):
        attendees = obj.booking_attendees.select_related("user").all()
        return [
            {
                "id": str(a.user_id),
                "name": a.user.name,
                "email": a.user.email,
                "department": a.user.department,
            }
            for a in attendees
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(data["id"])
        return data


class BookingCreateSerializer(serializers.Serializer):
    """
    Validates the BookingRequest shape from the web frontend:
    { roomId, title, description?, startTime, endTime, attendeeIds[] }
    """
    roomId = serializers.UUIDField()
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    startTime = serializers.DateTimeField()
    endTime = serializers.DateTimeField()
    attendeeIds = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list
    )
    attendeeCount = serializers.IntegerField(required=False, default=1, min_value=1, max_value=50)


class BookingUpdateSerializer(serializers.Serializer):
    """Partial update of a booking."""
    title = serializers.CharField(max_length=500, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    startTime = serializers.DateTimeField(required=False)
    endTime = serializers.DateTimeField(required=False)
    attendeeIds = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )


class RecurringBookingCreateSerializer(serializers.Serializer):
    """
    Validates recurring booking creation request.
    
    Creates a parent booking and multiple child occurrences based on
    recurrence pattern. The parent booking represents the first occurrence
    and stores the recurrence pattern for future reference.
    
    Example request:
    {
        "roomId": "uuid",
        "title": "Weekly Team Standup",
        "description": "Every Monday and Wednesday",
        "startTime": "2026-02-17T09:00:00Z",
        "endTime": "2026-02-17T09:30:00Z",
        "attendeeIds": ["uuid1", "uuid2"],
        "recurrenceType": "weekly",
        "recurrenceEndDate": "2026-12-31",
        "recurrencePattern": {"days": [0, 2], "interval": 1}
    }
    """
    roomId = serializers.UUIDField()
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    startTime = serializers.DateTimeField()
    endTime = serializers.DateTimeField()
    attendeeIds = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=list
    )
    recurrenceType = serializers.ChoiceField(
        choices=["daily", "weekly", "monthly"],
        help_text="Type of recurrence: daily, weekly, or monthly"
    )
    recurrenceEndDate = serializers.DateField(
        help_text="Last date for recurring occurrences (inclusive)"
    )
    recurrencePattern = serializers.JSONField(
        help_text="Pattern details: {'days': [0,2,4], 'interval': 1} for weekly"
    )


class BookingExtensionSerializer(serializers.Serializer):
    """
    Validates booking extension request.
    
    Allows extending a checked-in booking by 15-120 minutes.
    Maximum 4 extensions per booking (configurable via BookingDefaults).
    
    Example request:
    {
        "extensionMinutes": 15
    }
    """
    extensionMinutes = serializers.IntegerField(
        min_value=15,
        max_value=120,
        help_text="Minutes to extend (15-120)"
    )
    
    def validate_extensionMinutes(self, value):
        """Ensure extension is in 15-minute increments."""
        from bookings.constants import BookingDefaults
        increment = BookingDefaults.EXTENSION_INCREMENT_MINUTES.value
        
        if value % increment != 0:
            raise serializers.ValidationError(
                f"Extension must be in {increment}-minute increments"
            )
        return value
