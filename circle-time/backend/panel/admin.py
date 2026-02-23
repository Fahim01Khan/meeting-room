from django.contrib import admin
from panel.models import DeviceRegistration, IssueReport, PairingCode


@admin.register(PairingCode)
class PairingCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "device_serial", "status", "room", "created_at", "expires_at", "paired_at")
    list_filter = ("status",)
    search_fields = ("code", "device_serial")
    readonly_fields = ("created_at", "expires_at", "paired_at")


@admin.register(DeviceRegistration)
class DeviceRegistrationAdmin(admin.ModelAdmin):
    list_display = ("device_serial", "room", "registered_at", "is_active")
    list_filter = ("is_active",)
    search_fields = ("device_serial", "room__name")


@admin.register(IssueReport)
class IssueReportAdmin(admin.ModelAdmin):
    list_display = ("room", "description", "reported_at", "resolved")
    list_filter = ("resolved",)
