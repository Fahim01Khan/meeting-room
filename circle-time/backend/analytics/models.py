from django.db import models
# Analytics uses pre-computed snapshots; the real source of truth is bookings.
# This model is optional — keep it for future materialized-view optimization.
