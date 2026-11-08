import os
import hashlib
import hmac
import secrets
from datetime import timedelta
from typing import Optional
from fastapi import Request, HTTPException, Depends
from lib.db import db
from lib.dates import iso_now, now_ist, parse_iso

SESSION_COOKIE = "session_token"
PBKDF2_ITERATIONS = 100_000
SESSION_TTL = timedelta(days=7)

def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a random 16-byte salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{salt.hex()}${key.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against the stored PBKDF2 hash using constant-time comparison."""
    try:
        parts = hashed.split("$")
        if len(parts) != 2:
            return False
        salt = bytes.fromhex(parts[0])
        expected_key = bytes.fromhex(parts[1])
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
        return hmac.compare_digest(key, expected_key)
    except Exception:
        return False

async def create_session(user_id: str) -> str:
    """Create a new 256-bit session token stored in the sessions collection."""
    token = secrets.token_hex(32)
    await db.sessions.insert_one({
        "id": token,
        "token": token,
        "user_id": user_id,
        "created_at": iso_now(),
        "expires_at": (now_ist() + SESSION_TTL).isoformat(),
    })
    return token

async def delete_session(token: str) -> None:
    """Invalidate a session on logout."""
    await db.sessions.delete_one({"token": token})

async def get_current_user(request: Request) -> Optional[dict]:
    """Retrieve the current user from session cookie or Authorization header."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    session = await db.sessions.find_one({"token": token})
    if not session:
        return None

    # Reject expired sessions server-side, even if the client retains its cookie.
    # The created_at fallback keeps sessions from older deployments compatible.
    expires_at = session.get("expires_at")
    if not expires_at and session.get("created_at"):
        expires_at = (parse_iso(session["created_at"]) + SESSION_TTL).isoformat()
    if expires_at:
        try:
            if parse_iso(expires_at) <= now_ist():
                await delete_session(token)
                return None
        except (TypeError, ValueError):
            await delete_session(token)
            return None

    user = await db.users.find_one({"id": session["user_id"]})
    return user

async def require_user(user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependency that mandates an authenticated session (401 if missing)."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    return user

async def require_admin(user: dict = Depends(require_user)) -> dict:
    """Dependency that restricts access to administrators (403 if student)."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Administrator access required.")
    return user

async def require_student(user: dict = Depends(require_user)) -> dict:
    """Dependency that restricts access to students."""
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Forbidden: Student access required.")
    return user
