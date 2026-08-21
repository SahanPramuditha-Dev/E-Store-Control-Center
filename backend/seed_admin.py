import sys
from app.database import engine, SessionLocal, Base
from app.models import AdminUser, AdminRole
from app.auth import hash_password

def seed_admin_user():
    print("👤 Seeding Administrator Accounts...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Super Admin Sahan
    sahan = db.query(AdminUser).filter(
        (AdminUser.username == "sahan") | (AdminUser.email == "sahanpramuditha91@gmail.com")
    ).first()
    if not sahan:
        sahan = AdminUser(
            username="sahan",
            email="sahanpramuditha91@gmail.com",
            hashed_password=hash_password("Sahan@910"),
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(sahan)
    else:
        sahan.username = "sahan"
        sahan.email = "sahanpramuditha91@gmail.com"
        sahan.hashed_password = hash_password("Sahan@910")
        sahan.role = AdminRole.SUPER_ADMIN
        sahan.is_active = True

    # 2. Master Admin
    admin = db.query(AdminUser).filter(AdminUser.username == "admin").first()
    if not admin:
        admin = AdminUser(
            username="admin",
            email="admin@estore.lk",
            hashed_password=hash_password("Admin@1234"),
            role=AdminRole.SUPER_ADMIN,
            is_active=True
        )
        db.add(admin)
    else:
        admin.hashed_password = hash_password("Admin@1234")
        admin.is_active = True

    db.commit()
    print("✅ Super Admin Sahan & Admin seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_admin_user()
