from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LicensePayload(BaseModel):
    license_schema_version: int = Field(default=1, description="License schema version")
    license_id: str = Field(description="Unique license identifier code")
    tenant_code: str = Field(description="Customer tenant identifier")
    shop_code: str = Field(description="Shop identifier")
    package_code: str = Field(description="Package code (RETAIL, BUSINESS, BUSINESS_AI)")
    entitlements: List[str] = Field(description="List of active feature codes")
    license_type: str = Field(description="ANNUAL, LIFETIME, TRIAL")
    issued_at: str = Field(description="ISO UTC datetime when license was issued")
    starts_at: str = Field(description="ISO UTC datetime when license begins")
    expires_at: Optional[str] = Field(default=None, description="ISO UTC datetime when license expires (null if lifetime)")
    machine_fingerprint: str = Field(description="Hardware binding fingerprint")
    grace_period_days: int = Field(default=14, description="Allowed offline duration before online check is forced")
    min_app_version: Optional[str] = Field(default=None, description="Minimum supported client version")
    max_app_version: Optional[str] = Field(default=None, description="Maximum supported client version")

class SignedLicenseToken(BaseModel):
    payload: LicensePayload
    signature: str = Field(description="Base64 encoded Ed25519 digital signature of canonical payload")
    signature_algorithm: str = Field(default="Ed25519", description="Signature algorithm")
