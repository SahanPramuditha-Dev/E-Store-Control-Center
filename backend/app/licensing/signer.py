import base64
from cryptography.hazmat.primitives.asymmetric import ed25519
from app.licensing.payload import LicensePayload, SignedLicenseToken
from app.licensing.canonicalization import canonicalize_bytes
from app.licensing.key_manager import KeyManager

class LicenseSigner:
    """
    Signs canonical license payloads with the Server's Ed25519 Private Key.
    """

    @classmethod
    def sign_payload(cls, payload: LicensePayload, private_key: ed25519.Ed25519PrivateKey = None) -> SignedLicenseToken:
        if private_key is None:
            private_key = KeyManager.get_server_private_key()
            
        canonical_bytes = canonicalize_bytes(payload.model_dump())
        raw_signature = private_key.sign(canonical_bytes)
        sig_b64 = base64.b64encode(raw_signature).decode('ascii')
        
        return SignedLicenseToken(
            payload=payload,
            signature=sig_b64,
            signature_algorithm="Ed25519",
            key_id=payload.key_id
        )

