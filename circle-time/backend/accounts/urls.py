from django.urls import path
from accounts.views import (
    login_view,
    me_view,
    oidc_login_view,
    oidc_callback_view,
    list_users,
    send_invite,
    accept_invite,
    validate_invite_token,
    list_invitations,
    cancel_invitation,
    list_calendar_tokens,
    disconnect_calendar_token,
    calendar_token_callback,
)

urlpatterns = [
    path("login", login_view, name="auth-login"),
    path("me", me_view, name="auth-me"),
    # User management (admin)
    path("users", list_users, name="auth-users"),
    # Invitation flow
    path("invite", send_invite, name="auth-invite"),
    path("accept-invite", accept_invite, name="auth-accept-invite"),
    path("invite/<str:token>/validate", validate_invite_token, name="auth-validate-invite"),
    path("invites", list_invitations, name="auth-invitations"),
    path("invites/<uuid:invitation_id>", cancel_invitation, name="auth-cancel-invitation"),
    # Calendar token management
    path("calendar-tokens", list_calendar_tokens, name="auth-calendar-tokens"),
    path("calendar-tokens/callback", calendar_token_callback, name="auth-calendar-token-callback"),
    path("calendar-tokens/<str:provider>", disconnect_calendar_token, name="auth-disconnect-calendar"),
    # OIDC/SAML skeleton (future SSO — mints JWT after callback)
    path("oidc/login", oidc_login_view, name="auth-oidc-login"),
    path("oidc/callback", oidc_callback_view, name="auth-oidc-callback"),
]
