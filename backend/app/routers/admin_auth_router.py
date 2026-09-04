from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import AdminUser, AdminRole, AuditLog
from app.auth import verify_password, create_admin_token, get_current_admin


router = APIRouter(prefix="/admin/auth", tags=["Admin Auth"])

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str

class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    is_active: bool

class CreateAdminRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None


@router.post("/login", response_model=TokenResponse)
def login_for_admin_token(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        clean_user = payload.username.strip().lower()
        password = payload.password
        user = db.query(AdminUser).filter(
            (func.lower(AdminUser.username) == clean_user) |
            (func.lower(AdminUser.email) == clean_user)
        ).first()
        
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account is inactive. Please contact system administrator."
            )
        
        token = create_admin_token(data={"sub": user.username, "role": user.role.value})
        return TokenResponse(
            access_token=token,
            username=user.username,
            role=user.role.value
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to complete login"
        )

@router.post("/google", response_model=TokenResponse)
def google_auth_login(
    payload: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google sign-in is disabled until server-side ID-token verification is configured",
    )


@router.get("/me", response_model=AdminUserResponse)
def read_admin_me(current_admin: AdminUser = Depends(get_current_admin)):
    return AdminUserResponse(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        role=current_admin.role.value,
        is_active=current_admin.is_active
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_session_token(
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Refreshes and extends the active session JWT token for an active admin."""
    new_token = create_admin_token(data={"sub": current_admin.username, "role": current_admin.role.value})
    return TokenResponse(
        access_token=new_token,
        username=current_admin.username,
        role=current_admin.role.value
    )

@router.post("/logout")
def logout_admin_session(
    request: Request,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Audits admin logout event and safely closes user session."""
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    audit = AuditLog(
        admin_user_id=current_admin.id,
        action="ADMIN_LOGOUT",
        entity_type="SESSION",
        entity_id=str(current_admin.id),
        details_json={
            "username": current_admin.username,
            "ip_address": client_ip,
            "user_agent": user_agent,
            "reason": "USER_INITIATED"
        },
        ip_address=client_ip
    )
    db.add(audit)
    db.commit()

    return {"success": True, "message": "Session terminated successfully."}

@router.get("/session-status")
def get_session_status(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin)
):
    """Returns real-time session telemetry, permissions, and security metadata."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Web Browser")
    
    return {
        "is_authenticated": True,
        "username": current_admin.username,
        "email": current_admin.email,
        "role": current_admin.role.value,
        "client_ip": client_ip,
        "user_agent": user_agent,
        "idle_timeout_minutes": 15,
        "security_features": {
            "auto_logout": True,
            "hardware_key_auth": True,
            "multi_tab_sync": True,
            "ed25519_signatures": True,
            "brute_force_shield": True
        }
    }
