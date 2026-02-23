from django.contrib import admin
from .models import OrganisationSettings


@admin.register(OrganisationSettings)
class OrganisationSettingsAdmin(admin.ModelAdmin):
    list_display = ["org_name", "primary_colour", "timezone", "updated_at"]
    fieldsets = [
        ("Branding", {"fields": ["org_name", "primary_colour", "logo_url"]}),
        ("Check-in", {"fields": ["checkin_window_minutes", "auto_release_minutes"]}),
        ("Business Hours", {"fields": ["business_days", "business_start", "business_end", "timezone"]}),
        ("Metadata", {"fields": ["updated_by", "updated_at"], "classes": ["collapse"]}),
    ]
    readonly_fields = ["updated_at"]

    def has_add_permission(self, request):
        """Singleton — prevent adding more than one row via admin."""
        return not OrganisationSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
