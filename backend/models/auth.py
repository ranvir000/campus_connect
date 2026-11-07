from typing import Optional
from pydantic import BaseModel

class LoginPayload(BaseModel):
    email: str
    password: str

class SessionUser(BaseModel):
    id: str
    name: str
    email: str
    role: str
    roll_no: Optional[str] = ""
    branch: Optional[str] = ""
    semester: Optional[str] = ""
    batch: Optional[str] = ""
    cgpa: Optional[str] = ""
    attendance: Optional[str] = ""
    designation: Optional[str] = ""

class AuthMeResponse(BaseModel):
    user: Optional[SessionUser] = None
