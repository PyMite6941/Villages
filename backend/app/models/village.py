from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Village(BaseModel):
    id: str
    name: str
    description: str
    focus_area: str       # e.g. "SAT Math", "AP Biology", "College Apps"
    resources: list[str]  # study topics / materials
    max_members: int = 10
    member_count: int = 0
    is_active: bool = True
    created_by: str
    created_at: Optional[datetime] = None

class VillageCreate(BaseModel):
    name: str
    description: str
    focus_area: str
    resources: list[str]
    max_members: int = 10

class VillageMember(BaseModel):
    user_id: str
    village_id: str
    role: str = "member"  # "member" | "elder" (AI facilitator proxy) | "chief"
    joined_at: Optional[datetime] = None
