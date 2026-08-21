import sys
from datetime import datetime, timezone
from app.database import engine, SessionLocal, Base
from app.models import (
    AdminUser, AdminRole, Tenant, Shop, Package, Feature, TenantStatus,
    License, Machine, Payment, AuditLog, LicenseType, LicenseStatus, MachineStatus, PaymentType,
    FeatureFlag, SupportTicket, TicketPriority, TicketStatus,
    Announcement, AnnouncementType, AppRelease, BackgroundJob, PlatformSetting
)

from app.auth import hash_password

def seed_complete_database():
    print("🌱 Re-initializing Database with full 25-module SaaS Control Center seed data...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()


    # 1. Super Admins
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
        sahan.hashed_password = hash_password("Sahan@910")
        sahan.is_active = True

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
    db.commit()

    # 2. Features
    default_features = [
        ("core_pos", "Core Point of Sale & Quick Billing", "Fast barcode billing, receipts, cart", "CORE"),
        ("inventory", "Inventory & Stock Lifecycle", "Batches, barcodes, reorder thresholds, supplier orders", "CORE"),
        ("repairs", "Repair & Workshop Job Tracking", "Technician tracking, repair diagnostics, ticket statuses", "OPERATIONS"),
        ("multi_branch", "Multi-Branch & Store Switching", "Centralized branch sync and location switching", "ENTERPRISE"),
        ("smart_sms", "SMS & WhatsApp Automated Alerts", "Automated customer bills and job alerts", "COMMUNICATION"),
        ("bi_analytics", "Advanced Business Intelligence", "Profit forecasting, sales heatmaps, tax reports", "ANALYTICS"),
        ("ai_assistant", "Gemini AI Retail Assistant", "AI repair diagnostic recommendations & profit optimization", "AI"),
        ("developer_api", "External Developer Open API", "REST webhooks and 3rd party ERP connectors", "DEVELOPER")
    ]

    feature_map = {}
    for code, name, desc, cat in default_features:
        feat = db.query(Feature).filter(Feature.code == code).first()
        if not feat:
            feat = Feature(code=code, name=name, description=desc, category=cat, is_active=True)
            db.add(feat)
            db.commit()
            db.refresh(feat)
        feature_map[code] = feat

    # 3. Packages & Monetization Tiers
    packages_data = [
        {
            "code": "FREE",
            "name": "Community Trial",
            "description": "Basic single-register trial for new businesses",
            "price": 0.0,
            "max_users": 2,
            "max_devices": 1,
            "max_stores": 1,
            "storage_gb": 2.0,
            "monthly_transactions_limit": 500,
            "whatsapp_enabled": False,
            "ai_features_enabled": False,
            "api_access_enabled": False,
            "reports_tier": "BASIC",
            "features": ["core_pos", "inventory"]
        },
        {
            "code": "STARTER",
            "name": "Starter Retail Plan",
            "description": "Essential POS and inventory for growing single-branch shops",
            "price": 35000.0,
            "max_users": 5,
            "max_devices": 2,
            "max_stores": 1,
            "storage_gb": 10.0,
            "monthly_transactions_limit": 5000,
            "whatsapp_enabled": True,
            "ai_features_enabled": False,
            "api_access_enabled": False,
            "reports_tier": "STANDARD",
            "features": ["core_pos", "inventory", "smart_sms"]
        },
        {
            "code": "BUSINESS",
            "name": "Business Pro Plan",
            "description": "Multi-device & workshop platform with repair diagnostics & WhatsApp",
            "price": 95000.0,
            "max_users": 15,
            "max_devices": 5,
            "max_stores": 3,
            "storage_gb": 50.0,
            "monthly_transactions_limit": 25000,
            "whatsapp_enabled": True,
            "ai_features_enabled": False,
            "api_access_enabled": True,
            "reports_tier": "ADVANCED",
            "features": ["core_pos", "inventory", "repairs", "multi_branch", "smart_sms"]
        },
        {
            "code": "BUSINESS_AI",
            "name": "Enterprise AI Suite",
            "description": "Full-scale multi-branch ERP with Gemini AI, Open APIs & WhatsApp AI Hub",
            "price": 250000.0,
            "max_users": 50,
            "max_devices": 20,
            "max_stores": 10,
            "storage_gb": 200.0,
            "monthly_transactions_limit": 100000,
            "whatsapp_enabled": True,
            "ai_features_enabled": True,
            "api_access_enabled": True,
            "reports_tier": "EXECUTIVE",
            "features": ["core_pos", "inventory", "repairs", "multi_branch", "smart_sms", "bi_analytics", "ai_assistant", "developer_api"]
        }
    ]

    for pdata in packages_data:
        pkg = db.query(Package).filter(Package.code == pdata["code"]).first()
        if not pkg:
            pkg = Package(
                code=pdata["code"],
                name=pdata["name"],
                description=pdata["description"],
                price_lkr=pdata["price"],
                max_users=pdata["max_users"],
                max_devices=pdata["max_devices"],
                max_stores=pdata["max_stores"],
                storage_gb=pdata["storage_gb"],
                monthly_transactions_limit=pdata["monthly_transactions_limit"],
                whatsapp_enabled=pdata["whatsapp_enabled"],
                ai_features_enabled=pdata["ai_features_enabled"],
                api_access_enabled=pdata["api_access_enabled"],
                reports_tier=pdata["reports_tier"],
                is_active=True
            )
            db.add(pkg)
            db.commit()
            db.refresh(pkg)
            for fcode in pdata["features"]:
                if fcode in feature_map:
                    pkg.features.append(feature_map[fcode])
            db.commit()

    # 4. Feature Flags
    flags_data = [
        ("AI_ASSISTANT_V2", "Gemini 2.5 Flash Repair AI Engine", "Next-gen intelligent diagnostics and repair estimations", True, 100),
        ("WHATSAPP_BETA", "Interactive WhatsApp Receipt Bot", "Automated customer interactive invoice querying", True, 100),
        ("NEW_REPORTING_ENGINE", "Ultra-Fast OLAP Reporting Engine", "Instant revenue and stock turn metrics calculation", True, 75),
        ("CUSTOMER_PORTAL_V2", "Self-Service Customer Warranty Portal", "End-consumer repair status lookup portal", False, 0),
        ("MULTI_STORE_ROUTING", "Dynamic Inter-Branch Stock Transfers", "Automated stock routing between branches", True, 100)
    ]
    for code, name, desc, enabled, pct in flags_data:
        flag = db.query(FeatureFlag).filter(FeatureFlag.code == code).first()
        if not flag:
            flag = FeatureFlag(
                code=code,
                name=name,
                description=desc,
                is_enabled=enabled,
                rollout_percentage=pct,
                target_plans_json=["BUSINESS", "BUSINESS_AI"],
                target_orgs_json=[]
            )
            db.add(flag)
    db.commit()

    # 5. Sample Support Tickets
    tenant = db.query(Tenant).first()
    if tenant and db.query(SupportTicket).count() == 0:
        ticket = SupportTicket(
            ticket_number="TCK-1001",
            tenant_id=tenant.id,
            subject="Assistance with secondary POS barcode scanner setup",
            description="Client requested help configuring their Honeywell Orbit scanner on Terminal 2.",
            priority=TicketPriority.MEDIUM,
            status=TicketStatus.IN_PROGRESS,
            assigned_agent="Sahan"
        )
        db.add(ticket)
        db.commit()

    # 6. Sample App Releases
    if db.query(AppRelease).count() == 0:
        release = AppRelease(
            version="v2.4.0",
            channel="STABLE",
            release_notes="Added offline Ed25519 token caching, hardware SHA-256 validation, and fast Bluetooth thermal printing.",
            download_url="https://releases.estore.lk/pos/v2.4.0/E-Store-POS-Setup.exe",
            min_supported_version="v2.0.0",
            is_mandatory=False,
            rollout_percentage=100
        )
        db.add(release)
        db.commit()

    # 7. Sample Background Jobs
    jobs_data = [
        ("License Expiration Sweep", "COMPLETED", 0.4),
        ("Subscription Renewal Auto-Bill", "COMPLETED", 1.2),
        ("Telemetry Heartbeat Monitor", "COMPLETED", 0.2),
        ("Nightly Database Cloud Backup", "COMPLETED", 4.8),
        ("WhatsApp Notification Dispatcher", "COMPLETED", 0.3)
    ]
    for name, status, dur in jobs_data:
        job = db.query(BackgroundJob).filter(BackgroundJob.job_name == name).first()
        if not job:
            job = BackgroundJob(
                job_name=name,
                status=status,
                duration_seconds=dur,
                last_run_at=datetime.now(timezone.utc)
            )
            db.add(job)
    db.commit()

    # 8. Sample Announcements
    if db.query(Announcement).count() == 0:
        ann = Announcement(
            title="Scheduled Database Maintenance Tonight at 02:00 AM IST",
            content="We will be executing a database optimization sweep. No downtime is expected for active POS devices.",
            announcement_type=AnnouncementType.MAINTENANCE,
            target_type="ALL",
            is_active=True
        )
        db.add(ann)
        db.commit()

    # 9. Platform Settings
    default_settings = {
        "platform_name": "E-Store Central SaaS",
        "default_currency": "LKR",
        "default_timezone": "Asia/Colombo",
        "maintenance_mode": False,
        "whatsapp_provider": "Meta Cloud API",
        "smtp_host": "smtp.sendgrid.net",
        "storage_provider": "Cloudflare R2"
    }
    for k, v in default_settings.items():
        setting = db.query(PlatformSetting).filter(PlatformSetting.setting_key == k).first()
        if not setting:
            setting = PlatformSetting(setting_key=k, setting_value=v)
            db.add(setting)
    db.commit()

    # 10. Default Seed Tenants & Shops
    t1 = Tenant(
        tenant_code="ESTO-3673",
        company_name="E Store Mobiles & Computers",
        contact_name="Sahan Pramuditha",
        phone="+94 77 123 4567",
        email="sahanpramuditha91@gmail.com",
        address="124 Main Street, Kotugoda",
        industry="Electronics & Mobile Repairs",
        country="Sri Lanka",
        currency="LKR",
        timezone="Asia/Colombo",
        status=TenantStatus.ACTIVE,
        storage_used_mb=342.8,
        monthly_transactions_count=4890,
        users_count=4
    )
    db.add(t1)
    db.commit()
    db.refresh(t1)

    s1 = Shop(
        tenant_id=t1.id,
        shop_code="KOTU-KOT-474",
        shop_name="Kotugoda Flagship Store",
        city="Kotugoda",
        phone="+94 77 123 4567",
        status="ACTIVE"
    )
    db.add(s1)
    db.commit()
    db.refresh(s1)

    # 11. Default License & Machines
    pkg_business = db.query(Package).filter(Package.code == "BUSINESS").first()
    from datetime import timedelta
    l1 = License(
        license_key="ESTORE-BIZ-2026-0001",
        tenant_id=t1.id,
        shop_id=s1.id,
        package_id=pkg_business.id,
        license_type=LicenseType.ANNUAL,
        status=LicenseStatus.ACTIVE,
        max_machines=5,
        replacement_limit=3,
        expires_at=datetime.now(timezone.utc) + timedelta(days=365)
    )
    db.add(l1)
    db.commit()
    db.refresh(l1)

    m1 = Machine(
        tenant_id=t1.id,
        shop_id=s1.id,
        license_id=l1.id,
        machine_fingerprint="MACH-9A8B-7C6D-5E4F-3321",
        machine_name="Main Billing Terminal 01",
        platform="Windows 11 Pro",
        app_version="2.4.0",
        ip_address="192.168.1.104",
        status=MachineStatus.ACTIVE,
        last_seen_at=datetime.now(timezone.utc)
    )
    db.add(m1)

    p1 = Payment(
        tenant_id=t1.id,
        shop_id=s1.id,
        license_id=l1.id,
        amount_lkr=95000.0,
        currency="LKR",
        payment_type=PaymentType.INITIAL,
        payment_method="BANK_TRANSFER",
        reference_no="TXN-ESTORE-9988",
        status="COMPLETED"
    )
    db.add(p1)

    # 12. Audit Log
    log1 = AuditLog(
        admin_user_id=sahan.id,
        action="TENANT_ONBOARDED",
        entity_type="TENANT",
        entity_id=str(t1.id),
        details_json={"company": t1.company_name, "license": l1.license_key, "amount": 95000},
        ip_address="127.0.0.1"
    )
    db.add(log1)
    db.commit()

    print("🎉 Complete database seed SUCCESSFUL! All 25 SaaS modules populated with seed data.")
    db.close()

if __name__ == "__main__":
    seed_complete_database()

