from app.database import SessionLocal
from app.models import Package, Tenant, Shop

db = SessionLocal()
pkgs = db.query(Package).all()
for p in pkgs:
    p.code = p.code.strip('\'" ')
    p.name = p.name.strip('\'" ')

tenants = db.query(Tenant).all()
for t in tenants:
    t.tenant_code = t.tenant_code.strip('\'" ')
    t.company_name = t.company_name.strip('\'" ')

shops = db.query(Shop).all()
for s in shops:
    s.shop_code = s.shop_code.strip('\'" ')
    s.shop_name = s.shop_name.strip('\'" ')

db.commit()
print("CLEANED PACKAGES:", [(p.id, p.code, p.name) for p in db.query(Package).all()])
print("CLEANED TENANTS:", [(t.id, t.tenant_code, t.company_name) for t in db.query(Tenant).all()])
print("CLEANED SHOPS:", [(s.id, s.shop_code, s.shop_name) for s in db.query(Shop).all()])
db.close()
