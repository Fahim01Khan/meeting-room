"""
Google Calendar adapter — stubbed for future integration.

When PROVIDER_MODE=google, the gateway routes through this adapter.
Replace the stub methods with real Google Calendar API calls.
"""
from providers.gateway import BaseProviderAdapter


class GoogleAdapter(BaseProviderAdapter):
    """Google Workspace Calendar adapter (stub)."""

    def __init__(self):
        # FUTURE: Load Google service-account or OAuth2 credentials from
        # settings (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) and build
        # the google-auth session for Calendar API calls.
        pass

    def create_event(self, booking_data: dict) -> dict:
        # FUTURE: POST to Google Calendar API — events.insert()
        raise NotImplementedError("Google adapter not yet implemented")

    def update_event(self, external_id: str, booking_data: dict) -> dict:
        # FUTURE: PATCH to Google Calendar API — events.patch()
        raise NotImplementedError("Google adapter not yet implemented")

    def delete_event(self, external_id: str) -> bool:
        # FUTURE: DELETE via Google Calendar API — events.delete()
        raise NotImplementedError("Google adapter not yet implemented")

    def get_event(self, external_id: str) -> dict | None:
        # FUTURE: GET via Google Calendar API — events.get()
        raise NotImplementedError("Google adapter not yet implemented")

    def list_events(self, room_id: str, date: str) -> list[dict]:
        # FUTURE: LIST via Google Calendar API — events.list()
        raise NotImplementedError("Google adapter not yet implemented")

    def check_availability(self, room_id: str, start: str, end: str) -> bool:
        # FUTURE: Google Calendar freebusy.query() to check room availability
        raise NotImplementedError("Google adapter not yet implemented")
