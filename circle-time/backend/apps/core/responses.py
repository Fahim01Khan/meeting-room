"""
Standard API response helpers.

All API views should use these to ensure a consistent response envelope:

    Success: { "success": true,  "data": T, "message"?: string }
    Error:   { "success": false, "message": string, "code": string, "errors"?: string[] }
"""

from rest_framework import status
from rest_framework.response import Response


def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """Return a success envelope."""
    payload = {"success": True, "data": data}
    if message is not None:
        payload["message"] = message
    return Response(payload, status=status_code)


def error_response(message, code, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Return an error envelope."""
    payload = {"success": False, "message": message, "code": code}
    if errors is not None:
        payload["errors"] = errors
    return Response(payload, status=status_code)
