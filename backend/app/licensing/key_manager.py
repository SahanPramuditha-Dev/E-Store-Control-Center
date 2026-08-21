import base64
from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from app.config import settings

class KeyManager:
    """
    Manages Ed25519 Private & Public keys for license generation and verification.
    """

    @staticmethod
    def generate_key_pair() -> Tuple[ed25519.Ed25519PrivateKey, ed25519.Ed25519PublicKey]:
        """Generates a fresh Ed25519 key pair."""
        private_key = ed25519.Ed25519PrivateKey.generate()
        return private_key, private_key.public_key()

    @staticmethod
    def export_private_key_b64(private_key: ed25519.Ed25519PrivateKey) -> str:
        """Exports raw 32-byte private key as Base64 string."""
        raw_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        return base64.b64encode(raw_bytes).decode('ascii')

    @staticmethod
    def export_public_key_b64(public_key: ed25519.Ed25519PublicKey) -> str:
        """Exports raw 32-byte public key as Base64 string."""
        raw_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        return base64.b64encode(raw_bytes).decode('ascii')

    @classmethod
    def load_private_key_from_b64(cls, b64_str: str) -> ed25519.Ed25519PrivateKey:
        raw_bytes = base64.b64decode(b64_str.strip())
        return ed25519.Ed25519PrivateKey.from_private_bytes(raw_bytes)

    @classmethod
    def load_public_key_from_b64(cls, b64_str: str) -> ed25519.Ed25519PublicKey:
        raw_bytes = base64.b64decode(b64_str.strip())
        return ed25519.Ed25519PublicKey.from_public_bytes(raw_bytes)

    @classmethod
    def get_server_private_key(cls) -> ed25519.Ed25519PrivateKey:
        """Loads private key from settings/env. If not set (dev mode), generates an ephemeral one."""
        if settings.ED25519_PRIVATE_KEY_B64:
            return cls.load_private_key_from_b64(settings.ED25519_PRIVATE_KEY_B64)
        
        # Development fallback (Ephemeral)
        if not hasattr(cls, "_dev_private_key"):
            cls._dev_private_key, cls._dev_public_key = cls.generate_key_pair()
        return cls._dev_private_key

    @classmethod
    def get_server_public_key(cls) -> ed25519.Ed25519PublicKey:
        """Loads public key corresponding to server private key."""
        if settings.ED25519_PUBLIC_KEY_B64:
            return cls.load_public_key_from_b64(settings.ED25519_PUBLIC_KEY_B64)
        
        # Derive from private key
        return cls.get_server_private_key().public_key()
