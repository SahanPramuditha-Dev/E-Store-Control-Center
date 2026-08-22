import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import AdminUser, AdminRole, Feature, Package, Tenant, Shop, License, Payment, Machine, LicenseEvent
from app.auth import hash_password
from app.main import app

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(autouse=True)
def setup_admin_test_db():
    Base.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()

    # Create Super Admin
    admin = AdminUser(
        username="superadmin",
        email="admin@istore.lk",
        hashed_password=hash_password("admin1234"),
        role=AdminRole.SUPER_ADMIN,
        is_active=True
    )
    db.add(admin)

    # Seed Package
    f_pos = Feature(code="pos", name="POS", is_active=True)
    db.add(f_pos)
    db.flush()

    pkg = Package(code="RETAIL", name="Retail Plan", price_lkr=55000.0)
    pkg.features.append(f_pos)
    db.add(pkg)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()

def test_admin_login_and_crud_flow():
    client = TestClient(app)

    # 1. Login
    login_res = client.post("/api/v1/admin/auth/login", json={
        "username": "superadmin",
        "password": "admin1234"
    })
    # Also test without api/v1 prefix router mount
    if login_res.status_code == 404:
        login_res = client.post("/admin/auth/login", json={
            "username": "superadmin",
            "password": "admin1234"
        })

    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Me
    me_res = client.get("/admin/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "superadmin"

    # 3. Create Tenant
    tenant_res = client.post("/admin/tenants", headers=headers, json={
        "tenant_code": "CEYLON-CORP",
        "company_name": "Ceylon Holdings Ltd",
        "contact_name": "Nimal Jayasinghe",
        "phone": "+94770001122",
        "email": "nimal@ceylon.lk"
    })
    assert tenant_res.status_code == 200
    tenant_id = tenant_res.json()["id"]

    # 4. Create Shop
    shop_res = client.post("/admin/shops", headers=headers, json={
        "tenant_id": tenant_id,
        "shop_code": "CEYLON-KANDY",
        "shop_name": "Ceylon Mobile Kandy",
        "city": "Kandy",
        "phone": "+94812233445"
    })
    assert shop_res.status_code == 200
    shop_id = shop_res.json()["id"]

    # 5. Issue License with Initial Payment
    lic_res = client.post("/admin/licenses", headers=headers, json={
        "tenant_id": tenant_id,
        "shop_id": shop_id,
        "package_code": "RETAIL",
        "validity_days": 365,
        "payment_amount": 55000.0,
        "payment_method": "BANK_TRANSFER",
        "payment_reference": "SLT-REF-0099"
    })
    assert lic_res.status_code == 200
    lic_data = lic_res.json()
    assert lic_data["success"] is True
    assert "ISTORE-RETAIL" in lic_data["license_key"]

    # 6. Check Dashboard Stats
    stats_res = client.get("/admin/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_tenants"] == 1
    assert stats["total_shops"] == 1
    assert stats["total_licenses"] == 1
    assert stats["total_revenue_lkr"] == 55000.0

    # 7. Test Rapid Single-Step Onboarding
    onboard_res = client.post("/admin/onboard", headers=headers, json={
        "tenant_code": "APEX-INC",
        "company_name": "Apex Digital Inc",
        "contact_name": "Kasun Perera",
        "phone": "+94719998888",
        "email": "kasun@apex.lk",
        "shop_code": "APEX-COLOMBO",
        "shop_name": "Apex Colombo Hub",
        "city": "Colombo",
        "package_code": "RETAIL",
        "validity_days": 365,
        "payment_amount": 55000.0,
        "payment_method": "CASH"
    })
    assert onboard_res.status_code == 200
    onboard_data = onboard_res.json()
    assert onboard_data["success"] is True
    assert "ISTORE-RETAIL" in onboard_data["license_key"]

    # 8. Test Global Search
    search_res = client.get("/admin/search?q=Apex", headers=headers)
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["tenants"]) > 0


def test_rbac_role_enforcement_and_impersonation_isolation():
    client = TestClient(app)
    db = TestingSessionLocal()

    # Create a READ_ONLY Admin
    readonly_admin = AdminUser(
        username="readonly_user",
        email="readonly@istore.lk",
        hashed_password=hash_password("readonly123"),
        role=AdminRole.READ_ONLY,
        is_active=True
    )
    db.add(readonly_admin)
    db.commit()

    # Login as READ_ONLY
    login_res = client.post("/admin/auth/login", json={
        "username": "readonly_user",
        "password": "readonly123"
    })
    assert login_res.status_code == 200
    ro_token = login_res.json()["access_token"]
    ro_headers = {"Authorization": f"Bearer {ro_token}"}

    # 1. READ_ONLY can read list endpoints
    list_res = client.get("/admin/tenants", headers=ro_headers)
    assert list_res.status_code == 200

    # 2. READ_ONLY is strictly blocked (403 Forbidden) from mutating tenant
    blocked_post = client.post("/admin/tenants", headers=ro_headers, json={
        "tenant_code": "ILLEGAL-CORP",
        "company_name": "Illegal Holdings",
        "contact_name": "Bad Actor",
        "phone": "+94770000000"
    })
    assert blocked_post.status_code == 403
    assert "Operation requires" in blocked_post.json()["detail"]

    # 3. Test Impersonation Token Generation & Scope Isolation
    # Login as superadmin to generate impersonation token
    sa_login = client.post("/admin/auth/login", json={"username": "superadmin", "password": "admin1234"})
    sa_token = sa_login.json()["access_token"]
    sa_headers = {"Authorization": f"Bearer {sa_token}"}

    # First create tenant
    t_res = client.post("/admin/tenants", headers=sa_headers, json={
        "tenant_code": "TEST-IMP-CORP",
        "company_name": "Test Impersonate Ltd",
        "contact_name": "Operator Test",
        "phone": "+94771112233"
    })
    assert t_res.status_code == 200
    t_id = t_res.json()["id"]

    # Generate support impersonation token
    imp_res = client.post(f"/admin/organizations/{t_id}/impersonate", headers=sa_headers)
    assert imp_res.status_code == 200
    imp_token = imp_res.json()["impersonation_token"]
    imp_headers = {"Authorization": f"Bearer {imp_token}"}

    # Verify that support impersonation token is strictly rejected from Control Panel Admin APIs
    blocked_admin_call = client.get("/admin/tenants", headers=imp_headers)
    assert blocked_admin_call.status_code == 403
    assert "Support impersonation tokens cannot access" in blocked_admin_call.json()["detail"]
    db.close()


