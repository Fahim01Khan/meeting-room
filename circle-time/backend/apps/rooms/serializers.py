from rest_framework import serializers

from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """
    Serialize a Room for API responses.

    Contract shape:
        { id, name, building, floor, capacity, amenities, status, imageUrl }
    """

    id = serializers.CharField()
    imageUrl = serializers.URLField(source="image_url", allow_null=True)

    class Meta:
        model = Room
        fields = ["id", "name", "building", "floor", "capacity", "amenities", "status", "imageUrl"]
        read_only_fields = fields
