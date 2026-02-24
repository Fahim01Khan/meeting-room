import time
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from bookings.models import Booking
from bookings.constants import BookingStatus
from organisation.models import OrganisationSettings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Auto-release confirmed bookings where nobody checked in within the "
        "configured auto_release_minutes window. Marks them as no_show."
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
                "Running auto_release in loop mode (every 60s). Press Ctrl+C to stop."
            )
            try:
                while True:
                    count = self._release_stale_bookings()
                    if count:
                        self.stdout.write(self.style.SUCCESS(f"Auto-released {count} booking(s) as no-show"))
                    time.sleep(60)
            except KeyboardInterrupt:
                self.stdout.write("\nStopped auto_release loop.")
        else:
            count = self._release_stale_bookings()
            if count:
                self.stdout.write(self.style.SUCCESS(f"Auto-released {count} booking(s) as no-show"))
            else:
                self.stdout.write("No bookings to auto-release.")

    def _release_stale_bookings(self) -> int:
        """
        Find and mark stale bookings as no_show.
        Returns the count of affected bookings for testability.
        """
        org = OrganisationSettings.get()
        window = org.auto_release_minutes
        now = timezone.now()
        cutoff = now - timedelta(minutes=window)

        stale_bookings = Booking.objects.filter(
            status=BookingStatus.CONFIRMED.value,
            checked_in=False,
            start_time__lte=cutoff,
            end_time__gte=now,
        ).exclude(
            status=BookingStatus.NO_SHOW.value,
        )

        count = stale_bookings.count()
        if count:
            stale_bookings.update(status=BookingStatus.NO_SHOW.value)
            logger.info("Auto-released %d booking(s) as no-show", count)
        return count
