import os
from typing import Optional
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    backend_dir = Path(__file__).resolve().parents[1]
    root_dir = Path(__file__).resolve().parents[2]
    load_dotenv(backend_dir / ".env")
    load_dotenv(root_dir / ".env")
except ImportError:
    pass

# Absolute DB path so running from any CWD always targets the same database file
BACKEND_DIR = Path(__file__).resolve().parents[1]
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    DEFAULT_SQLITE_PATH = "/tmp/license_platform.db"
else:
    DEFAULT_SQLITE_PATH = (BACKEND_DIR / "license_platform.db").resolve().as_posix()

def get_clean_database_url() -> str:
    use_local = os.getenv("USE_LOCAL_DB", "").strip().lower() in ("true", "1", "yes")
    if use_local:
        return f"sqlite:///{DEFAULT_SQLITE_PATH}"

    raw_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_PRISMA_URL")
        or os.getenv("POSTGRES_URL")
        or f"sqlite:///{DEFAULT_SQLITE_PATH}"
    )
    # SQLAlchemy 2.0 requires postgresql:// instead of postgres://
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)
    
    # Strip pgbouncer / supa query parameters that strict drivers reject
    if "?" in raw_url:
        base, query = raw_url.split("?", 1)
        params = [p for p in query.split("&") if not p.startswith(("pgbouncer=", "supa="))]
        raw_url = f"{base}?{'&'.join(params)}" if params else base

    return raw_url

class Settings:
    ENV: str = os.getenv("ENV", "production" if os.getenv("VERCEL") else "development").strip().lower()
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "E-Store License Platform")
    API_V1_STR: str = "/api/v1"
    
    # Database - dynamically normalized for SQLAlchemy + psycopg2
    DATABASE_URL: str = get_clean_database_url()
    
    # Cryptography - Ed25519 Keys
    # Accept the legacy LICENSE_* names so existing deployment templates keep working.
    ED25519_PRIVATE_KEY_B64: Optional[str] = os.getenv("ED25519_PRIVATE_KEY_B64") or os.getenv("LICENSE_PRIVATE_KEY_B64")
    ED25519_PUBLIC_KEY_B64: Optional[str] = os.getenv("ED25519_PUBLIC_KEY_B64") or os.getenv("LICENSE_PUBLIC_KEY_B64")
    
    # Admin Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # License Schema
    CURRENT_LICENSE_SCHEMA_VERSION: int = 1
    DEFAULT_GRACE_PERIOD_DAYS: int = 14
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "https://e-store-control-center-frontend.vercel.app"
            if ENV == "production"
            else "http://localhost:5173,http://localhost:3000,http://localhost:8000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://127.0.0.1:8000",
        ).split(",")
        if origin.strip()
    ]

    @classmethod
    def validate_production(cls) -> None:
        if cls.ENV != "production":
            return
        if not cls.ED25519_PRIVATE_KEY_B64 or not cls.ED25519_PUBLIC_KEY_B64:
            raise RuntimeError("Production Ed25519 signing keys are required")
        if cls.SECRET_KEY == "dev-secret-key-change-in-production-123456789" or len(cls.SECRET_KEY) < 32:
            raise RuntimeError("Production SECRET_KEY must be a strong non-default value")
        if cls.DATABASE_URL.startswith("sqlite"):
            raise RuntimeError("Production license service requires a persistent database")

settings = Settings()
settings.validate_production()
