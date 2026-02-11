"""
Seed script: creates demo users and rooms for local development.
Run with: python manage.py shell < seed.py
"""
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from accounts.models import User
from rooms.models import Room

# ── Users ──────────────────────────────────────────────────────────────────────

users_data = [
    {
        "email": "admin@circletime.io",
        "name": "John Doe",
        "password": "admin123",
        "role": "admin",
        "department": "Operations",
    },
    {
        "email": "user@circletime.io",
        "name": "Jane Smith",
        "password": "user123",
        "role": "user",
        "department": "Engineering",
    },
    {
        "email": "manager@circletime.io",
        "name": "Bob Wilson",
        "password": "manager123",
        "role": "admin",
        "department": "Management",
    },
]

for u in users_data:
    if not User.objects.filter(email=u["email"]).exists():
        User.objects.create_user(
            email=u["email"],
            password=u["password"],
            name=u["name"],
            role=u["role"],
            department=u["department"],
        )
        print(f"  Created user: {u['email']}")
    else:
        print(f"  User already exists: {u['email']}")

# ── Rooms ──────────────────────────────────────────────────────────────────────

rooms_data = [
    {
        "name": "Conference Room A",
        "building": "Main Building",
        "floor": 1,
        "capacity": 10,
        "amenities": ["projector", "whiteboard", "video_conference"],
        "status": "available",
    },
    {
        "name": "Conference Room B",
        "building": "Main Building",
        "floor": 1,
        "capacity": 8,
        "amenities": ["whiteboard", "tv_display"],
        "status": "available",
    },
    {
        "name": "Board Room",
        "building": "Main Building",
        "floor": 2,
        "capacity": 20,
        "amenities": ["projector", "video_conference", "phone", "tv_display", "air_conditioning"],
        "status": "available",
    },
    {
        "name": "Huddle Space 1",
        "building": "Main Building",
        "floor": 1,
        "capacity": 4,
        "amenities": ["whiteboard"],
        "status": "available",
    },
    {
        "name": "Huddle Space 2",
        "building": "Main Building",
        "floor": 2,
        "capacity": 4,
        "amenities": ["tv_display"],
        "status": "available",
    },
    {
        "name": "Training Room",
        "building": "Annex",
        "floor": 1,
        "capacity": 30,
        "amenities": ["projector", "whiteboard", "video_conference", "air_conditioning"],
        "status": "available",
    },
    {
        "name": "Meeting Room East",
        "building": "Annex",
        "floor": 2,
        "capacity": 12,
        "amenities": ["video_conference", "phone", "whiteboard"],
        "status": "available",
    },
    {
        "name": "Executive Suite",
        "building": "Annex",
        "floor": 3,
        "capacity": 6,
        "amenities": ["video_conference", "tv_display", "phone", "air_conditioning"],
        "status": "maintenance",
    },
]

# Use a fixed UUID for room-001 so the mobile panel (hardcoded ROOM_ID = 'room-001') can find it
import uuid

ROOM_001_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

for i, r in enumerate(rooms_data):
    # First room gets the well-known ID for mobile compatibility
    room_id = ROOM_001_ID if i == 0 else uuid.uuid4()
    if not Room.objects.filter(name=r["name"], building=r["building"]).exists():
        Room.objects.create(
            id=room_id,
            name=r["name"],
            building=r["building"],
            floor=r["floor"],
            capacity=r["capacity"],
            amenities=r["amenities"],
            status=r["status"],
        )
        print(f"  Created room: {r['name']} (id={room_id})")
    else:
        print(f"  Room already exists: {r['name']}")

print("\n✓ Seed complete.")
