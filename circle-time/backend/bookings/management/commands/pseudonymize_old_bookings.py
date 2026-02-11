"""
Management command to pseudonymize booking titles and attendee names
after PSEUDONYMIZE_AFTER_DAYS days, retaining only numeric metrics.

Per TRD §6 Data Pseudonymization:
  "Meeting titles and attendee names should be purged from the analytics
   database after 30 days, retaining only the raw numerical metrics."

Usage:
    python manage.py pseudonymize_old_bookings
    python manage.py pseudonymize_old_bookings --days 60
"""
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from bookings.models import Booking


class Command(BaseCommand):
    help = "Pseudonymize booking titles/descriptions older than N days (default from settings)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=getattr(settings, "PSEUDONYMIZE_AFTER_DAYS", 30),
            help="Number of days after which to pseudonymize (default: PSEUDONYMIZE_AFTER_DAYS setting).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print what would be changed without making updates.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]
        cutoff = timezone.now() - timedelta(days=days)

        bookings = Booking.objects.filter(
            start_time__lt=cutoff,
        ).exclude(title="[redacted]")

        count = bookings.count()

        if dry_run:
            self.stdout.write(f"[DRY RUN] Would pseudonymize {count} booking(s) older than {days} days.")
            return

        updated = bookings.update(
            title="[redacted]",
            description="",
        )

        self.stdout.write(self.style.SUCCESS(
            f"Pseudonymized {updated} booking(s) older than {days} days (cutoff: {cutoff.date()})."
        ))
