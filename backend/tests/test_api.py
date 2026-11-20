import os
import uuid
os.environ.setdefault("SITE_ADMIN_BOOTSTRAP_PASSWORD", "test-site-admin-password")
import pytest
from httpx import AsyncClient, ASGITransport
from backend.server import app
from backend.lib.db import db
from backend.lib.auth import hash_password
from backend.seed import seed_database, LEGACY_RESOURCE_URLS, PDF_RESOURCE_KINDS, SAMPLE_PDF_URL, CALENDAR_PDF_URL, SYLLABUS_PDF_URL

@pytest.fixture(autouse=True)
async def setup_db():
    await db.init()
    await seed_database(force=True)

@pytest.mark.asyncio
async def test_student_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "email": "aman@gmail.com",
            "password": "aman123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "aman@gmail.com"
        assert data["role"] == "student"
        assert "session_token" in resp.cookies

@pytest.mark.asyncio
async def test_faculty_login_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "email": "hod@gmail.com",
            "password": "hod123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "hod@gmail.com"
        assert data["role"] == "faculty"

@pytest.mark.asyncio
async def test_login_invalid_password():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/api/auth/login", json={
            "email": "aman@gmail.com",
            "password": "pass-aman123"
        })
        assert resp.status_code == 401

@pytest.mark.asyncio
async def test_seed_migrates_existing_demo_passwords():
    await db.users.update_one(
        {"id": "7f769313-537d-552f-9e77-5b315efb2559"},
        {"$set": {"password_hash": hash_password("pass-aman123")}},
    )
    await db.users.update_one(
        {"id": "a2d35653-e0be-54d3-867d-4787e6d7cd1f"},
        {"$set": {"password_hash": hash_password("pass-hod123"), "role": "admin"}},
    )
    await seed_database()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        student = await client.post("/api/auth/login", json={
            "email": "aman@gmail.com",
            "password": "aman123",
        })
        faculty_old = await client.post("/api/auth/login", json={
            "email": "hod@gmail.com",
            "password": "pass-hod123",
        })
        assert student.status_code == 200
        assert faculty_old.status_code == 200
        assert faculty_old.json()["role"] == "faculty"

@pytest.mark.asyncio
async def test_broken_seed_resource_links_get_placeholder_and_repaired_links_are_preserved():
    entries = list(LEGACY_RESOURCE_URLS.items())
    broken_id, broken_url = entries[0]
    repaired_id, _ = entries[1]
    repaired_url = "https://storage.example.edu/anti-ragging.pdf"

    await db.resources.update_one({"id": broken_id}, {"$set": {"url": broken_url}})
    await db.resources.update_one({"id": repaired_id}, {"$set": {"url": repaired_url}})
    await seed_database()

    broken = await db.resources.find_one({"id": broken_id})
    repaired = await db.resources.find_one({"id": repaired_id})
    assert broken["url"] == CALENDAR_PDF_URL
    assert broken["title"] == "Academic Calendar 2026-27"
    assert broken["description"].startswith("Officially notified academic calendar")
    assert "placeholder" not in broken["description"].lower()
    assert "sample" not in broken["description"].lower()
    assert repaired["url"] == repaired_url

@pytest.mark.asyncio
async def test_all_pdf_resources_use_labeled_pdf_but_web_links_do_not():
    resources = await db.resources.find().to_list(100)
    pdfs = [resource for resource in resources if resource.get("kind") in PDF_RESOURCE_KINDS]
    web_links = [resource for resource in resources if resource.get("kind") == "Link"]
    assert len(pdfs) == 6
    expected_pdf_urls = {"Academic Calendar 2026-27": CALENDAR_PDF_URL, "B.Tech CSE 8th Semester Syllabus (CS-801–805)": SYLLABUS_PDF_URL}
    assert all(resource["url"] == expected_pdf_urls.get(resource["title"], SAMPLE_PDF_URL) for resource in pdfs)
    descriptions = {resource["title"]: resource["description"] for resource in pdfs}
    assert descriptions["Academic Calendar 2026-27"].startswith("Officially notified academic calendar")
    assert descriptions["Anti-Ragging Guidelines & Helpline Booklet"].startswith("Guidelines, reporting channels")
    assert descriptions["B.Tech CSE 8th Semester Syllabus (CS-801–805)"].startswith("Official B.Tech CSE syllabus")
    assert descriptions["Cloud Computing Practical Workbook (CS-802)"].startswith("Practical exercises")
    assert descriptions["Machine Learning Lab Manual (CS-801)"].startswith("Experiments, algorithms")
    assert descriptions["Previous Year Question Papers — 8th Sem CSE"].startswith("Past examination papers")
    assert len(set(descriptions.values())) == len(descriptions)
    assert all("placeholder" not in resource["description"].lower() for resource in pdfs)
    assert all("sample" not in resource["description"].lower() for resource in pdfs)
    assert len(web_links) == 2
    assert all(resource["url"] != SAMPLE_PDF_URL for resource in web_links)


@pytest.mark.asyncio
async def test_login_sets_csrf_cookie_and_throttles_repeated_failures():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        success = await client.post("/api/auth/login", json={
            "email": "aman@gmail.com",
            "password": "aman123",
        })
        assert success.status_code == 200
        assert "csrf_token" in success.cookies

        unique_email = "rate-limit-check@mrsptu.ac.in"
        for _ in range(5):
            failed = await client.post("/api/auth/login", json={
                "email": unique_email,
                "password": "wrongpassword",
            })
            assert failed.status_code == 401
        blocked = await client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "wrongpassword",
        })
        assert blocked.status_code == 429

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
            "email": "aman@gmail.com",
            "password": "aman123"
        })
        resp = await client.get("/api/admin/stats")
        assert resp.status_code == 403

