from django.urls import path
from rooms.views import (
    list_rooms,
    create_room,
    get_room,
    update_room,
    delete_room,
    room_availability,
    book_adhoc,
    list_buildings,
    get_floor_plan,
)

urlpatterns = [
    path("rooms", list_rooms, name="rooms-list"),
    path("rooms/new", create_room, name="rooms-create"),
    path("rooms/<uuid:room_id>", get_room, name="rooms-detail"),
    path("rooms/<uuid:room_id>/edit", update_room, name="rooms-update"),
    path("rooms/<uuid:room_id>/delete", delete_room, name="rooms-delete"),
    path("rooms/<uuid:room_id>/availability", room_availability, name="rooms-availability"),
    path("rooms/<uuid:room_id>/book-adhoc", book_adhoc, name="rooms-book-adhoc"),
    path("buildings", list_buildings, name="buildings-list"),
    path("buildings/<uuid:building_id>/floors/<int:floor_num>", get_floor_plan, name="floor-plan"),
]
