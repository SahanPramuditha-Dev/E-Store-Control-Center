import os
from pathlib import Path
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config import settings
from app.database import engine, Base, get_db
from app.routers import license_router, admin_auth_router, admin_management_router

# Auto-create tables in development if needed
try:
    Base.metadata.create_all(bind=engine)
except Exception as _e:
    pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized License Management & Verification Engine for E-Store ERP",
    version="1.0.0"
)

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
    # Handle preflight OPTIONS requests gracefully
    if request.method == "OPTIONS":
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=200,
            content={"status": "ok"},
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
            }
        )

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

# Admin Portal Endpoints
app.include_router(admin_auth_router.router)
app.include_router(admin_management_router.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "schema_version": settings.CURRENT_LICENSE_SCHEMA_VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "schema_version": settings.CURRENT_LICENSE_SCHEMA_VERSION
    }

@app.get("/api/db-check")
def db_connection_check(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        result = db.execute(text("SELECT 1 AS live, current_database(), current_user;")).fetchone()
        return {
            "status": "connected",
            "message": "Supabase Cloud Database is connected and responding!",
            "database": result[1],
            "connected_as": result[2],
            "host": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "masked"
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": "Database connection failed",
            "error": str(e),
            "trace": traceback.format_exc()[-300:]
        }
