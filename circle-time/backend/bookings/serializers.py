from rest_framework import serializers
from bookings.models import Booking, BookingAttendee
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
    """
    roomId = serializers.SerializerMethodField()
    roomName = serializers.CharField(source="room.name", read_only=True)
    organizer = UserSerializer(read_only=True)
    attendees = serializers.SerializerMethodField()
    startTime = serializers.DateTimeField(source="start_time")
    endTime = serializers.DateTimeField(source="end_time")
    checkedIn = serializers.BooleanField(source="checked_in", read_only=True)
    checkedInAt = serializers.DateTimeField(source="checked_in_at", read_only=True, allow_null=True)

    class Meta:
        model = Booking
        fields = [
            "id", "roomId", "roomName", "title", "description",
            "organizer", "attendees", "startTime", "endTime",
            "status", "checkedIn", "checkedInAt",
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


class BookingUpdateSerializer(serializers.Serializer):
    """Partial update of a booking."""
    title = serializers.CharField(max_length=500, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    startTime = serializers.DateTimeField(required=False)
    endTime = serializers.DateTimeField(required=False)
    attendeeIds = serializers.ListField(
        child=serializers.UUIDField(), required=False
    )
