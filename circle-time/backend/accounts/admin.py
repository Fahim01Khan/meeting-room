from django.contrib import admin
from accounts.models import User, CalendarToken


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "role", "department", "is_active")
    search_fields = ("email", "name")
    list_filter = ("role", "department")


@admin.register(CalendarToken)
class CalendarTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "calendar_id", "token_expiry", "updated_at")
    list_filter = ("provider",)
    search_fields = ("user__email", "calendar_id")
