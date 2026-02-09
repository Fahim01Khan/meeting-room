"""
Custom permissions for the accounts app.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allow access only to users with role='admin'.

    Used by analytics endpoints and other admin-only views.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "admin"
        )
