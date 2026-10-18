import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token, UserSettingsUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # First user can be admin
    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "user"

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        full_name=user_in.full_name or user_in.email.split("@")[0].capitalize(),
        hashed_password=hashed_pw,
        role=role,
        is_active=True,
        settings_json=json.dumps({"preferred_model": "gemini", "theme_preference": "dark"})
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    settings_dict = json.loads(user.settings_json or "{}")

    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            settings=settings_dict
        )
    )

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account."
        )

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    settings_dict = json.loads(user.settings_json or "{}")

    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            settings=settings_dict
        )
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    settings_dict = json.loads(current_user.settings_json or "{}")
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        settings=settings_dict
    )

@router.put("/settings", response_model=UserOut)
def update_settings(
    settings_in: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings_dict = json.loads(current_user.settings_json or "{}")

    if settings_in.full_name is not None:
        current_user.full_name = settings_in.full_name
    if settings_in.gemini_api_key is not None:
        settings_dict["gemini_api_key"] = settings_in.gemini_api_key
    if settings_in.openai_api_key is not None:
        settings_dict["openai_api_key"] = settings_in.openai_api_key
    if settings_in.preferred_model is not None:
        settings_dict["preferred_model"] = settings_in.preferred_model
    if settings_in.theme_preference is not None:
        settings_dict["theme_preference"] = settings_in.theme_preference

    current_user.settings_json = json.dumps(settings_dict)
    db.commit()
    db.refresh(current_user)

    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        settings=settings_dict
    )
