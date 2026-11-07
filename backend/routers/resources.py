import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from lib.db import db
from lib.auth import require_admin
from lib.dates import iso_now
from models.portal import Resource, ResourceCreate, ResourceUpdate

router = APIRouter(prefix="/api/resources", tags=["resources"])

@router.get("", response_model=List[Resource])
async def get_resources(kind: Optional[str] = Query(None)):
    query = {}
    if kind and kind.lower() != "all":
        query["kind"] = kind

    cursor = db.resources.find(query).sort("created_at", -1)
    resources = await cursor.to_list(100)
    return [Resource(**r) for r in resources]

@router.post("", response_model=Resource)
async def create_resource(payload: ResourceCreate, admin: dict = Depends(require_admin)):
    res_id = str(uuid.uuid4())
    resource = {
        "id": res_id,
        "title": payload.title,
        "kind": payload.kind,
        "subject": payload.subject,
        "url": payload.url,
        "description": payload.description,
        "created_at": iso_now(),
    }
    await db.resources.insert_one(resource)
    return Resource(**resource)

@router.put("/{resource_id}", response_model=Resource)
async def update_resource(
    resource_id: str,
    payload: ResourceUpdate,
    admin: dict = Depends(require_admin),
):
    resource = await db.resources.find_one({"id": resource_id})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if update_data:
        await db.resources.update_one({"id": resource_id}, {"$set": update_data})
        resource.update(update_data)

    return Resource(**resource)

@router.delete("/{resource_id}")
async def delete_resource(resource_id: str, admin: dict = Depends(require_admin)):
    res = await db.resources.delete_one({"id": resource_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"status": "deleted"}
