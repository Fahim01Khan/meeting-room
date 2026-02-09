"""
Analytics serializers.

Serializers for the analytics response shapes defined in the V1 contract.
Used for documentation and future real serialization.
"""

from rest_framework import serializers


class KPISerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.CharField()  # number or string per contract
    change = serializers.FloatField(allow_null=True)
    changeType = serializers.ChoiceField(
        choices=["positive", "negative", "neutral"],
        allow_null=True,
    )
    unit = serializers.CharField(allow_null=True)


class UtilizationSerializer(serializers.Serializer):
    roomId = serializers.CharField()
    roomName = serializers.CharField()
    utilizationRate = serializers.FloatField()
    totalBookings = serializers.IntegerField()
    totalHoursBooked = serializers.FloatField()
    peakHours = serializers.ListField(child=serializers.CharField())


class GhostingSerializer(serializers.Serializer):
    roomId = serializers.CharField()
    roomName = serializers.CharField()
    ghostingRate = serializers.FloatField()
    totalNoShows = serializers.IntegerField()
    totalBookings = serializers.IntegerField()
    averageWastedMinutes = serializers.FloatField()


class CapacitySerializer(serializers.Serializer):
    roomId = serializers.CharField()
    roomName = serializers.CharField()
    roomCapacity = serializers.IntegerField()
    averageAttendees = serializers.FloatField()
    capacityUtilization = serializers.FloatField()
    oversizedBookings = serializers.IntegerField()
    undersizedBookings = serializers.IntegerField()
