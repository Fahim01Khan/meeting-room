from django.urls import path
from .views import organisation_settings

urlpatterns = [
    path("organisation/settings", organisation_settings, name="organisation-settings"),
]
