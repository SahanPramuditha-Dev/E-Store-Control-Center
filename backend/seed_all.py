import sys
from datetime import datetime, timezone
from app.database import engine, SessionLocal, Base
from app.models import AdminUser, AdminRole, Tenant, Shop, Package, Feature, TenantStatus
from app.auth import hash_password

def seed_complete_database():
    print("🌱 Seeding Cloud PostgreSQL with default Packages, Features, Tenants, and Super Admin...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Super Admin
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

    # 2. Features
    default_features = [
        ("core_pos", "Core Point of Sale & Quick Billing", "Fast barcode billing, receipts, cart"),
        ("inventory", "Inventory & Stock Lifecycle", "Batches, barcodes, reorder thresholds, supplier orders"),
        ("repairs", "Repair & Workshop Job Tracking", "Technician tracking, repair diagnostics, ticket statuses"),
        ("multi_branch", "Multi-Branch & Store Switching", "Centralized branch sync and location switching"),
        ("smart_sms", "SMS & WhatsApp Automated Alerts", "Automated customer bills and job alerts"),
        ("bi_analytics", "Advanced Business Intelligence", "Profit forecasting, sales heatmaps, tax reports"),
        ("multi_currency", "Multi-Currency & International Tax", "Foreign exchange pricing and regional taxes"),
        ("developer_api", "External Developer Open API", "REST webhooks and 3rd party ERP connectors")
    ]

    feature_map = {}
    for code, name, desc in default_features:
        feat = db.query(Feature).filter(Feature.code == code).first()
        if not feat:
            feat = Feature(code=code, name=name, description=desc, is_active=True)
            db.add(feat)
            db.commit()
            db.refresh(feat)
        feature_map[code] = feat

    # 3. Packages
    packages_data = [
        {
            "code": "STARTER",
            "name": "Starter Retail Plan",
            "description": "Essential POS and stock management for single-branch stores",
            "price": 35000.0,
            "features": ["core_pos", "inventory"]
        },
        {
            "code": "BUSINESS",
            "name": "Business Pro Plan",
            "description": "Multi-terminal & workshop platform with repair diagnostics & SMS",
            "price": 95000.0,
            "features": ["core_pos", "inventory", "repairs", "multi_branch", "smart_sms"]
        },
        {
            "code": "ENTERPRISE",
            "name": "Enterprise AI Suite",
            "description": "Full-scale ERP with central BI analytics, developer API & WhatsApp AI Hub",
            "price": 250000.0,
            "features": ["core_pos", "inventory", "repairs", "multi_branch", "smart_sms", "bi_analytics", "multi_currency", "developer_api"]
        }
    ]

    package_map = {}
    for pdata in packages_data:
        pkg = db.query(Package).filter(Package.code == pdata["code"]).first()
        if not pkg:
            pkg = Package(
                code=pdata["code"],
                name=pdata["name"],
                description=pdata["description"],
                price_lkr=pdata["price"],
                is_active=True
            )
            db.add(pkg)
            db.commit()
            db.refresh(pkg)
            for fcode in pdata["features"]:
                if fcode in feature_map:
                    pkg.features.append(feature_map[fcode])
            db.commit()
        package_map[pdata["code"]] = pkg

    # 4. Default Seed Tenant & Branch
    tenant = db.query(Tenant).filter(Tenant.tenant_code == "ESTO-3673").first()
    if not tenant:
        tenant = Tenant(
            tenant_code="ESTO-3673",
            company_name="E Store",
            contact_name="Sahan Pramuditha",
            phone="0771234567",
            email="sahan@estore.lk",
            address="Kotugoda, Sri Lanka",
            status=TenantStatus.ACTIVE
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

    shop = db.query(Shop).filter(Shop.shop_code == "KOTU-KOT-474").first()
    if not shop:
        shop = Shop(
            tenant_id=tenant.id,
            shop_code="KOTU-KOT-474",
            shop_name="Kotugoda Branch",
            city="Kotugoda",
            phone="0771234567",
            status="ACTIVE"
        )
        db.add(shop)
        db.commit()

    print("🎉 Complete database seed SUCCESSFUL! Default Packages, Features, Tenants, and Shops are now in Supabase.")
    db.close()

if __name__ == "__main__":
    seed_complete_database()
