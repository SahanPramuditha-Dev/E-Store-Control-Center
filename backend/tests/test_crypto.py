import pytest
from app.licensing.key_manager import KeyManager
from app.licensing.payload import LicensePayload
from app.licensing.signer import LicenseSigner
from app.licensing.verifier import LicenseVerifier
from app.licensing.canonicalization import canonicalize_json

def test_key_generation_and_export():
    private_key, public_key = KeyManager.generate_key_pair()
    priv_b64 = KeyManager.export_private_key_b64(private_key)
    pub_b64 = KeyManager.export_public_key_b64(public_key)

    assert len(priv_b64) > 0
    assert len(pub_b64) > 0

    reloaded_priv = KeyManager.load_private_key_from_b64(priv_b64)
    reloaded_pub = KeyManager.load_public_key_from_b64(pub_b64)

    assert reloaded_priv is not None
    assert reloaded_pub is not None

def test_deterministic_canonicalization():
    dict1 = {"b": 2, "a": 1, "c": {"y": 20, "x": 10}}
    dict2 = {"a": 1, "c": {"x": 10, "y": 20}, "b": 2}
    
    assert canonicalize_json(dict1) == canonicalize_json(dict2)
    assert canonicalize_json(dict1) == '{"a":1,"b":2,"c":{"x":10,"y":20}}'

def test_sign_and_verify_valid_token():
    private_key, public_key = KeyManager.generate_key_pair()

    payload = LicensePayload(
        license_schema_version=1,
        license_id="LIC-TEST-001",
        tenant_code="TENANT-ABC",
        shop_code="SHOP-COLOMBO",
        package_code="BUSINESS",
        entitlements=["pos", "inventory", "repairs", "imei"],
        license_type="ANNUAL",
        issued_at="2026-08-17T12:00:00Z",
        starts_at="2026-08-17T12:00:00Z",
        expires_at="2027-08-17T12:00:00Z",
        machine_fingerprint="MACH-TEST-1234"
    )

    signed_token = LicenseSigner.sign_payload(payload, private_key=private_key)
    assert signed_token.signature is not None

    # Verification with matching public key
    is_valid, msg = LicenseVerifier.verify_signature(signed_token, public_key=public_key)
    assert is_valid is True
    assert msg == "Signature valid"

    # State validation
    is_active, state_msg = LicenseVerifier.validate_license_state(
        signed_token,
        current_machine_fingerprint="MACH-TEST-1234",
        public_key=public_key
    )
    assert is_active is True

def test_tampering_detection():
    private_key, public_key = KeyManager.generate_key_pair()

    payload = LicensePayload(
        license_schema_version=1,
        license_id="LIC-TEST-001",
        tenant_code="TENANT-ABC",
        shop_code="SHOP-COLOMBO",
        package_code="RETAIL",
        entitlements=["pos", "inventory"],
        license_type="ANNUAL",
        issued_at="2026-08-17T12:00:00Z",
        starts_at="2026-08-17T12:00:00Z",
        expires_at="2027-08-17T12:00:00Z",
        machine_fingerprint="MACH-TEST-1234"
    )

    signed_token = LicenseSigner.sign_payload(payload, private_key=private_key)

    # TAMPERING: Attacker attempts to sneak "repairs" into payload without re-signing
    signed_token.payload.entitlements.append("repairs")

    is_valid, msg = LicenseVerifier.verify_signature(signed_token, public_key=public_key)
    assert is_valid is False
    assert "Invalid signature" in msg

def test_machine_mismatch_detection():
    private_key, public_key = KeyManager.generate_key_pair()

    payload = LicensePayload(
        license_schema_version=1,
        license_id="LIC-TEST-001",
        tenant_code="TENANT-ABC",
        shop_code="SHOP-COLOMBO",
        package_code="BUSINESS",
        entitlements=["pos", "inventory"],
        license_type="ANNUAL",
        issued_at="2026-08-17T12:00:00Z",
        starts_at="2026-08-17T12:00:00Z",
        expires_at="2027-08-17T12:00:00Z",
        machine_fingerprint="MACH-SHOP-ORIGINAL"
    )

    signed_token = LicenseSigner.sign_payload(payload, private_key=private_key)

    # Validate against different machine
    is_valid, msg = LicenseVerifier.validate_license_state(
        signed_token,
        current_machine_fingerprint="MACH-SHOP-COPIED",
        public_key=public_key
    )
    assert is_valid is False
    assert "Machine mismatch" in msg
