import os
from typing import Optional
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    root_dir = Path(__file__).resolve().parents[2]
    load_dotenv(root_dir / ".env")
except ImportError:
    pass

# Absolute DB path so running from any CWD always targets the same database file
BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_SQLITE_PATH = (BACKEND_DIR / "license_platform.db").resolve().as_posix()

def get_clean_database_url() -> str:
    raw_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
        or os.getenv("POSTGRES_URL")
        or f"sqlite:///{DEFAULT_SQLITE_PATH}"
    )
    # SQLAlchemy 2.0 requires postgresql:// instead of postgres://
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)
    
    # Strip pgbouncer / supa query parameters that psycopg2 rejects
    if "?" in raw_url:
        base, query = raw_url.split("?", 1)
        params = [p for p in query.split("&") if not p.startswith(("pgbouncer=", "supa="))]
        raw_url = f"{base}?{'&'.join(params)}" if params else base

    return raw_url

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "E-Store License Platform")
    API_V1_STR: str = "/api/v1"
    
    # Database - dynamically normalized for SQLAlchemy + psycopg2
    DATABASE_URL: str = get_clean_database_url()
    
    # Cryptography - Ed25519 Keys
    ED25519_PRIVATE_KEY_B64: Optional[str] = os.getenv("ED25519_PRIVATE_KEY_B64", None)
    ED25519_PUBLIC_KEY_B64: Optional[str] = os.getenv("ED25519_PUBLIC_KEY_B64", None)
    
    # Admin Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # License Schema
    CURRENT_LICENSE_SCHEMA_VERSION: int = 1
    DEFAULT_GRACE_PERIOD_DAYS: int = 14

settings = Settings()
