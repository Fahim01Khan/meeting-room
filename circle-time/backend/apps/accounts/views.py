"""
Account views — login, token refresh, and current-user profile.

These are thin wrappers; business logic lives in services.py.
"""

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.responses import error_response, success_response

from .serializers import LoginSerializer, RefreshSerializer, UserSerializer
from .services import authenticate_user


class LoginView(APIView):
    """
    POST /api/auth/login

    Authenticate with email + password and receive JWT tokens.

    The response includes both an access token (short-lived) and a refresh
    token (long-lived). The frontend should store the refresh token securely
    and use it to obtain new access tokens via /api/auth/refresh.

    The ``token`` field is an alias for ``access`` to maintain backward
    compatibility with frontends that expect a single token field.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Missing or invalid fields",
                code="validation_error",
                errors=[str(v[0]) for v in serializer.errors.values()],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        result = authenticate_user(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if result is None:
            return error_response(
                message="Invalid credentials",
                code="unauthorized",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        tokens, user = result
        return success_response(
            data={
                "token": tokens["access"],      # backward-compat alias
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": UserSerializer(user).data,
            }
        )


class RefreshView(APIView):
    """
    POST /api/auth/refresh

    Exchange a valid refresh token for a new access + refresh pair.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message="Refresh token is required",
                code="validation_error",
                errors=[str(v[0]) for v in serializer.errors.values()],
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            refresh = RefreshToken(serializer.validated_data["refresh"])
            data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        except (TokenError, InvalidToken):
            return error_response(
                message="Invalid or expired refresh token",
                code="unauthorized",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        return success_response(data=data)


class MeView(APIView):
    """
    GET /api/auth/me

    Return the authenticated user's profile.
    """

    def get(self, request):
        return success_response(data=UserSerializer(request.user).data)
