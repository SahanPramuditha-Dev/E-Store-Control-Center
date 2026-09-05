import sys
from datetime import datetime, timezone
from app.database import engine, SessionLocal, Base
from app.models import Feature, Package
from app.package_catalog import PACKAGE_CATALOG

def seed_features_and_packages():
    print("🌱 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Core Feature Definitions
    feature_defs = [
        ("core_pos", "Core Point of Sale", "Billing, customers, returns, expenses, printing and access control"),
        ("inventory", "Inventory Management", "Products, purchasing, GRN, stock, labels and serialization"),
        ("repairs", "Repair and Warranty Workflows", "Workshop, repair, warranty and claim workflows"),
        ("multi_branch", "Multi-Branch Operations", "Multiple stores, terminals and synchronized operations"),
        ("smart_sms", "WhatsApp and Messaging", "Receipts, notifications and customer messaging"),
        ("bi_analytics", "Advanced Analytics", "Advanced reports, forecasting and business intelligence"),
        ("ai_assistant", "AI Store Assistant", "Natural-language operational assistance"),
        ("developer_api", "Developer API", "Authorized external API and integration access"),
    ]

    features_map = {}
    for code, name, desc in feature_defs:
        feat = db.query(Feature).filter(Feature.code == code).first()
        if not feat:
            feat = Feature(code=code, name=name, description=desc, is_active=True)
            db.add(feat)
            db.flush()
        features_map[code] = feat

    # 2. Seed Standard Packages
    package_defs = [
        (code, data["name"], data["description"], data["price_lkr"], sorted(data["entitlements"]))
        for code, data in PACKAGE_CATALOG.items()
    ]

    for code, name, desc, price, f_codes in package_defs:
        pkg = db.query(Package).filter(Package.code == code).first()
        if not pkg:
            pkg = Package(code=code, name=name, description=desc, price_lkr=price, is_active=True)
            db.add(pkg)
            db.flush()
        else:
            pkg.name, pkg.description, pkg.price_lkr = name, desc, price
        
        # Link features
        pkg.features = [features_map[fc] for fc in f_codes if fc in features_map]

    db.commit()
    db.close()
    print("✅ Seed completed: Features and standard commercial packages initialized.")

if __name__ == "__main__":
    seed_features_and_packages()
