import base64
from datetime import datetime, timezone
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature
from app.licensing.payload import SignedLicenseToken
from app.licensing.canonicalization import canonicalize_bytes
from app.licensing.key_manager import KeyManager

class LicenseVerifier:
    """
    Verifies Ed25519 digital signatures and validates license payload invariants.
    Can be used both centrally and embedded in client ERP with public key.
    """

    @classmethod
    def verify_signature(
        cls,
        signed_token: SignedLicenseToken,
        public_key: ed25519.Ed25519PublicKey = None
    ) -> Tuple[bool, str]:
        """
        Validates cryptographic integrity of the token.
        Returns: (is_valid, reason_or_success_message)
        """
        if public_key is None:
            public_key = KeyManager.get_server_public_key()

        try:
            sig_bytes = base64.b64decode(signed_token.signature)
            canonical_bytes = canonicalize_bytes(signed_token.payload.model_dump())
            public_key.verify(sig_bytes, canonical_bytes)
            return True, "Signature valid"
        except InvalidSignature:
            return False, "Invalid signature: Payload has been tampered with"
        except Exception as e:
            return False, f"Signature verification error: {str(e)}"

    @classmethod
    def validate_license_state(
        cls,
        signed_token: SignedLicenseToken,
        current_machine_fingerprint: str = None,
        public_key: ed25519.Ed25519PublicKey = None
    ) -> Tuple[bool, str]:
        """
        Full offline validation check: signature, dates, schema version, and machine binding.
        """
        # 1. Signature check
        is_sig_valid, sig_msg = cls.verify_signature(signed_token, public_key)
        if not is_sig_valid:
            return False, sig_msg

        payload = signed_token.payload

        # 2. Schema version check
        if payload.license_schema_version != 1:
            return False, f"Unsupported license schema version: {payload.license_schema_version}"

        # 3. Machine binding check
        if current_machine_fingerprint and payload.machine_fingerprint != current_machine_fingerprint:
            return False, f"Machine mismatch: License is bound to {payload.machine_fingerprint}, but current machine is {current_machine_fingerprint}"

        # 4. Temporal validity check
        now = datetime.now(timezone.utc)
        
        # Starts at check
        starts_at = datetime.fromisoformat(payload.starts_at.replace("Z", "+00:00"))
        if now < starts_at:
            return False, "License is not yet active"

        # Expiry check
        if payload.expires_at:
            expires_at = datetime.fromisoformat(payload.expires_at.replace("Z", "+00:00"))
            if now > expires_at:
                return False, f"License expired on {payload.expires_at}"

        return True, "License is active and valid"
