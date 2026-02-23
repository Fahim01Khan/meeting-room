import uuid
import random
import string
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class PairingCode(models.Model):
    """
    Short-lived 6-digit code displayed on a tablet during pairing.

    Flow:
      1. Tablet POST /api/panel/pairing-codes  → gets a 6-digit code
      2. Tablet polls GET /api/panel/pairing-status/<code> every 3 s
      3. Admin POST /api/panel/pair-device with code + roomId
      4. Backend links code → room → DeviceRegistration
      5. Next poll returns status='paired' + roomId
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paired", "Paired"),
        ("expired", "Expired"),
    ]

    EXPIRY_MINUTES = 10

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=6, unique=True, db_index=True)
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pairing_codes",
        help_text="Populated when an admin pairs the code to a room",
    )
    device_serial = models.CharField(
        max_length=255,
        help_text="Hardware serial or generated UUID from the tablet",
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        help_text="Auto-set to created_at + 10 minutes",
    )
    paired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"PairingCode {self.code} ({self.status})"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Use timezone.now() as fallback when auto_now_add hasn't fired yet
            base = self.created_at or timezone.now()
            self.expires_at = base + timedelta(minutes=self.EXPIRY_MINUTES)
        super().save(*args, **kwargs)

    @staticmethod
    def generate_unique_code() -> str:
        """Generate a random 6-digit numeric code that doesn't collide."""
        for _ in range(20):
            code = "".join(random.choices(string.digits, k=6))
            if not PairingCode.objects.filter(
                code=code, status="pending"
            ).exists():
                return code
        raise RuntimeError("Unable to generate a unique pairing code")


class DeviceRegistration(models.Model):
    """Maps a physical SUNMI device to a room."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey("rooms.Room", on_delete=models.CASCADE, related_name="devices")
    device_serial = models.CharField(max_length=255, unique=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Device {self.device_serial} → {self.room.name}"


class IssueReport(models.Model):
    """Issue reported from a panel device."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey("rooms.Room", on_delete=models.CASCADE, related_name="issues")
    description = models.TextField()
    reported_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    def __str__(self):
        return f"Issue in {self.room.name}: {self.description[:50]}"
