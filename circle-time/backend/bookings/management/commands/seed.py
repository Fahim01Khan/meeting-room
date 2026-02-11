"""
Management command to seed the database with demo data.
Creates users, buildings, rooms, and ~2 weeks of bookings
so all web + mobile screens look alive on first boot.

Usage:
    python manage.py seed
"""
import uuid
import random
from datetime import datetime, timedelta, time

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from rooms.models import Room, Building, FloorPlan
from bookings.models import Booking, BookingAttendee


# Fixed UUIDs so mobile panel (ROOM_ID = 'room-001') and curl examples work
ROOM_001_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
ROOM_IDS = [
    ROOM_001_ID,
    uuid.UUID("00000000-0000-0000-0000-000000000002"),
    uuid.UUID("00000000-0000-0000-0000-000000000003"),
    uuid.UUID("00000000-0000-0000-0000-000000000004"),
    uuid.UUID("00000000-0000-0000-0000-000000000005"),
    uuid.UUID("00000000-0000-0000-0000-000000000006"),
    uuid.UUID("00000000-0000-0000-0000-000000000007"),
    uuid.UUID("00000000-0000-0000-0000-000000000008"),
]


class Command(BaseCommand):
    help = "Seed the database with demo data for local development."

    def handle(self, *args, **options):
        self._seed_users()
        self._seed_buildings()
        self._seed_rooms()
        self._seed_bookings()
        self.stdout.write(self.style.SUCCESS("\n✓ Seed complete."))

    # ── Users ─────────────────────────────────────────────────────────
    def _seed_users(self):
        users_data = [
            {"email": "admin@example.com", "name": "John Doe", "password": "pass1234", "role": "admin", "department": "Operations"},
            {"email": "jane@example.com", "name": "Jane Smith", "password": "pass1234", "role": "user", "department": "Engineering"},
            {"email": "bob@example.com", "name": "Bob Wilson", "password": "pass1234", "role": "admin", "department": "Management"},
            {"email": "alice@example.com", "name": "Alice Chen", "password": "pass1234", "role": "user", "department": "Design"},
            {"email": "dave@example.com", "name": "Dave Kumar", "password": "pass1234", "role": "user", "department": "Engineering"},
            {"email": "sarah@example.com", "name": "Sarah Johnson", "password": "pass1234", "role": "user", "department": "Marketing"},
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
                self.stdout.write(f"  Created user: {u['email']}")
            else:
                self.stdout.write(f"  User exists: {u['email']}")

    # ── Buildings ─────────────────────────────────────────────────────
    def _seed_buildings(self):
        buildings_data = [
            {"name": "HQ", "address": "100 Main Street, Johannesburg", "floors": 3},
            {"name": "Annex", "address": "102 Main Street, Johannesburg", "floors": 3},
        ]
        for b in buildings_data:
            bldg, created = Building.objects.get_or_create(
                name=b["name"],
                defaults={"address": b["address"], "floors": b["floors"]},
            )
            action = "Created" if created else "Exists"
            self.stdout.write(f"  {action} building: {bldg.name}")

            # Create floor plans
            for floor in range(1, b["floors"] + 1):
                FloorPlan.objects.get_or_create(
                    building=bldg,
                    floor_number=floor,
                    defaults={"svg_data": f'<svg viewBox="0 0 800 600"><text x="10" y="30">{bldg.name} Floor {floor}</text></svg>'},
                )

    # ── Rooms ─────────────────────────────────────────────────────────
    def _seed_rooms(self):
        hq = Building.objects.get(name="HQ")
        annex = Building.objects.get(name="Annex")

        rooms_data = [
            {"id": ROOM_IDS[0], "name": "Conference Room A", "building": "HQ", "floor": 1, "capacity": 10, "amenities": ["projector", "whiteboard", "video_conference"], "status": "available", "building_ref": hq},
            {"id": ROOM_IDS[1], "name": "Conference Room B", "building": "HQ", "floor": 1, "capacity": 8, "amenities": ["whiteboard", "tv_display"], "status": "available", "building_ref": hq},
            {"id": ROOM_IDS[2], "name": "Board Room", "building": "HQ", "floor": 2, "capacity": 20, "amenities": ["projector", "video_conference", "phone", "tv_display", "air_conditioning"], "status": "available", "building_ref": hq},
            {"id": ROOM_IDS[3], "name": "Huddle Space 1", "building": "HQ", "floor": 1, "capacity": 4, "amenities": ["whiteboard"], "status": "available", "building_ref": hq},
            {"id": ROOM_IDS[4], "name": "Huddle Space 2", "building": "HQ", "floor": 2, "capacity": 4, "amenities": ["tv_display"], "status": "available", "building_ref": hq},
            {"id": ROOM_IDS[5], "name": "Training Room", "building": "Annex", "floor": 1, "capacity": 30, "amenities": ["projector", "whiteboard", "video_conference", "air_conditioning"], "status": "available", "building_ref": annex},
            {"id": ROOM_IDS[6], "name": "Meeting Room East", "building": "Annex", "floor": 2, "capacity": 12, "amenities": ["video_conference", "phone", "whiteboard"], "status": "available", "building_ref": annex},
            {"id": ROOM_IDS[7], "name": "Executive Suite", "building": "Annex", "floor": 3, "capacity": 6, "amenities": ["video_conference", "tv_display", "phone", "air_conditioning"], "status": "maintenance", "building_ref": annex},
        ]

        for r in rooms_data:
            room, created = Room.objects.get_or_create(
                id=r["id"],
                defaults={
                    "name": r["name"],
                    "building": r["building"],
                    "floor": r["floor"],
                    "capacity": r["capacity"],
                    "amenities": r["amenities"],
                    "status": r["status"],
                    "building_ref": r["building_ref"],
                },
            )
            action = "Created" if created else "Exists"
            self.stdout.write(f"  {action} room: {room.name} (id={room.id})")

    # ── Bookings ──────────────────────────────────────────────────────
    def _seed_bookings(self):
        users = list(User.objects.all())
        rooms = list(Room.objects.exclude(status="maintenance"))
        if not users or not rooms:
            self.stdout.write("  No users/rooms to seed bookings")
            return

        now = timezone.now()
        today = now.date()

        meeting_titles = [
            "Sprint Planning", "Design Review", "All Hands", "1:1 Sync",
            "Budget Review", "Product Demo", "Retrospective", "Architecture Discussion",
            "Team Standup", "Client Call", "Brainstorming Session", "Quarterly Planning",
            "Onboarding Session", "Tech Talk", "Strategy Meeting", "Project Kickoff",
        ]

        created_count = 0

        # ── Historical bookings (past 14 days) ──
        for days_ago in range(1, 15):
            d = today - timedelta(days=days_ago)
            if d.weekday() >= 5:  # skip weekends
                continue
            for room in rooms:
                # 2-4 bookings per room per day
                n_bookings = random.randint(2, 4)
                used_hours = set()
                for _ in range(n_bookings):
                    start_hour = random.choice([h for h in range(8, 17) if h not in used_hours])
                    duration_hours = random.choice([0.5, 1, 1.5, 2])
                    used_hours.add(start_hour)

                    start_dt = timezone.make_aware(
                        datetime.combine(d, time(start_hour, 0))
                    )
                    end_dt = start_dt + timedelta(hours=duration_hours)

                    organizer = random.choice(users)
                    title = random.choice(meeting_titles)

                    # Vary statuses for analytics
                    if random.random() < 0.12:
                        bk_status = "no_show"
                        checked_in = False
                    elif random.random() < 0.85:
                        bk_status = "completed"
                        checked_in = True
                    else:
                        bk_status = "completed"
                        checked_in = False

                    booking = Booking.objects.create(
                        room=room,
                        title=title,
                        organizer=organizer,
                        start_time=start_dt,
                        end_time=end_dt,
                        status=bk_status,
                        checked_in=checked_in,
                        checked_in_at=start_dt + timedelta(minutes=random.randint(1, 10)) if checked_in else None,
                    )

                    # Add 1-3 attendees
                    attendees = random.sample(users, min(random.randint(1, 3), len(users)))
                    for u in attendees:
                        if u.id != organizer.id:
                            BookingAttendee.objects.get_or_create(booking=booking, user=u)

                    created_count += 1

        # ── Today's bookings ──
        # One currently in progress (checked in) — for MeetingScreen
        in_progress_start = now - timedelta(minutes=20)
        in_progress_end = now + timedelta(minutes=40)
        bp1 = Booking.objects.create(
            room=rooms[0],  # Conference Room A (room-001)
            title="Sprint Planning Session",
            organizer=users[0],
            start_time=in_progress_start,
            end_time=in_progress_end,
            status="checked_in",
            checked_in=True,
            checked_in_at=in_progress_start + timedelta(minutes=2),
        )
        for u in users[1:3]:
            BookingAttendee.objects.get_or_create(booking=bp1, user=u)
        created_count += 1

        # One pending check-in (started but not checked in) — for CheckInScreen
        pending_start = now - timedelta(minutes=3)
        pending_end = now + timedelta(minutes=57)
        bp2 = Booking.objects.create(
            room=rooms[1],  # Conference Room B
            title="Design Review",
            organizer=users[1],
            start_time=pending_start,
            end_time=pending_end,
            status="confirmed",
            checked_in=False,
        )
        BookingAttendee.objects.get_or_create(booking=bp2, user=users[0])
        BookingAttendee.objects.get_or_create(booking=bp2, user=users[3])
        created_count += 1

        # A few upcoming meetings today
        upcoming_times = [
            (now + timedelta(hours=1), now + timedelta(hours=2)),
            (now + timedelta(hours=2, minutes=30), now + timedelta(hours=3, minutes=30)),
            (now + timedelta(hours=4), now + timedelta(hours=5)),
        ]
        for i, (s, e) in enumerate(upcoming_times):
            room = rooms[i % len(rooms)]
            organizer = users[(i + 2) % len(users)]
            bp = Booking.objects.create(
                room=room,
                title=random.choice(meeting_titles),
                organizer=organizer,
                start_time=s,
                end_time=e,
                status="confirmed",
                checked_in=False,
            )
            for u in random.sample(users, min(2, len(users))):
                if u.id != organizer.id:
                    BookingAttendee.objects.get_or_create(booking=bp, user=u)
            created_count += 1

        # An upcoming meeting specifically for room-001 (mobile idle screen next-meeting card)
        bp_next = Booking.objects.create(
            room=rooms[0],
            title="Architecture Discussion",
            organizer=users[2],
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=3),
            status="confirmed",
            checked_in=False,
        )
        BookingAttendee.objects.get_or_create(booking=bp_next, user=users[0])
        created_count += 1

        self.stdout.write(f"  Created {created_count} bookings (including historical)")
