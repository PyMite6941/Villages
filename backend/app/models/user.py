from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str
    academic_level: str
    goals: list[str]
    strengths: list[str]
    weaknesses: list[str]
    village_id: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified_teacher: Optional[bool] = False
    teacher_subjects: Optional[list[str]] = []
    bio: Optional[str] = None
    created_at: Optional[datetime] = None

class UserProfileCreate(BaseModel):
    display_name: str
    academic_level: str
    goals: list[str]
    strengths: list[str]
    weaknesses: list[str]

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    academic_level: Optional[str] = None
    goals: Optional[list[str]] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    bio: Optional[str] = None
