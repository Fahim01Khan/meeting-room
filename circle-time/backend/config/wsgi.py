"""
WSGI config for Circle Time backend.

Defaults to production settings. Override via DJANGO_SETTINGS_MODULE env var.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_wsgi_application()
