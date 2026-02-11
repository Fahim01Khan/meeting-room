from django.urls import path
from accounts.views import login_view, me_view, oidc_login_view, oidc_callback_view

urlpatterns = [
    path("login", login_view, name="auth-login"),
    path("me", me_view, name="auth-me"),
    # OIDC/SAML skeleton (future SSO — mints JWT after callback)
    path("oidc/login", oidc_login_view, name="auth-oidc-login"),
    path("oidc/callback", oidc_callback_view, name="auth-oidc-callback"),
]
