from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Challenge(BaseModel):
    id: str
    village_id: str
    title: str
    description: str
    subject: str
    difficulty: str  # "easy" | "medium" | "hard"
    is_collaborative: bool = True
    generated_by_ai: bool = True
    completed_by: list[str] = []
    created_at: Optional[datetime] = None

class ChallengeCreate(BaseModel):
    village_id: str
    subject: str
    difficulty: str = "medium"
