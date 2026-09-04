"""Create or update one administrator from environment variables."""

import os

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.models import AdminRole, AdminUser


def seed_admin_user() -> None:
    username = os.getenv("ADMIN_USERNAME", "").strip()
    password = os.getenv("ADMIN_PASSWORD", "")
    email = os.getenv("ADMIN_EMAIL", "").strip().lower()
    if not username or not password:
        raise RuntimeError("ADMIN_USERNAME and ADMIN_PASSWORD are required")
    if len(password) < 10:
        raise RuntimeError("ADMIN_PASSWORD must contain at least 10 characters")
    if not email:
        email = f"{username.lower()}@estore.local"

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(AdminUser).filter(
            (AdminUser.username == username) | (AdminUser.email == email)
        ).first()
        if admin is None:
            admin = AdminUser(username=username, email=email)
            db.add(admin)
        admin.username = username
        admin.email = email
        admin.hashed_password = hash_password(password)
        admin.role = AdminRole.SUPER_ADMIN
        admin.is_active = True
        db.commit()
        print(f"Administrator '{username}' is ready.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin_user()
