from typing import Optional, List
from pydantic import BaseModel

class Subject(BaseModel):
    id: str
    code: str
    name: str
    credits: int
    faculty: str
    attendance_pct: float
    progress_pct: int
    viva_status: str

class TimetableEntry(BaseModel):
    id: str
    day: str
    day_index: int
    start: str
    end: str
    subject: str
    code: str
    room: str
    faculty: str
    kind: str

class TodaySchedule(BaseModel):
    day: str
    entries: List[TimetableEntry]

class Assignment(BaseModel):
    id: str
    title: str
    code: str
    subject: str
    due: str
    status: str
    marks: Optional[int] = None
    submitted_at: Optional[str] = None
