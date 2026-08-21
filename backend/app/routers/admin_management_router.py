from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models import (
    Tenant, Shop, Package, Feature, License, Machine, Payment,
    LicenseEvent, AuditLog, AdminUser, AdminRole, LicenseStatus, LicenseType,
    MachineStatus, PaymentType, LicenseEventType, package_features
)
from app.auth import get_current_admin
from app.licensing.service import LicenseService

router = APIRouter(prefix="/admin", tags=["Admin Management"])

# --- Pydantic Schemas ---
class TenantCreate(BaseModel):
    tenant_code: str
    company_name: str
    contact_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class ShopCreate(BaseModel):
    tenant_id: int
    shop_code: str
    shop_name: str
    city: Optional[str] = None
    phone: Optional[str] = None

class LicenseIssueRequest(BaseModel):
    tenant_id: int
    shop_id: int
    package_code: str
    license_type: LicenseType = LicenseType.ANNUAL
    validity_days: int = 365
    max_machines: int = 1
    min_app_version: Optional[str] = None
    max_app_version: Optional[str] = None
    payment_amount: Optional[float] = None
    payment_method: Optional[str] = "BANK_TRANSFER"
    payment_reference: Optional[str] = None

class MachineResetRequest(BaseModel):
    reason: str

class LicenseRenewRequest(BaseModel):
    validity_days: int = 365
    payment_amount: Optional[float] = None
    payment_method: Optional[str] = "BANK_TRANSFER"
    payment_reference: Optional[str] = None

class LicenseActionRequest(BaseModel):
    reason: str

class PaymentCreateRequest(BaseModel):
    tenant_id: int
    shop_id: int
    license_id: Optional[int] = None
    amount_lkr: float
    payment_type: PaymentType = PaymentType.INITIAL
    payment_method: str = "BANK_TRANSFER"
    reference_no: Optional[str] = None
    notes: Optional[str] = None

class PackageUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_lkr: Optional[float] = None
    feature_codes: Optional[List[str]] = None

def log_admin_action(db: Session, admin_id: int, action: str, entity_type: str, entity_id: str, details: dict = None):
    audit = AuditLog(
        admin_user_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details_json=details or {}
    )
    db.add(audit)

# --- Endpoints ---

# 1. Dashboard Overview Stats
@router.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    total_tenants = db.query(Tenant).count()
    total_shops = db.query(Shop).count()
    total_licenses = db.query(License).count()
    active_licenses = db.query(License).filter(License.status == LicenseStatus.ACTIVE).count()
    suspended_licenses = db.query(License).filter(License.status == LicenseStatus.SUSPENDED).count()
    active_machines = db.query(Machine).filter(Machine.status == MachineStatus.ACTIVE).count()
    
    total_revenue = db.query(func.sum(Payment.amount_lkr)).scalar() or 0.0

    now = datetime.now(timezone.utc)
    soon_30d = now + timedelta(days=30)
    expiring_soon = db.query(License).filter(
        License.status == LicenseStatus.ACTIVE,
        License.expires_at != None,
        License.expires_at <= soon_30d
    ).count()

    recent_payments = db.query(Payment).order_by(Payment.created_at.desc()).limit(5).all()

    return {
        "total_tenants": total_tenants,
        "total_shops": total_shops,
        "total_licenses": total_licenses,
        "active_licenses": active_licenses,
        "suspended_licenses": suspended_licenses,
        "active_machines": active_machines,
        "expiring_soon_30d": expiring_soon,
        "total_revenue_lkr": total_revenue,
        "recent_payments": [
            {
                "id": p.id,
                "amount_lkr": p.amount_lkr,
                "payment_type": p.payment_type.value,
                "payment_method": p.payment_method,
                "reference_no": p.reference_no,
                "created_at": p.created_at.isoformat()
            } for p in recent_payments
        ]
    }

