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
    TRIAL = "TRIAL"
    PAST_DUE = "PAST_DUE"
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
    LOCKED = "LOCKED"
    RESET = "RESET"

class PaymentType(str, enum.Enum):
    INITIAL = "INITIAL"
    RENEWAL = "RENEWAL"
    UPGRADE = "UPGRADE"
    CUSTOM_FEATURE = "CUSTOM_FEATURE"

class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    SUPPORT = "SUPPORT"
    FINANCE = "FINANCE"
    TECHNICAL = "TECHNICAL"
    READ_ONLY = "READ_ONLY"

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class AnnouncementType(str, enum.Enum):
    INFO = "INFO"
    FEATURE = "FEATURE"
    MAINTENANCE = "MAINTENANCE"
    WARNING = "WARNING"


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
    
    # Extended Enterprise SaaS Attributes
    industry = Column(String(80), default="MOBILE_RETAIL", nullable=True)
    industry_code = Column(String(50), default="MOBILE_RETAIL", nullable=False)
    configuration_version = Column(Integer, default=1, nullable=False)
    capabilities_override = Column(JSON, default=dict, nullable=True)
    country = Column(String(80), default="Sri Lanka", nullable=True)
    currency = Column(String(10), default="LKR", nullable=True)
    timezone = Column(String(50), default="Asia/Colombo", nullable=True)
    logo_url = Column(String(255), nullable=True)
    settings_json = Column(JSON, default=dict, nullable=True)
    
    # Live Quota Tracking
    storage_used_mb = Column(Float, default=124.5, nullable=False)
    monthly_transactions_count = Column(Integer, default=1420, nullable=False)
    users_count = Column(Integer, default=3, nullable=False)
    
    status = Column(Enum(TenantStatus), default=TenantStatus.ACTIVE, nullable=False)
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    shops = relationship("Shop", back_populates="tenant")
    licenses = relationship("License", back_populates="tenant")
    payments = relationship("Payment", back_populates="tenant")
    tickets = relationship("SupportTicket", back_populates="tenant")
    api_keys = relationship("ApiKey", back_populates="tenant")


class Shop(Base):
    __tablename__ = "shops"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    shop_code = Column(String(50), unique=True, index=True, nullable=False)
    shop_name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    status = Column(String(30), default="ACTIVE", nullable=False)
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


    tenant = relationship("Tenant", back_populates="shops")
    licenses = relationship("License", back_populates="shop", cascade="all, delete-orphan")
    machines = relationship("Machine", back_populates="shop", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="shop")


class Feature(Base):
    __tablename__ = "features"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # pos, repairs, imei, whatsapp, ai_assistant
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="CORE", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    packages = relationship("Package", secondary=package_features, back_populates="features")


class Package(Base):
    __tablename__ = "packages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # FREE, STARTER, BUSINESS, BUSINESS_AI, ENTERPRISE
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price_lkr = Column(Float, default=0.0, nullable=False)
    
    # Granular Quota & Limit Capabilities
    max_users = Column(Integer, default=5, nullable=False)
    max_devices = Column(Integer, default=2, nullable=False)
    max_stores = Column(Integer, default=1, nullable=False)
    storage_gb = Column(Float, default=10.0, nullable=False)
    monthly_transactions_limit = Column(Integer, default=10000, nullable=False)
    
    # Feature Flags
    whatsapp_enabled = Column(Boolean, default=True, nullable=False)
    ai_features_enabled = Column(Boolean, default=False, nullable=False)
    api_access_enabled = Column(Boolean, default=False, nullable=False)
    reports_tier = Column(String(30), default="STANDARD", nullable=False)
    
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
    ip_address = Column(String(50), default="127.0.0.1", nullable=True)
    
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
    
    activation_type = Column(String(30), default="ONLINE", nullable=False)
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


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(80), unique=True, index=True, nullable=False) # AI_ASSISTANT_V2, WHATSAPP_BETA, MULTI_STORE
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    is_enabled = Column(Boolean, default=False, nullable=False)
    rollout_percentage = Column(Integer, default=100, nullable=False)
    target_plans_json = Column(JSON, default=list, nullable=True)
    target_orgs_json = Column(JSON, default=list, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    shop_id = Column(Integer, ForeignKey("shops.id", ondelete="SET NULL"), nullable=True)
    
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False)
    assigned_agent = Column(String(100), default="Support Desk", nullable=False)
    
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="tickets")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    announcement_type = Column(Enum(AnnouncementType), default=AnnouncementType.INFO, nullable=False)
    target_type = Column(String(30), default="ALL", nullable=False)  # ALL, PLAN, ORG
    target_value = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    starts_at = Column(DateTime, default=utcnow, nullable=False)
    ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class AppRelease(Base):
    __tablename__ = "app_releases"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String(30), unique=True, nullable=False)
    channel = Column(String(30), default="STABLE", nullable=False)  # STABLE, BETA
    release_notes = Column(Text, nullable=True)
    download_url = Column(String(255), nullable=True)
    min_supported_version = Column(String(30), default="1.0.0", nullable=False)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    rollout_percentage = Column(Integer, default=100, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    key_name = Column(String(100), nullable=False)
    key_prefix = Column(String(20), nullable=False)
    hashed_secret = Column(String(255), nullable=False)
    scopes_json = Column(JSON, default=list, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="api_keys")


class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, index=True, nullable=False)
    setting_value = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_name = Column(String(100), unique=True, nullable=False)
    status = Column(String(30), default="COMPLETED", nullable=False)
    duration_seconds = Column(Float, default=1.2, nullable=False)
    last_run_at = Column(DateTime, default=utcnow, nullable=False)
    next_run_at = Column(DateTime, nullable=True)
    error_log = Column(Text, nullable=True)


class IndustryTemplate(Base):
    __tablename__ = "industry_templates"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)  # MOBILE_RETAIL, GROCERY, FASHION, ELECTRONICS, COSMETICS, GENERAL_RETAIL
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    default_capabilities = Column(JSON, default=dict, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class CapabilityDefinition(Base):
    __tablename__ = "capability_definitions"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, index=True, nullable=False)  # imei_tracking, weighted_products, etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="CORE", nullable=False)  # HARDWARE, INVENTORY, POS, OPERATIONS, CATALOG
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


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

