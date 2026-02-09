"""
Analytics service layer.

All metric computation logic will live here. Views call services; services
query booking data and return computed results.

When Celery is introduced:
- Heavy aggregations can be dispatched as background tasks.
- Pre-computed snapshots can be generated periodically via Celery beat.
- CSV/PDF export jobs will be async tasks returning download URLs.
"""


def get_placeholder_kpi_data(start_date: str, end_date: str) -> list[dict]:
    """Return placeholder KPI data matching the V1 contract shape."""
    # TODO: compute real KPIs from bookings data
    return [
        {
            "label": "Total Rooms",
            "value": 24,
            "change": None,
            "changeType": None,
            "unit": None,
        },
        {
            "label": "Avg Utilization",
            "value": 67.5,
            "change": 3.2,
            "changeType": "positive",
            "unit": "%",
        },
        {
            "label": "Ghosting Rate",
            "value": 12.1,
            "change": -1.5,
            "changeType": "positive",
            "unit": "%",
        },
        {
            "label": "Total Bookings",
            "value": 342,
            "change": 15,
            "changeType": "positive",
            "unit": None,
        },
    ]


def get_placeholder_utilization_data(start_date: str, end_date: str) -> list[dict]:
    """Return placeholder utilization data matching the V1 contract shape."""
    # TODO: compute real utilization rates per room
    return [
        {
            "roomId": "room-001",
            "roomName": "Maple Room",
            "utilizationRate": 72.5,
            "totalBookings": 45,
            "totalHoursBooked": 67.5,
            "peakHours": ["09:00", "14:00"],
        },
        {
            "roomId": "room-002",
            "roomName": "Oak Room",
            "utilizationRate": 58.3,
            "totalBookings": 32,
            "totalHoursBooked": 48.0,
            "peakHours": ["10:00", "15:00"],
        },
    ]


def get_placeholder_ghosting_data(start_date: str, end_date: str) -> list[dict]:
    """Return placeholder ghosting data matching the V1 contract shape."""
    # TODO: compute real ghosting rates from check-in data
    return [
        {
            "roomId": "room-001",
            "roomName": "Maple Room",
            "ghostingRate": 8.5,
            "totalNoShows": 4,
            "totalBookings": 45,
            "averageWastedMinutes": 42.0,
        },
        {
            "roomId": "room-002",
            "roomName": "Oak Room",
            "ghostingRate": 15.6,
            "totalNoShows": 5,
            "totalBookings": 32,
            "averageWastedMinutes": 55.0,
        },
    ]


def get_placeholder_capacity_data(start_date: str, end_date: str) -> list[dict]:
    """Return placeholder capacity data matching the V1 contract shape."""
    # TODO: compute real capacity efficiency from attendee data
    return [
        {
            "roomId": "room-001",
            "roomName": "Maple Room",
            "roomCapacity": 10,
            "averageAttendees": 6.2,
            "capacityUtilization": 62.0,
            "oversizedBookings": 8,
            "undersizedBookings": 2,
        },
        {
            "roomId": "room-002",
            "roomName": "Oak Room",
            "roomCapacity": 6,
            "averageAttendees": 4.1,
            "capacityUtilization": 68.3,
            "oversizedBookings": 3,
            "undersizedBookings": 5,
        },
    ]


# TODO: implement compute_kpi(start_date, end_date) with real aggregation
# TODO: implement compute_utilization(start_date, end_date, building=None)
# TODO: implement compute_ghosting(start_date, end_date)
# TODO: implement compute_capacity(start_date, end_date)
# TODO: move heavy aggregation to async Celery tasks when introduced
# TODO: implement export_report(date_range, format) as a Celery task