# 2. Tenant Management
@router.get("/tenants")
def list_tenants(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    tenants = db.query(Tenant).all()
    return [
        {
            "id": t.id,
            "tenant_code": t.tenant_code,
            "company_name": t.company_name,
            "contact_name": t.contact_name,
            "phone": t.phone,
            "email": t.email,
            "status": t.status.value,
            "shops_count": len(t.shops),
            "licenses_count": len(t.licenses),
            "created_at": t.created_at.isoformat()
        } for t in tenants
    ]

@router.post("/tenants")
def create_tenant(req: TenantCreate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    existing = db.query(Tenant).filter(Tenant.tenant_code == req.tenant_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tenant code already exists")
    
    tenant = Tenant(
        tenant_code=req.tenant_code.upper().strip(),
        company_name=req.company_name.strip(),
        contact_name=req.contact_name.strip(),
        phone=req.phone.strip(),
        email=req.email,
        address=req.address
    )
    db.add(tenant)
    db.flush()

    log_admin_action(db, admin.id, "CREATE_TENANT", "TENANT", tenant.id, {"code": tenant.tenant_code, "name": tenant.company_name})
    db.commit()
    db.refresh(tenant)
    return tenant

@router.get("/tenants/{tenant_id}")
def get_tenant_details(tenant_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return {
        "id": t.id,
        "tenant_code": t.tenant_code,
        "company_name": t.company_name,
        "contact_name": t.contact_name,
        "phone": t.phone,
        "email": t.email,
        "address": t.address,
        "status": t.status.value,
        "created_at": t.created_at.isoformat(),
        "shops": [
            {
                "id": s.id,
                "shop_code": s.shop_code,
                "shop_name": s.shop_name,
                "city": s.city,
                "phone": s.phone,
                "status": s.status,
                "active_machines_count": len([m for m in s.machines if m.status == MachineStatus.ACTIVE]),
                "licenses": [
                    {
                        "id": l.id,
                        "license_key": l.license_key,
                        "package_code": l.package.code,
                        "status": l.status.value,
                        "expires_at": l.expires_at.isoformat() if l.expires_at else None
                    } for l in s.licenses
                ]
            } for s in t.shops
        ],
        "payments": [
            {
                "id": p.id,
                "amount_lkr": p.amount_lkr,
                "payment_type": p.payment_type.value,
                "payment_method": p.payment_method,
                "reference_no": p.reference_no,
                "created_at": p.created_at.isoformat()
            } for p in t.payments
        ]
    }

# 3. Shop Management
@router.get("/shops")
def list_shops(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    shops = db.query(Shop).all()
    return [
        {
            "id": s.id,
            "tenant_id": s.tenant_id,
            "shop_code": s.shop_code,
            "shop_name": s.shop_name,
            "city": s.city,
            "phone": s.phone,
            "tenant_name": s.tenant.company_name,
            "tenant_code": s.tenant.tenant_code,
            "active_machines_count": len([m for m in s.machines if m.status == MachineStatus.ACTIVE]),
            "active_license_key": s.licenses[0].license_key if s.licenses else None,
            "package_code": s.licenses[0].package.code if s.licenses else None,
            "created_at": s.created_at.isoformat()
        } for s in shops
    ]

@router.post("/shops")
def create_shop(req: ShopCreate, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    tenant = db.query(Tenant).filter(Tenant.id == req.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    existing = db.query(Shop).filter(Shop.shop_code == req.shop_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Shop code already exists")
    
    shop = Shop(
        tenant_id=req.tenant_id,
        shop_code=req.shop_code.upper().strip(),
        shop_name=req.shop_name.strip(),
        city=req.city,
        phone=req.phone
    )
    db.add(shop)
    db.flush()

    log_admin_action(db, admin.id, "CREATE_SHOP", "SHOP", shop.id, {"code": shop.shop_code, "name": shop.shop_name, "tenant": tenant.company_name})
    db.commit()
    db.refresh(shop)
    return shop

# 4. Packages & Features Management
@router.get("/packages")
def list_packages(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    packages = db.query(Package).all()
    all_features = db.query(Feature).all()
    return {
        "packages": [
            {
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "description": p.description,
                "price_lkr": p.price_lkr,
                "features": [f.code for f in p.features]
            } for p in packages
        ],
        "all_features": [
            {
                "id": f.id,
                "code": f.code,
                "name": f.name,
                "description": f.description
            } for f in all_features
        ]
    }

@router.patch("/packages/{package_id}")
def update_package(
    package_id: int,
    req: PackageUpdateRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    pkg = db.query(Package).filter(Package.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    if req.name is not None:
        pkg.name = req.name
    if req.description is not None:
        pkg.description = req.description
    if req.price_lkr is not None:
        pkg.price_lkr = req.price_lkr
    if req.feature_codes is not None:
        features = db.query(Feature).filter(Feature.code.in_(req.feature_codes)).all()
        pkg.features = features

    log_admin_action(db, admin.id, "UPDATE_PACKAGE", "PACKAGE", pkg.id, {"code": pkg.code, "price": pkg.price_lkr})
    db.commit()
    return {"success": True, "message": "Package updated successfully"}

# 5. Licenses Management & Advanced Lifecycle Actions
@router.get("/licenses")
def list_licenses(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    licenses = db.query(License).all()
    return [
        {
            "id": lic.id,
            "license_key": lic.license_key,
            "tenant_name": lic.tenant.company_name,
            "tenant_code": lic.tenant.tenant_code,
            "shop_name": lic.shop.shop_name,
            "shop_code": lic.shop.shop_code,
            "package_code": lic.package.code,
            "status": lic.status.value,
            "issued_at": lic.issued_at.isoformat(),
            "expires_at": lic.expires_at.isoformat() if lic.expires_at else None,
            "max_machines": lic.max_machines,
            "active_machines_count": len([m for m in lic.machines if m.status == MachineStatus.ACTIVE]),
            "replacement_count": lic.replacement_count,
            "last_validated_at": lic.last_validated_at.isoformat() if lic.last_validated_at else None
        } for lic in licenses
    ]

@router.get("/licenses/{license_id}/history")
def get_license_history(license_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")

    events = db.query(LicenseEvent).filter(LicenseEvent.license_id == license_id).order_by(desc(LicenseEvent.created_at)).all()
    machines = db.query(Machine).filter(Machine.license_id == license_id).all()
    payments = db.query(Payment).filter(Payment.license_id == license_id).order_by(desc(Payment.created_at)).all()

    return {
        "license_key": lic.license_key,
        "status": lic.status.value,
        "shop_name": lic.shop.shop_name,
        "events": [
            {
                "id": e.id,
                "event_type": e.event_type.value,
                "from_state": e.from_state,
                "to_state": e.to_state,
                "actor": e.actor,
                "notes": e.notes,
                "created_at": e.created_at.isoformat()
            } for e in events
        ],
        "machines": [
            {
                "id": m.id,
                "fingerprint": m.machine_fingerprint,
                "name": m.machine_name,
                "status": m.status.value,
                "app_version": m.app_version,
                "first_activated_at": m.first_activated_at.isoformat(),
                "last_seen_at": m.last_seen_at.isoformat()
            } for m in machines
        ],
        "payments": [
            {
                "id": p.id,
                "amount_lkr": p.amount_lkr,
                "payment_type": p.payment_type.value,
                "payment_method": p.payment_method,
                "reference_no": p.reference_no,
                "created_at": p.created_at.isoformat()
            } for p in payments
        ]
    }

@router.post("/licenses")
def issue_license(req: LicenseIssueRequest, db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    tenant = db.query(Tenant).filter(Tenant.id == req.tenant_id).first()
    shop = db.query(Shop).filter(Shop.id == req.shop_id).first()
    pkg = db.query(Package).filter(Package.code == req.package_code.upper()).first()

    if not tenant or not shop or not pkg:
        raise HTTPException(status_code=404, detail="Tenant, Shop, or Package not found")

    import uuid
    key_prefix = f"ISTORE-{pkg.code}"
    random_part = uuid.uuid4().hex[:12].upper()
    license_key = f"{key_prefix}-{random_part[:4]}-{random_part[4:8]}-{random_part[8:]}"

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=req.validity_days) if req.license_type != LicenseType.LIFETIME else None

    license_obj = License(
        license_key=license_key,
        tenant_id=tenant.id,
        shop_id=shop.id,
        package_id=pkg.id,
        license_type=req.license_type,
        status=LicenseStatus.PENDING,
        issued_at=now,
        starts_at=now,
        expires_at=expires_at,
        max_machines=req.max_machines,
        min_app_version=req.min_app_version,
        max_app_version=req.max_app_version
    )
    db.add(license_obj)
    db.flush()

    event = LicenseEvent(
        license_id=license_obj.id,
        event_type=LicenseEventType.CREATED,
        from_state=None,
        to_state=LicenseStatus.PENDING.value,
        actor=admin.username,
        notes=f"Issued {pkg.code} license for {shop.shop_name}"
    )
    db.add(event)

    if req.payment_amount and req.payment_amount > 0:
        payment = Payment(
            tenant_id=tenant.id,
            shop_id=shop.id,
            license_id=license_obj.id,
            amount_lkr=req.payment_amount,
            payment_type=PaymentType.INITIAL,
            payment_method=req.payment_method or "BANK_TRANSFER",
            reference_no=req.payment_reference
        )
        db.add(payment)

    log_admin_action(db, admin.id, "ISSUE_LICENSE", "LICENSE", license_obj.id, {"key": license_obj.license_key, "shop": shop.shop_name})
    db.commit()
    db.refresh(license_obj)
    return {
        "success": True,
        "license_key": license_obj.license_key,
        "status": license_obj.status.value,
        "expires_at": license_obj.expires_at.isoformat() if license_obj.expires_at else None
    }

@router.post("/licenses/{license_id}/suspend")
def suspend_license(
    license_id: int,
    req: LicenseActionRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")

    old_status = lic.status.value
    lic.status = LicenseStatus.SUSPENDED

    event = LicenseEvent(
        license_id=lic.id,
        event_type=LicenseEventType.SUSPENDED,
        from_state=old_status,
        to_state=LicenseStatus.SUSPENDED.value,
        actor=admin.username,
        notes=f"Suspended: {req.reason}"
    )
    db.add(event)
    log_admin_action(db, admin.id, "SUSPEND_LICENSE", "LICENSE", lic.id, {"reason": req.reason})
    db.commit()
    return {"success": True, "message": "License suspended successfully."}

@router.post("/licenses/{license_id}/reactivate")
def reactivate_license(
    license_id: int,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")

    old_status = lic.status.value
    lic.status = LicenseStatus.ACTIVE

    event = LicenseEvent(
        license_id=lic.id,
        event_type=LicenseEventType.REACTIVATED,
        from_state=old_status,
        to_state=LicenseStatus.ACTIVE.value,
        actor=admin.username,
        notes="Reactivated license"
    )
    db.add(event)
    log_admin_action(db, admin.id, "REACTIVATE_LICENSE", "LICENSE", lic.id)
    db.commit()
    return {"success": True, "message": "License reactivated successfully."}

@router.post("/licenses/{license_id}/revoke")
def revoke_license(
    license_id: int,
    req: LicenseActionRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    lic = db.query(License).filter(License.id == license_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="License not found")

    old_status = lic.status.value
    lic.status = LicenseStatus.REVOKED

    event = LicenseEvent(
        license_id=lic.id,
        event_type=LicenseEventType.REVOKED,
        from_state=old_status,
        to_state=LicenseStatus.REVOKED.value,
        actor=admin.username,
        notes=f"Revoked: {req.reason}"
    )
    db.add(event)
    log_admin_action(db, admin.id, "REVOKE_LICENSE", "LICENSE", lic.id, {"reason": req.reason})
    db.commit()
    return {"success": True, "message": "License permanently revoked."}

# 6. Machine Management & Telemetry
@router.get("/machines")
def list_machines(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    machines = db.query(Machine).order_by(desc(Machine.last_seen_at)).all()
    return [
        {
            "id": m.id,
            "machine_fingerprint": m.machine_fingerprint,
            "machine_name": m.machine_name,
            "platform": m.platform,
            "app_version": m.app_version,
            "status": m.status.value,
            "shop_name": m.shop.shop_name,
            "tenant_name": m.shop.tenant.company_name,
            "license_key": m.license.license_key,
            "first_activated_at": m.first_activated_at.isoformat(),
            "last_seen_at": m.last_seen_at.isoformat()
        } for m in machines
    ]

# 7. Payments Ledger & Manual Payment Entry
@router.get("/payments")
def list_payments(db: Session = Depends(get_db), admin: AdminUser = Depends(get_current_admin)):
    payments = db.query(Payment).order_by(desc(Payment.created_at)).all()
    return [
        {
            "id": p.id,
            "tenant_name": p.tenant.company_name,
            "shop_name": p.shop.shop_name if p.shop else "—",
            "license_key": p.license.license_key if p.license else "—",
            "amount_lkr": p.amount_lkr,
            "currency": p.currency,
            "payment_type": p.payment_type.value,
            "payment_method": p.payment_method,
            "reference_no": p.reference_no,
            "payment_date": p.payment_date.isoformat(),
            "notes": p.notes,
            "created_at": p.created_at.isoformat()
        } for p in payments
    ]

@router.post("/payments")
def record_payment(
    req: PaymentCreateRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    tenant = db.query(Tenant).filter(Tenant.id == req.tenant_id).first()
    shop = db.query(Shop).filter(Shop.id == req.shop_id).first()
    if not tenant or not shop:
        raise HTTPException(status_code=404, detail="Tenant or Shop not found")

    pmt = Payment(
        tenant_id=req.tenant_id,
        shop_id=req.shop_id,
        license_id=req.license_id,
        amount_lkr=req.amount_lkr,
        payment_type=req.payment_type,
        payment_method=req.payment_method,
        reference_no=req.reference_no,
        notes=req.notes
    )
    db.add(pmt)
    db.flush()

    log_admin_action(db, admin.id, "RECORD_PAYMENT", "PAYMENT", pmt.id, {"amount": pmt.amount_lkr, "shop": shop.shop_name})
    db.commit()
    db.refresh(pmt)
    return {"success": True, "payment_id": pmt.id}

# 8. Audit Trail Viewer
@router.get("/audit-logs")
def list_audit_logs(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    return [
        {
            "id": a.id,
            "action": a.action,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "details": a.details_json,
            "created_at": a.created_at.isoformat()
        } for a in logs
    ]
