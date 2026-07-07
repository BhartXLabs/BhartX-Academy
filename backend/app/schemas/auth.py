from pydantic import BaseModel, EmailStr
from typing import Optional, Any, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "student"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    streak: int
    xp: int
    onboarded: bool
    onboarding_profile: Optional[Any] = None
    provider: Optional[str] = "email"
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    token_type: str = "bearer"
    message: str = "success"

class TokenRefreshRequest(BaseModel):
    # Refresh token is read from HttpOnly cookie server-side.
    # This body field is kept optional for backward compatibility.
    refresh_token: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    id_token: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    course: Optional[str] = None
    daily_time: Optional[str] = None
    onboarded: Optional[bool] = None
    exam_date: Optional[str] = None
    weak_subjects: Optional[List[str]] = None
    strong_subjects: Optional[List[str]] = None
    knowledge_level: Optional[str] = None
    gender: Optional[str] = None
    mobile_number: Optional[str] = None
    password: Optional[str] = None


class OnboardingRequest(BaseModel):
    who_are_you: str
    why_learning: str
    exam_date: str
    daily_time: str
    weak_subjects: List[str]
    strong_subjects: List[str]
    knowledge_level: str

class UserRoleUpdateRequest(BaseModel):
    role: str

class AdminResetPasswordRequest(BaseModel):
    password: str

