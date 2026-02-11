"""
Google Calendar adapter — stubbed for future integration.

When PROVIDER_MODE=google, the gateway routes through this adapter.
Replace the stub methods with real Google Calendar API calls.
"""
from providers.gateway import BaseProviderAdapter


class GoogleAdapter(BaseProviderAdapter):
    """Google Workspace Calendar adapter (stub)."""

    def __init__(self):
        # TODO: Initialize Google API credentials from settings
        pass

    def create_event(self, booking_data: dict) -> dict:
        # TODO: POST to Google Calendar API
        raise NotImplementedError("Google adapter not yet implemented")

    def update_event(self, external_id: str, booking_data: dict) -> dict:
        # TODO: PATCH/PUT to Google Calendar API
        raise NotImplementedError("Google adapter not yet implemented")

    def delete_event(self, external_id: str) -> bool:
        # TODO: DELETE to Google Calendar API
        raise NotImplementedError("Google adapter not yet implemented")

    def get_event(self, external_id: str) -> dict | None:
        # TODO: GET from Google Calendar API
        raise NotImplementedError("Google adapter not yet implemented")

    def list_events(self, room_id: str, date: str) -> list[dict]:
        # TODO: LIST from Google Calendar API
        raise NotImplementedError("Google adapter not yet implemented")

    def check_availability(self, room_id: str, start: str, end: str) -> bool:
        # TODO: Free/busy query to Google Calendar API
        raise NotImplementedError("Google adapter not yet implemented")
