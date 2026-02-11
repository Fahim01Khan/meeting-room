from django.contrib import admin
from panel.models import DeviceRegistration, IssueReport


@admin.register(DeviceRegistration)
class DeviceRegistrationAdmin(admin.ModelAdmin):
    list_display = ("device_serial", "room", "registered_at", "is_active")
    list_filter = ("is_active",)
    search_fields = ("device_serial", "room__name")


@admin.register(IssueReport)
class IssueReportAdmin(admin.ModelAdmin):
    list_display = ("room", "description", "reported_at", "resolved")
    list_filter = ("resolved",)
