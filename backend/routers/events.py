import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from lib.db import db
from lib.auth import require_admin, require_user, get_current_user
from lib.dates import iso_now, is_past_date
from models.portal import Event, EventCreate, EventUpdate

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("", response_model=List[Event])
async def get_events(
    scope: Optional[str] = Query("upcoming"),
    user: Optional[dict] = Depends(get_current_user),
):
    cursor = db.events.find().sort("date", 1)
    events = await cursor.to_list(100)

    user_id = user.get("id") if user else None
    user_registrations = set()
    if user_id:
        regs = await db.event_registrations.find({"student_id": user_id}).to_list(100)
        user_registrations = {r["event_id"] for r in regs}

    result = []
    for ev in events:
        ev_id = ev["id"]
        reg_count = await db.event_registrations.count_documents({"event_id": ev_id})
        past = is_past_date(ev["date"])

        is_registered = (ev_id in user_registrations) if user_id else None

        ev_dict = dict(ev)
        ev_dict["registered_count"] = reg_count
        ev_dict["registered"] = is_registered
        ev_dict["is_past"] = past

        if scope == "upcoming" and past:
            continue

        result.append(Event(**ev_dict))

    return result

@router.post("/{event_id}/register")
async def register_event(event_id: str, user: dict = Depends(require_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if is_past_date(event["date"]):
        raise HTTPException(status_code=400, detail="Registration closed: this event has already taken place.")

    # Check capacity
    count = await db.event_registrations.count_documents({"event_id": event_id})
    if count >= event.get("capacity", 0):
        raise HTTPException(status_code=400, detail="Event is already full.")

    # Check if already registered
    existing = await db.event_registrations.find_one({
        "event_id": event_id,
        "student_id": user["id"],
    })
    if existing:
        return {"status": "already_registered", "registered_count": count}

    await db.event_registrations.insert_one({
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "student_id": user["id"],
        "student_name": user.get("name", "Student"),
        "registered_at": iso_now(),
    })

    return {"status": "registered", "registered_count": count + 1}

@router.delete("/{event_id}/register")
async def cancel_registration(event_id: str, user: dict = Depends(require_user)):
    await db.event_registrations.delete_many({
        "event_id": event_id,
        "student_id": user["id"],
    })
    count = await db.event_registrations.count_documents({"event_id": event_id})
    return {"status": "unregistered", "registered_count": count}

@router.post("", response_model=Event)
async def create_event(payload: EventCreate, admin: dict = Depends(require_admin)):
    event_id = str(uuid.uuid4())
    event = {
        "id": event_id,
        "title": payload.title,
        "club": payload.club,
        "category": payload.category,
        "description": payload.description,
        "venue": payload.venue,
        "date": payload.date,
        "capacity": payload.capacity,
    }
    await db.events.insert_one(event)
    ev_dict = dict(event)
    ev_dict["registered_count"] = 0
    ev_dict["registered"] = False
    ev_dict["is_past"] = is_past_date(payload.date)
    return Event(**ev_dict)

@router.put("/{event_id}", response_model=Event)
async def update_event(
    event_id: str,
    payload: EventUpdate,
    admin: dict = Depends(require_admin),
):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
        event.update(update_data)

    reg_count = await db.event_registrations.count_documents({"event_id": event_id})
    ev_dict = dict(event)
    ev_dict["registered_count"] = reg_count
    ev_dict["registered"] = False
    ev_dict["is_past"] = is_past_date(event.get("date", ""))
    return Event(**ev_dict)

@router.delete("/{event_id}")
async def delete_event(event_id: str, admin: dict = Depends(require_admin)):
    res = await db.events.delete_one({"id": event_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.event_registrations.delete_many({"event_id": event_id})
    return {"status": "deleted"}
