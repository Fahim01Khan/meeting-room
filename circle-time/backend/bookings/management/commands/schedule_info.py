from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Print instructions for scheduling the auto_release cron job."

    def handle(self, *args, **options):
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Auto-release scheduling"))
        self.stdout.write("")
        self.stdout.write("Run auto_release every minute via cron:")
        self.stdout.write(
            "  * * * * * cd /path/to/backend && python manage.py auto_release"
        )
        self.stdout.write("")
        self.stdout.write("For local testing:")
        self.stdout.write(
            "  python manage.py auto_release --run-loop"
        )
        self.stdout.write("")
        self.stdout.write(
            "The --run-loop flag runs the check every 60 seconds in a loop "
            "(for development only, not production)."
        )
        self.stdout.write("")