@pytest.mark.asyncio
async def test_faculty_stats_success():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as admin
        await client.post("/api/auth/login", json={
            "email": "hod@gmail.com",
            "password": "hod123"
        })
        resp = await client.get("/api/admin/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_notices" in data
        assert "students" in data

@pytest.mark.asyncio
async def test_faculty_notice_crud():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as admin
        await client.post("/api/auth/login", json={
            "email": "hod@gmail.com",
            "password": "hod123"
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
        "email": "hod@gmail.com",
        "password": "hod123",
    })
    await student.post("/api/auth/login", json={
        "email": "aman@gmail.com",
        "password": "aman123",
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
            "email": "aman@gmail.com",
            "password": "aman123"
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
            "email": "hod@gmail.com",
            "password": "hod123"
        })
        patch_resp = await client.patch(f"/api/support/{ticket_id}", json={
            "status": "resolved",
            "note": "Reporting time confirmed as 9:30 AM."
        })
        assert patch_resp.status_code == 200
        resolved_ticket = patch_resp.json()
        assert resolved_ticket["status"] == "resolved"
        assert len(resolved_ticket["updates"]) == 2
        delete_resp = await client.delete(f"/api/support/{ticket_id}")
        assert delete_resp.status_code == 200
        assert delete_resp.json()["status"] == "deleted"

@pytest.mark.asyncio
async def test_event_registration_response_and_cancellation():
    event_id = "0b4fa307-fc14-5551-8d07-d034eeb3915a"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login = await client.post("/api/auth/login", json={
            "email": "aman@gmail.com",
            "password": "aman123",
        })
        assert login.status_code == 200

        registered = await client.post(f"/api/events/{event_id}/register")
        assert registered.status_code == 200
        assert registered.json()["status"] == "registered"
        assert "registered" not in registered.json()
        assert "title" not in registered.json()

        cancelled = await client.delete(f"/api/events/{event_id}/register")
        assert cancelled.status_code == 200
        assert cancelled.json()["status"] == "unregistered"

@pytest.mark.asyncio
async def test_site_admin_bootstrap_and_account_management_security():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as admin:
        login = await admin.post("/api/auth/login", json={"email": "admin@gmail.com", "password": "test-site-admin-password"})
        assert login.status_code == 200 and login.json()["role"] == "site_admin"
        student_email = f"new.student.{uuid.uuid4().hex}@example.com"
        faculty_email = f"faculty.{uuid.uuid4().hex}@example.com"
        created = await admin.post("/api/site-admin/accounts", json={"name":"New Student", "email":f"  {student_email} ", "password":"long-password", "role":"student", "roll_no":"R100"})
        assert created.status_code == 200
        data = created.json()
        assert data["email"] == student_email and "password_hash" not in data and "password" not in data
        assert (await admin.post("/api/site-admin/accounts", json={"name":"Dup", "email":student_email.upper(), "password":"long-password", "role":"student", "roll_no":"R101"})).status_code == 409
        faculty = await admin.post("/api/site-admin/accounts", json={"name":"Faculty X", "email":faculty_email, "password":"long-password", "role":"faculty"})
        assert faculty.status_code == 200 and "password_hash" not in faculty.json()
        assert (await admin.patch(f"/api/site-admin/accounts/{faculty.json()['id']}/status", json={"is_active":False})).status_code == 403
        assert (await admin.delete(f"/api/site-admin/accounts/{faculty.json()['id']}")).status_code == 403
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as student:
            student_login = await student.post("/api/auth/login", json={"email":student_email, "password":"long-password"})
            assert student_login.status_code == 200
            token = student_login.cookies["session_token"]
            assert (await admin.patch(f"/api/site-admin/accounts/{data['id']}/status", json={"is_active":False})).status_code == 200
            assert (await student.get("/api/auth/me")).json()["user"] is None
            assert (await student.post("/api/auth/login", json={"email":student_email, "password":"long-password"})).status_code == 401
            assert (await admin.delete(f"/api/site-admin/accounts/{data['id']}" )).status_code == 200

@pytest.mark.asyncio
async def test_site_admin_cannot_manage_content_and_faculty_can_view_drafts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as site, AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as faculty:
        await site.post("/api/auth/login", json={"email":"admin@gmail.com", "password":"test-site-admin-password"})
        await faculty.post("/api/auth/login", json={"email":"hod@gmail.com", "password":"hod123"})
        draft = await faculty.post("/api/notices", json={"title":"Private draft", "category":"Test", "body":"Draft", "published":False})
        assert draft.status_code == 200
        assert any(x["id"] == draft.json()["id"] for x in (await faculty.get("/api/notices?all=1")).json())
        assert all(x["id"] != draft.json()["id"] for x in (await site.get("/api/notices?all=1")).json())
        assert (await site.post("/api/notices", json={"title":"No", "category":"Test", "body":"No"})).status_code == 403
        assert (await site.get("/api/admin/stats")).status_code == 403
        assert (await site.post("/api/site-admin/accounts", json={"name":"Bad","email":"bad@example.com","password":"long-password","role":"site_admin"})).status_code == 422

@pytest.mark.asyncio
async def test_site_admin_cannot_use_student_portal_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login = await client.post("/api/auth/login", json={"email": "admin@gmail.com", "password": os.environ["SITE_ADMIN_BOOTSTRAP_PASSWORD"]})
        assert login.status_code == 200
        assert (await client.get("/api/academics/subjects")).status_code == 403
        assert (await client.get("/api/support/mine")).status_code == 403
        event_id = "0b4fa307-fc14-5551-8d07-d034eeb3915a"
        assert (await client.post(f"/api/events/{event_id}/register")).status_code == 403
