"""
Analytics views — KPI, utilization, ghosting, capacity.

All analytics endpoints require admin role. They accept a date range
and return placeholder data matching the V1 API contract. Real computation
will live in services.py.
"""

from rest_framework import status
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.core.responses import error_response, success_response

from .services import (
    get_placeholder_capacity_data,
    get_placeholder_ghosting_data,
    get_placeholder_kpi_data,
    get_placeholder_utilization_data,
)


def _validate_date_range(request):
    """Extract and validate start_date / end_date from query params."""
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")
    if not start_date or not end_date:
        return None, None, error_response(
            message="start_date and end_date query parameters are required",
            code="validation_error",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    return start_date, end_date, None


class KPIView(APIView):
    """
    GET /api/analytics/kpi?start_date=&end_date=

    Return high-level KPIs for the admin dashboard.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        start_date, end_date, err = _validate_date_range(request)
        if err:
            return err

        # TODO: call services.compute_kpi(start_date, end_date)
        data = get_placeholder_kpi_data(start_date, end_date)
        return success_response(data=data)


class UtilizationView(APIView):
    """
    GET /api/analytics/utilization?start_date=&end_date=&building=

    Return per-room utilization metrics for a date range.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        start_date, end_date, err = _validate_date_range(request)
        if err:
            return err

        _building = request.query_params.get("building")

        # TODO: call services.compute_utilization(start_date, end_date, building)
        data = get_placeholder_utilization_data(start_date, end_date)
        return success_response(data=data)


class GhostingView(APIView):
    """
    GET /api/analytics/ghosting?start_date=&end_date=

    Return per-room ghosting (no-show) metrics for a date range.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        start_date, end_date, err = _validate_date_range(request)
        if err:
            return err

        # TODO: call services.compute_ghosting(start_date, end_date)
        data = get_placeholder_ghosting_data(start_date, end_date)
        return success_response(data=data)


class CapacityView(APIView):
    """
    GET /api/analytics/capacity?start_date=&end_date=

    Return per-room capacity efficiency metrics for a date range.
    """

    permission_classes = [IsAdmin]

    def get(self, request):
        start_date, end_date, err = _validate_date_range(request)
        if err:
            return err

        # TODO: call services.compute_capacity(start_date, end_date)
        data = get_placeholder_capacity_data(start_date, end_date)
        return success_response(data=data)
