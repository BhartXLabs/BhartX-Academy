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
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class OnboardingRequest(BaseModel):
    who_are_you: str
    why_learning: str
    exam_date: str
    daily_time: str
    weak_subjects: List[str]
    strong_subjects: List[str]
    knowledge_level: str
