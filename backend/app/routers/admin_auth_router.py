from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

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
class AdminLoginJSON(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None

@router.post("/login", response_model=TokenResponse)
async def login_for_admin_token(
    request: Request,
    db: Session = Depends(get_db)
):
    username = None
    password = None

    # Check for JSON body first
    try:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
    except Exception:
        pass

    # Fallback to form-data / multipart
    if not username:
        try:
            form = await request.form()
            username = form.get("username")
            password = form.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required"
        )

    user = db.query(AdminUser).filter(AdminUser.username == username.strip()).first()
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

@router.get("/me", response_model=AdminUserResponse)
def read_admin_me(current_admin: AdminUser = Depends(get_current_admin)):
    return AdminUserResponse(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        role=current_admin.role.value,
        is_active=current_admin.is_active
    )
