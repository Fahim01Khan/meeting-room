from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers import LoginSerializer, UserSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login
    Authenticate user with email + password, return access+refresh JWT + user profile.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"success": False, "message": "Missing email or password"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    user = authenticate(request, email=email, password=password)
    if user is None:
        return Response(
            {"success": False, "message": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)
    user_data = UserSerializer(user).data

    return Response(
        {
            "success": True,
            "data": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": user_data,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET /api/auth/me
    Return the authenticated user's profile.
    """
    user_data = UserSerializer(request.user).data
    return Response(
        {"success": True, "data": user_data},
        status=status.HTTP_200_OK,
    )


# ---------------------------------------------------------------------------
# OIDC / SAML skeleton endpoints (future SSO)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([AllowAny])
def oidc_login_view(request):
    """
    GET /api/auth/oidc/login
    In production: redirect to identity provider authorisation URL.
    In local mode: return a stub response.
    """
    if getattr(settings, "PROVIDER_MODE", "local") == "local":
        return Response(
            {
                "success": False,
                "message": "OIDC login is not available in local mode. Use POST /api/auth/login.",
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    # TODO: Build OIDC authorization URL and redirect
    return Response(
        {"success": False, "message": "OIDC provider not configured"},
        status=status.HTTP_501_NOT_IMPLEMENTED,
    )


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def oidc_callback_view(request):
    """
    GET/POST /api/auth/oidc/callback
    In production: exchange authorization code for ID token, find-or-create
    local user, and mint a JWT.
    In local mode: return a stub response.
    """
    if getattr(settings, "PROVIDER_MODE", "local") == "local":
        return Response(
            {
                "success": False,
                "message": "OIDC callback is not available in local mode.",
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    # TODO: Exchange code → id_token, extract user claims, upsert User,
    #       mint JWT via RefreshToken.for_user(user), return tokens.
    return Response(
        {"success": False, "message": "OIDC callback not implemented"},
        status=status.HTTP_501_NOT_IMPLEMENTED,
    )
