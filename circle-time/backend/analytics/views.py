"""
Analytics views — compute aggregated metrics from booking data.

All endpoints accept `startDate` and `endDate` query params (YYYY-MM-DD).
Returns data matching the web frontend's analytics type definitions.
"""
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, Q, F, ExpressionWrapper, DurationField
from django.db.models.functions import ExtractHour
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rooms.models import Room
from bookings.models import Booking


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_date_range(request):
    """Extract startDate / endDate from query params."""
    start_str = request.query_params.get("startDate")
    end_str = request.query_params.get("endDate")
    try:
        start = datetime.strptime(start_str, "%Y-%m-%d").date() if start_str else (timezone.now().date() - timedelta(days=30))
        end = datetime.strptime(end_str, "%Y-%m-%d").date() if end_str else timezone.now().date()
    except ValueError:
        return None, None
    return start, end


def _bookings_in_range(start, end):
    return Booking.objects.filter(
        start_time__date__gte=start,
        start_time__date__lte=end,
    ).exclude(status="cancelled")


# ---------------------------------------------------------------------------
# GET /api/analytics/kpi
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpi_view(request):
    """KPI summary: Total Rooms, Avg Utilization, Ghosting Rate, Total Bookings."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format. Use YYYY-MM-DD."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    total_rooms = Room.objects.count()
    bookings = _bookings_in_range(start, end)
    total_bookings = bookings.count()
    no_shows = bookings.filter(status="no_show").count()
    checked_in = bookings.filter(checked_in=True).count()

    ghosting_rate = round((no_shows / total_bookings * 100) if total_bookings > 0 else 0, 1)

    # Utilization: total booked hours / (rooms × business hours × working days)
    days = max((end - start).days, 1)
    business_hours_per_day = 12  # 07:00 – 19:00
    total_available_hours = total_rooms * business_hours_per_day * days
    _dur_expr = ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
    total_duration = bookings.aggregate(total=Sum(_dur_expr))['total']
    total_booked_hours = total_duration.total_seconds() / 3600 if total_duration else 0
    avg_util = round((total_booked_hours / total_available_hours * 100) if total_available_hours > 0 else 0, 1)

    # Period-over-period comparison (same-length window immediately before current period)
    period_len = timedelta(days=days)
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - period_len + timedelta(days=1)
    prev_bookings = _bookings_in_range(prev_start, prev_end)
    prev_total = prev_bookings.count()
    prev_no_shows = prev_bookings.filter(status="no_show").count()
    prev_duration = prev_bookings.aggregate(total=Sum(_dur_expr))['total']
    prev_booked_hours = prev_duration.total_seconds() / 3600 if prev_duration else 0
    prev_util = round((prev_booked_hours / total_available_hours * 100) if total_available_hours > 0 else 0, 1)
    prev_ghosting = round((prev_no_shows / prev_total * 100) if prev_total > 0 else 0, 1)

    def _pct_change(current, previous):
        if previous == 0:
            return 0.0
        return round((current - previous) / previous * 100, 1)

    util_change = _pct_change(avg_util, prev_util)
    ghost_change = _pct_change(ghosting_rate, prev_ghosting)
    bookings_change = _pct_change(total_bookings, prev_total)

    data = [
        {"label": "Total Rooms", "value": total_rooms, "changeType": "neutral", "unit": "rooms"},
        {
            "label": "Avg Utilization", "value": avg_util,
            "change": util_change,
            "changeType": "positive" if util_change >= 0 else "negative",
            "unit": "%",
        },
        {
            "label": "Ghosting Rate", "value": ghosting_rate,
            "change": ghost_change,
            # For ghosting: a decrease is good (fewer no-shows)
            "changeType": "positive" if ghost_change <= 0 else "negative",
            "unit": "%",
        },
        {
            "label": "Total Bookings", "value": total_bookings,
            "change": bookings_change,
            "changeType": "positive" if bookings_change >= 0 else "negative",
            "unit": "bookings",
        },
    ]

    return Response({"success": True, "data": data})


# ---------------------------------------------------------------------------
# GET /api/analytics/utilization
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def utilization_view(request):
    """Utilization data per room."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    building = request.query_params.get("building")
    rooms = Room.objects.all()
    if building:
        rooms = rooms.filter(building__iexact=building)

    days = max((end - start).days, 1)
    business_hours = 12
    available_hours = business_hours * days

    _dur_expr = ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
    result = []
    for room in rooms:
        room_bookings = _bookings_in_range(start, end).filter(room=room)
        duration_agg = room_bookings.aggregate(total=Sum(_dur_expr))
        total_booked = (duration_agg['total'].total_seconds() / 3600) if duration_agg['total'] else 0
        util_rate = round((total_booked / available_hours * 100) if available_hours > 0 else 0, 1)
        total_count = room_bookings.count()

        # Determine peak hours via ORM aggregation
        peak_qs = (
            room_bookings
            .annotate(hour=ExtractHour('start_time'))
            .values('hour')
            .annotate(count=Count('id'))
            .order_by('-count')[:3]
        )
        peak_hours = [f"{entry['hour']:02d}:00" for entry in peak_qs]

        result.append({
            "roomId": str(room.id),
            "roomName": room.name,
            "utilizationRate": util_rate,
            "totalBookings": total_count,
            "totalHoursBooked": round(total_booked, 1),
            "peakHours": peak_hours,
        })

    return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# GET /api/analytics/ghosting
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ghosting_view(request):
    """Ghosting data per room."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rooms = Room.objects.all()
    result = []
    for room in rooms:
        room_bookings = _bookings_in_range(start, end).filter(room=room)
        total = room_bookings.count()
        no_shows = room_bookings.filter(status="no_show").count()
        ghosting_rate = round((no_shows / total * 100) if total > 0 else 0, 1)

        wasted_agg = room_bookings.filter(status="no_show").aggregate(
            total=Sum(ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField()))
        )
        wasted_minutes = (wasted_agg['total'].total_seconds() / 60) if wasted_agg['total'] else 0

        result.append({
            "roomId": str(room.id),
            "roomName": room.name,
            "ghostingRate": ghosting_rate,
            "totalNoShows": no_shows,
            "totalBookings": total,
            "averageWastedMinutes": round(wasted_minutes / no_shows if no_shows > 0 else 0, 1),
        })

    return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# GET /api/analytics/ghosting/departments
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ghosting_departments_view(request):
    """Ghosting rate grouped by organizer department."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bookings_qs = _bookings_in_range(start, end).select_related("organizer")
    # Group by department
    dept_stats: dict[str, dict] = {}
    for b in bookings_qs:
        dept = b.organizer.department or "Unknown"
        if dept not in dept_stats:
            dept_stats[dept] = {"total": 0, "no_shows": 0}
        dept_stats[dept]["total"] += 1
        if b.status == "no_show":
            dept_stats[dept]["no_shows"] += 1

    result = []
    for name, stats in sorted(dept_stats.items()):
        rate = round((stats["no_shows"] / stats["total"] * 100) if stats["total"] > 0 else 0, 1)
        result.append({"name": name, "rate": rate, "totalBookings": stats["total"], "noShows": stats["no_shows"]})

    return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# GET /api/analytics/capacity
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def capacity_view(request):
    """Capacity efficiency data per room."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rooms = Room.objects.all()
    result = []
    for room in rooms:
        room_bookings = _bookings_in_range(start, end).filter(room=room)
        total = room_bookings.count()

        # Average attendees from BookingAttendee count (annotation avoids N+1)
        room_bookings_annotated = room_bookings.annotate(
            attendee_count=Count('booking_attendees')
        )
        attendee_counts = [b.attendee_count + 1 for b in room_bookings_annotated]

        avg_attendees = round(sum(attendee_counts) / len(attendee_counts), 1) if attendee_counts else 0
        cap_util = round((avg_attendees / room.capacity * 100) if room.capacity > 0 else 0, 1)

        oversized = sum(1 for c in attendee_counts if c < room.capacity * 0.5)
        undersized = sum(1 for c in attendee_counts if c > room.capacity)

        result.append({
            "roomId": str(room.id),
            "roomName": room.name,
            "roomCapacity": room.capacity,
            "averageAttendees": avg_attendees,
            "capacityUtilization": cap_util,
            "oversizedBookings": oversized,
            "undersizedBookings": undersized,
        })

    return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# GET /api/analytics/heatmap
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def heatmap_view(request):
    """Heatmap data: day × hour grid."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bookings = _bookings_in_range(start, end)

    # Build heatmap grid: Mon-Fri, hours 7-18
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    grid = []
    for day in days:
        for hour in range(7, 19):
            count = bookings.filter(
                start_time__week_day=(days.index(day) + 2) % 7 + 1,  # Django week_day: Sun=1
                start_time__hour=hour,
            ).count()
            grid.append({
                "day": day,
                "hour": hour,
                "value": count,
            })

    return Response({"success": True, "data": grid})


