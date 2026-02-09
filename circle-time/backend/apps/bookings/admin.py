from django.contrib import admin

from .models import Booking, BookingAttendee


class AttendeeInline(admin.TabularInline):
    model = BookingAttendee
    extra = 0


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("title", "room", "organizer", "start_time", "end_time", "status", "checked_in")
    list_filter = ("status", "checked_in")
    search_fields = ("title", "room__name", "organizer__email")
    inlines = [AttendeeInline]
