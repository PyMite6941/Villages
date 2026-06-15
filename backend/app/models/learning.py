from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TopicExplanation(BaseModel):
    id: str
    village_id: str
    topic: str
    plain_language: str
    checklist: list[dict] = []
    next_steps: list[dict] = []
    generated_by_ai: bool = True
    created_at: Optional[datetime] = None


class LearningPath(BaseModel):
    id: str
    village_id: str
    title: str
    description: str
    steps: list[dict] = []
    generated_by_ai: bool = True
    created_at: Optional[datetime] = None
