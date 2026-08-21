import sys
from datetime import datetime, timezone
from app.database import engine, SessionLocal, Base
from app.models import Feature, Package

def seed_features_and_packages():
    print("🌱 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Core Feature Definitions
    feature_defs = [
        # Retail Tier
        ("pos", "Point of Sale Billing", "Quick barcode scanning, split payments, receipts"),
        ("inventory", "Inventory Management", "Stock levels, categories, brands, low-stock warnings"),
        ("customers_suppliers", "Customer & Supplier Directory", "Customer loyalty, supplier profiles"),
        ("grn", "Goods Received Notes", "Purchase order reconciliation, inventory inflow"),
        ("returns_refunds", "Returns & Refunds", "Customer returns, credit notes, cashier refunds"),
        ("expenses", "Expense Management", "Petty cash and operating expense tracking"),
        ("thermal_print", "Thermal Printing Engine", "ESC/POS 58mm/80mm receipt and barcode label engine"),
        ("local_backup", "Local Database Backup", "SQLite local snapshot backup and restoration"),
        ("user_mgmt", "Role-Based Access Control", "Cashier, Manager, and Admin permissions"),
        
        # Business Tier (Mobile / Computer / Electronics / Repairs)
        ("imei_serial", "IMEI & Serial Tracking", "Device IMEI history, lifecycle, and serialized stock"),
        ("repairs", "Repair Workshop Service", "Job sheets, diagnostic tracking, technician assignments"),
        ("warranty", "Warranty Management", "Serialized warranty claims, repair history, and lookup"),
        ("whatsapp_bot", "WhatsApp Automation Bot", "Instant digital receipts, milestone repair notifications"),
        ("cloud_backup", "Encrypted Cloud Backups", "Automated cloud snapshot synchronization"),
        ("advanced_reports", "Advanced Business Reports", "Profit margin analytics, cashier reconciliation, tax audits"),
        
        # Business AI Tier
        ("ai_assistant", "AI Store Assistant", "Natural language store queries via Google Gemini"),
        ("ai_analytics", "AI Predictive Restock Insights", "Restock velocity analytics, predictive trends")
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
        (
            "RETAIL",
            "iStore Retail",
            "Tailored for grocery, clothing, and general retail stores",
            55000.0,
            ["pos", "inventory", "customers_suppliers", "grn", "returns_refunds", "expenses", "thermal_print", "local_backup", "user_mgmt"]
        ),
        (
            "BUSINESS",
            "iStore Business",
            "Designed for mobile phone shops, computer repair centres, and electronics retailers",
            95000.0,
            ["pos", "inventory", "customers_suppliers", "grn", "returns_refunds", "expenses", "thermal_print", "local_backup", "user_mgmt", "imei_serial", "repairs", "warranty", "whatsapp_bot", "cloud_backup", "advanced_reports"]
        ),
        (
            "BUSINESS_AI",
            "iStore Business AI",
            "Complete flagship suite with Gemini AI store insights and predictive intelligence",
            145000.0,
            ["pos", "inventory", "customers_suppliers", "grn", "returns_refunds", "expenses", "thermal_print", "local_backup", "user_mgmt", "imei_serial", "repairs", "warranty", "whatsapp_bot", "cloud_backup", "advanced_reports", "ai_assistant", "ai_analytics"]
        )
    ]

    for code, name, desc, price, f_codes in package_defs:
        pkg = db.query(Package).filter(Package.code == code).first()
        if not pkg:
            pkg = Package(code=code, name=name, description=desc, price_lkr=price, is_active=True)
            db.add(pkg)
            db.flush()
        
        # Link features
        pkg.features = [features_map[fc] for fc in f_codes if fc in features_map]

    db.commit()
    db.close()
    print("✅ Seed completed: Features and standard commercial packages initialized.")

if __name__ == "__main__":
    seed_features_and_packages()
