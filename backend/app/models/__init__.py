import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Table, Text, Float, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

# Enums
class TenantStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"

class LicenseStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    EXPIRING = "EXPIRING"
    EXPIRED = "EXPIRED"
    SUSPENDED = "SUSPENDED"
    REVOKED = "REVOKED"

class LicenseType(str, enum.Enum):
    TRIAL = "TRIAL"
    ANNUAL = "ANNUAL"
    LIFETIME = "LIFETIME"

class LicenseEventType(str, enum.Enum):
    CREATED = "CREATED"
    ACTIVATED = "ACTIVATED"
    RENEWED = "RENEWED"
    UPGRADED = "UPGRADED"
    DOWNGRADED = "DOWNGRADED"
    MACHINE_ATTACHED = "MACHINE_ATTACHED"
    MACHINE_RESET = "MACHINE_RESET"
    SUSPENDED = "SUSPENDED"
    REACTIVATED = "REACTIVATED"
    REVOKED = "REVOKED"
    EXPIRED = "EXPIRED"

class MachineStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DEACTIVATED = "DEACTIVATED"
    RESET = "RESET"

class PaymentType(str, enum.Enum):
    INITIAL = "INITIAL"
    RENEWAL = "RENEWAL"
    UPGRADE = "UPGRADE"

class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    SUPPORT = "SUPPORT"
    SALES = "SALES"


# Association Table: Packages <-> Features
package_features = Table(
    "package_features",
    Base.metadata,
    Column("package_id", Integer, ForeignKey("packages.id", ondelete="CASCADE"), primary_key=True),
    Column("feature_id", Integer, ForeignKey("features.id", ondelete="CASCADE"), primary_key=True)
)


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    tenant_code = Column(String(50), unique=True, index=True, nullable=False)
    company_name = Column(String(150), nullable=False)
    contact_name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(100), index=True, nullable=True)
    address = Column(Text, nullable=True)
    status = Column(Enum(TenantStatus), default=TenantStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    shops = relationship("Shop", back_populates="tenant", cascade="all, delete-orphan")
    licenses = relationship("License", back_populates="tenant", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="tenant", cascade="all, delete-orphan")


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    shop_code = Column(String(50), unique=True, index=True, nullable=False)
    shop_name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    status = Column(String(30), default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="shops")
    licenses = relationship("License", back_populates="shop", cascade="all, delete-orphan")
    machines = relationship("Machine", back_populates="shop", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="shop")


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # e.g., 'pos', 'repairs', 'imei'
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    packages = relationship("Package", secondary=package_features, back_populates="features")


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # RETAIL, BUSINESS, BUSINESS_AI
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price_lkr = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    features = relationship("Feature", secondary=package_features, back_populates="packages")
    licenses = relationship("License", back_populates="package")


class License(Base):
    __tablename__ = "licenses"

    id = Column(Integer, primary_key=True, index=True)
    license_key = Column(String(100), unique=True, index=True, nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    package_id = Column(Integer, ForeignKey("packages.id"), nullable=False)
    
    license_type = Column(Enum(LicenseType), default=LicenseType.ANNUAL, nullable=False)
    status = Column(Enum(LicenseStatus), default=LicenseStatus.PENDING, nullable=False)
    
    issued_at = Column(DateTime, default=utcnow, nullable=False)
    starts_at = Column(DateTime, default=utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)  # None for lifetime
    
    max_machines = Column(Integer, default=1, nullable=False)
    replacement_limit = Column(Integer, default=3, nullable=False)
    replacement_count = Column(Integer, default=0, nullable=False)
    
    grace_period_days = Column(Integer, default=14, nullable=False)
    schema_version = Column(Integer, default=1, nullable=False)
    
    min_app_version = Column(String(20), nullable=True)
    max_app_version = Column(String(20), nullable=True)
    
    last_validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="licenses")
    shop = relationship("Shop", back_populates="licenses")
    package = relationship("Package", back_populates="licenses")
    machines = relationship("Machine", back_populates="license", cascade="all, delete-orphan")
    events = relationship("LicenseEvent", back_populates="license", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="license")
    activations = relationship("Activation", back_populates="license", cascade="all, delete-orphan")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    license_id = Column(Integer, ForeignKey("licenses.id", ondelete="CASCADE"), nullable=False)
    
    machine_fingerprint = Column(String(100), index=True, nullable=False)
    machine_name = Column(String(100), nullable=True)
    platform = Column(String(50), default="Windows", nullable=True)
    app_version = Column(String(30), nullable=True)
    
    status = Column(Enum(MachineStatus), default=MachineStatus.ACTIVE, nullable=False)
    first_activated_at = Column(DateTime, default=utcnow, nullable=False)
    last_seen_at = Column(DateTime, default=utcnow, nullable=False)

    shop = relationship("Shop", back_populates="machines")
    license = relationship("License", back_populates="machines")
    activations = relationship("Activation", back_populates="machine")


class LicenseEvent(Base):
    __tablename__ = "license_events"

    id = Column(Integer, primary_key=True, index=True)
    license_id = Column(Integer, ForeignKey("licenses.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(Enum(LicenseEventType), nullable=False)
    from_state = Column(String(50), nullable=True)
    to_state = Column(String(50), nullable=True)
    actor = Column(String(100), default="SYSTEM", nullable=False)
    notes = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    license = relationship("License", back_populates="events")


class Activation(Base):
    __tablename__ = "activations"

    id = Column(Integer, primary_key=True, index=True)
    license_id = Column(Integer, ForeignKey("licenses.id", ondelete="CASCADE"), nullable=False)
    machine_id = Column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    
    activation_type = Column(String(30), default="ONLINE", nullable=False)  # ONLINE, OFFLINE_IMPORT
    ip_address = Column(String(50), nullable=True)
    app_version = Column(String(30), nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    failure_reason = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    license = relationship("License", back_populates="activations")
    machine = relationship("Machine", back_populates="activations")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False)
    license_id = Column(Integer, ForeignKey("licenses.id", ondelete="SET NULL"), nullable=True)
    
    amount_lkr = Column(Float, nullable=False)
    currency = Column(String(10), default="LKR", nullable=False)
    payment_type = Column(Enum(PaymentType), default=PaymentType.INITIAL, nullable=False)
    payment_method = Column(String(50), default="BANK_TRANSFER", nullable=False)
    reference_no = Column(String(100), nullable=True)
    payment_date = Column(DateTime, default=utcnow, nullable=False)
    status = Column(String(30), default="COMPLETED", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="payments")
    shop = relationship("Shop", back_populates="payments")
    license = relationship("License", back_populates="payments")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(AdminRole), default=AdminRole.ADMIN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_user_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=True)
    details_json = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
