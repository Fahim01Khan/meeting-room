from django.contrib import admin

from .models import DeviceRegistration, IssueReport


@admin.register(DeviceRegistration)
class DeviceRegistrationAdmin(admin.ModelAdmin):
    list_display = ("device_id", "room", "is_active", "registered_at")
    list_filter = ("is_active",)


@admin.register(IssueReport)
class IssueReportAdmin(admin.ModelAdmin):
    list_display = ("room", "reported_at", "resolved")
    list_filter = ("resolved",)
