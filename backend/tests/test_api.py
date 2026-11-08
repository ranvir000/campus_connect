import pytest
from httpx import AsyncClient, ASGITransport
from backend.server import app
from backend.lib.db import db
from backend.seed import seed_database

@pytest.fixture(autouse=True)
async def setup_db():
    await db.init()
    await seed_database(force=True)

@pytest.mark.asyncio
async def test_student_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "email": "aman.cse084@mrsptu.ac.in",
            "password": "student123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "aman.cse084@mrsptu.ac.in"
        assert data["role"] == "student"
        assert "session_token" in resp.cookies

@pytest.mark.asyncio
async def test_admin_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "email": "hod.cse@mrsptu.ac.in",
            "password": "admin123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "hod.cse@mrsptu.ac.in"
        assert data["role"] == "admin"

@pytest.mark.asyncio
async def test_login_invalid_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "email": "aman.cse084@mrsptu.ac.in",
            "password": "wrongpassword"
        })
        assert resp.status_code == 401

@pytest.mark.asyncio
async def test_unauthenticated_access_blocked():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/academics/subjects")
        assert resp.status_code == 401

@pytest.mark.asyncio
async def test_student_forbidden_on_admin_stats():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as student
        await client.post("/api/auth/login", json={
            "email": "aman.cse084@mrsptu.ac.in",
            "password": "student123"
        })
        resp = await client.get("/api/admin/stats")
        assert resp.status_code == 403

@pytest.mark.asyncio
async def test_admin_stats_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as admin
        await client.post("/api/auth/login", json={
            "email": "hod.cse@mrsptu.ac.in",
            "password": "admin123"
        })
        resp = await client.get("/api/admin/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_notices" in data
        assert "students" in data

@pytest.mark.asyncio
async def test_admin_notice_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as admin
        await client.post("/api/auth/login", json={
            "email": "hod.cse@mrsptu.ac.in",
            "password": "admin123"
        })

        # 1. Create notice
        create_resp = await client.post("/api/notices", json={
            "title": "Test Notice for Viva Defense",
            "category": "Academic",
            "body": "All students must bring 2 hard copies of report.",
            "published": True
        })
        assert create_resp.status_code == 200
        notice = create_resp.json()
        notice_id = notice["id"]

        # 2. Update notice
        update_resp = await client.put(f"/api/notices/{notice_id}", json={
            "title": "Updated Notice for Viva Defense"
        })
        assert update_resp.status_code == 200
        assert update_resp.json()["title"] == "Updated Notice for Viva Defense"

        # 3. Delete notice
        del_resp = await client.delete(f"/api/notices/{notice_id}")
        assert del_resp.status_code == 200

@pytest.mark.asyncio
async def test_admin_content_is_visible_to_students():
    admin = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    student = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    await admin.post("/api/auth/login", json={
        "email": "hod.cse@mrsptu.ac.in",
        "password": "admin123",
    })
    await student.post("/api/auth/login", json={
        "email": "aman.cse084@mrsptu.ac.in",
        "password": "student123",
    })

    notice = (await admin.post("/api/notices", json={
        "title": "Cross-role sync notice",
        "category": "Academic",
        "body": "This published notice must be visible to students.",
        "published": True,
    })).json()
    event = (await admin.post("/api/events", json={
        "title": "Cross-role sync event",
        "club": "Coding Club",
        "category": "Technical",
        "description": "This event must be visible to students.",
        "venue": "CS Lab",
        "date": "2099-12-01T10:00:00+05:30",
        "capacity": 30,
    })).json()
    resource = (await admin.post("/api/resources", json={
        "title": "Cross-role sync resource",
        "kind": "Notes",
        "subject": "Machine Learning",
        "url": "https://example.com/sync-resource",
        "description": "This resource must be visible to students.",
    })).json()

    updated = await admin.put(f"/api/notices/{notice['id']}", json={"title": "Updated sync notice"})
    assert updated.status_code == 200

    notices = (await student.get("/api/notices")).json()
    events = (await student.get("/api/events")).json()
    resources = (await student.get("/api/resources")).json()
    assert any(n["id"] == notice["id"] and n["title"] == "Updated sync notice" for n in notices)
    assert any(e["id"] == event["id"] and e["title"] == event["title"] for e in events)
    assert any(r["id"] == resource["id"] and r["title"] == resource["title"] for r in resources)

    assert (await admin.delete(f"/api/notices/{notice['id']}")).status_code == 200
    assert (await admin.delete(f"/api/events/{event['id']}")).status_code == 200
    assert (await admin.delete(f"/api/resources/{resource['id']}")).status_code == 200
    await admin.aclose()
    await student.aclose()

@pytest.mark.asyncio
async def test_student_support_ticket_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Student creates ticket
        await client.post("/api/auth/login", json={
            "email": "aman.cse084@mrsptu.ac.in",
            "password": "student123"
        })
        ticket_resp = await client.post("/api/support", json={
            "category": "Academic",
            "subject": "Viva panel schedule query",
            "priority": "Medium",
            "description": "Please confirm Panel B reporting time."
        })
        assert ticket_resp.status_code == 200
        ticket = ticket_resp.json()
        ticket_id = ticket["id"]
        assert ticket["status"] == "pending"

        # 2. Admin reviews and resolves ticket
        await client.post("/api/auth/login", json={
            "email": "hod.cse@mrsptu.ac.in",
            "password": "admin123"
        })
        patch_resp = await client.patch(f"/api/support/{ticket_id}", json={
            "status": "resolved",
            "note": "Reporting time confirmed as 9:30 AM."
        })
        assert patch_resp.status_code == 200
        resolved_ticket = patch_resp.json()
        assert resolved_ticket["status"] == "resolved"
        assert len(resolved_ticket["updates"]) == 2
