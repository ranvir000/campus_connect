import os
import time
from secrets import token_urlsafe
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from lib.db import db
from lib.auth import (
    hash_password,
    verify_password,
    create_session,
    delete_session,
    get_current_user,
    SESSION_COOKIE,
)
from models.auth import LoginPayload, SessionUser, AuthMeResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
_failed_logins: dict[str, list[float]] = {}
_RATE_WINDOW_SECONDS = 600
_MAX_FAILED_ATTEMPTS = 5

@router.post("/login", response_model=SessionUser)
async def login(payload: LoginPayload, response: Response, request: Request):
    key = f"{request.client.host if request.client else 'unknown'}:{payload.email.lower()}"
    now = time.monotonic()
    attempts = [stamp for stamp in _failed_logins.get(key, []) if now - stamp < _RATE_WINDOW_SECONDS]
    if len(attempts) >= _MAX_FAILED_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in a few minutes.")
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        attempts.append(now)
        _failed_logins[key] = attempts
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    _failed_logins.pop(key, None)

    token = await create_session(user["id"])
    csrf_token = token_urlsafe(32)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=os.getenv("ENVIRONMENT", "development").lower() == "production",
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        secure=os.getenv("ENVIRONMENT", "development").lower() == "production",
        samesite="lax",
        max_age=7 * 24 * 3600,
        path="/",
    )
    return SessionUser(**user)

@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        await delete_session(token)
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    response.delete_cookie(key="csrf_token", path="/")
    return {"status": "ok"}

@router.get("/me", response_model=AuthMeResponse)
async def me(user: dict = Depends(get_current_user)):
    if not user:
        return AuthMeResponse(user=None)
    return AuthMeResponse(user=SessionUser(**user))
