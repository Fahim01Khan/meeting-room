"""
WebSocket consumer stub for real-time room state updates.

NOT ACTIVE — Django Channels is not installed yet.

When Channels + Redis are introduced:
1. Install channels and channels-redis
2. Add 'channels' to INSTALLED_APPS
3. Configure ASGI_APPLICATION in settings
4. Wire this consumer into config/asgi.py via Channels' URLRouter
5. WebSocket path: ws://host/api/panel/rooms/{roomId}/ws

Client behavior:
- Open connection with roomId
- Server pushes { "type": "room_state_update", "data": { ... } } on changes
- If WebSocket unavailable, client falls back to polling GET /state every 30s
"""

# from channels.generic.websocket import AsyncJsonWebsocketConsumer


# class RoomStateConsumer(AsyncJsonWebsocketConsumer):
#     """Push room state updates to connected panel devices."""
#
#     async def connect(self):
#         self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
#         self.group_name = f"room_{self.room_id}"
#
#         # TODO: validate auth token from query params
#         # TODO: verify room exists — reject with 4004 if not
#
#         await self.channel_layer.group_add(self.group_name, self.channel_name)
#         await self.accept()
#
#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(self.group_name, self.channel_name)
#
#     async def room_state_update(self, event):
#         """Handle room_state_update messages from the channel layer."""
#         await self.send_json({
#             "type": "room_state_update",
#             "data": event["data"],
#         })
