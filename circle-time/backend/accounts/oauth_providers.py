from django.conf import settings

PROVIDERS = {
    'google': {
        'auth_url':  'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'client_id':     settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,
        'scopes': [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ],
    },
    'microsoft': {
        'auth_url':  f'https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize',
        'token_url': f'https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/oauth2/v2.0/token',
        'client_id':     settings.MICROSOFT_CLIENT_ID,
        'client_secret': settings.MICROSOFT_CLIENT_SECRET,
        'scopes': [
            'https://graph.microsoft.com/Calendars.ReadWrite',
            'offline_access',
        ],
    },
    'zoho': {
        'auth_url':  'https://accounts.zoho.com/oauth/v2/auth',
        'token_url': 'https://accounts.zoho.com/oauth/v2/token',
        'client_id':     settings.ZOHO_CLIENT_ID,
        'client_secret': settings.ZOHO_CLIENT_SECRET,
        'scopes': [
            'ZohoCalendar.event.ALL',
            'ZohoCalendar.calendar.ALL',
        ],
    },
}


def get_provider(provider: str) -> dict:
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown provider: {provider}")
    return PROVIDERS[provider]


def build_auth_url(provider: str, state: str) -> str:
    """Build the OAuth redirect URL for a provider."""
    from urllib.parse import urlencode
    cfg = get_provider(provider)
    params = {
        'client_id':     cfg['client_id'],
        'redirect_uri':  settings.CALENDAR_REDIRECT_URI,
        'response_type': 'code',
        'scope':         ' '.join(cfg['scopes']),
        'state':         f"{provider}:{state}",
        'access_type':   'offline',   # Google needs this for refresh token
        'prompt':        'consent',   # Force consent to always get refresh token
    }
    # Zoho uses different param name
    if provider == 'zoho':
        params['access_type'] = 'offline'
    return cfg['auth_url'] + '?' + urlencode(params)


def exchange_code_for_tokens(provider: str, code: str) -> dict:
    """Exchange auth code for access + refresh tokens."""
    import requests as req
    cfg = get_provider(provider)
    data = {
        'code':          code,
        'client_id':     cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'redirect_uri':  settings.CALENDAR_REDIRECT_URI,
        'grant_type':    'authorization_code',
    }
    resp = req.post(cfg['token_url'], data=data, timeout=10)
    resp.raise_for_status()
    return resp.json()
    # Returns: { access_token, refresh_token, expires_in, ... }
