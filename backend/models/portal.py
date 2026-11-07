from typing import Optional
from pydantic import BaseModel, Field

# Notices
class Notice(BaseModel):
    id: str
    title: str
    category: str
    body: str
    author: str
    published: bool
    created_at: str

class NoticeCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., min_length=2)
    body: str = Field(..., min_length=5)
    published: bool = True

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    body: Optional[str] = None
    published: Optional[bool] = None

# Events
class Event(BaseModel):
    id: str
    title: str
    club: str
    category: str
    description: str
    venue: str
    date: str
    capacity: int
    registered: Optional[bool] = None
    registered_count: int = 0
    is_past: bool = False

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3)
    club: str = Field(..., min_length=2)
    category: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)
    venue: str = Field(..., min_length=2)
    date: str
    capacity: int = Field(..., gt=0)

class EventUpdate(BaseModel):
    title: Optional[str] = None
    club: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    date: Optional[str] = None
    capacity: Optional[int] = None

# Resources
class Resource(BaseModel):
    id: str
    title: str
    kind: str
    subject: str
    url: str
    description: str
    created_at: str

class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=3)
    kind: str = Field(..., min_length=2)
    subject: str = Field(..., min_length=2)
    url: str = Field(..., min_length=5)
    description: str = Field(..., min_length=5)

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    kind: Optional[str] = None
    subject: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
