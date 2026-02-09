"""
ASGI config for Circle Time backend.

Defaults to production settings. Override via DJANGO_SETTINGS_MODULE env var.

NOTE: When Django Channels is introduced for WebSocket support, this file will
be updated to wrap the application with Channels' ProtocolTypeRouter.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_asgi_application()
# TODO: wrap with Channels ProtocolTypeRouter when WebSocket support is added
# from channels.routing import ProtocolTypeRouter, URLRouter
# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": URLRouter([...]),
# })
