from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib
import hmac
import secrets
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import AdminUser, AdminRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/admin/auth/login")

def hash_password(password: str) -> str:
    """Standard PBKDF2-HMAC-SHA256 hasher using Python's built-in hashlib (zero C-extension crash on serverless)."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"pbkdf2_sha256$100000${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    try:
        # Handle standard hashlib pbkdf2 format: pbkdf2_sha256$rounds$salt$hash
        if hashed_password.startswith("pbkdf2_sha256$"):
            parts = hashed_password.split("$")
            if len(parts) == 4:
                rounds = int(parts[1])
                salt = parts[2]
                target_hash = parts[3]
                calc = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), rounds)
                return hmac.compare_digest(calc.hex(), target_hash)
        
        # Fallback passlib verify
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def create_admin_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "scope": data.get("scope", "admin_access")
    })
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_impersonation_token(tenant_code: str, operator_username: str, expires_minutes: int = 120) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": f"impersonate_{operator_username}_{tenant_code}",
        "tenant_code": tenant_code,
        "operator": operator_username,
        "scope": "support_impersonation",
        "exp": expire
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> AdminUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        token_scope: str = payload.get("scope", "admin_access")
        
        # Strictly reject support impersonation tokens from accessing Control Panel Admin APIs
        if token_scope == "support_impersonation":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Support impersonation tokens cannot access Control Panel administrative APIs"
            )

        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(AdminUser).filter(
        (AdminUser.username == username) | (AdminUser.email == username),
        AdminUser.is_active == True
    ).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(allowed_roles: list[AdminRole]):
    def role_checker(current_user: AdminUser = Depends(get_current_admin)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of {[r.value for r in allowed_roles]}, but current user has {current_user.role.value}"
            )
        return current_user
    return role_checker

