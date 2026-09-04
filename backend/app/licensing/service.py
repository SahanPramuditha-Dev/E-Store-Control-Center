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


def _version_tuple(value: Optional[str]) -> tuple[int, ...]:
    """Parse ordinary dotted app versions without adding a runtime dependency."""
    if not value:
        return ()
    cleaned = str(value).strip().lower().lstrip("v").split("-", 1)[0]
    try:
        return tuple(int(part) for part in cleaned.split("."))
    except ValueError:
        return ()


def _license_policy_error(license_obj: License, app_version: Optional[str]) -> Optional[str]:
    now = datetime.now(timezone.utc)
    starts_at = license_obj.starts_at
    expires_at = license_obj.expires_at
    if starts_at and starts_at.tzinfo is None:
        starts_at = starts_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if starts_at and now < starts_at:
        return "License is not yet active"
    if license_obj.license_type.value != "LIFETIME" and expires_at and now > expires_at:
        return f"License expired on {expires_at.isoformat()}"

    current = _version_tuple(app_version)
    minimum = _version_tuple(license_obj.min_app_version)
    maximum = _version_tuple(license_obj.max_app_version)
    if (minimum or maximum) and not current:
        return "A valid app version is required for this license"
    if minimum and current < minimum:
        return f"App version {app_version} is below minimum {license_obj.min_app_version}"
    if maximum and current > maximum:
        return f"App version {app_version} is above maximum {license_obj.max_app_version}"
    return None

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
        from app.licensing.industry_capability_service import resolve_effective_capabilities
        features = cls.get_package_features(db, license_obj.package)
        
        cap_res = resolve_effective_capabilities(db, tenant=license_obj.tenant, shop=license_obj.shop, package=license_obj.package)
        enabled_caps = [k for k, v in cap_res["effective_capabilities"].items() if v]

        payload = LicensePayload(
            license_schema_version=license_obj.schema_version,
            license_id=license_obj.license_key,
            tenant_code=license_obj.tenant.tenant_code,
            shop_code=license_obj.shop.shop_code,
            package_code=license_obj.package.code,
            entitlements=features,
            industry_code=cap_res["industry_code"],
            capabilities=enabled_caps,
            configuration_version=cap_res["configuration_version"],
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
        from sqlalchemy import func
        clean_key = license_key.strip().upper()
        # Row-level lock on the license record to guarantee serial execution and prevent race condition over-activation
        try:
            license_obj = db.query(License).filter(func.upper(func.trim(License.license_key)) == clean_key).with_for_update().first()
        except Exception:
            # Fallback for dialects that do not support SELECT FOR UPDATE
            license_obj = db.query(License).filter(func.upper(func.trim(License.license_key)) == clean_key).first()
        if not license_obj:
            return False, "Invalid license key", None


        if license_obj.status in [LicenseStatus.REVOKED, LicenseStatus.SUSPENDED]:
            return False, f"License is {license_obj.status.value}. Activation prohibited.", None

        policy_error = _license_policy_error(license_obj, app_version)
        if policy_error:
            return False, policy_error, None

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
        from sqlalchemy import func
        clean_key = license_key.strip().upper()
        license_obj = db.query(License).filter(func.upper(func.trim(License.license_key)) == clean_key).first()
        if not license_obj:
            return False, "License not found", None

        if license_obj.status in [LicenseStatus.REVOKED, LicenseStatus.SUSPENDED]:
            return False, f"License is {license_obj.status.value}", None

        policy_error = _license_policy_error(license_obj, app_version)
        if policy_error:
            return False, policy_error, None

        # Check if machine is bound and active
        machine = db.query(Machine).filter(
            Machine.license_id == license_obj.id,
            Machine.machine_fingerprint == machine_fingerprint,
            Machine.status == MachineStatus.ACTIVE
        ).first()

        if not machine:
            return False, "Machine is not authorized for this license", None

        now = datetime.now(timezone.utc)
        
        # Heartbeat write-throttling: only write to DB if > 5 minutes (300s) have passed since last write
        should_write = False
        if not machine.last_seen_at or (now - machine.last_seen_at.replace(tzinfo=timezone.utc if machine.last_seen_at.tzinfo is None else machine.last_seen_at.tzinfo)).total_seconds() > 300:
            machine.last_seen_at = now
            if app_version:
                machine.app_version = app_version
            license_obj.last_validated_at = now
            should_write = True

        if should_write:
            try:
                db.commit()
            except Exception:
                db.rollback()

        token = cls.generate_signed_token_for_license(db, license_obj, machine_fingerprint)
        return True, "License validated successfully", token

    @classmethod
    def transfer_machine(
        cls,
        db: Session,
        license_key: str,
        new_machine_fingerprint: str,
        old_machine_fingerprint: Optional[str] = None,
        new_machine_name: Optional[str] = "Replacement POS",
        platform: Optional[str] = "Windows",
        app_version: Optional[str] = "1.0.0",
        ip_address: Optional[str] = None
    ) -> Tuple[bool, str, Optional[SignedLicenseToken]]:
        """
        Transfers an active license binding from an old machine to a new machine,
        enforcing the replacement limit and generating a fresh signed token.
        """
        from sqlalchemy import func
        clean_key = license_key.strip().upper()
        license_obj = db.query(License).filter(func.upper(func.trim(License.license_key)) == clean_key).first()
        if not license_obj:
            return False, "Invalid license key", None

        if license_obj.status in [LicenseStatus.REVOKED, LicenseStatus.SUSPENDED]:
            return False, f"License is {license_obj.status.value}. Transfer prohibited.", None

        policy_error = _license_policy_error(license_obj, app_version)
        if policy_error:
            return False, policy_error, None

        if license_obj.replacement_count >= license_obj.replacement_limit:
            return False, f"Machine transfer limit reached ({license_obj.replacement_limit} replacements allowed). Please contact support to reset quota.", None

        now = datetime.now(timezone.utc)

        # Deactivate old machine(s)
        if old_machine_fingerprint:
            old_machines = db.query(Machine).filter(
                Machine.license_id == license_obj.id,
                Machine.machine_fingerprint == old_machine_fingerprint.strip()
            ).all()
        else:
            old_machines = db.query(Machine).filter(
                Machine.license_id == license_obj.id,
                Machine.status == MachineStatus.ACTIVE
            ).all()

        for om in old_machines:
            om.status = MachineStatus.DEACTIVATED

        # Check if new machine already exists or create new
        new_m = db.query(Machine).filter(
            Machine.license_id == license_obj.id,
            Machine.machine_fingerprint == new_machine_fingerprint.strip()
        ).first()

        if not new_m:
            new_m = Machine(
                tenant_id=license_obj.tenant_id,
                shop_id=license_obj.shop_id,
                license_id=license_obj.id,
                machine_fingerprint=new_machine_fingerprint.strip(),
                machine_name=new_machine_name,
                platform=platform or "Windows",
                app_version=app_version,
                ip_address=ip_address or "127.0.0.1",
                status=MachineStatus.ACTIVE,
                first_activated_at=now,
                last_seen_at=now
            )
            db.add(new_m)
        else:
            new_m.status = MachineStatus.ACTIVE
            new_m.machine_name = new_machine_name
            new_m.last_seen_at = now
            new_m.app_version = app_version
            if ip_address:
                new_m.ip_address = ip_address

        license_obj.replacement_count += 1
        license_obj.status = LicenseStatus.ACTIVE
        license_obj.last_validated_at = now

        # Record License Event
        event = LicenseEvent(
            license_id=license_obj.id,
            event_type=LicenseEventType.MACHINE_RESET,
            from_state=license_obj.status.value,
            to_state=LicenseStatus.ACTIVE.value,
            actor="MERCHANT_SELF_SERVICE",
            notes=f"Self-service machine transfer to {new_machine_fingerprint} ({new_machine_name}). Replacement #{license_obj.replacement_count}/{license_obj.replacement_limit}"
        )
        db.add(event)
        db.commit()
        db.refresh(license_obj)

        token = cls.generate_signed_token_for_license(db, license_obj, new_machine_fingerprint.strip())
        remaining = license_obj.replacement_limit - license_obj.replacement_count
        return True, f"Machine successfully transferred to new hardware. Remaining transfers: {remaining}", token
