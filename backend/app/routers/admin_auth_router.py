from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import AdminUser, AdminRole
from app.auth import verify_password, hash_password, create_admin_token, get_current_admin

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

@router.post("/login", response_model=TokenResponse)
def login_for_admin_token(
    payload: LoginRequest,
    db: Session = Depends(get_db)
):
    try:
        clean_user = payload.username.strip().lower()
        password = payload.password
        user = db.query(AdminUser).filter(func.lower(AdminUser.username) == clean_user).first()
        
        # Auto-seed initial super admin if database is brand new
        if not user and clean_user == "admin" and password == "Admin@1234":
            user = AdminUser(
                username="admin",
                email="admin@estore.lk",
                hashed_password=hash_password("Admin@1234"),
                role=AdminRole.SUPER_ADMIN,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin user is inactive"
            )
        
        token = create_admin_token(data={"sub": user.username, "role": user.role.value})
        return TokenResponse(
            access_token=token,
            username=user.username,
            role=user.role.value
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login Error: {str(e)} | Trace: {traceback.format_exc()[-200:]}"
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
