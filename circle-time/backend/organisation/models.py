from django.db import models
from django.utils import timezone


class OrganisationSettings(models.Model):
    """
    Singleton model — only one row ever exists (id=1).
    Access via OrganisationSettings.get() which creates defaults on first call.
    """

    # ── Branding ─────────────────────────────────────────────────────────────
    org_name = models.CharField(max_length=255, default="Circle Time")
    primary_colour = models.CharField(
        max_length=7,
        default="#1E8ACC",
        help_text="Hex colour including #, e.g. #1E8ACC",
    )
    logo_url = models.URLField(max_length=500, null=True, blank=True)

    # ── Check-in settings ────────────────────────────────────────────────────
    checkin_window_minutes = models.IntegerField(
        default=15,
        help_text="Minutes before meeting start that attendees can check in",
    )
    auto_release_minutes = models.IntegerField(
        default=15,
        help_text="Minutes after meeting start before room is auto-released if no check-in",
    )

    # ── Business hours ───────────────────────────────────────────────────────
    business_days = models.JSONField(
        default=list,
        help_text="List of active day numbers (0=Mon, 6=Sun), e.g. [0,1,2,3,4]",
    )
    business_start = models.TimeField(default="08:00")
    business_end = models.TimeField(default="17:00")
    timezone = models.CharField(max_length=100, default="Africa/Johannesburg")

    # ── Metadata ─────────────────────────────────────────────────────────────
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    class Meta:
        verbose_name = "Organisation Settings"

    def __str__(self):
        return f"Organisation Settings — {self.org_name}"

    def save(self, *args, **kwargs):
        # Enforce singleton by always using id=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        """Singleton accessor — get or create with defaults."""
        obj, created = cls.objects.get_or_create(id=1)
        if created:
            # Ensure business_days default is populated (JSONField default=list gives [])
            if not obj.business_days:
                obj.business_days = [0, 1, 2, 3, 4]
                obj.save(update_fields=["business_days"])
        return obj
