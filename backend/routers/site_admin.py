import uuid
from typing import Optional
from pydantic import BaseModel, Field, field_validator
import re
from fastapi import APIRouter, Depends, HTTPException
from lib.auth import hash_password, require_site_admin
from lib.db import db

router = APIRouter(prefix="/api/site-admin/accounts", tags=["site-admin"])

class AccountCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: str
    roll_no: Optional[str] = Field(default="", max_length=40)
    branch: Optional[str] = Field(default="", max_length=100)
    semester: Optional[str] = Field(default="", max_length=40)
    batch: Optional[str] = ""
    cgpa: Optional[str] = ""
    attendance: Optional[str] = ""
    designation: Optional[str] = Field(default="", max_length=100)
    @field_validator("role")
    @classmethod
    def valid_role(cls, value):
        if value not in {"student", "faculty"}:
            raise ValueError("Only student and faculty accounts can be created.")
        return value
    @field_validator("email")
    @classmethod
    def normalized_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value):
            raise ValueError("A valid email address is required.")
        return value
    @field_validator("roll_no")
    @classmethod
    def require_roll_for_student(cls, value, info):
        if info.data.get("role") == "student" and not (value or "").strip():
            raise ValueError("Student roll number is required.")
        return value

class StatusUpdate(BaseModel):
    is_active: bool

def sanitized(user):
    return {k: v for k, v in user.items() if k not in {"password_hash", "_id"}}

@router.get("")
async def list_accounts(_: dict = Depends(require_site_admin)):
    users = await db.users.find().sort("name", 1).to_list(10000)
    return [sanitized(u) for u in users if u.get("role") in {"student", "faculty"}]

@router.post("")
async def create_account(payload: AccountCreate, _: dict = Depends(require_site_admin)):
    email = str(payload.email).strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already exists.")
    if payload.role == "student" and not (payload.roll_no or "").strip():
        raise HTTPException(status_code=422, detail="Student roll number is required.")
    user = payload.model_dump()
    user.update(id=str(uuid.uuid4()), email=email, password_hash=hash_password(user.pop("password")), is_active=True)
    await db.users.insert_one(user)
    return sanitized(user)

@router.patch("/{account_id}")
@router.patch("/{account_id}/status")
async def update_status(account_id: str, payload: StatusUpdate, _: dict = Depends(require_site_admin)):
    user = await db.users.find_one({"id": account_id})
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only student accounts can be suspended or reactivated.")
    await db.users.update_one({"id": account_id}, {"$set": {"is_active": payload.is_active}})
    if not payload.is_active:
        await db.sessions.delete_many({"user_id": account_id})
    user["is_active"] = payload.is_active
    return sanitized(user)

@router.delete("/{account_id}")
async def delete_account(account_id: str, _: dict = Depends(require_site_admin)):
    user = await db.users.find_one({"id": account_id})
    if not user:
        raise HTTPException(status_code=404, detail="Account not found.")
    if user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Only student accounts can be deleted.")
    await db.sessions.delete_many({"user_id": account_id})
    await db.event_registrations.delete_many({"student_id": account_id})
    await db.users.delete_one({"id": account_id})
    return {"status": "deleted"}
