"""
Zoho Calendar adapter — stubbed for future integration.

When PROVIDER_MODE=zoho, the gateway routes through this adapter.
Replace the stub methods with real Zoho Calendar API calls.
"""
from providers.gateway import BaseProviderAdapter


class ZohoAdapter(BaseProviderAdapter):
    """Zoho Calendar adapter (stub)."""

    def __init__(self):
        # FUTURE: Load Zoho OAuth2 credentials from settings
        # (ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET) and initialise
        # the requests-oauthlib session for Zoho Calendar API calls.
        pass

    def create_event(self, booking_data: dict) -> dict:
        # FUTURE: POST to Zoho Calendar API — create event
        raise NotImplementedError("Zoho adapter not yet implemented")

    def update_event(self, external_id: str, booking_data: dict) -> dict:
        # FUTURE: PUT to Zoho Calendar API — update event
        raise NotImplementedError("Zoho adapter not yet implemented")

    def delete_event(self, external_id: str) -> bool:
        # FUTURE: DELETE via Zoho Calendar API — remove event
        raise NotImplementedError("Zoho adapter not yet implemented")

    def get_event(self, external_id: str) -> dict | None:
        # FUTURE: GET via Zoho Calendar API — fetch single event
        raise NotImplementedError("Zoho adapter not yet implemented")

    def list_events(self, room_id: str, date: str) -> list[dict]:
        # FUTURE: LIST via Zoho Calendar API — fetch events for date
        raise NotImplementedError("Zoho adapter not yet implemented")

    def check_availability(self, room_id: str, start: str, end: str) -> bool:
        # FUTURE: Zoho Calendar free/busy query to check room availability
        raise NotImplementedError("Zoho adapter not yet implemented")
