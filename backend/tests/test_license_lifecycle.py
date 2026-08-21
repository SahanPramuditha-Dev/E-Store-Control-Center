import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import (
    Tenant, Shop, Package, Feature, License, Machine,
    LicenseEvent, LicenseStatus, LicenseType, LicenseEventType, Payment, PaymentType
)
from app.licensing.service import LicenseService

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_full_license_and_payment_lifecycle(db_session):
    # 1. Create Features
    f_pos = Feature(code="pos", name="POS", is_active=True)
    f_repairs = Feature(code="repairs", name="Repairs", is_active=True)
    f_imei = Feature(code="imei", name="IMEI", is_active=True)
    db_session.add_all([f_pos, f_repairs, f_imei])
    db_session.flush()

    # 2. Create Packages
    pkg_retail = Package(code="RETAIL", name="Retail Plan", price_lkr=55000.0)
    pkg_retail.features.append(f_pos)

    pkg_business = Package(code="BUSINESS", name="Business Plan", price_lkr=95000.0)
    pkg_business.features.extend([f_pos, f_repairs, f_imei])

    db_session.add_all([pkg_retail, pkg_business])
    db_session.flush()

    # 3. Create Tenant & Shop
    tenant = Tenant(
        tenant_code="ABC-HOLDINGS",
        company_name="ABC Holdings Ltd",
        contact_name="Kasun Perera",
        phone="+94771234567"
    )
    db_session.add(tenant)
    db_session.flush()

    shop = Shop(
        tenant_id=tenant.id,
        shop_code="ABC-COLOMBO",
        shop_name="ABC Mobile Colombo",
        city="Colombo 04"
    )
    db_session.add(shop)
    db_session.flush()

    # 4. Issue License
    now = datetime.now(timezone.utc)
    license_obj = License(
        license_key="ISTORE-BIZ-2026-001",
        tenant_id=tenant.id,
        shop_id=shop.id,
        package_id=pkg_business.id,
        license_type=LicenseType.ANNUAL,
        status=LicenseStatus.PENDING,
        issued_at=now,
        starts_at=now,
        expires_at=now + timedelta(days=365),
        max_machines=1
    )
    db_session.add(license_obj)
    db_session.flush()

    # Record Initial Payment
    payment = Payment(
        tenant_id=tenant.id,
        shop_id=shop.id,
        license_id=license_obj.id,
        amount_lkr=95000.0,
        payment_type=PaymentType.INITIAL,
        payment_method="BANK_TRANSFER",
        reference_no="BOC-TX-98721"
    )
    db_session.add(payment)
    db_session.commit()

    # 5. Activate Machine
    success, msg, token = LicenseService.activate_machine(
        db=db_session,
        license_key="ISTORE-BIZ-2026-001",
        machine_fingerprint="MACH-HP-LAPTOP-01",
        machine_name="Cashier Desk 1",
        app_version="1.0.0"
    )

    assert success is True
    assert token is not None
    assert token.payload.package_code == "BUSINESS"
    assert "repairs" in token.payload.entitlements
    assert token.payload.machine_fingerprint == "MACH-HP-LAPTOP-01"

    # 6. Verify License Status and Events
    db_session.refresh(license_obj)
    assert license_obj.status == LicenseStatus.ACTIVE

    events = db_session.query(LicenseEvent).filter(LicenseEvent.license_id == license_obj.id).all()
    assert len(events) >= 1
    assert events[0].event_type in [LicenseEventType.ACTIVATED, LicenseEventType.MACHINE_ATTACHED]

    # 7. Attempt to activate a second machine (Should fail with machine limit)
    fail_success, fail_msg, fail_token = LicenseService.activate_machine(
        db=db_session,
        license_key="ISTORE-BIZ-2026-001",
        machine_fingerprint="MACH-UNAUTHORIZED-PC",
        machine_name="Stolen Copy"
    )
    assert fail_success is False
    assert "Machine limit reached" in fail_msg

    # 8. Heartbeat online validation
    val_success, val_msg, val_token = LicenseService.validate_online_heartbeat(
        db=db_session,
        license_key="ISTORE-BIZ-2026-001",
        machine_fingerprint="MACH-HP-LAPTOP-01"
    )
    assert val_success is True
    assert val_token is not None
