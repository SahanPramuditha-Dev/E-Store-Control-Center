import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config import settings
from app.database import engine, Base
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
