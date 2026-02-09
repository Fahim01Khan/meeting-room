"""
Analytics models — stub.

No models are needed for V1 analytics — all metrics are computed on the fly
from bookings data. When materialized aggregation is introduced (for
performance), pre-computed snapshot models will live here.
"""

# TODO: add MetricSnapshot model if periodic materialization is needed
# TODO: add ExportJob model for tracking CSV/PDF export requests (Celery)
