import os
import sys
import json
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(__file__))
from app.database import SessionLocal
from app.licensing.service import LicenseService
from app.models import License, Tenant, Shop, Package, LicenseType, LicenseStatus

db = SessionLocal()

# 1. Tenant
tenant = db.query(Tenant).filter(Tenant.tenant_code == "IPOINT").first()
if not tenant:
    tenant = Tenant(
        tenant_code="IPOINT",
        company_name="I Point Electronics & POS",
        contact_name="Bandara",
        phone="+94 77 000 1122",
        email="info@ipoint.lk",
        industry="MOBILE_RETAIL",
        industry_code="MOBILE_RETAIL",
        configuration_version=1
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

# 2. Shop
shop = db.query(Shop).filter(Shop.shop_code == "KOTUGODA").first()
if not shop:
    shop = Shop(
        tenant_id=tenant.id,
        shop_code="KOTUGODA",
        shop_name="Kotugoda Branch",
        city="Kotugoda",
        phone="+94 77 000 1122"
    )
    db.add(shop)
    db.commit()
    db.refresh(shop)

# 3. Package
pkg = db.query(Package).filter(Package.code == "BUSINESS").first()
if not pkg:
    pkg = Package(code="BUSINESS", name="Business Multi-Industry Plan", price_lkr=95000.0, is_active=True)
    db.add(pkg)
    db.commit()
    db.refresh(pkg)

# 4. License
lic = db.query(License).filter(License.shop_id == shop.id).first()
now = datetime.now(timezone.utc)
if not lic:
    lic = License(
        license_key="ISTORE-IPOINT-KOTUGODA-2026",
        tenant_id=tenant.id,
        shop_id=shop.id,
        package_id=pkg.id,
        license_type=LicenseType.ANNUAL,
        status=LicenseStatus.ACTIVE,
        issued_at=now,
        starts_at=now,
        expires_at=now + timedelta(days=365),
        max_machines=5
    )
    db.add(lic)
    db.commit()
    db.refresh(lic)

# 5. Generate signed Ed25519 token
token = LicenseService.generate_signed_token_for_license(db, lic, machine_fingerprint="*")
db.close()

token_dict = json.loads(token.model_dump_json())

# 6. Save to I Store Website database/license_cache.json
target_cache_path = r"c:\D\Projects\Websites\I Store Website\database\license_cache.json"
os.makedirs(os.path.dirname(target_cache_path), exist_ok=True)
with open(target_cache_path, "w", encoding="utf-8") as f:
    json.dump(token_dict, f, indent=2)

print("SUCCESS: License generated and cached successfully!")
print("License Key:", lic.license_key)
print("Tenant:", tenant.company_name)
print("Shop:", shop.shop_name)
print("Payload:", json.dumps(token_dict["payload"], indent=2))
