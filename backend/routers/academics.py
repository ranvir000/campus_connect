from typing import List
from fastapi import APIRouter, HTTPException, Depends
from ..lib.db import db
from ..lib.auth import require_user
from ..lib.dates import today_ist_day_name, iso_now
from ..models.academics import Subject, TimetableEntry, TodaySchedule, Assignment

router = APIRouter(prefix="/api/academics", tags=["academics"])

@router.get("/subjects", response_model=List[Subject])
async def get_subjects(user: dict = Depends(require_user)):
    subjects = await db.subjects.find().to_list(100)
    return [Subject(**s) for s in subjects]

@router.get("/timetable", response_model=List[TimetableEntry])
async def get_timetable(user: dict = Depends(require_user)):
    cursor = db.timetable.find().sort([("day_index", 1), ("start", 1)])
    entries = await cursor.to_list(100)
    return [TimetableEntry(**e) for e in entries]

@router.get("/today", response_model=TodaySchedule)
async def get_today_timetable(user: dict = Depends(require_user)):
    current_day = today_ist_day_name()
    cursor = db.timetable.find({"day": current_day}).sort("start", 1)
    entries = await cursor.to_list(100)
    return TodaySchedule(day=current_day, entries=[TimetableEntry(**e) for e in entries])

@router.get("/assignments", response_model=List[Assignment])
async def get_assignments(user: dict = Depends(require_user)):
    cursor = db.assignments.find().sort("due", 1)
    assignments = await cursor.to_list(100)
    return [Assignment(**a) for a in assignments]

@router.post("/assignments/{assignment_id}/submit", response_model=Assignment)
async def submit_assignment(assignment_id: str, user: dict = Depends(require_user)):
    assignment = await db.assignments.find_one({"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending assignments can be submitted.")

    now = iso_now()
    await db.assignments.update_one(
        {"id": assignment_id},
        {"$set": {"status": "submitted", "submitted_at": now}}
    )
    assignment["status"] = "submitted"
    assignment["submitted_at"] = now
    return Assignment(**assignment)
