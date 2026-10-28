import base64
import hashlib
import hmac
import os
import time
from pathlib import Path

from fastapi import HTTPException, Request, status
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

SESSION_COOKIE = "portfolio_admin_session"
SESSION_DURATION = 8 * 60 * 60


def _configured_value(name: str) -> str:
    value = os.getenv(name, "")
    if not value or (name == "ADMIN_SESSION_SECRET" and len(value) < 32):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin login needs a username, password, and session secret of at least 32 characters.",
        )
    return value


def _sign(payload: str, secret: str) -> str:
    digest = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


def create_session(username: str) -> str:
    secret = _configured_value("ADMIN_SESSION_SECRET")
    expires_at = int(time.time()) + SESSION_DURATION
    payload = f"{username}:{expires_at}"
    encoded_payload = base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")
    return f"{encoded_payload}.{_sign(encoded_payload, secret)}"


def is_authenticated(request: Request) -> bool:
    token = request.cookies.get(SESSION_COOKIE, "")
    try:
        encoded_payload, signature = token.split(".", 1)
        expected_signature = _sign(
            encoded_payload, _configured_value("ADMIN_SESSION_SECRET")
        )
        if not hmac.compare_digest(signature, expected_signature):
            return False
        payload = base64.urlsafe_b64decode(
            encoded_payload + "=" * (-len(encoded_payload) % 4)
        ).decode()
        username, expires_at = payload.rsplit(":", 1)
        return (
            hmac.compare_digest(username, _configured_value("ADMIN_USERNAME"))
            and int(expires_at) > int(time.time())
        )
    except (ValueError, UnicodeDecodeError, HTTPException):
        return False


def require_admin(request: Request) -> None:
    if not is_authenticated(request):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin login required.",
        )


def credentials_match(username: str, password: str) -> bool:
    configured_username = _configured_value("ADMIN_USERNAME")
    configured_password = _configured_value("ADMIN_PASSWORD")
    return hmac.compare_digest(username, configured_username) and hmac.compare_digest(
        password, configured_password
    )


def cookie_is_secure() -> bool:
    return os.getenv("ADMIN_COOKIE_SECURE", "false").strip().lower() == "true"
