from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.repositories.user import user_repo
from app.core.security import create_access_token, create_refresh_token, verify_password, decode_token
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, TokenRefreshRequest, OnboardingRequest
import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-oauth")

# Dependency to get current user
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = user_repo.get(db, id=int(user_id))
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    db_user = user_repo.get_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = user_repo.create_user(db, user_in)
    return user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, email=user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    # Store refresh session in database
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    user_repo.create_refresh_session(db, user.id, refresh_token, expires_at)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login-oauth")
def login_oauth(form_data: Depends(OAuth2PasswordBearer) = Depends(), db: Session = Depends(get_db)):
    # Needed for FastAPI swagger login page integration
    # For now we will hook standard form login if needed, or raise 400 for OAuth standard
    raise HTTPException(status_code=400, detail="Use /api/v1/auth/login JSON endpoint")

@router.post("/refresh", response_model=Token)
def refresh(refresh_in: TokenRefreshRequest, db: Session = Depends(get_db)):
    session = user_repo.get_refresh_session(db, refresh_in.refresh_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Generate new tokens
    access_token = create_access_token(subject=session.user_id)
    new_refresh_token = create_refresh_token(subject=session.user_id)
    
    # Revoke old token and save new one
    user_repo.revoke_refresh_session(db, refresh_in.refresh_token)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    user_repo.create_refresh_session(db, session.user_id, new_refresh_token, expires_at)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.post("/onboard", response_model=UserResponse)
def onboard_user(onboard_in: OnboardingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user.onboarded = True
    current_user.onboarding_profile = onboard_in.dict()
    db.commit()
    db.refresh(current_user)
    return current_user