# ---------------------------------------------------------------------------
# GET /api/analytics/rooms/compare
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def room_compare_view(request):
    """Room comparison across multiple rooms."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    room_ids_param = request.query_params.get("roomIds", "")
    rooms = Room.objects.all()
    if room_ids_param:
        ids = [r.strip() for r in room_ids_param.split(",") if r.strip()]
        rooms = rooms.filter(id__in=ids)

    days = max((end - start).days, 1)
    business_hours = 12
    available_hours = business_hours * days

    result = []
    for room in rooms:
        room_bookings = _bookings_in_range(start, end).filter(room=room)
        total = room_bookings.count()
        no_shows = room_bookings.filter(status="no_show").count()
        dur_agg = room_bookings.aggregate(
            total=Sum(ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField()))
        )
        booked_hours = (dur_agg['total'].total_seconds() / 3600) if dur_agg['total'] else 0
        util = round((booked_hours / available_hours * 100) if available_hours > 0 else 0, 1)
        ghost = round((no_shows / total * 100) if total > 0 else 0, 1)

        attendee_counts = [
            b.attendee_count + 1
            for b in room_bookings.annotate(attendee_count=Count('booking_attendees'))
        ]
        avg_att = round(sum(attendee_counts) / len(attendee_counts), 1) if attendee_counts else 0
        cap = round((avg_att / room.capacity * 100) if room.capacity > 0 else 0, 1)

        result.append({
            "roomId": str(room.id),
            "roomName": room.name,
            "utilization": util,
            "ghosting": ghost,
            "capacity": cap,
            "bookings": total,
        })

    return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# GET /api/analytics/trends
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trends_view(request):
    """Trend data for a metric over time."""
    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    metric = request.query_params.get("metric", "utilization")

    result = []
    current = start
    while current <= end:
        day_bookings = _bookings_in_range(current, current)
        if metric == "ghosting":
            total = day_bookings.count()
            no_shows = day_bookings.filter(status="no_show").count()
            value = round((no_shows / total * 100) if total > 0 else 0, 1)
        else:  # utilization
            value = round(day_bookings.count() * 1.0, 1)  # simple count per day
        result.append({
            "date": current.isoformat(),
            "value": value,
        })
        current += timedelta(days=1)

    return Response({"success": True, "data": result})


# ---------------------------------------------------------------------------
# GET /api/analytics/export
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_view(request):
    """Export analytics as CSV. PDF is a future enhancement."""
    import csv
    from django.http import HttpResponse

    start, end = _parse_date_range(request)
    if start is None:
        return Response(
            {"success": False, "message": "Invalid date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    fmt = request.query_params.get("format", "csv")
    if fmt != "csv":
        return Response(
            {"success": False, "message": "Only CSV export is supported currently."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    bookings = _bookings_in_range(start, end).select_related("room", "organizer")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="analytics_{start}_{end}.csv"'

    writer = csv.writer(response)
    writer.writerow(["Booking ID", "Room", "Title", "Organizer", "Start", "End", "Status", "Checked In"])
    for b in bookings:
        writer.writerow([
            str(b.id), b.room.name, b.title, b.organizer.name,
            b.start_time.isoformat(), b.end_time.isoformat(),
            b.status, b.checked_in,
        ])

    return response
