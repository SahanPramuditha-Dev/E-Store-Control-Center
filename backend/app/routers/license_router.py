from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.licensing.service import LicenseService
from app.licensing.payload import SignedLicenseToken

router = APIRouter(prefix="/license", tags=["License"])

class ActivationRequest(BaseModel):
    license_key: str = Field(..., example="ISTORE-BIZ-2026-0001")
    machine_fingerprint: str = Field(..., example="MACH-8F92-A4C1-33D9")
    machine_name: Optional[str] = Field(default="POS-Terminal-01")
    app_version: Optional[str] = Field(default="1.0.0")

class ValidationRequest(BaseModel):
    license_key: str = Field(..., example="ISTORE-BIZ-2026-0001")
    machine_fingerprint: str = Field(..., example="MACH-8F92-A4C1-33D9")
    app_version: Optional[str] = Field(default="1.0.0")

class LicenseResponse(BaseModel):
    success: bool
    message: str
    token: Optional[SignedLicenseToken] = None

@router.post("/activate", response_model=LicenseResponse)
def activate_license(
    req: ActivationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip_addr = request.client.host if request.client else None
    success, msg, token = LicenseService.activate_machine(
        db=db,
        license_key=req.license_key.strip(),
        machine_fingerprint=req.machine_fingerprint.strip(),
        machine_name=req.machine_name,
        app_version=req.app_version,
        ip_address=ip_addr
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )
    return LicenseResponse(success=True, message=msg, token=token)

@router.post("/validate", response_model=LicenseResponse)
def validate_license(
    req: ValidationRequest,
    db: Session = Depends(get_db)
):
    success, msg, token = LicenseService.validate_online_heartbeat(
        db=db,
        license_key=req.license_key.strip(),
        machine_fingerprint=req.machine_fingerprint.strip(),
        app_version=req.app_version
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )
    return LicenseResponse(success=True, message=msg, token=token)


@router.get("/public-keys")
def get_public_keys():
    """
    Public Keyring distribution endpoint (JWKS-style).
    Allows client ERP desktop applications to fetch trusted root and rotated Ed25519 public keys.
    """
    from app.licensing.key_manager import KeyManager
    pub_key = KeyManager.get_server_public_key()
    pub_key_b64 = KeyManager.export_public_key_b64(pub_key)
    
    return {
        "keys": [
            {
                "key_id": "estore-root-2026-v1",
                "algorithm": "Ed25519",
                "usage": "license_signature_verification",
                "public_key_b64": pub_key_b64,
                "status": "active"
            }
        ]
    }

