import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from .schemas import UserCreate, UserRead, Token, UserLogin, UserSettingsUpdate
from .services import create_user, get_user_by_email, get_user_by_username, update_user_settings
from .security import create_access_token, verify_password, get_current_user, limiter
from .models import User

router = APIRouter()

class GoogleLoginRequest(BaseModel):
    id_token: str
    email: str | None = None
    name: str | None = None


@router.post("/register", response_model=UserRead)
@limiter.limit("5/minute")
def register_user(request: Request, user_create: UserCreate, db: Session = Depends(get_db)):
    db_user_email = get_user_by_email(db, user_create.email)
    if db_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )
    db_user_username = get_user_by_username(db, user_create.username)
    if db_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso."
        )
    return create_user(db, user_create)

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_for_access_token(
    request: Request,
    user_login: UserLogin,
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, user_login.email)
    if not user or not verify_password(user_login.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/oauth", response_model=Token)
@limiter.limit("5/minute")
def login_oauth_form(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me/settings", response_model=UserRead)
def update_settings(
    settings: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return update_user_settings(db, current_user, settings)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# ADMIN ENDPOINTS
def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación no permitida. Se requiere rol de administrador."
        )
    return current_user

@router.get("/admin/users")
def admin_list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "profile_focus": u.profile_focus,
            "is_admin": u.is_admin,
            "whatsapp_active": u.whatsapp_active,
            "tasks_count": len(u.tasks),
            "habits_count": len(u.habits),
            "diary_count": len(u.diary_entries)
        })
    return result

@router.post("/admin/toggle-admin/{user_id}")
def toggle_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="No puedes quitarte el rol de administrador a ti mismo")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)
    return {"message": f"Estado de admin de {user.username} modificado", "is_admin": user.is_admin}

@router.post("/login/google", response_model=Token)
def login_with_google(
    request: Request,
    google_req: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    email = google_req.email
    name = google_req.name
    
    # Validation fallback for mock/local development or real google integration
    if not email:
        raise HTTPException(status_code=400, detail="El correo es requerido para el inicio de sesión con Google")
        
    # Standardize email
    email = email.lower().strip()
    
    # Find or Create User
    user = get_user_by_email(db, email)
    if not user:
        # Determine username from email or name
        base_username = name if name else email.split("@")[0]
        base_username = "".join(e for e in base_username if e.isalnum())
        
        # Ensure username uniqueness
        username = base_username
        counter = 1
        while get_user_by_username(db, username):
            username = f"{base_username}{counter}"
            counter += 1
            
        # Create user with random password
        user_in = UserCreate(
            username=username,
            email=email,
            password=str(uuid.uuid4()),
            profile_focus="personal"
        )
        user = create_user(db, user_in)
        
    # Generate Access Token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}