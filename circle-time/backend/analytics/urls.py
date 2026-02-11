from django.urls import path
from analytics.views import (
    kpi_view,
    utilization_view,
    ghosting_view,
    capacity_view,
    heatmap_view,
    room_compare_view,
    trends_view,
    export_view,
)

urlpatterns = [
    path("kpi", kpi_view, name="analytics-kpi"),
    path("utilization", utilization_view, name="analytics-utilization"),
    path("ghosting", ghosting_view, name="analytics-ghosting"),
    path("capacity", capacity_view, name="analytics-capacity"),
    path("heatmap", heatmap_view, name="analytics-heatmap"),
    path("rooms/compare", room_compare_view, name="analytics-rooms-compare"),
    path("trends", trends_view, name="analytics-trends"),
    path("export", export_view, name="analytics-export"),
]
