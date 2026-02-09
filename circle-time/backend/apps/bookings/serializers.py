from rest_framework import serializers


class CreateBookingSerializer(serializers.Serializer):
    """
    Validate the create-booking request body.

    Contract fields:
        roomId (required), title (required), description (optional),
        startTime (required), endTime (required), attendeeIds (optional)
    """

    roomId = serializers.CharField(required=True)
    title = serializers.CharField(required=True, max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    startTime = serializers.DateTimeField(required=True)
    endTime = serializers.DateTimeField(required=True)
    attendeeIds = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )

    def validate(self, attrs):
        if attrs["endTime"] <= attrs["startTime"]:
            raise serializers.ValidationError("endTime must be after startTime")
        return attrs


class BookingResponseSerializer(serializers.Serializer):
    """
    Read-only serializer matching the V1 booking response shape.

    Used for documentation / future real serialization — not called in
    placeholder views.
    """

    id = serializers.CharField()
    roomId = serializers.CharField()
    roomName = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_null=True)
    organizer = serializers.DictField()
    attendees = serializers.ListField(child=serializers.DictField())
    startTime = serializers.DateTimeField()
    endTime = serializers.DateTimeField()
    status = serializers.CharField()
    checkedIn = serializers.BooleanField()
    checkedInAt = serializers.DateTimeField(allow_null=True)
