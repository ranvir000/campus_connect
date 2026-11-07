from pydantic import BaseModel
from fastapi import APIRouter, Depends
from ..lib.db import db
from ..lib.auth import require_admin
from ..lib.dates import is_past_date

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AdminStats(BaseModel):
    students: int
    notices_published: int
    total_notices: int
    upcoming_events: int
    active_tickets: int
    resolved_tickets: int
    resources: int

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(admin: dict = Depends(require_admin)):
    students_count = await db.users.count_documents({"role": "student"})
    notices_published = await db.notices.count_documents({"published": True})
    total_notices = await db.notices.count_documents()

    all_events = await db.events.find().to_list(100)
    upcoming_events_count = sum(1 for e in all_events if not is_past_date(e.get("date", "")))

    active_tickets = await db.support_tickets.count_documents({"status": {"$in": ["pending", "in review", "in_review"]}})
    resolved_tickets = await db.support_tickets.count_documents({"status": "resolved"})
    resources_count = await db.resources.count_documents()

    return AdminStats(
        students=max(students_count, 1),
        notices_published=notices_published,
        total_notices=total_notices,
        upcoming_events=upcoming_events_count,
        active_tickets=active_tickets,
        resolved_tickets=resolved_tickets,
        resources=resources_count,
    )
