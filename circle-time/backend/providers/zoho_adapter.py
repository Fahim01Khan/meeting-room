"""
Zoho Calendar adapter — stubbed for future integration.

When PROVIDER_MODE=zoho, the gateway routes through this adapter.
Replace the stub methods with real Zoho Calendar API calls.
"""
from providers.gateway import BaseProviderAdapter


class ZohoAdapter(BaseProviderAdapter):
    """Zoho Calendar adapter (stub)."""

    def __init__(self):
        # TODO: Initialize Zoho API OAuth2 credentials from settings
        pass

    def create_event(self, booking_data: dict) -> dict:
        # TODO: POST to Zoho Calendar API
        raise NotImplementedError("Zoho adapter not yet implemented")

    def update_event(self, external_id: str, booking_data: dict) -> dict:
        # TODO: PUT to Zoho Calendar API
        raise NotImplementedError("Zoho adapter not yet implemented")

    def delete_event(self, external_id: str) -> bool:
        # TODO: DELETE to Zoho Calendar API
        raise NotImplementedError("Zoho adapter not yet implemented")

    def get_event(self, external_id: str) -> dict | None:
        # TODO: GET from Zoho Calendar API
        raise NotImplementedError("Zoho adapter not yet implemented")

    def list_events(self, room_id: str, date: str) -> list[dict]:
        # TODO: LIST from Zoho Calendar API
        raise NotImplementedError("Zoho adapter not yet implemented")

    def check_availability(self, room_id: str, start: str, end: str) -> bool:
        # TODO: Free/busy query to Zoho Calendar API
        raise NotImplementedError("Zoho adapter not yet implemented")
