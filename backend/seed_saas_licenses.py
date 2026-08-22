"""Comprehensive SaaS Control Center Initialization & Demo License Generation Script

Usage:
  python seed_saas_licenses.py

Creates/updates:
  1. Default Industry Templates (Mobile, Grocery, Fashion, Electronics, Cosmetics, General Retail)
  2. Standard Capability Registry (14 definitions)
  3. Pre-provisioned Tenants with distinct Industry types & Ed25519-signed Licenses:
     - 📱 Apex Mobile Care (Industry: MOBILE_RETAIL -> Key: ISTORE-BUSINESS-MOBILE-2026)
     - 🥦 FreshLand Supermarket (Industry: GROCERY -> Key: ISTORE-BUSINESS-GROCERY-2026)
     - 👗 Vogue Style Studio (Industry: FASHION -> Key: ISTORE-BUSINESS-FASHION-2026)
"""

import os
import sys
from datetime import datetime, timezone, timedelta

# Append app paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import Tenant, Shop, Package, License, LicenseType, LicenseStatus, LicenseEvent, LicenseEventType
from app.licensing.industry_capability_service import seed_industry_templates_and_capabilities
from app.licensing.service import LicenseService

def seed_saas_ecosystem():
    db = SessionLocal()
    print("🚀 Initializing SaaS Control Center Templates, Capabilities & Licenses...")

    try:
        # 1. Seed Templates and Capability Registry in DB
        seed_industry_templates_and_capabilities(db)
        print("✅ Industry templates and capability registry seeded.")

        # 2. Seed Standard SaaS Packages
        packages_data = [
            ("STARTER", "Starter Retail Plan", 35000.0, 1),
            ("BUSINESS", "Business Multi-Industry Plan", 95000.0, 3),
            ("ENTERPRISE", "Enterprise Multi-Branch Suite", 250000.0, 10),
        ]
        pkg_map = {}
        for code, name, price, max_m in packages_data:
            p = db.query(Package).filter(Package.code == code).first()
            if not p:
                p = Package(code=code, name=name, price_lkr=price, is_active=True)
                db.add(p)
                db.commit()
                db.refresh(p)
            pkg_map[code] = p

        business_pkg = pkg_map["BUSINESS"]

        # 3. Pre-provision Industry Tenants & Licenses
        demo_tenants = [
            {
                "code": "APEXMOB",
                "name": "Apex Mobile Retail & Repairs",
                "contact": "Amal Perera",
                "phone": "+94 77 123 4567",
                "email": "amal@apexmobile.lk",
                "industry": "MOBILE_RETAIL",
                "shop_code": "APEX-HQ",
                "shop_name": "Apex Flagship Colombo 03",
                "license_key": "ISTORE-BIZ-MOBILE-2026-0001",
            },
            {
                "code": "FRESHGR",
                "name": "FreshLand Supermarket & Grocers",
                "contact": "Kamal Fernando",
                "phone": "+94 71 987 6543",
                "email": "kamal@freshland.lk",
                "industry": "GROCERY",
                "shop_code": "FRESH-HQ",
                "shop_name": "FreshLand Supercenter Kandy",
                "license_key": "ISTORE-BIZ-GROCERY-2026-0002",
            },
            {
                "code": "VOGUEF",
                "name": "Vogue Avenue Fashion & Apparel",
                "contact": "Sarah De Silva",
                "phone": "+94 76 555 4321",
                "email": "sarah@vogueavenue.lk",
                "industry": "FASHION",
                "shop_code": "VOGUE-HQ",
                "shop_name": "Vogue Colombo One",
                "license_key": "ISTORE-BIZ-FASHION-2026-0003",
            },
        ]

        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=365)

        for t_info in demo_tenants:
            # Tenant
            tenant = db.query(Tenant).filter(Tenant.tenant_code == t_info["code"]).first()
            if not tenant:
                tenant = Tenant(
                    tenant_code=t_info["code"],
                    company_name=t_info["name"],
                    contact_name=t_info["contact"],
                    phone=t_info["phone"],
                    email=t_info["email"],
                    industry_code=t_info["industry"],
                    configuration_version=1
                )
                db.add(tenant)
                db.commit()
                db.refresh(tenant)
            else:
                tenant.industry_code = t_info["industry"]
                db.commit()

            # Shop
            shop = db.query(Shop).filter(Shop.shop_code == t_info["shop_code"]).first()
            if not shop:
                shop = Shop(
                    tenant_id=tenant.id,
                    shop_code=t_info["shop_code"],
                    shop_name=t_info["shop_name"],
                    city="Colombo",
                    phone=t_info["phone"]
                )
                db.add(shop)
                db.commit()
                db.refresh(shop)

            # License
            lic = db.query(License).filter(License.license_key == t_info["license_key"]).first()
            if not lic:
                lic = License(
                    license_key=t_info["license_key"],
                    tenant_id=tenant.id,
                    shop_id=shop.id,
                    package_id=business_pkg.id,
                    license_type=LicenseType.ANNUAL,
                    status=LicenseStatus.ACTIVE,
                    issued_at=now,
                    starts_at=now,
                    expires_at=expires,
                    max_machines=3
                )
                db.add(lic)
                db.commit()
                db.refresh(lic)

                event = LicenseEvent(
                    license_id=lic.id,
                    event_type=LicenseEventType.CREATED,
                    from_state=None,
                    to_state=LicenseStatus.ACTIVE.value,
                    actor="System Seeder",
                    notes=f"Auto-generated demo license for {t_info['industry']} industry"
                )
                db.add(event)
                db.commit()

            print(f"🔑 Provisioned Tenant: {t_info['name']} | Industry: {t_info['industry']} | Key: {t_info['license_key']}")

        print("\n✨ SaaS Control Management Setup Completed Successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error during SaaS seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_saas_ecosystem()
