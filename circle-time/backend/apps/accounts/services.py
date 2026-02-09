"""
Accounts service layer.

Business logic for authentication and user management lives here,
keeping views thin and making future async migration straightforward.
"""

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


def authenticate_user(email: str, password: str) -> tuple[dict, User] | None:
    """
    Validate credentials and return (tokens_dict, user) or None.

    Called by LoginView. Issues a new JWT access + refresh pair.
    """
    user = authenticate(username=email, password=password)
    if user is None:
        return None
    refresh = RefreshToken.for_user(user)
    tokens = {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
    return tokens, user


# TODO: add password-reset service when that flow is implemented
