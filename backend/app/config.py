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

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "E-Store License Platform")
    API_V1_STR: str = "/api/v1"
    
    # Database - supports native Vercel Supabase integration variables
    DATABASE_URL: str = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
        or os.getenv("POSTGRES_URL")
        or f"sqlite:///{DEFAULT_SQLITE_PATH}"
    )
    
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
