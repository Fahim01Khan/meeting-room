import time
import logging

from django.core.management.base import BaseCommand

from bookings.utils import release_stale_bookings

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
                    count = release_stale_bookings()
                    if count:
                        self.stdout.write(self.style.SUCCESS(f"Auto-released {count} booking(s) as no-show"))
                    time.sleep(60)
            except KeyboardInterrupt:
                self.stdout.write("\nStopped auto_release loop.")
        else:
            count = release_stale_bookings()
            if count:
                self.stdout.write(self.style.SUCCESS(f"Auto-released {count} booking(s) as no-show"))
            else:
                self.stdout.write("No bookings to auto-release.")
