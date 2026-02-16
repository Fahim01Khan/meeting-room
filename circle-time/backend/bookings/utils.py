"""
Booking utility functions.

This module provides reusable helper functions for date/time parsing,
recurring booking generation, and conflict detection.
"""
from datetime import datetime, date, timedelta
from typing import Optional
from django.core.exceptions import ValidationError
from django.utils import timezone
import pytz


def parse_date(date_str: str) -> date:
    """
    Parse YYYY-MM-DD string to date object.
    
    Args:
        date_str: Date string in YYYY-MM-DD format
        
    Returns:
        date: Python date object
        
    Raises:
        ValidationError: If date format is invalid
        
    Example:
        >>> parse_date("2026-02-17")
        datetime.date(2026, 2, 17)
    """
    if not date_str:
        raise ValidationError("Date string cannot be empty")
    
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError as e:
        raise ValidationError(
            f"Invalid date format: '{date_str}'. Expected YYYY-MM-DD."
        ) from e


def parse_datetime_iso(dt_str: str, tz: Optional[pytz.timezone] = None) -> datetime:
    """
    Parse ISO 8601 datetime string to timezone-aware datetime.
    
    Handles various ISO formats including:
    - 2026-02-17T14:30:00Z (UTC with Z suffix)
    - 2026-02-17T14:30:00+02:00 (with timezone offset)
    - 2026-02-17T14:30:00 (naive, will be localized to provided tz)
    
    Args:
        dt_str: ISO 8601 datetime string
        tz: Timezone to localize naive datetimes to (defaults to settings.TIME_ZONE)
        
    Returns:
        datetime: Timezone-aware datetime object
        
    Raises:
        ValidationError: If datetime format is invalid
        
    Example:
        >>> parse_datetime_iso("2026-02-17T14:30:00Z")
        datetime.datetime(2026, 2, 17, 14, 30, tzinfo=datetime.timezone.utc)
    """
    if not dt_str:
        raise ValidationError("Datetime string cannot be empty")
    
    try:
        # Handle 'Z' suffix for UTC
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        
        # If naive datetime, localize to provided timezone or default
        if not dt.tzinfo:
            tz = tz or timezone.get_current_timezone()
            dt = tz.localize(dt)
        
        return dt
    except (ValueError, AttributeError) as e:
        raise ValidationError(
            f"Invalid ISO datetime format: '{dt_str}'. Expected ISO 8601 format."
        ) from e


