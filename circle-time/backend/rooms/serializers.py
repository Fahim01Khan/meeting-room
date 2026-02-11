from rest_framework import serializers
from rooms.models import Room, Building, FloorPlan


class RoomSerializer(serializers.ModelSerializer):
    # Contract field name is "imageUrl" (camelCase)
    imageUrl = serializers.URLField(source="image_url", allow_null=True, required=False)

    class Meta:
        model = Room
        fields = ["id", "name", "building", "floor", "capacity", "amenities", "status", "imageUrl"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(data["id"])
        return data


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name", "address", "floors"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["id"] = str(data["id"])
        return data


class FloorRoomSerializer(serializers.Serializer):
    roomId = serializers.CharField()
    x = serializers.IntegerField()
    y = serializers.IntegerField()
    width = serializers.IntegerField()
    height = serializers.IntegerField()


class FloorPlanSerializer(serializers.ModelSerializer):
    floorNumber = serializers.IntegerField(source="floor_number")
    buildingId = serializers.SerializerMethodField()
    svgData = serializers.CharField(source="svg_data")
    rooms = serializers.SerializerMethodField()

    class Meta:
        model = FloorPlan
        fields = ["floorNumber", "buildingId", "svgData", "rooms"]

    def get_buildingId(self, obj):
        return str(obj.building_id)

    def get_rooms(self, obj):
        # Return room positions on the floor plan (placeholder geometry)
        rooms = Room.objects.filter(
            building_ref=obj.building, floor=obj.floor_number
        )
        result = []
        for i, room in enumerate(rooms):
            result.append({
                "roomId": str(room.id),
                "x": 50 + (i % 4) * 200,
                "y": 50 + (i // 4) * 150,
                "width": 160,
                "height": 120,
            })
        return result
