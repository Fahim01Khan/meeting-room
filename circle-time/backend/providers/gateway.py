"""
Provider Gateway — TRD Brokered Architecture.

Provides a unified interface that switches on PROVIDER_MODE:
  - local:  use only the DB (no external calls)
  - google: same interface, calls Google Calendar API (stubbed)
  - zoho:   same interface, calls Zoho Calendar API (stubbed)
"""
from abc import ABC, abstractmethod
from typing import Any
from django.conf import settings


class BaseProviderAdapter(ABC):
    """Interface that every provider adapter must implement."""

    @abstractmethod
    def create_event(self, booking_data: dict) -> dict:
        """Create an external calendar event for a booking."""
        ...

    @abstractmethod
    def update_event(self, external_id: str, booking_data: dict) -> dict:
        """Update an external calendar event."""
        ...

    @abstractmethod
    def delete_event(self, external_id: str) -> bool:
        """Delete / cancel an external calendar event."""
        ...

    @abstractmethod
    def get_event(self, external_id: str) -> dict | None:
        """Retrieve a single event from the external provider."""
        ...

    @abstractmethod
    def list_events(self, room_id: str, date: str) -> list[dict]:
        """List events for a room on a given date from the external provider."""
        ...

    @abstractmethod
    def check_availability(self, room_id: str, start: str, end: str) -> bool:
        """Check whether a time slot is available in the external provider."""
        ...


class LocalAdapter(BaseProviderAdapter):
    """
    Local-first adapter: all data lives in the Django DB.
    No external API calls are made.
    """

    def create_event(self, booking_data: dict) -> dict:
        # In local mode the booking is already persisted by Django ORM.
        return {"provider": "local", "external_id": None}

    def update_event(self, external_id: str, booking_data: dict) -> dict:
        return {"provider": "local", "external_id": None}

    def delete_event(self, external_id: str) -> bool:
        return True

    def get_event(self, external_id: str) -> dict | None:
        return None

    def list_events(self, room_id: str, date: str) -> list[dict]:
        return []

    def check_availability(self, room_id: str, start: str, end: str) -> bool:
        # Conflict check handled by bookings app directly against DB
        return True


def _load_adapter() -> BaseProviderAdapter:
    mode = getattr(settings, "PROVIDER_MODE", "local")
    if mode == "google":
        from providers.google_adapter import GoogleAdapter
        return GoogleAdapter()
    elif mode == "zoho":
        from providers.zoho_adapter import ZohoAdapter
        return ZohoAdapter()
    else:
        return LocalAdapter()


# Singleton gateway instance
_adapter: BaseProviderAdapter | None = None


def get_provider() -> BaseProviderAdapter:
    """Return the configured provider adapter (cached singleton)."""
    global _adapter
    if _adapter is None:
        _adapter = _load_adapter()
    return _adapter
