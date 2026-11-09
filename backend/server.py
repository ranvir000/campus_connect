import os
import hmac
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from lib.db import db
from seed import seed_database
from routers.auth import router as auth_router
from routers.academics import router as academics_router
from routers.notices import router as notices_router
from routers.events import router as events_router
from routers.resources import router as resources_router
from routers.support import router as support_router
from routers.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect database and seed demo data if empty
    await db.init()
    await seed_database()
    yield
    # Shutdown logic if needed

app = FastAPI(
    title="CampusConnect API",
    description="MRSPTU B.Tech CSE Student & Department Portal Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
origins.extend(
    origin.strip()
    for origin in os.getenv("FRONTEND_URLS", "").split(",")
    if origin.strip()
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def csrf_protection(request, call_next):
    """Require the readable CSRF cookie to match the request header in production."""
    protected = request.method in {"POST", "PUT", "PATCH", "DELETE"}
    exempt = request.url.path == "/api/auth/login"
    if (
        os.getenv("ENVIRONMENT", "development").lower() == "production"
        and request.url.path.startswith("/api/")
        and protected
        and not exempt
    ):
        cookie_token = request.cookies.get("csrf_token", "")
        header_token = request.headers.get("X-CSRF-Token", "")
        if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "CSRF validation failed."}, status_code=403)
    return await call_next(request)

# Router registration
app.include_router(auth_router)
app.include_router(academics_router)
app.include_router(notices_router)
app.include_router(events_router)
app.include_router(resources_router)
app.include_router(support_router)
app.include_router(admin_router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "database": "connected", "app": "CampusConnect"}

@app.get("/")
async def api_root():
    return {
        "app": "CampusConnect API",
        "status": "ok",
        "health": "/api/health",
        "message": "Use the CampusConnect frontend URL for the web application.",
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("backend.server:app", host="0.0.0.0", port=port, reload=True)
