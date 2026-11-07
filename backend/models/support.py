from typing import Optional, List
from pydantic import BaseModel, Field

class TicketUpdate(BaseModel):
    status: str
    note: str
    at: str
    by: str

class SupportTicket(BaseModel):
    id: str
    student_id: str
    student_name: str
    roll_no: str
    category: str
    subject: str
    priority: str
    description: str
    status: str
    created_at: str
    updates: List[TicketUpdate] = []

class SupportTicketCreate(BaseModel):
    category: str = Field(..., min_length=2)
    subject: str = Field(..., min_length=3, max_length=200)
    priority: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)

class SupportTicketPatch(BaseModel):
    status: str
    note: Optional[str] = ""
