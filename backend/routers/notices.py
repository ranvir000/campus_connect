import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from lib.db import db
from lib.auth import require_admin, get_current_user
from lib.dates import iso_now
from models.portal import Notice, NoticeCreate, NoticeUpdate

router = APIRouter(prefix="/api/notices", tags=["notices"])

@router.get("", response_model=List[Notice])
async def get_notices(
    search: Optional[str] = None,
    category: Optional[str] = None,
    all: Optional[int] = Query(0),
    user: Optional[dict] = Depends(get_current_user),
):
    query = {}
    is_admin = user and user.get("role") == "admin"

    # Only admins requesting all=1 can see unpublished drafts
    if not (is_admin and all == 1):
        query["published"] = True

    if category and category.lower() != "all":
        query["category"] = category

    cursor = db.notices.find(query).sort("created_at", -1)
    notices = await cursor.to_list(200)

    if search:
        s = search.lower().strip()
        notices = [
            n for n in notices
            if s in n.get("title", "").lower() or s in n.get("body", "").lower()
        ]

    return [Notice(**n) for n in notices]

@router.post("", response_model=Notice)
async def create_notice(payload: NoticeCreate, admin: dict = Depends(require_admin)):
    notice_id = str(uuid.uuid4())
    notice = {
        "id": notice_id,
        "title": payload.title,
        "category": payload.category,
        "body": payload.body,
        "author": admin.get("name", "Department Admin"),
        "published": payload.published,
        "created_at": iso_now(),
    }
    await db.notices.insert_one(notice)
    return Notice(**notice)

@router.put("/{notice_id}", response_model=Notice)
async def update_notice(
    notice_id: str,
    payload: NoticeUpdate,
    admin: dict = Depends(require_admin),
):
    notice = await db.notices.find_one({"id": notice_id})
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data:
        await db.notices.update_one({"id": notice_id}, {"$set": update_data})
        notice.update(update_data)

    return Notice(**notice)

@router.delete("/{notice_id}")
async def delete_notice(notice_id: str, admin: dict = Depends(require_admin)):
    res = await db.notices.delete_one({"id": notice_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notice not found")
    return {"status": "deleted"}
