import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Tenant, Shop, Package, Feature, License, LicenseType, LicenseStatus
from app.main import app

api_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
ApiTestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=api_test_engine)

def override_get_db():
    db = ApiTestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_api_test_db():
    Base.metadata.create_all(bind=api_test_engine)
    app.dependency_overrides[get_db] = override_get_db
    db = ApiTestingSessionLocal()

    # Seed features & packages
    f_pos = Feature(code="pos", name="POS", is_active=True)
    f_repairs = Feature(code="repairs", name="Repairs", is_active=True)
    db.add_all([f_pos, f_repairs])
    db.flush()

    pkg = Package(code="BUSINESS", name="Business Plan", price_lkr=95000.0)
    pkg.features.extend([f_pos, f_repairs])
    db.add(pkg)
    db.flush()

    tenant = Tenant(
        tenant_code="KING-PHONES",
        company_name="Kings Mobile Pvt Ltd",
        contact_name="Dilan Silva",
        phone="+94712345678"
    )
    db.add(tenant)
    db.flush()

    shop = Shop(
        tenant_id=tenant.id,
        shop_code="KING-MAJESTIC",
        shop_name="Kings Mobile MC Branch",
        city="Colombo 04"
    )
    db.add(shop)
    db.flush()

    now = datetime.now(timezone.utc)
    lic = License(
        license_key="ISTORE-TEST-KEY-001",
        tenant_id=tenant.id,
        shop_id=shop.id,
        package_id=pkg.id,
        license_type=LicenseType.ANNUAL,
        status=LicenseStatus.PENDING,
        issued_at=now,
        starts_at=now,
        expires_at=now + timedelta(days=365),
        max_machines=1
    )
    db.add(lic)
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=api_test_engine)
    app.dependency_overrides.clear()

def test_api_root():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_api_activate_and_validate_flow():
    client = TestClient(app)

    # 1. Activation
    activate_res = client.post("/license/activate", json={
        "license_key": "ISTORE-TEST-KEY-001",
        "machine_fingerprint": "MACH-DESKTOP-POS1",
        "machine_name": "Front Desk Terminal",
        "app_version": "1.0.0"
    })
    assert activate_res.status_code == 200
    act_data = activate_res.json()
    assert act_data["success"] is True
    assert act_data["token"]["payload"]["package_code"] == "BUSINESS"
    assert "repairs" in act_data["token"]["payload"]["entitlements"]

    # 2. Validation Heartbeat
    validate_res = client.post("/license/validate", json={
        "license_key": "ISTORE-TEST-KEY-001",
        "machine_fingerprint": "MACH-DESKTOP-POS1",
        "app_version": "1.0.0"
    })
    assert validate_res.status_code == 200
    val_data = validate_res.json()
    assert val_data["success"] is True
    assert val_data["token"]["payload"]["machine_fingerprint"] == "MACH-DESKTOP-POS1"

def test_api_activate_invalid_key():
    client = TestClient(app)
    res = client.post("/license/activate", json={
        "license_key": "NON-EXISTENT-KEY",
        "machine_fingerprint": "MACH-ANY"
    })
    assert res.status_code == 400
    assert "Invalid license key" in res.json()["detail"]

def test_api_public_keys_keyring():
    client = TestClient(app)
    res = client.get("/license/public-keys")
    assert res.status_code == 200
    data = res.json()
    assert "keys" in data
    assert len(data["keys"]) > 0
    key_entry = data["keys"][0]
    assert key_entry["key_id"] == "estore-root-2026-v1"
    assert key_entry["algorithm"] == "Ed25519"
    assert key_entry["status"] == "active"
    assert len(key_entry["public_key_b64"]) > 0

