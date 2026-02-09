"""
Production settings.

Usage:
    DJANGO_SETTINGS_MODULE=config.settings.production gunicorn config.wsgi
"""

from .base import *  # noqa: F401, F403

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
DEBUG = False

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"

# TODO: configure SECURE_SSL_REDIRECT and SECURE_HSTS_* when TLS is set up
