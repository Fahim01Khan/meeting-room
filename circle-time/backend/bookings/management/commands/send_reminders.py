import time
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from bookings.models import Booking
from bookings.constants import BookingStatus
from bookings.emails import send_checkin_reminder
from organisation.models import OrganisationSettings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Send check-in reminder emails for upcoming bookings. "
        "Finds confirmed bookings starting within the check-in window "
        "that haven't had a reminder sent yet."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--run-loop",
            action="store_true",
            help="Run continuously every 60 seconds (for local development only, not production).",
        )

    def handle(self, *args, **options):
        if options["run_loop"]:
            self.stdout.write(
                "Running send_reminders in loop mode (every 60s). Press Ctrl+C to stop."
            )
            try:
                while True:
                    count = self._send_pending_reminders()
                    if count:
                        self.stdout.write(
                            self.style.SUCCESS(f"Sent {count} reminder(s)")
                        )
                    time.sleep(60)
            except KeyboardInterrupt:
                self.stdout.write("\nStopped send_reminders loop.")
        else:
            count = self._send_pending_reminders()
            if count:
                self.stdout.write(
                    self.style.SUCCESS(f"Sent {count} reminder(s)")
                )
            else:
                self.stdout.write("0 reminders sent.")

    def _send_pending_reminders(self) -> int:
        """
        Find bookings that need a reminder and send emails.
        Returns count of reminders sent.
        """
        org = OrganisationSettings.get()
        window = org.checkin_window_minutes
        now = timezone.now()
        window_end = now + timedelta(minutes=window)

        # Bookings starting within the check-in window that:
        # - are confirmed (not yet checked in, not cancelled, etc.)
        # - haven't had a reminder sent yet
        # - start between now and now + window
        pending_bookings = Booking.objects.filter(
            status=BookingStatus.CONFIRMED.value,
            reminder_sent=False,
            start_time__gte=now,
            start_time__lte=window_end,
        ).select_related("organizer", "room")

        count = 0
        for booking in pending_bookings:
            send_checkin_reminder(booking)
            booking.reminder_sent = True
            booking.save(update_fields=["reminder_sent"])
            count += 1

        if count:
            logger.info("Sent %d check-in reminder(s)", count)

        return count