def generate_recurring_dates(
    start_date: date,
    end_date: date,
    recurrence_type: str,
    pattern: dict,
) -> list[date]:
    """
    Generate list of dates for recurring bookings.
    
    Args:
        start_date: First occurrence date
        end_date: Last possible occurrence date (inclusive)
        recurrence_type: One of "daily", "weekly", "monthly", "custom"
        pattern: Recurrence pattern dictionary with type-specific keys:
            - daily: {"interval": 1}  # every N days
            - weekly: {"days": [0, 2, 4], "interval": 1}  # Mon/Wed/Fri, 0=Monday
            - monthly: {"day_of_month": 15, "interval": 1}  # 15th of every N months
            
    Returns:
        list[date]: List of date objects for all occurrences
        
    Raises:
        ValidationError: If pattern is invalid or would generate too many dates
        
    Example:
        >>> generate_recurring_dates(
        ...     date(2026, 2, 17),
        ...     date(2026, 3, 31),
        ...     "weekly",
        ...     {"days": [0, 2], "interval": 1}  # Monday and Wednesday
        ... )
        [date(2026, 2, 17), date(2026, 2, 19), date(2026, 2, 23), ...]
    """
    if start_date > end_date:
        raise ValidationError("start_date must be before or equal to end_date")
    
    dates = []
    current = start_date
    max_iterations = 1000  # Safety limit to prevent infinite loops
    iteration_count = 0
    
    if recurrence_type == "daily":
        interval = pattern.get("interval", 1)
        if interval < 1:
            raise ValidationError("Daily interval must be at least 1")
        
        while current <= end_date:
            dates.append(current)
            current += timedelta(days=interval)
            iteration_count += 1
            
            if iteration_count > max_iterations:
                raise ValidationError(f"Too many recurrences (max {max_iterations})")
    
    elif recurrence_type == "weekly":
        days_of_week = pattern.get("days", [])  # 0=Monday, 6=Sunday
        interval = pattern.get("interval", 1)
        
        if not days_of_week:
            raise ValidationError("Weekly recurrence requires 'days' in pattern")
        if not all(0 <= day <= 6 for day in days_of_week):
            raise ValidationError("Days of week must be 0-6 (0=Monday, 6=Sunday)")
        if interval < 1:
            raise ValidationError("Weekly interval must be at least 1")
        
        week_count = 0
        current_week_start = start_date - timedelta(days=start_date.weekday())
        
        while current <= end_date:
            if current.weekday() in days_of_week and current >= start_date:
                dates.append(current)
            
            current += timedelta(days=1)
            iteration_count += 1
            
            # Start of new week (Monday)
            if current.weekday() == 0:
                week_count += 1
                # Skip weeks based on interval
                if interval > 1 and week_count % interval != 0:
                    current += timedelta(days=7 * (interval - 1))
            
            if iteration_count > max_iterations:
                raise ValidationError(f"Too many recurrences (max {max_iterations})")
    
    elif recurrence_type == "monthly":
        day_of_month = pattern.get("day_of_month", 1)
        interval = pattern.get("interval", 1)
        
        if not (1 <= day_of_month <= 31):
            raise ValidationError("day_of_month must be 1-31")
        if interval < 1:
            raise ValidationError("Monthly interval must be at least 1")
        
        current_year = start_date.year
        current_month = start_date.month
        
        while True:
            try:
                occurrence = date(current_year, current_month, day_of_month)
                if occurrence >= start_date and occurrence <= end_date:
                    dates.append(occurrence)
                elif occurrence > end_date:
                    break
            except ValueError:
                # Invalid day for this month (e.g., Feb 30)
                pass
            
            # Move to next month with interval
            current_month += interval
            while current_month > 12:
                current_year += 1
                current_month -= 12
            
            iteration_count += 1
            if iteration_count > max_iterations:
                raise ValidationError(f"Too many recurrences (max {max_iterations})")
    
    else:
        raise ValidationError(
            f"Unsupported recurrence_type: '{recurrence_type}'. "
            "Must be 'daily', 'weekly', or 'monthly'."
        )
    
    return dates


def check_booking_conflicts(
    room_id,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: Optional[str] = None,
) -> bool:
    """
    Check if a booking time range conflicts with existing bookings.
    
    Only considers bookings in 'confirmed' or 'checked_in' status.
    Cancelled, completed, and no-show bookings are ignored.
    
    Args:
        room_id: UUID of the room to check
        start_time: Proposed booking start datetime
        end_time: Proposed booking end datetime
        exclude_booking_id: Optional booking ID to exclude from conflict check
                           (useful when updating an existing booking)
        
    Returns:
        bool: True if conflict exists, False if time slot is available
        
    Example:
        >>> # Check if room is free
        >>> has_conflict = check_booking_conflicts(
        ...     room_id=room.id,
        ...     start_time=datetime(2026, 2, 17, 14, 0, tzinfo=timezone.utc),
        ...     end_time=datetime(2026, 2, 17, 15, 0, tzinfo=timezone.utc)
        ... )
        >>> if has_conflict:
        ...     print("Room is already booked")
        False
        
        >>> # Check while updating a booking (exclude self)
        >>> has_conflict = check_booking_conflicts(
        ...     room_id=room.id,
        ...     start_time=new_start,
        ...     end_time=new_end,
        ...     exclude_booking_id=booking.id
        ... )
    """
    from bookings.models import Booking
    from bookings.constants import BookingStatus
    
    # Query for overlapping bookings
    # Two time ranges overlap if: start1 < end2 AND end1 > start2
    qs = Booking.objects.filter(
        room_id=room_id,
        status__in=[BookingStatus.CONFIRMED.value, BookingStatus.CHECKED_IN.value],
        start_time__lt=end_time,
        end_time__gt=start_time,
    )
    
    # Exclude specific booking if provided (for updates)
    if exclude_booking_id:
        qs = qs.exclude(id=exclude_booking_id)
    
    return qs.exists()
