import logging
import secrets

from django.contrib.auth import authenticate
from django.conf import settings
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserInvitation, CalendarToken
from accounts.serializers import LoginSerializer, UserSerializer

logger = logging.getLogger(__name__)


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


# ---------------------------------------------------------------------------
# User management (admin)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_users(request):
    """
    GET /api/auth/users
    List all users (excluding kiosk system user). Admin only.
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    users = User.objects.exclude(email="kiosk@circletime.io").order_by("name")
    data = []
    for u in users:
        data.append({
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "department": u.department,
            "dateJoined": u.date_joined.isoformat(),
        })

    return Response(
        {"success": True, "data": data},
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    """
    DELETE /api/auth/users/<uuid:user_id>
    Delete a user. Admin only. Cannot delete yourself or the kiosk user.
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if str(request.user.id) == str(user_id):
        return Response(
            {"success": False, "message": "You cannot delete your own account"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"success": False, "message": "User not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if user.email == "kiosk@circletime.io":
        return Response(
            {"success": False, "message": "Cannot delete the kiosk system user"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.delete()

    return Response(
        {"success": True},
        status=status.HTTP_200_OK,
    )


# ---------------------------------------------------------------------------
# Invitation endpoints
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_invite(request):
    """
    POST /api/auth/invite
    Send an email invitation. Admin only.
    Body: { email, role?, department? }
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    email = (request.data.get("email") or "").strip().lower()
    role = request.data.get("role", "user")
    department = request.data.get("department", "").strip() or None

    # Validate email format
    try:
        validate_email(email)
    except ValidationError:
        return Response(
            {"success": False, "message": "Invalid email address."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check email not already a user
    if User.objects.filter(email=email).exists():
        return Response(
            {"success": False, "message": "A user with this email already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    # Check no pending non-expired invitation for this email
    pending = UserInvitation.objects.filter(
        email=email,
        status="pending",
        expires_at__gt=timezone.now(),
    ).exists()
    if pending:
        return Response(
            {"success": False, "message": "A pending invitation for this email already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    # Validate role
    if role not in ("admin", "user"):
        role = "user"

    # Create invitation
    invitation = UserInvitation(
        email=email,
        invited_by=request.user,
        role=role,
        department=department,
        token=secrets.token_urlsafe(48),
    )
    invitation.save()

    # Send invite email
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    invite_link = f"{frontend_url}/accept-invite?token={invitation.token}"
    subject = "You've been invited to Circle Time"
    body = (
        f"Hi,\n\n"
        f"You've been invited to join Circle Time as a {invitation.role}.\n\n"
        f"Click the link below to set up your account:\n"
        f"{invite_link}\n\n"
        f"This link expires in 48 hours.\n\n"
        f"— The Circle Time Team"
    )

    try:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error("Failed to send invite email to %s: %s", email, exc)

    return Response(
        {
            "success": True,
            "data": {
                "id": str(invitation.id),
                "email": invitation.email,
                "role": invitation.role,
                "expiresAt": invitation.expires_at.isoformat(),
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def accept_invite(request):
    """
    POST /api/auth/accept-invite
    Accept an invitation and create the user account.
    Body: { token, name, password }
    """
    token = (request.data.get("token") or "").strip()
    name = (request.data.get("name") or "").strip()
    password = request.data.get("password", "")

    if not token or not name or not password:
        return Response(
            {"success": False, "message": "Token, name, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {"success": False, "message": "Password must be at least 8 characters."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        invitation = UserInvitation.objects.get(token=token)
    except UserInvitation.DoesNotExist:
        return Response(
            {"success": False, "message": "Invalid invitation token."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if invitation.status != "pending":
        return Response(
            {"success": False, "message": "This invitation has already been used or cancelled."},
            status=status.HTTP_410_GONE,
        )

    if invitation.is_expired:
        invitation.status = "expired"
        invitation.save(update_fields=["status"])
        return Response(
            {"success": False, "message": "This invitation has expired."},
            status=status.HTTP_410_GONE,
        )

    # Check email not already taken (race condition guard)
    if User.objects.filter(email=invitation.email).exists():
        return Response(
            {"success": False, "message": "A user with this email already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    # Create user
    user = User.objects.create_user(
        email=invitation.email,
        password=password,
        name=name,
        role=invitation.role,
        department=invitation.department,
    )

    # Mark invitation as accepted
    invitation.status = "accepted"
    invitation.accepted_at = timezone.now()
    invitation.save(update_fields=["status", "accepted_at"])

    return Response(
        {
            "success": True,
            "data": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def validate_invite_token(request, token):
    """
    GET /api/auth/invite/<token>/validate
    Validate an invitation token before the user fills out the acceptance form.
    """
    try:
        invitation = UserInvitation.objects.get(token=token)
    except UserInvitation.DoesNotExist:
        return Response(
            {"success": False, "message": "Invitation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if invitation.status != "pending" or invitation.is_expired:
        if invitation.status == "pending" and invitation.is_expired:
            invitation.status = "expired"
            invitation.save(update_fields=["status"])
        return Response(
            {"success": False, "message": "This invitation has expired or been used."},
            status=status.HTTP_410_GONE,
        )

    return Response(
        {
            "success": True,
            "data": {
                "email": invitation.email,
                "role": invitation.role,
                "valid": True,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_invitations(request):
    """
    GET /api/auth/invites
    List all invitations. Admin only.
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    invitations = UserInvitation.objects.select_related("invited_by").all()
    data = []
    for inv in invitations:
        # Auto-expire stale pending invitations on read
        if inv.status == "pending" and inv.is_expired:
            inv.status = "expired"
            inv.save(update_fields=["status"])

        data.append({
            "id": str(inv.id),
            "email": inv.email,
            "role": inv.role,
            "department": inv.department,
            "status": inv.status,
            "invitedBy": inv.invited_by.name if inv.invited_by else None,
            "createdAt": inv.created_at.isoformat(),
            "expiresAt": inv.expires_at.isoformat(),
            "acceptedAt": inv.accepted_at.isoformat() if inv.accepted_at else None,
        })

    return Response(
        {"success": True, "data": data},
        status=status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_invitation(request, invitation_id):
    """
    DELETE /api/auth/invites/<id>
    Cancel a pending invitation. Admin only.
    """
    if request.user.role != "admin":
        return Response(
            {"success": False, "message": "Admin access required"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        invitation = UserInvitation.objects.get(id=invitation_id)
    except (UserInvitation.DoesNotExist, ValueError):
        return Response(
            {"success": False, "message": "Invitation not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if invitation.status != "pending":
        return Response(
            {"success": False, "message": "Only pending invitations can be cancelled."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    invitation.status = "expired"
    invitation.save(update_fields=["status"])

    return Response(
        {"success": True},
        status=status.HTTP_200_OK,
    )


# ---------------------------------------------------------------------------
# Calendar token management
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_calendar_tokens(request):
    """
    GET /api/auth/calendar-tokens
    Returns the current user's connected calendar providers.
    """
    tokens = CalendarToken.objects.filter(user=request.user)
    data = []
    for t in tokens:
        data.append({
            "provider": t.provider,
            "calendarId": t.calendar_id,
            "tokenExpiry": t.token_expiry.isoformat() if t.token_expiry else None,
            "connected": True,
            "expired": t.token_expiry < timezone.now() if t.token_expiry else False,
        })

    return Response(
        {"success": True, "data": data},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def get_auth_url(request, provider):
    """
    GET /api/auth/calendar-tokens/<provider>/auth-url
    Returns the OAuth URL to redirect the user to.
    Query param: state (optional, for tracking)
    """
    from accounts.oauth_providers import build_auth_url

    valid_providers = ['google', 'microsoft', 'zoho']
    if provider not in valid_providers:
        return Response(
            {"success": False, "message": f"Unknown provider: {provider}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    state = request.query_params.get('state', secrets.token_urlsafe(16))
    try:
        url = build_auth_url(provider, state)
        return Response({"success": True, "data": {"authUrl": url, "state": state}})
    except Exception as e:
        logger.error(f"Auth URL error for {provider}: {e}")
        return Response(
            {"success": False, "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def calendar_token_callback(request):
    """
    GET /api/auth/calendar-tokens/callback
    Handles the OAuth redirect from providers.
    Exchanges code for tokens, saves to DB, redirects to frontend.
    """
    from django.shortcuts import redirect as http_redirect
    from datetime import timedelta
    from accounts.oauth_providers import exchange_code_for_tokens

    code = request.query_params.get('code')
    state = request.query_params.get('state', '')
    error = request.query_params.get('error')

    frontend_url = settings.FRONTEND_URL

    if error:
        return http_redirect(f"{frontend_url}/admin/settings?calendar=error&reason={error}")

    if not code:
        return http_redirect(f"{frontend_url}/admin/settings?calendar=error&reason=no_code")

    # State format: "provider:random_state"
    provider = state.split(':')[0] if ':' in state else None
    if not provider:
        return http_redirect(f"{frontend_url}/admin/settings?calendar=error&reason=invalid_state")

    try:
        token_data = exchange_code_for_tokens(provider, code)
    except Exception as e:
        logger.error(f"Token exchange failed for {provider}: {e}")
        return http_redirect(f"{frontend_url}/admin/settings?calendar=error&reason=token_exchange")

    # For now, save against the first admin user
    # (tablet-initiated OAuth doesn't have a user session)
    # In production this would use the state param to link to a user
    admin_user = User.objects.filter(role='admin').first()
    if not admin_user:
        return http_redirect(f"{frontend_url}/admin/settings?calendar=error&reason=no_admin")

    # Calculate expiry
    expires_in = token_data.get('expires_in', 3600)
    token_expiry = timezone.now() + timedelta(seconds=expires_in)

    # Save or update token
    CalendarToken.objects.update_or_create(
        user=admin_user,
        provider=provider,
        defaults={
            'access_token':  token_data.get('access_token', ''),
            'refresh_token': token_data.get('refresh_token', ''),
            'token_expiry':  token_expiry,
            'scope':         token_data.get('scope', ''),
        }
    )

    logger.info(f"Calendar connected: {provider} for {admin_user.email}")
    return http_redirect(f"{frontend_url}/admin/settings?calendar=connected&provider={provider}")


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def disconnect_calendar_token(request, provider):
    """
    DELETE /api/auth/calendar-tokens/<provider>
    Disconnects a calendar provider for the current user.
    """
    valid_providers = [c[0] for c in CalendarToken.PROVIDER_CHOICES]
    if provider not in valid_providers:
        return Response(
            {"success": False, "message": f"Invalid provider. Must be one of: {valid_providers}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    deleted, _ = CalendarToken.objects.filter(
        user=request.user, provider=provider
    ).delete()

    if deleted == 0:
        return Response(
            {"success": False, "message": "No connection found for this provider."},
            status=status.HTTP_404_NOT_FOUND,
        )

    return Response(
        {"success": True},
        status=status.HTTP_200_OK,
    )
