from datetime import datetime, timezone
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session

from app.models import (
    Tenant, Shop, Package, Feature, License, Machine, Activation,
    LicenseEvent, LicenseStatus, LicenseEventType, MachineStatus
)
from app.licensing.payload import LicensePayload, SignedLicenseToken
from app.licensing.signer import LicenseSigner
from app.licensing.verifier import LicenseVerifier

def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

class LicenseService:
    """
    Central orchestration service for creating, activating, renewing,
    suspending, and validating client licenses.
    """

    @classmethod
    def get_package_features(cls, db: Session, package: Package) -> List[str]:
        return [f.code for f in package.features if f.is_active]

    @classmethod
    def generate_signed_token_for_license(
        cls,
        db: Session,
        license_obj: License,
        machine_fingerprint: str
    ) -> SignedLicenseToken:
        features = cls.get_package_features(db, license_obj.package)
        
        payload = LicensePayload(
            license_schema_version=license_obj.schema_version,
            license_id=license_obj.license_key,
            tenant_code=license_obj.tenant.tenant_code,
            shop_code=license_obj.shop.shop_code,
            package_code=license_obj.package.code,
            entitlements=features,
            license_type=license_obj.license_type.value,
            issued_at=license_obj.issued_at.isoformat().replace("+00:00", "Z") if license_obj.issued_at else utcnow_iso(),
            starts_at=license_obj.starts_at.isoformat().replace("+00:00", "Z") if license_obj.starts_at else utcnow_iso(),
            expires_at=license_obj.expires_at.isoformat().replace("+00:00", "Z") if license_obj.expires_at else None,
            machine_fingerprint=machine_fingerprint,
            grace_period_days=license_obj.grace_period_days,
            min_app_version=license_obj.min_app_version,
            max_app_version=license_obj.max_app_version
        )
        return LicenseSigner.sign_payload(payload)

    @classmethod
    def activate_machine(
        cls,
        db: Session,
        license_key: str,
        machine_fingerprint: str,
        machine_name: Optional[str] = "Main Terminal",
        app_version: Optional[str] = "1.0.0",
        ip_address: Optional[str] = None
    ) -> Tuple[bool, str, Optional[SignedLicenseToken]]:
        """
        Validates unactivated or active license, binds machine, records activation & license events.
        """
        license_obj = db.query(License).filter(License.license_key == license_key).first()
        if not license_obj:
            return False, "Invalid license key", None

        if license_obj.status in [LicenseStatus.REVOKED, LicenseStatus.SUSPENDED]:
            return False, f"License is {license_obj.status.value}. Activation prohibited.", None

        now = datetime.now(timezone.utc)

        # Check existing active machines for this license
        active_machines = db.query(Machine).filter(
            Machine.license_id == license_obj.id,
            Machine.status == MachineStatus.ACTIVE
        ).all()

        existing_machine = next((m for m in active_machines if m.machine_fingerprint == machine_fingerprint), None)

        if not existing_machine:
            if len(active_machines) >= license_obj.max_machines:
                # Log failed activation attempt
                activation_log = Activation(
                    license_id=license_obj.id,
                    activation_type="ONLINE",
                    ip_address=ip_address,
                    app_version=app_version,
                    success=False,
                    failure_reason=f"Machine limit reached ({license_obj.max_machines})"
                )
                db.add(activation_log)
                db.commit()
                return False, f"Machine limit reached ({license_obj.max_machines}). Please reset or upgrade license.", None

            # Register new machine
            new_machine = Machine(
                tenant_id=license_obj.tenant_id,
                shop_id=license_obj.shop_id,
                license_id=license_obj.id,
                machine_fingerprint=machine_fingerprint,
                machine_name=machine_name,
                platform="Windows",
                app_version=app_version,
                status=MachineStatus.ACTIVE,
                first_activated_at=now,
                last_seen_at=now
            )
            db.add(new_machine)
            db.flush()

            # Record Activation History
            activation_log = Activation(
                license_id=license_obj.id,
                machine_id=new_machine.id,
                activation_type="ONLINE",
                ip_address=ip_address,
                app_version=app_version,
                success=True
            )
            db.add(activation_log)

            # Record License Event
            event = LicenseEvent(
                license_id=license_obj.id,
                event_type=LicenseEventType.MACHINE_ATTACHED if license_obj.status == LicenseStatus.ACTIVE else LicenseEventType.ACTIVATED,
                from_state=license_obj.status.value,
                to_state=LicenseStatus.ACTIVE.value,
                actor="CLIENT_ERP",
                notes=f"Activated machine {machine_fingerprint} ({machine_name})"
            )
            db.add(event)
            license_obj.status = LicenseStatus.ACTIVE
            target_machine = new_machine
        else:
            # Re-activation / check-in on already registered machine
            existing_machine.last_seen_at = now
            existing_machine.app_version = app_version
            target_machine = existing_machine

        license_obj.last_validated_at = now
        db.commit()
        db.refresh(license_obj)

        token = cls.generate_signed_token_for_license(db, license_obj, machine_fingerprint)
        return True, "Activation successful", token

    @classmethod
    def validate_online_heartbeat(
        cls,
        db: Session,
        license_key: str,
        machine_fingerprint: str,
        app_version: Optional[str] = None
    ) -> Tuple[bool, str, Optional[SignedLicenseToken]]:
        """
        Called periodically by client ERP to sync license health and renew signed offline token.
        """
        license_obj = db.query(License).filter(License.license_key == license_key).first()
        if not license_obj:
            return False, "License not found", None

        if license_obj.status in [LicenseStatus.REVOKED, LicenseStatus.SUSPENDED]:
            return False, f"License is {license_obj.status.value}", None

        # Check if machine is bound and active
        machine = db.query(Machine).filter(
            Machine.license_id == license_obj.id,
            Machine.machine_fingerprint == machine_fingerprint,
            Machine.status == MachineStatus.ACTIVE
        ).first()

        if not machine:
            return False, "Machine is not authorized for this license", None

        now = datetime.now(timezone.utc)
        machine.last_seen_at = now
        if app_version:
            machine.app_version = app_version
        license_obj.last_validated_at = now
        db.commit()

        token = cls.generate_signed_token_for_license(db, license_obj, machine_fingerprint)
        return True, "License validated", token
