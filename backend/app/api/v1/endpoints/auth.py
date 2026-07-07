from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.repositories.user import user_repo
from app.core.security import create_access_token, create_refresh_token, verify_password, decode_token
from app.core.config import settings  # Required for GOOGLE_CLIENT_ID + ENV checks in google_login()
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, TokenRefreshRequest, OnboardingRequest, GoogleAuthRequest, ProfileUpdateRequest
from app.models.all_models import User, UserSession
from jose import jwt
from app.core.security import get_password_hash
from app.core.ratelimit import limiter
import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-oauth")

# Dependency to get current user
def get_current_user(request: Request, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise credentials_exception

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
@limiter.limit("5/minute")
def login(request: Request, user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, email=user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    # Store refresh session in database
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    user_repo.create_refresh_session(db, user.id, refresh_token, expires_at)
    
    # Set secure HttpOnly cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=15 * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30 * 24 * 60 * 60
    )
    
    # Tokens are in HttpOnly cookies only — do not expose in response body
    return {"token_type": "bearer", "message": "Login successful"}

from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login-oauth")
def login_oauth(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Needed for FastAPI swagger login page integration
    # For now we will hook standard form login if needed, or raise 400 for OAuth standard
    raise HTTPException(status_code=400, detail="Use /api/v1/auth/login JSON endpoint")

@router.post("/refresh", response_model=Token)
@limiter.limit("5/minute")
def refresh(request: Request, refresh_in: TokenRefreshRequest, response: Response, db: Session = Depends(get_db)):
    # Read refresh token from HttpOnly cookie first; fall back to request body
    token = request.cookies.get("refresh_token") or refresh_in.refresh_token
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token not found")

    session = user_repo.get_refresh_session(db, token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    
    # Generate new tokens
    access_token = create_access_token(subject=session.user_id)
    new_refresh_token = create_refresh_token(subject=session.user_id)
    
    # Rotate: revoke old token and save new one
    user_repo.revoke_refresh_session(db, token)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    user_repo.create_refresh_session(db, session.user_id, new_refresh_token, expires_at)
    
    # Set new cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=15 * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30 * 24 * 60 * 60
    )
    
    return {"token_type": "bearer", "message": "Token refreshed"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.post("/onboard", response_model=UserResponse)
def onboard_user(onboard_in: OnboardingRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user.onboarded = True
    current_user.onboarding_profile = onboard_in.model_dump()
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/login-or-signup", response_model=Token)
@limiter.limit("5/minute")
def login_or_signup(request: Request, user_in: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = user_repo.get_by_email(db, email=user_in.email)
    
    if user:
        # Case A: User exists, verify password
        if not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password for this email")
    else:
        # Case B: User does not exist, auto-signup
        default_name = user_in.email.split("@")[0]
        # SQLModel / SQLAlchemy model insertion
        user = User(
            name=default_name.capitalize(),
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            role="student",
            provider="email",
            onboarded=False,
            xp=0,
            streak=1,
            login_count=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Update login metrics & create UserSession record
    user.last_login = datetime.datetime.utcnow()
    user.login_count += 1
    
    user_repo.log_user_session(
        db,
        user_id=user.id,
        device="Web Browser",
        browser="Next.js Client",
        ip=request.client.host if request.client else "unknown"
    )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    user_repo.create_refresh_session(db, user.id, refresh_token, expires_at)
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=15 * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30 * 24 * 60 * 60
    )
    
    return {"token_type": "bearer", "message": "Login successful"}

@router.post("/google", response_model=Token)
@limiter.limit("5/minute")
def google_login(request: Request, google_in: GoogleAuthRequest, response: Response, db: Session = Depends(get_db)):
    email = None
    name = None
    avatar = None
    sub = None

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        
        # Verify Google token signature cryptographically
        # requests.Request() fetches Google public certs
        # audience= validates that this token was issued for OUR app specifically
        # Prevents tokens issued for other Google apps from being accepted
        idinfo = google_id_token.verify_oauth2_token(
            google_in.id_token,
            google_requests.Request(),
            audience=settings.GOOGLE_CLIENT_ID  # Must match GOOGLE_CLIENT_ID env var
        )
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0])
        avatar = idinfo.get("picture")
        sub = idinfo.get("sub")
    except Exception as e:
        # Fallback to decode unverified claims ONLY for local mocks during development
        if settings.ENV == "development":
            try:
                claims = jwt.get_unverified_claims(google_in.id_token)
                email = claims.get("email")
                name = claims.get("name", email.split("@")[0] if email else "Google Student")
                avatar = claims.get("picture")
                sub = claims.get("sub")
            except Exception:
                pass
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail=f"Google token signature verification failed: {e}"
            )

    # If token parsing fails completely, load default mock profile in dev, otherwise raise error
    if not email:
        if settings.ENV == "development":
            email = "google_student@bhartx.com"
            name = "Google Student"
            avatar = "https://lh3.googleusercontent.com/a/default-user"
            sub = "mock-google-id-12345"
        else:
            raise HTTPException(status_code=400, detail="Invalid Google token claims")

    user = user_repo.get_by_email(db, email=email)
    
    if user:
        # Link Google details to email if it was previously email provider
        if user.provider == "email":
            user.provider = "google"
            user.provider_id = sub
            user.avatar_url = avatar
    else:
        # Create new Google user
        user = User(
            name=name,
            email=email,
            role="student",
            provider="google",
            provider_id=sub,
            avatar_url=avatar,
            onboarded=False,
            xp=0,
            streak=1,
            login_count=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Update login metrics
    user.last_login = datetime.datetime.utcnow()
    user.login_count += 1
    
    user_repo.log_user_session(
        db,
        user_id=user.id,
        device="Google Auth Client",
        browser="OAuth API",
        ip=request.client.host if request.client else "unknown"
    )

    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    user_repo.create_refresh_session(db, user.id, refresh_token, expires_at)
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=15 * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30 * 24 * 60 * 60
    )
    
    # Tokens are in HttpOnly cookies only — do not expose in response body
    return {"token_type": "bearer", "message": "Login successful"}

@router.post("/profile-update", response_model=UserResponse)
def profile_update(profile_in: ProfileUpdateRequest, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.onboarded is not None:
        current_user.onboarded = profile_in.onboarded

    # Gradual profile updates to onboarding_profile JSON
    profile = current_user.onboarding_profile or {}
    
    if profile_in.course is not None:
        profile["course"] = profile_in.course
    if profile_in.daily_time is not None:
        profile["daily_time"] = profile_in.daily_time
    if profile_in.exam_date is not None:
        profile["exam_date"] = profile_in.exam_date
    if profile_in.weak_subjects is not None:
        profile["weak_subjects"] = profile_in.weak_subjects
    if profile_in.strong_subjects is not None:
        profile["strong_subjects"] = profile_in.strong_subjects
    if profile_in.knowledge_level is not None:
        profile["knowledge_level"] = profile_in.knowledge_level

    current_user.onboarding_profile = profile
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Clear HttpOnly auth cookies server-side to fully log out the user."""
    # Revoke refresh session from DB so the token is fully invalidated server-side
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        user_repo.revoke_refresh_session(db, refresh_token)

    # delete_cookie MUST use IDENTICAL attributes as set_cookie:
    # secure=True, samesite="none" — otherwise the browser treats it as a different cookie
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    return {"message": "Logged out successfully"}
