import sys
from app.database import engine, SessionLocal, Base
from app.models import AdminUser, AdminRole
from app.auth import hash_password

def seed_admin_user():
    print("👤 Resetting Super Admin password...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    admin = db.query(AdminUser).filter(AdminUser.username == "admin").first()
    if not admin:
        admin = AdminUser(
            username="admin",
            email="admin@istore.lk",
            hashed_password=hash_password("Admin@1234"),
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(admin)
    else:
        admin.hashed_password = hash_password("Admin@1234")
        admin.is_active = True
        
    db.commit()
    print("✅ Super Admin password reset: Username: 'admin' | Password: 'Admin@1234'")
    db.close()

if __name__ == "__main__":
    seed_admin_user()
