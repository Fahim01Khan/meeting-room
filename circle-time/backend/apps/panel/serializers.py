"""
Panel serializers.

Serializers for the composite room-state and panel action responses.
Used for validation / documentation; placeholder views currently return dicts.
"""

from rest_framework import serializers


class MeetingSerializer(serializers.Serializer):
    """Meeting shape within the composite room-state payload."""

    id = serializers.CharField()
    title = serializers.CharField()
    organizer = serializers.CharField()
    organizerEmail = serializers.EmailField()
    startTime = serializers.DateTimeField()
    endTime = serializers.DateTimeField()
    attendeeCount = serializers.IntegerField()
    checkedIn = serializers.BooleanField()
    checkedInAt = serializers.DateTimeField(allow_null=True)


class RoomInfoSerializer(serializers.Serializer):
    """Room info within the composite room-state payload."""

    id = serializers.CharField()
    name = serializers.CharField()
    building = serializers.CharField()
    floor = serializers.IntegerField()
    capacity = serializers.IntegerField()


class RoomStateSerializer(serializers.Serializer):
    """Full composite room-state payload for the mobile panel."""

    room = RoomInfoSerializer()
    status = serializers.ChoiceField(choices=["available", "occupied", "upcoming", "offline"])
    currentMeeting = MeetingSerializer(allow_null=True)
    nextMeeting = MeetingSerializer(allow_null=True)
    upcomingMeetings = MeetingSerializer(many=True)
    lastUpdated = serializers.DateTimeField()
