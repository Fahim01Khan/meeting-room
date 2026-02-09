"""
Root URL configuration for Circle Time.

All API endpoints live under /api/ to keep a clean namespace.
"""

from django.contrib import admin
from django.urls import include, path

from apps.bookings.views import RoomBookingsView

urlpatterns = [
    # Django admin
    path("admin/", admin.site.urls),

    # ── Authentication ──────────────────────────────────────────────────
    path("api/auth/", include("apps.accounts.urls")),

    # ── Rooms ───────────────────────────────────────────────────────────
    path("api/rooms/", include("apps.rooms.urls")),

    # ── Room bookings (nested under rooms, served by bookings app) ─────
    path(
        "api/rooms/<str:room_id>/bookings/",
        RoomBookingsView.as_view(),
        name="room-bookings",
    ),

    # ── Bookings ────────────────────────────────────────────────────────
    path("api/bookings/", include("apps.bookings.urls")),

    # ── Panel (mobile tablet) ──────────────────────────────────────────
    path("api/panel/", include("apps.panel.urls")),

    # ── Analytics (admin-only) ─────────────────────────────────────────
    path("api/analytics/", include("apps.analytics.urls")),
]
