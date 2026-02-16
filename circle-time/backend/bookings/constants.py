"""
Booking-related constants and enumerations.

This module centralizes all magic values and constants used throughout
the bookings app to improve maintainability and consistency.
"""
from enum import Enum


class BookingDefaults(Enum):
    """
    Default values for booking configuration.
    
    These values can be overridden by environment variables or admin settings.
    """
    CHECKIN_WINDOW_MINUTES = 15
    DEFAULT_MEETING_START = "09:00"
    DEFAULT_MEETING_END = "10:00"
    MAX_BOOKING_DURATION_HOURS = 8
    MIN_BOOKING_DURATION_MINUTES = 15
    EXTENSION_INCREMENT_MINUTES = 15
    MAX_EXTENSIONS_PER_BOOKING = 4
    BUSINESS_HOURS_START = 7
    BUSINESS_HOURS_END = 19
    TIME_SLOT_DURATION_MINUTES = 30


class BookingStatus(str, Enum):
    """
    Booking status enum.
    
    Inherits from str to allow direct string comparisons while maintaining
    type safety and IDE autocomplete support.
    
    Status flow:
        pending → confirmed → checked_in → completed
                          ↓
                      cancelled
                          ↓
                       no_show (if not checked in within window)
    """
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class RecurrenceType(str, Enum):
    """
    Recurrence pattern types for recurring bookings.
    
    Examples:
        NONE: Single booking
        DAILY: Repeat every N days
        WEEKLY: Repeat on specific days of week (e.g., Mon/Wed/Fri)
        MONTHLY: Repeat on specific day of month (e.g., 1st or 15th)
        CUSTOM: Advanced patterns defined by recurrence_pattern JSON
    """
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"
