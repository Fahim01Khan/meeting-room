"""
Email notification functions for the bookings app.

Three email types:
  1. send_booking_confirmation — sent after a booking is created
  2. send_checkin_reminder     — sent before meeting starts (within check-in window)
  3. send_no_show_notification — sent when a booking is auto-released for no check-in

All functions are fire-and-forget: they log success/failure and never raise,
so email failures cannot break the main application flow.
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from organisation.models import OrganisationSettings

logger = logging.getLogger(__name__)


def _format_date(dt) -> str:
    """Format a datetime as 'Monday, 24 Feb 2026'."""
    return dt.strftime("%A, %d %b %Y")


def _format_time(dt) -> str:
    """Format a datetime as '2:30 PM'."""
    return dt.strftime("%-I:%M %p") if hasattr(dt, 'strftime') else str(dt)


def send_booking_confirmation(booking) -> None:
    """
    Send a booking confirmation email to the organizer.
    Called after a booking is successfully created.
    """
    organizer = booking.organizer
    room = booking.room
    org = OrganisationSettings.get()

    subject = f"Booking Confirmed: {booking.title}"
    to_email = organizer.email

    body = (
        f"Hi {organizer.name},\n"
        f"\n"
        f"Your booking has been confirmed.\n"
        f"\n"
        f"Room:       {room.name}, {room.building} Floor {room.floor}\n"
        f"Date:       {_format_date(booking.start_time)}\n"
        f"Time:       {_format_time(booking.start_time)} – {_format_time(booking.end_time)}\n"
        f"Attendees:  {booking.attendee_count}\n"
        f"\n"
        f"Check-in opens {org.checkin_window_minutes} minutes\n"
        f"before the meeting starts.\n"
        f"\n"
        f"— Circle Time\n"
    )

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            fail_silently=False,
        )
        logger.info("Email sent: %s → %s", subject, to_email)
    except Exception as e:
        logger.warning("Email failed: %s → %s", subject, e)


def send_checkin_reminder(booking) -> None:
    """
    Send a check-in reminder email to the organizer.
    Called by the send_reminders management command.
    """
    organizer = booking.organizer
    room = booking.room
    org = OrganisationSettings.get()

    subject = f"Reminder: Check in to {booking.title}"
    to_email = organizer.email

    body = (
        f"Hi {organizer.name},\n"
        f"\n"
        f"Your meeting starts in {org.checkin_window_minutes} minutes.\n"
        f"\n"
        f"Please check in on the room display or the web app\n"
        f"to hold your booking. Unchecked bookings are\n"
        f"automatically released.\n"
        f"\n"
        f"Room: {room.name}\n"
        f"Time: {_format_time(booking.start_time)} – {_format_time(booking.end_time)}\n"
        f"\n"
        f"— Circle Time\n"
    )

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            fail_silently=False,
        )
        logger.info("Email sent: %s → %s", subject, to_email)
    except Exception as e:
        logger.warning("Email failed: %s → %s", subject, e)


def send_no_show_notification(booking) -> None:
    """
    Send a notification that a booking was auto-released due to no check-in.
    Called by the auto_release management command.
    """
    organizer = booking.organizer
    room = booking.room

    subject = f"Booking Released: {booking.title} (No Check-in)"
    to_email = organizer.email

    body = (
        f"Hi {organizer.name},\n"
        f"\n"
        f"Your booking for {room.name} was automatically released\n"
        f"because no one checked in within the required window.\n"
        f"\n"
        f"If you still need the room, please book again.\n"
        f"\n"
        f"— Circle Time\n"
    )

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [to_email],
            fail_silently=False,
        )
        logger.info("Email sent: %s → %s", subject, to_email)
    except Exception as e:
        logger.warning("Email failed: %s → %s", subject, e)
