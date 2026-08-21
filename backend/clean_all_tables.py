from app.database import SessionLocal
from app.models import License, Package, Tenant, Shop

db = SessionLocal()

# Strip any accidental quotes from existing records
for l in db.query(License).all():
    l.license_key = l.license_key.strip('\'" ')

for p in db.query(Package).all():
    p.code = p.code.strip('\'" ')
    p.name = p.name.strip('\'" ')

for t in db.query(Tenant).all():
    t.tenant_code = t.tenant_code.strip('\'" ')

for s in db.query(Shop).all():
    s.shop_code = s.shop_code.strip('\'" ')

db.commit()

print("ALL LICENSES IN CLOUD DB:")
for l in db.query(License).all():
    print(f"ID: {l.id} | Key: '{l.license_key}' | Status: {l.status.value} | Pkg: {l.package.code}")

db.close()
