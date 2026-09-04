from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ClientSyncEvent, License, LicenseStatus, Machine, MachineStatus

router = APIRouter(prefix="/api/sync", tags=["Client Sync"])


class SyncEventInput(BaseModel):
    id: int | None = None
    uuid: str = Field(min_length=8, max_length=64)
    entity_type: str = Field(min_length=1, max_length=80)
    entity_id: str = Field(min_length=1, max_length=120)
    operation: str = Field(pattern="^(CREATE|UPDATE|DELETE)$")
    payload: dict[str, Any]
    created_at: datetime | None = None


class SyncBatchInput(BaseModel):
    license_key: str = Field(min_length=8, max_length=160)
    machine_fingerprint: str = Field(min_length=8, max_length=100)
    events: list[SyncEventInput] = Field(min_length=1, max_length=100)


def _authorized_binding(db: Session, license_key: str, fingerprint: str) -> tuple[License, Machine]:
    license_obj = db.query(License).filter(License.license_key == license_key.strip().upper()).first()
    if not license_obj or license_obj.status != LicenseStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Active license required")
    now = datetime.now(timezone.utc)
    expires_at = license_obj.expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if license_obj.license_type.value != "LIFETIME" and expires_at and now > expires_at:
        raise HTTPException(status_code=403, detail="License expired")
    machine = db.query(Machine).filter(
        Machine.license_id == license_obj.id,
        Machine.machine_fingerprint == fingerprint,
        Machine.status == MachineStatus.ACTIVE,
    ).first()
    if not machine:
        raise HTTPException(status_code=403, detail="Machine is not authorized")
    return license_obj, machine


@router.post("/ingest")
def ingest_sync_events(batch: SyncBatchInput, db: Session = Depends(get_db)):
    license_obj, machine = _authorized_binding(db, batch.license_key, batch.machine_fingerprint)
    accepted: list[int] = []
    duplicate: list[int] = []
    for event in batch.events:
        existing = db.query(ClientSyncEvent.id).filter(ClientSyncEvent.event_uuid == event.uuid).first()
        target = duplicate if existing else accepted
        if event.id is not None:
            target.append(event.id)
        if existing:
            continue
        db.add(ClientSyncEvent(
            event_uuid=event.uuid,
            source_event_id=event.id,
            tenant_id=license_obj.tenant_id,
            shop_id=license_obj.shop_id,
            license_id=license_obj.id,
            machine_id=machine.id,
            entity_type=event.entity_type.lower(),
            entity_id=event.entity_id,
            operation=event.operation,
            payload_json=event.payload,
            source_created_at=event.created_at,
        ))
    machine.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "success", "processed_ids": accepted + duplicate, "accepted_ids": accepted, "duplicate_ids": duplicate}
