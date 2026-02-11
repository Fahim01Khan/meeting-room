from django.contrib import admin
from rooms.models import Room, Building, FloorPlan


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "building", "floor", "capacity", "status")
    search_fields = ("name", "building")
    list_filter = ("building", "floor", "status")


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ("name", "address", "floors")
    search_fields = ("name",)


@admin.register(FloorPlan)
class FloorPlanAdmin(admin.ModelAdmin):
    list_display = ("building", "floor_number")
    list_filter = ("building",)
