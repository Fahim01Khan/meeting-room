from django.urls import path

from . import views

app_name = "analytics"

urlpatterns = [
    path("kpi", views.KPIView.as_view(), name="kpi"),
    path("utilization", views.UtilizationView.as_view(), name="utilization"),
    path("ghosting", views.GhostingView.as_view(), name="ghosting"),
    path("capacity", views.CapacityView.as_view(), name="capacity"),
]
