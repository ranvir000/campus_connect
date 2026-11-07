import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from lib.db import db
from lib.auth import require_admin, require_user
from lib.dates import iso_now
from models.support import SupportTicket, SupportTicketCreate, SupportTicketPatch

router = APIRouter(prefix="/api/support", tags=["support"])

@router.post("", response_model=SupportTicket)
async def create_support_ticket(
    payload: SupportTicketCreate,
    user: dict = Depends(require_user),
):
    ticket_id = str(uuid.uuid4())
    now = iso_now()
    ticket = {
        "id": ticket_id,
        "student_id": user["id"],
        "student_name": user.get("name", "Student"),
        "roll_no": user.get("roll_no", ""),
        "category": payload.category,
        "subject": payload.subject,
        "priority": payload.priority,
        "description": payload.description,
        "status": "pending",
        "created_at": now,
        "updates": [
            {
                "status": "pending",
                "note": "Request received at the CSE department helpdesk.",
                "at": now,
                "by": "System",
            }
        ],
    }
    await db.support_tickets.insert_one(ticket)
    return SupportTicket(**ticket)

@router.get("/mine", response_model=List[SupportTicket])
async def get_my_tickets(user: dict = Depends(require_user)):
    cursor = db.support_tickets.find({"student_id": user["id"]}).sort("created_at", -1)
    tickets = await cursor.to_list(100)
    return [SupportTicket(**t) for t in tickets]

@router.get("", response_model=List[SupportTicket])
async def get_all_tickets(
    status: Optional[str] = Query(None),
    admin: dict = Depends(require_admin),
):
    query = {}
    if status and status.lower() != "all":
        query["status"] = status.lower()

    cursor = db.support_tickets.find(query).sort("created_at", -1)
    tickets = await cursor.to_list(200)
    return [SupportTicket(**t) for t in tickets]

@router.patch("/{ticket_id}", response_model=SupportTicket)
async def update_ticket_status(
    ticket_id: str,
    payload: SupportTicketPatch,
    admin: dict = Depends(require_admin),
):
    ticket = await db.support_tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found")

    now = iso_now()
    note_text = payload.note.strip() if payload.note else f"Status changed to {payload.status.title()}."
    update_entry = {
        "status": payload.status.lower(),
        "note": note_text,
        "at": now,
        "by": admin.get("name", "Department Admin"),
    }

    if "updates" not in ticket or not isinstance(ticket["updates"], list):
        ticket["updates"] = []

    ticket["updates"].append(update_entry)
    ticket["status"] = payload.status.lower()

    await db.support_tickets.update_one(
        {"id": ticket_id},
        {
            "$set": {"status": payload.status.lower()},
            "$push": {"updates": update_entry},
        },
    )

    return SupportTicket(**ticket)
