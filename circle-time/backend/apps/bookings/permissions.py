"""
Booking permissions.

No custom permissions beyond IsAuthenticated for V1.
Organizer-or-admin enforcement for cancellation will be added here.
"""

from rest_framework.permissions import BasePermission


class IsOrganizerOrAdmin(BasePermission):
    """
    Allow access only if the user is the booking organizer or an admin.

    Used by cancel-booking endpoint.
    """

    def has_object_permission(self, request, view, obj):
        # TODO: implement when real booking objects are used
        if getattr(request.user, "role", None) == "admin":
            return True
        return getattr(obj, "organizer_id", None) == request.user.id
