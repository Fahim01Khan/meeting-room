from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    """GET /api/health → { success: true, data: { status: "ok" } }"""
    return JsonResponse({"success": True, "data": {"status": "ok"}})


urlpatterns = [
    path("admin/", admin.site.urls),
    # Health
    path("api/health", health_check, name="health-check"),
    # Five app boundaries (backend-planning-brief)
    path("api/auth/", include("accounts.urls")),
    path("api/", include("rooms.urls")),
    path("api/", include("bookings.urls")),
    path("api/", include("panel.urls")),
    path("api/analytics/", include("analytics.urls")),
    path("api/", include("organisation.urls")),
]
