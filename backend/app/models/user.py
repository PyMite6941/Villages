from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str
    academic_level: str  # e.g. "Grade 10", "SAT Prep", "Adult Learner", "Professional"
    goals: list[str]     # e.g. ["SAT Math", "College Apps", "Career Change"]
    strengths: list[str]
    weaknesses: list[str]
    interests: list[str] = []       # broad topics of curiosity
    learning_style: str = "visual"  # visual, auditory, reading, kinesthetic
    village_id: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

class UserProfileCreate(BaseModel):
    display_name: str
    academic_level: str
    goals: list[str]
    strengths: list[str]
    weaknesses: list[str]
    interests: list[str] = []
    learning_style: str = "visual"

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    academic_level: Optional[str] = None
    goals: Optional[list[str]] = None
    strengths: Optional[list[str]] = None
    weaknesses: Optional[list[str]] = None
    interests: Optional[list[str]] = None
    learning_style: Optional[str] = None
