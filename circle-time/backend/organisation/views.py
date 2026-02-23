import re
from datetime import time as dt_time

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import OrganisationSettings


# ── Helpers ───────────────────────────────────────────────────────────────────

def _time_to_str(t) -> str:
    """Convert a datetime.time (or string) to 'HH:MM' format."""
    if isinstance(t, str):
        return t[:5]
    return t.strftime("%H:%M")


def _settings_to_dict(obj: OrganisationSettings) -> dict:
    return {
        "orgName": obj.org_name,
        "primaryColour": obj.primary_colour,
        "logoUrl": obj.logo_url,
        "checkinWindowMinutes": obj.checkin_window_minutes,
        "autoReleaseMinutes": obj.auto_release_minutes,
        "businessDays": obj.business_days if obj.business_days else [0, 1, 2, 3, 4],
        "businessStart": _time_to_str(obj.business_start),
        "businessEnd": _time_to_str(obj.business_end),
        "timezone": obj.timezone,
        "updatedAt": obj.updated_at.isoformat() if obj.updated_at else None,
    }


# ── GET /api/organisation/settings ───────────────────────────────────────────

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def organisation_settings(request):
    if request.method == "GET":
        return _get_settings(request)
    return _update_settings(request)


def _get_settings(request):
    obj = OrganisationSettings.get()
    return Response({"success": True, "data": _settings_to_dict(obj)})


# ── PUT /api/organisation/settings ───────────────────────────────────────────

def _update_settings(request):
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    data = request.data
    obj = OrganisationSettings.get()
    errors = {}

    # ── Validate and apply each field ────────────────────────────────────────

    if "orgName" in data:
        val = str(data["orgName"]).strip()
        if not val:
            errors["orgName"] = "Organisation name cannot be empty."
        else:
            obj.org_name = val

    if "primaryColour" in data:
        val = str(data["primaryColour"]).strip()
        if not re.match(r"^#[0-9A-Fa-f]{6}$", val):
            errors["primaryColour"] = "Must be a valid hex colour, e.g. #1E8ACC."
        else:
            obj.primary_colour = val

    if "logoUrl" in data:
        val = data["logoUrl"]
        obj.logo_url = val if val else None

    if "checkinWindowMinutes" in data:
        try:
            val = int(data["checkinWindowMinutes"])
        except (TypeError, ValueError):
            errors["checkinWindowMinutes"] = "Must be an integer."
        else:
            if not (5 <= val <= 60):
                errors["checkinWindowMinutes"] = "Must be between 5 and 60 minutes."
            else:
                obj.checkin_window_minutes = val

    if "autoReleaseMinutes" in data:
        try:
            val = int(data["autoReleaseMinutes"])
        except (TypeError, ValueError):
            errors["autoReleaseMinutes"] = "Must be an integer."
        else:
            if not (5 <= val <= 60):
                errors["autoReleaseMinutes"] = "Must be between 5 and 60 minutes."
            else:
                obj.auto_release_minutes = val

    if "businessDays" in data:
        val = data["businessDays"]
        if not isinstance(val, list) or not all(isinstance(d, int) and 0 <= d <= 6 for d in val):
            errors["businessDays"] = "Must be a list of integers 0–6."
        else:
            obj.business_days = val

    start_str = data.get("businessStart", _time_to_str(obj.business_start))
    end_str = data.get("businessEnd", _time_to_str(obj.business_end))

    if "businessStart" in data or "businessEnd" in data:
        try:
            def _parse_time(s):
                parts = str(s).split(":")
                return dt_time(int(parts[0]), int(parts[1]))

            parsed_start = _parse_time(start_str)
            parsed_end = _parse_time(end_str)
        except (ValueError, IndexError):
            errors["businessHours"] = "Invalid time format — use HH:MM."
        else:
            if parsed_start >= parsed_end:
                errors["businessHours"] = "Business start time must be before end time."
            else:
                if "businessStart" in data:
                    obj.business_start = parsed_start
                if "businessEnd" in data:
                    obj.business_end = parsed_end

    if "timezone" in data:
        obj.timezone = str(data["timezone"]).strip()

    if errors:
        return Response(
            {"success": False, "message": "Validation failed", "errors": errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    obj.updated_by = request.user
    obj.save()

    return Response({"success": True, "data": _settings_to_dict(obj)})
