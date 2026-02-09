from django.contrib import admin

from .models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "building", "floor", "capacity", "status")
    list_filter = ("building", "floor", "status")
    search_fields = ("name", "building")
