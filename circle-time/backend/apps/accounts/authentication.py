"""
Authentication configuration.

SimpleJWT handles Bearer token authentication natively:

    Authorization: Bearer <access-token>

This module is kept as a central reference for auth decisions.
The actual JWTAuthentication class is provided by simplejwt and
configured in settings via REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"].

Why SimpleJWT:
- Industry-standard JWT library for DRF, actively maintained.
- Supports access + refresh token pair for secure token rotation.
- Uses "Bearer" prefix by default — matches the V1 API contract.
- Stateless verification (no DB lookup per request).
- Token expiry is built-in; refresh flow keeps sessions alive.
"""

# The authentication class used project-wide is:
#   rest_framework_simplejwt.authentication.JWTAuthentication
#
# It is configured in config/settings/base.py under REST_FRAMEWORK.
# No custom subclass is needed — SimpleJWT's defaults match our contract.
