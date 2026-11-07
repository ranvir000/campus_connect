from fastapi import APIRouter, HTTPException, Response, Request, Depends
from ..lib.db import db
from ..lib.auth import (
    hash_password,
    verify_password,
    create_session,
    delete_session,
    get_current_user,
    SESSION_COOKIE,
)
from ..models.auth import LoginPayload, SessionUser, AuthMeResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=SessionUser)
async def login(payload: LoginPayload, response: Response):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = await create_session(user["id"])
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
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
    return {"status": "ok"}

@router.get("/me", response_model=AuthMeResponse)
async def me(user: dict = Depends(get_current_user)):
    if not user:
        return AuthMeResponse(user=None)
    return AuthMeResponse(user=SessionUser(**user))
