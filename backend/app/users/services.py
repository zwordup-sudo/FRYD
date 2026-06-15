from sqlalchemy.orm import Session
from .models import User
from .schemas import UserCreate, UserSettingsUpdate
from .security import get_password_hash

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user_create: UserCreate):
    hashed_pwd = get_password_hash(user_create.password)
    user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def update_user_settings(db: Session, user: User, settings: UserSettingsUpdate):
    if settings.username is not None:
        username = settings.username.strip()
        if username:
            existing = db.query(User).filter(User.username == username, User.id != user.id).first()
            if existing:
                raise ValueError("El nombre de usuario ya está en uso.")
            user.username = username
            
    if settings.whatsapp_phone is not None:
        # Clean whitespace and store phone
        phone = settings.whatsapp_phone.strip()
        user.whatsapp_phone = phone if phone else None
    if settings.whatsapp_active is not None:
        user.whatsapp_active = settings.whatsapp_active
    if settings.whatsapp_sandbox is not None:
        user.whatsapp_sandbox = settings.whatsapp_sandbox.strip() if settings.whatsapp_sandbox else None
    if settings.ai_provider is not None:
        user.ai_provider = settings.ai_provider
    if settings.ai_model is not None:
        user.ai_model = settings.ai_model
    if settings.ai_api_key is not None:
        key_val = settings.ai_api_key.strip()
        if key_val and not (key_val == "••••••••" or "..." in key_val or key_val == "configured"):
            user.ai_api_key = key_val
        elif not key_val:
            user.ai_api_key = None

    db.commit()
    db.refresh(user)
    return user