from django.contrib import admin
from accounts.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "role", "department", "is_active")
    search_fields = ("email", "name")
    list_filter = ("role", "department")
