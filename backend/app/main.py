import os
from pathlib import Path
from fastapi import FastAPI, Depends, Request
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config import settings
from app.database import engine, Base, get_db
import app.models
from app.routers import license_router, admin_auth_router, admin_management_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized License Management & Verification Engine for E-Store ERP",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    if settings.DATABASE_URL.startswith("sqlite"):
        try:
            Base.metadata.create_all(bind=engine)
        except Exception:
            pass

# Gzip Response Compression (75-85% smaller payloads)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Vercel Path Rewriting ASGI Middleware
class VercelPathFixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            forwarded_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8")
            matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
            
            real_path = forwarded_uri
            if not real_path and matched_path and not matched_path.startswith(("/api/index.py", "/api/index")):
                real_path = matched_path
                
            if real_path:
                scope["path"] = real_path.split("?")[0]
            elif scope.get("path") in ["/api/index.py", "/api/index"]:
                scope["path"] = "/"
        await self.app(scope, receive, send)

app.add_middleware(VercelPathFixMiddleware)

allowed_origins = [
    "https://e-store-control-center-frontend.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost(:\d+)?|http://127\.0\.0\.1(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Enterprise Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    return response


# License & Client Facing Endpoints
app.include_router(license_router.router)

@app.api_route("/debug-headers", methods=["GET", "POST"])
def debug_headers(request: Request):
    return {
        "path": request.scope.get("path"),
        "raw_path": request.scope.get("raw_path", b"").decode("utf-8", errors="ignore"),
        "headers": {k.decode("utf-8", errors="ignore"): v.decode("utf-8", errors="ignore") for k, v in request.scope.get("headers", [])}
    }

# Admin Portal Endpoints
app.include_router(admin_auth_router.router)
app.include_router(admin_management_router.router)

@app.get("/")
def root(request: Request):
    headers_dict = {k.decode("utf-8", errors="ignore"): v.decode("utf-8", errors="ignore") for k, v in request.scope.get("headers", [])}
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "schema_version": settings.CURRENT_LICENSE_SCHEMA_VERSION,
        "docs_url": "/docs",
        "scope_path": request.scope.get("path"),
        "headers": headers_dict
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "schema_version": settings.CURRENT_LICENSE_SCHEMA_VERSION
    }

@app.get("/api/debug-info")
def debug_info():
    import sys, os, traceback
    info = {
        "python_version": sys.version,
        "is_vercel": bool(os.getenv("VERCEL")),
        "db_url_masked": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL[:20],
        "db_driver": settings.DATABASE_URL.split("://")[0] if "://" in settings.DATABASE_URL else "unknown",
        "env_keys": [k for k in os.environ.keys() if "DATABASE" in k or "POSTGRES" in k or "SECRET" in k or "VERCEL" in k]
    }
    try:
        from app.database import engine, SessionLocal
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1;")).fetchone()
            info["db_query_result"] = str(res)
            info["db_status"] = "OK"
    except Exception as e:
        info["db_status"] = "FAILED"
        info["db_error"] = str(e)
        info["db_trace"] = traceback.format_exc()
    return info
